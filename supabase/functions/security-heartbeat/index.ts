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

// Derive encryption key from session token (for encrypting responses)
async function deriveSessionKey(sessionToken: string, salt: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(sessionToken),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );
  
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const clientIP = getClientIP(req);
  const E2E_SALT = Deno.env.get('E2E_ENCRYPTION_SALT') || '';

  // === PROXY INTERCEPTOR DETECTION ===
  const proxyCheck = detectProxyInterceptor(req);
  
  if (proxyCheck.shouldBlock) {
    console.log(`[HEARTBEAT] 🚨 PROXY BLOCKED! IP: ${clientIP}, Indicators:`, proxyCheck.indicators);
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
        JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    const { 
      session_token, 
      device_fingerprint, 
      integrity_hash,
      encrypted_payload, // E2E v2 support
      encrypt_response, // Client requests encrypted response
    } = body;

    const isE2Ev2 = !!encrypted_payload;

    console.log('[HEARTBEAT] Request:', { 
      session: session_token?.substring(0, 10) + '...', 
      device: device_fingerprint?.substring(0, 10) + '...',
      has_integrity: !!integrity_hash,
      is_e2e_v2: isE2Ev2,
      encrypt_response: !!encrypt_response,
    });

    let validationData: {
      session_token: string;
      device_fingerprint: string;
      integrity_hash: string | null;
    };

    // Handle E2E v2 encrypted payload
    if (isE2Ev2) {
      if (!session_token) {
        return new Response(
          JSON.stringify({ valid: false, error: 'MISSING_PARAMS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      try {
        const sessionKey = await deriveSessionKey(session_token, E2E_SALT);
        const decryptedPayload = await decryptData(
          encrypted_payload.iv,
          encrypted_payload.ciphertext,
          sessionKey
        );
        
        const parsedPayload = JSON.parse(decryptedPayload);
        validationData = {
          session_token,
          device_fingerprint: parsedPayload.device_fingerprint,
          integrity_hash: parsedPayload.integrity_hash,
        };

        console.log('[HEARTBEAT] ✅ E2E v2 payload decrypted');
      } catch (decryptError) {
        console.error('[HEARTBEAT] Decryption failed:', decryptError);
        return new Response(
          JSON.stringify({ valid: false, error: 'DECRYPTION_FAILED' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
      // Legacy mode
      if (!session_token || !device_fingerprint) {
        return new Response(
          JSON.stringify({ valid: false, error: 'MISSING_PARAMS' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      validationData = { session_token, device_fingerprint, integrity_hash };
    }

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('license_sessions')
      .select('*, licenses(status)')
      .eq('session_token', validationData.session_token)
      .eq('device_fingerprint', validationData.device_fingerprint)
      .maybeSingle();

    if (sessionError || !session) {
      console.log('[HEARTBEAT] Session not found');
      return new Response(
        JSON.stringify({ valid: false, error: 'SESSION_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('license_sessions').delete().eq('session_token', validationData.session_token);
      console.log('[HEARTBEAT] Session expired');
      return new Response(
        JSON.stringify({ valid: false, error: 'SESSION_EXPIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if license is still active
    if (session.licenses?.status !== 'active') {
      await supabase.from('license_sessions').delete().eq('session_token', validationData.session_token);
      console.log('[HEARTBEAT] License inactive');
      return new Response(
        JSON.stringify({ valid: false, error: 'LICENSE_INACTIVE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // === INTEGRITY CHECK ===
    if (session.integrity_hash && session.integrity_hash !== 'not-provided') {
      if (validationData.integrity_hash && validationData.integrity_hash !== session.integrity_hash) {
        console.log('[HEARTBEAT] Integrity hash mismatch!');
        // Log the tampering attempt
        await supabase.from('license_logs').insert({
          license_id: session.license_id,
          license_key: 'HEARTBEAT',
          device_fingerprint: validationData.device_fingerprint,
          ip_address: clientIP,
          action: 'integrity_violation',
          metadata: { 
            expected: session.integrity_hash.substring(0, 20) + '...',
            received: validationData.integrity_hash?.substring(0, 20) + '...',
          },
        });
        
        // Invalidate session
        await supabase.from('license_sessions').delete().eq('session_token', validationData.session_token);
        
        return new Response(
          JSON.stringify({ valid: false, error: 'INTEGRITY_VIOLATION' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Update heartbeat and extend session (24 hours)
    const newExpiry = new Date(Date.now() + 86400000).toISOString();
    await supabase
      .from('license_sessions')
      .update({
        last_heartbeat: new Date().toISOString(),
        expires_at: newExpiry,
        ip_address: clientIP,
      })
      .eq('session_token', validationData.session_token);

    // Generate response payload
    const responsePayload = {
      valid: true,
      session_expires: Date.now() + 86400000,
      server_time: Date.now(),
      verified_integrity_hash: session.integrity_hash !== 'not-provided' ? session.integrity_hash : null,
    };

    const payloadString = JSON.stringify(responsePayload);
    const signature = await signPayload(payloadString);

    // Encrypt response if requested
    if (encrypt_response || isE2Ev2) {
      try {
        const sessionKey = await deriveSessionKey(validationData.session_token, E2E_SALT);
        const encryptedResponse = await encryptData(
          JSON.stringify({ ...responsePayload, signature, signature_algorithm: 'HMAC-SHA256' }),
          sessionKey
        );

        console.log('[HEARTBEAT] ✅ Response encrypted');

        return new Response(
          JSON.stringify({
            encrypted: true,
            iv: encryptedResponse.iv,
            ciphertext: encryptedResponse.ciphertext,
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } catch (encryptError) {
        console.error('[HEARTBEAT] Response encryption failed:', encryptError);
        // Fall through to legacy response
      }
    }

    console.log('[HEARTBEAT] Success');

    return new Response(
      JSON.stringify({
        ...responsePayload,
        signature,
        signature_algorithm: 'HMAC-SHA256',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[HEARTBEAT] Error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
