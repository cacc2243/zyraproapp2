import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectProxyInterceptor, getClientIP } from "../_shared/proxy-detection.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// CRITICAL: No fallback - must be set in environment
const SIGNING_KEY = Deno.env.get('LICENSE_SIGNING_KEY');
if (!SIGNING_KEY) {
  console.error('[SECURITY] LICENSE_SIGNING_KEY not configured!');
}

// E2E Encryption salt (sent to client during validation)
const E2E_SALT = Deno.env.get('E2E_ENCRYPTION_SALT');
if (!E2E_SALT) {
  console.error('[SECURITY] E2E_ENCRYPTION_SALT not configured!');
}

// Rate limit config: 60 requests per minute per license
const RATE_LIMIT_WINDOW_MS = 60000;
const RATE_LIMIT_MAX_REQUESTS = 60;

// Generate HMAC-SHA256 signature
async function signPayload(payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SIGNING_KEY);
  const payloadData = encoder.encode(payload);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate session token
function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Import private key from JWK
async function importPrivateKey(jwkString: string): Promise<CryptoKey> {
  const jwk = JSON.parse(jwkString);
  return await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    ["deriveKey", "deriveBits"]
  );
}

// Import client's public key from base64
async function importClientPublicKey(publicKeyBase64: string): Promise<CryptoKey> {
  const publicKeyBuffer = Uint8Array.from(atob(publicKeyBase64), c => c.charCodeAt(0));
  
  return await crypto.subtle.importKey(
    "raw",
    publicKeyBuffer,
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    false,
    []
  );
}

// Derive shared key using ECDH
async function deriveSharedKey(
  privateKey: CryptoKey,
  clientPublicKey: CryptoKey
): Promise<CryptoKey> {
  return await crypto.subtle.deriveKey(
    {
      name: "ECDH",
      public: clientPublicKey,
    },
    privateKey,
    {
      name: "AES-GCM",
      length: 256,
    },
    false,
    ["encrypt", "decrypt"]
  );
}

// Decrypt data with AES-GCM
async function decryptData(
  iv: string,
  ciphertext: string,
  key: CryptoKey
): Promise<string> {
  const ivBytes = new Uint8Array(iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const dataBytes = new Uint8Array(ciphertext.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBytes },
    key,
    dataBytes
  );

  return new TextDecoder().decode(decrypted);
}

// Encrypt data with AES-GCM
async function encryptData(
  data: string,
  key: CryptoKey
): Promise<{ iv: string; ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(data)
  );

  return {
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
    ciphertext: Array.from(new Uint8Array(encrypted)).map(b => b.toString(16).padStart(2, '0')).join(''),
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const clientIP = getClientIP(req);

  // === PROXY INTERCEPTOR DETECTION ===
  const proxyCheck = detectProxyInterceptor(req);
  
  if (proxyCheck.shouldBlock) {
    console.log(`[VALIDATE] 🚨 PROXY BLOCKED! IP: ${clientIP}, Indicators:`, proxyCheck.indicators);
    return new Response(
      JSON.stringify({ valid: false, error: 'SECURITY_VIOLATION' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ valid: false, error: 'SERVER_CONFIG_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const { 
      nonce,
      challenge_token,
      client_public_key,
      encrypted_payload, // { iv, ciphertext } - E2E v2
      // Legacy fields for backward compatibility
      license_key, 
      device_fingerprint, 
      challenge_response,
      integrity_hash 
    } = body;

    const isE2Ev2 = !!(encrypted_payload && client_public_key);

    console.log('[VALIDATE] Request:', { 
      has_nonce: !!nonce,
      has_client_key: !!client_public_key,
      is_e2e_v2: isE2Ev2,
      has_legacy: !!license_key,
    });

    // === STEP 1: Validate required fields ===
    if (!nonce || !challenge_token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'MISSING_PARAMS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === STEP 2: Validate challenge and get server's private key ===
    const { data: challenge, error: challengeError } = await supabase
      .from('license_challenges')
      .select('*')
      .eq('nonce', nonce)
      .eq('challenge_token', challenge_token)
      .eq('used', false)
      .maybeSingle();

    if (challengeError || !challenge) {
      console.log('[VALIDATE] Invalid challenge:', challengeError);
      return new Response(
        JSON.stringify({ valid: false, error: 'INVALID_CHALLENGE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if challenge expired
    if (new Date(challenge.expires_at) < new Date()) {
      await supabase.from('license_challenges').delete().eq('id', challenge.id);
      return new Response(
        JSON.stringify({ valid: false, error: 'CHALLENGE_EXPIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark challenge as used (one-time use)
    await supabase
      .from('license_challenges')
      .update({ used: true })
      .eq('id', challenge.id);

    let validationData: {
      license_key: string;
      device_fingerprint: string;
      integrity_hash: string | null;
    };
    let sharedKey: CryptoKey | null = null;

    // === STEP 3: Decrypt payload if E2E v2 ===
    if (isE2Ev2) {
      if (!challenge.server_private_key) {
        console.log('[VALIDATE] No server private key stored');
        return new Response(
          JSON.stringify({ valid: false, error: 'ENCRYPTION_ERROR' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Use client public key from CHALLENGE (stored during handshake), NOT from validate request
      const storedClientPubKey = challenge.client_public_key || client_public_key;
      
      if (!storedClientPubKey) {
        console.log('[VALIDATE] No client public key available');
        return new Response(
          JSON.stringify({ valid: false, error: 'MISSING_CLIENT_KEY' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        // Import keys and derive shared secret
        const serverPrivateKey = await importPrivateKey(challenge.server_private_key);
        const clientPubKey = await importClientPublicKey(storedClientPubKey);
        sharedKey = await deriveSharedKey(serverPrivateKey, clientPubKey);

        console.log('[VALIDATE] Using client key from:', challenge.client_public_key ? 'challenge' : 'request');

        // Decrypt the payload
        const decryptedPayload = await decryptData(
          encrypted_payload.iv,
          encrypted_payload.ciphertext,
          sharedKey
        );
        
        const parsedPayload = JSON.parse(decryptedPayload);
        validationData = {
          license_key: parsedPayload.license_key,
          device_fingerprint: parsedPayload.device_fingerprint,
          integrity_hash: parsedPayload.integrity_hash,
        };

        console.log('[VALIDATE] ✅ E2E v2 payload decrypted successfully');
      } catch (decryptError) {
        console.error('[VALIDATE] Decryption failed:', decryptError);
        return new Response(
          JSON.stringify({ valid: false, error: 'DECRYPTION_FAILED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Legacy mode (backward compatibility)
      if (!license_key || !device_fingerprint) {
        return new Response(
          JSON.stringify({ valid: false, error: 'MISSING_PARAMS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Verify device fingerprint matches challenge
      if (challenge.device_fingerprint !== device_fingerprint) {
        return new Response(
          JSON.stringify({ valid: false, error: 'FINGERPRINT_MISMATCH' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      validationData = {
        license_key,
        device_fingerprint,
        integrity_hash,
      };
    }

    // === STEP 4: Validate license ===
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, transactions(customer_name, customer_email)')
      .eq('license_key', validationData.license_key.toUpperCase())
      .maybeSingle();

    if (licenseError || !license) {
      console.log('[VALIDATE] License not found');
      return new Response(
        JSON.stringify({ valid: false, error: 'LICENSE_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (license.status !== 'active') {
      console.log('[VALIDATE] License not active:', license.status);
      return new Response(
        JSON.stringify({ valid: false, error: 'LICENSE_INACTIVE', status: license.status }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get customer name from transaction
    const customerName = license.transactions?.customer_name || null;
    console.log('[VALIDATE] Customer name:', customerName);

    // === STEP 5: Rate limiting per license ===
    const windowStart = new Date(Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS);
    
    const { data: rateLimit } = await supabase
      .from('license_rate_limits')
      .select('*')
      .eq('license_id', license.id)
      .gte('window_start', windowStart.toISOString())
      .maybeSingle();

    if (rateLimit && rateLimit.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      console.log('[VALIDATE] Rate limit exceeded for license:', license.id);
      return new Response(
        JSON.stringify({ 
          valid: false, 
          error: 'RATE_LIMIT_EXCEEDED',
          retry_after: Math.ceil((windowStart.getTime() + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000)
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update or create rate limit counter
    if (rateLimit) {
      await supabase
        .from('license_rate_limits')
        .update({ request_count: rateLimit.request_count + 1 })
        .eq('id', rateLimit.id);
    } else {
      await supabase
        .from('license_rate_limits')
        .insert({
          license_id: license.id,
          window_start: windowStart.toISOString(),
          request_count: 1,
        });
    }

    // === STEP 6: Device validation ===
    const { data: devices } = await supabase
      .from('license_devices')
      .select('*')
      .eq('license_id', license.id)
      .eq('is_active', true);

    const existingDevice = devices?.find(d => d.device_fingerprint === validationData.device_fingerprint);

    if (!existingDevice) {
      const activeDeviceCount = devices?.length || 0;
      if (activeDeviceCount >= license.max_devices) {
        console.log('[VALIDATE] Max devices reached');
        return new Response(
          JSON.stringify({ valid: false, error: 'MAX_DEVICES_REACHED' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Register new device
      await supabase.from('license_devices').insert({
        license_id: license.id,
        device_fingerprint: validationData.device_fingerprint,
        device_name: 'Zyra Pro Extension',
        ip_address: clientIP,
        is_active: true,
      });
    } else {
      // Update last seen
      await supabase
        .from('license_devices')
        .update({ last_seen_at: new Date().toISOString(), ip_address: clientIP })
        .eq('id', existingDevice.id);
    }

    // === STEP 7: Create session (24 hours) ===
    const sessionToken = generateSessionToken();
    const sessionExpiry = new Date(Date.now() + 86400000); // 24 hours

    // Invalidate any existing sessions for this device
    await supabase
      .from('license_sessions')
      .delete()
      .eq('license_id', license.id)
      .eq('device_fingerprint', validationData.device_fingerprint);

    // Create new session
    const { error: sessionError } = await supabase
      .from('license_sessions')
      .insert({
        license_id: license.id,
        session_token: sessionToken,
        device_fingerprint: validationData.device_fingerprint,
        integrity_hash: validationData.integrity_hash || 'not-provided',
        ip_address: clientIP,
        expires_at: sessionExpiry.toISOString(),
      });

    if (sessionError) {
      console.error('[VALIDATE] Session creation error:', sessionError);
    }

    // === STEP 8: Update license last validated ===
    await supabase
      .from('licenses')
      .update({ last_validated_at: new Date().toISOString() })
      .eq('id', license.id);

    // === STEP 9: Log the validation ===
    await supabase.from('license_logs').insert({
      license_id: license.id,
      license_key: validationData.license_key.toUpperCase(),
      device_fingerprint: validationData.device_fingerprint,
      ip_address: clientIP,
      action: isE2Ev2 ? 'security_validate_e2e_v2' : 'security_validate_success',
      metadata: { 
        integrity_hash: validationData.integrity_hash?.substring(0, 20) + '...',
        session_created: true,
        encryption_version: isE2Ev2 ? 2 : 1,
      },
    });

    // === STEP 10: Generate response ===
    const responsePayload = {
      valid: true,
      session_token: sessionToken,
      session_expires: sessionExpiry.getTime(),
      server_time: Date.now(),
      license_status: license.status,
      customer_name: customerName,
      verified_integrity_hash: validationData.integrity_hash || null,
      encryption_salt: E2E_SALT || null,
      encryption_version: isE2Ev2 ? 2 : 1,
    };

    // If E2E v2, encrypt the response
    if (isE2Ev2 && sharedKey) {
      try {
        const payloadString = JSON.stringify(responsePayload);
        const signature = await signPayload(payloadString);
        
        const encryptedResponse = await encryptData(
          JSON.stringify({ ...responsePayload, signature, signature_algorithm: 'HMAC-SHA256' }),
          sharedKey
        );

        console.log('[VALIDATE] ✅ E2E v2 response encrypted');

        return new Response(
          JSON.stringify({
            encrypted: true,
            iv: encryptedResponse.iv,
            ciphertext: encryptedResponse.ciphertext,
            encryption_version: 2,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (encryptError) {
        console.error('[VALIDATE] Response encryption failed:', encryptError);
        // Fall through to legacy response
      }
    }

    // Legacy response (or fallback)
    const payloadString = JSON.stringify(responsePayload);
    const signature = await signPayload(payloadString);

    console.log('[VALIDATE] Success for license:', license.id);

    return new Response(
      JSON.stringify({
        ...responsePayload,
        signature,
        signature_algorithm: 'HMAC-SHA256',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[VALIDATE] Error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
