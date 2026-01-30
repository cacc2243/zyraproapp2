import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getClientIP } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SIGNING_KEY_SEED = Deno.env.get('LICENSE_SIGNING_KEY') || 'default-dev-key-do-not-use-in-production';

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

    const { session_token, device_fingerprint, client_timestamp } = await req.json();

    if (!session_token || !device_fingerprint) {
      return new Response(
        JSON.stringify({ valid: false, error: 'MISSING_PARAMS' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find active session
    const { data: session, error: sessionError } = await supabase
      .from('license_sessions')
      .select('*, licenses(status)')
      .eq('session_token', session_token)
      .eq('device_fingerprint', device_fingerprint)
      .maybeSingle();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ valid: false, error: 'SESSION_NOT_FOUND' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if session expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from('license_sessions').delete().eq('session_token', session_token);
      return new Response(
        JSON.stringify({ valid: false, error: 'SESSION_EXPIRED' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if license is still active
    if (session.licenses?.status !== 'active') {
      await supabase.from('license_sessions').delete().eq('session_token', session_token);
      return new Response(
        JSON.stringify({ valid: false, error: 'LICENSE_INACTIVE' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update heartbeat and extend session (24 hours to prevent frequent expiration)
    const newExpiry = new Date(Date.now() + 86400000).toISOString(); // Extend by 24 hours
    await supabase
      .from('license_sessions')
      .update({
        last_heartbeat: new Date().toISOString(),
        expires_at: newExpiry,
        ip_address: clientIP,
      })
      .eq('session_token', session_token);

    // Generate signed response
    const responsePayload = {
      valid: true,
      session_expires: Date.now() + 3600000,
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

  } catch (error: unknown) {
    console.error('Heartbeat error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
