import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, logRequest, getClientIP, rateLimitResponse } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Ed25519 key pair for signing (in production, store private key in secrets)
// This is the BASE64 encoded private key seed (32 bytes)
const SIGNING_KEY_SEED = Deno.env.get('LICENSE_SIGNING_KEY') || 'default-dev-key-do-not-use-in-production';

// Hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate HMAC-SHA256 signature
async function signPayload(payload: string, key: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(key);
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

// Validate license key format: ZYRA-XXXX-XXXX-XXXX
function isValidLicenseFormat(key: string): boolean {
  const pattern = /^ZYRA-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
  return pattern.test(key.toUpperCase());
}

// Generate session token for the extension
function generateSessionToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Encrypt sensitive data for transport
async function encryptForClient(data: string, sessionKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyHash = await crypto.subtle.digest('SHA-256', encoder.encode(sessionKey));
  const key = await crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  );
  
  // Return IV + encrypted data as base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
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
    const clientIP = getClientIP(req);

    // Rate limiting: 10 requests per minute per IP
    const rateLimit = await checkRateLimit(supabase, clientIP, 'validate-license-secure');
    if (!rateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return rateLimitResponse(rateLimit.remaining, rateLimit.resetIn, corsHeaders);
    }

    await logRequest(supabase, clientIP, 'validate-license-secure');

    const { 
      license_key, 
      device_fingerprint, 
      device_name, 
      device_info,
      nonce,
      challenge_token,
      integrity_hash,
      client_timestamp
    } = await req.json();

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Validate Challenge (Anti-Replay Attack)
    // ═══════════════════════════════════════════════════════════════
    if (!nonce || !challenge_token) {
      return new Response(
        JSON.stringify({ valid: false, error: 'MISSING_CHALLENGE', message: 'Challenge não fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify challenge exists and is valid
    const { data: challenge, error: challengeError } = await supabase
      .from('license_challenges')
      .select('*')
      .eq('nonce', nonce)
      .eq('challenge_token', challenge_token)
      .eq('used', false)
      .maybeSingle();

    if (challengeError || !challenge) {
      await supabase.from('license_logs').insert({
        license_key: license_key?.toUpperCase() || 'UNKNOWN',
        action: 'invalid_challenge',
        ip_address: clientIP,
        device_fingerprint: device_fingerprint || null,
        metadata: { nonce, challenge_token }
      });

      return new Response(
        JSON.stringify({ valid: false, error: 'INVALID_CHALLENGE', message: 'Challenge inválido ou expirado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if challenge expired
    if (new Date(challenge.expires_at) < new Date()) {
      await supabase.from('license_challenges').delete().eq('nonce', nonce);
      return new Response(
        JSON.stringify({ valid: false, error: 'CHALLENGE_EXPIRED', message: 'Challenge expirado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mark challenge as used (one-time use)
    await supabase.from('license_challenges').update({ used: true }).eq('nonce', nonce);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Validate Integrity Hash
    // ═══════════════════════════════════════════════════════════════
    const EXPECTED_INTEGRITY_HASHES: string[] = [
      // Add production hashes here when ready
    ];
    
    if (EXPECTED_INTEGRITY_HASHES.length > 0 && integrity_hash) {
      if (!EXPECTED_INTEGRITY_HASHES.includes(integrity_hash)) {
        console.warn(`Integrity check failed. Hash: ${integrity_hash}, IP: ${clientIP}`);
        
        await supabase.from('license_logs').insert({
          license_key: license_key?.toUpperCase() || 'UNKNOWN',
          action: 'integrity_violation',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { received_hash: integrity_hash }
        });

        return new Response(
          JSON.stringify({ valid: false, error: 'INTEGRITY_VIOLATION' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Validate Time Drift (Anti-Tampering)
    // ═══════════════════════════════════════════════════════════════
    if (client_timestamp) {
      const serverTime = Date.now();
      const timeDrift = Math.abs(serverTime - client_timestamp);
      
      // Allow up to 5 minutes of drift
      if (timeDrift > 300000) {
        await supabase.from('license_logs').insert({
          license_key: license_key?.toUpperCase() || 'UNKNOWN',
          action: 'time_drift_detected',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { client_time: client_timestamp, server_time: serverTime, drift: timeDrift }
        });

        // Don't block, just log - clock issues are common
        console.warn(`Time drift detected: ${timeDrift}ms for IP ${clientIP}`);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Validate License Key
    // ═══════════════════════════════════════════════════════════════
    if (!license_key) {
      return new Response(
        JSON.stringify({ valid: false, error: 'MISSING_LICENSE' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const upperLicenseKey = license_key.toUpperCase().trim();

    if (!isValidLicenseFormat(upperLicenseKey)) {
      return new Response(
        JSON.stringify({ valid: false, error: 'INVALID_FORMAT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Query license with subscription info
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('*, transactions(customer_name), subscriptions(id, status, plan_type, current_period_end)')
      .eq('license_key', upperLicenseKey)
      .maybeSingle();

    if (licenseError) {
      console.error('Error querying license:', licenseError);
      return new Response(
        JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!license) {
      // Check legacy transactions
      const { data: txLicense } = await supabase
        .from('transactions')
        .select('id, license_key, access_granted, customer_name')
        .eq('license_key', upperLicenseKey)
        .maybeSingle();

      if (!txLicense || !txLicense.access_granted) {
        await supabase.from('license_logs').insert({
          license_key: upperLicenseKey,
          action: 'validation_failed',
          ip_address: clientIP,
          device_fingerprint: device_fingerprint || null,
          metadata: { reason: 'not_found' }
        });

        return new Response(
          JSON.stringify({ valid: false, error: 'LICENSE_NOT_FOUND' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Legacy license valid - create signed response
      const sessionToken = generateSessionToken();
      const responsePayload = {
        valid: true,
        status: 'active',
        legacy: true,
        customer_name: txLicense.customer_name || null,
        session_token: sessionToken,
        session_expires: Date.now() + 3600000, // 1 hour
        server_time: Date.now(),
      };

      const signature = await signPayload(JSON.stringify(responsePayload), SIGNING_KEY_SEED);

      return new Response(
        JSON.stringify({
          ...responsePayload,
          signature,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check license status
    if (license.status !== 'active') {
      const errorMap: Record<string, string> = {
        'suspended': 'LICENSE_SUSPENDED',
        'revoked': 'LICENSE_REVOKED',
      };

      await supabase.from('license_logs').insert({
        license_id: license.id,
        license_key: upperLicenseKey,
        action: 'validation_failed',
        ip_address: clientIP,
        device_fingerprint: device_fingerprint || null,
        metadata: { reason: license.status }
      });

      return new Response(
        JSON.stringify({ valid: false, error: errorMap[license.status] || 'LICENSE_INACTIVE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check subscription status if applicable
    const subscription = license.subscriptions?.[0];
    let subscriptionStatus = null;
    let subscriptionExpired = false;

    if (subscription) {
      subscriptionStatus = subscription.status;
      const periodEnd = new Date(subscription.current_period_end);
      
      if (subscription.status === 'expired' || periodEnd < new Date()) {
        subscriptionExpired = true;
        subscriptionStatus = 'expired';

        // Auto-suspend if not already done
        if (subscription.status === 'active') {
          await supabase
            .from('subscriptions')
            .update({ status: 'expired' })
            .eq('id', subscription.id);
          
          await supabase
            .from('licenses')
            .update({ status: 'suspended' })
            .eq('id', license.id);

          await supabase.from('license_logs').insert({
            license_id: license.id,
            license_key: upperLicenseKey,
            action: 'subscription_expired_realtime',
            ip_address: clientIP,
            device_fingerprint: device_fingerprint || null,
            metadata: { subscription_id: subscription.id, period_end: subscription.current_period_end }
          });

          return new Response(
            JSON.stringify({ 
              valid: false, 
              error: 'SUBSCRIPTION_EXPIRED',
              subscription_status: 'expired',
              subscription_end: subscription.current_period_end
            }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Device Management
    // ═══════════════════════════════════════════════════════════════
    if (device_fingerprint) {
      const { data: existingDevice } = await supabase
        .from('license_devices')
        .select('id, is_active')
        .eq('license_id', license.id)
        .eq('device_fingerprint', device_fingerprint)
        .maybeSingle();

      if (existingDevice) {
        if (!existingDevice.is_active) {
          return new Response(
            JSON.stringify({ valid: false, error: 'DEVICE_DEACTIVATED' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('license_devices')
          .update({ last_seen_at: new Date().toISOString(), ip_address: clientIP })
          .eq('id', existingDevice.id);
      } else {
        // Check existing devices
        const { count: totalDevicesCount } = await supabase
          .from('license_devices')
          .select('*', { count: 'exact', head: true })
          .eq('license_id', license.id);

        if ((totalDevicesCount || 0) > 0) {
          await supabase.from('license_logs').insert({
            license_id: license.id,
            license_key: upperLicenseKey,
            action: 'new_device_blocked',
            ip_address: clientIP,
            device_fingerprint,
            metadata: { existing_devices: totalDevicesCount }
          });

          return new Response(
            JSON.stringify({ valid: false, error: 'LICENSE_ALREADY_ACTIVATED' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Register first device
        await supabase.from('license_devices').insert({
          license_id: license.id,
          device_fingerprint,
          device_name: device_name || null,
          ip_address: clientIP,
          device_info: device_info || {},
        });

        await supabase.from('license_logs').insert({
          license_id: license.id,
          license_key: upperLicenseKey,
          action: 'device_activated',
          ip_address: clientIP,
          device_fingerprint,
          metadata: { device_name, first_activation: true }
        });
      }
    }

    // Update license timestamps
    const updateData: Record<string, any> = {
      last_validated_at: new Date().toISOString()
    };

    if (!license.activated_at) {
      updateData.activated_at = new Date().toISOString();
    }

    await supabase.from('licenses').update(updateData).eq('id', license.id);

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Create Signed Response
    // ═══════════════════════════════════════════════════════════════
    const sessionToken = generateSessionToken();
    const customerName = license.transactions?.customer_name || null;

    const responsePayload = {
      valid: true,
      status: license.status,
      customer_name: customerName,
      session_token: sessionToken,
      session_expires: Date.now() + 3600000, // 1 hour
      server_time: Date.now(),
      nonce_used: nonce, // Echo back for client verification
      subscription_status: subscriptionStatus,
      subscription_end: subscription?.current_period_end || null,
      plan_type: subscription?.plan_type || null,
    };

    // Sign the response
    const signature = await signPayload(JSON.stringify(responsePayload), SIGNING_KEY_SEED);

    // Store session for heartbeat verification
    await supabase.from('license_sessions').upsert({
      license_id: license.id,
      session_token: sessionToken,
      device_fingerprint,
      ip_address: clientIP,
      expires_at: new Date(Date.now() + 86400000).toISOString(), // 24 hours
      last_heartbeat: new Date().toISOString(),
    }, { onConflict: 'license_id,device_fingerprint' });

    // Log successful validation
    await supabase.from('license_logs').insert({
      license_id: license.id,
      license_key: upperLicenseKey,
      action: 'validated_secure',
      ip_address: clientIP,
      device_fingerprint: device_fingerprint || null,
    });

    return new Response(
      JSON.stringify({
        ...responsePayload,
        signature,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
