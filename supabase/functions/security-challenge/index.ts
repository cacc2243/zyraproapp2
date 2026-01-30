import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { detectProxyInterceptor, getClientIP } from "../_shared/proxy-detection.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-fingerprint, x-integrity-hash',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Generate a cryptographically secure nonce (32 bytes hex)
function generateNonce(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate a short-lived challenge token
function generateChallengeToken(): string {
  const timestamp = Date.now().toString(36);
  const random = generateNonce().substring(0, 16);
  return `${timestamp}.${random}`;
}

// Generate ECDH key pair for Diffie-Hellman key exchange
async function generateECDHKeyPair(): Promise<{
  publicKey: string;
  privateKeyJwk: JsonWebKey;
}> {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDH",
      namedCurve: "P-256",
    },
    true, // extractable
    ["deriveKey", "deriveBits"]
  );

  // Export public key as base64
  const publicKeyBuffer = await crypto.subtle.exportKey("raw", keyPair.publicKey);
  const publicKeyBase64 = btoa(String.fromCharCode(...new Uint8Array(publicKeyBuffer)));

  // Export private key as JWK (to store in database)
  const privateKeyJwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);

  return {
    publicKey: publicKeyBase64,
    privateKeyJwk,
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
    console.log(`[CHALLENGE] 🚨 PROXY BLOCKED! IP: ${clientIP}, Indicators:`, proxyCheck.indicators);
    return new Response(
      JSON.stringify({ error: 'SECURITY_VIOLATION' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[CHALLENGE] Missing env vars');
      return new Response(
        JSON.stringify({ error: 'SERVER_CONFIG_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const body = await req.json();
    const { device_fingerprint, extension_id, integrity_hash, client_public_key } = body;

    console.log('[CHALLENGE] Request received:', { 
      device_fingerprint: device_fingerprint?.substring(0, 10) + '...', 
      extension_id,
      has_integrity: !!integrity_hash,
      has_client_key: !!client_public_key,
    });

    if (!device_fingerprint) {
      return new Response(
        JSON.stringify({ error: 'MISSING_FINGERPRINT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate challenge components
    const nonce = generateNonce();
    const challengeToken = generateChallengeToken();
    const expiresAt = Date.now() + 300000; // 5 minutes validity

    // Generate ECDH key pair for E2E encryption
    const { publicKey: serverPublicKey, privateKeyJwk } = await generateECDHKeyPair();

    // Store challenge in database with server's private key
    const { error: insertError } = await supabase
      .from('license_challenges')
      .insert({
        nonce,
        challenge_token: challengeToken,
        device_fingerprint,
        extension_id: extension_id || null,
        expires_at: new Date(expiresAt).toISOString(),
        used: false,
        // Store private key for later decryption (encrypted JSON)
        server_private_key: JSON.stringify(privateKeyJwk),
        client_public_key: client_public_key || null,
      });

    if (insertError) {
      console.error('[CHALLENGE] Error storing challenge:', insertError);
      return new Response(
        JSON.stringify({ error: 'CHALLENGE_STORE_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean up expired challenges (async, don't wait)
    (async () => {
      try {
        await supabase
          .from('license_challenges')
          .delete()
          .lt('expires_at', new Date().toISOString());
        console.log('[CHALLENGE] Cleanup completed');
      } catch (e) {
        console.error('[CHALLENGE] Cleanup error:', e);
      }
    })();

    console.log('[CHALLENGE] Challenge generated with ECDH key pair');

    return new Response(
      JSON.stringify({
        success: true,
        nonce,
        challenge_token: challengeToken,
        expires_at: expiresAt,
        server_time: Date.now(),
        // Send server's public key for ECDH key exchange
        server_public_key: serverPublicKey,
        encryption_version: 2, // Indicates E2E v2 with ECDH
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[CHALLENGE] Error:', error);
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
