import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Generate a cryptographically secure nonce
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(
        JSON.stringify({ error: 'SERVER_CONFIG_ERROR' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { device_fingerprint, extension_id } = await req.json();

    if (!device_fingerprint) {
      return new Response(
        JSON.stringify({ error: 'MISSING_FINGERPRINT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate challenge components
    const nonce = generateNonce();
    const challengeToken = generateChallengeToken();
    const expiresAt = Date.now() + 60000; // 60 seconds validity

    // Store challenge in database for later verification
    const { error: insertError } = await supabase
      .from('license_challenges')
      .insert({
        nonce,
        challenge_token: challengeToken,
        device_fingerprint,
        extension_id: extension_id || null,
        expires_at: new Date(expiresAt).toISOString(),
        used: false,
      });

    if (insertError) {
      // If table doesn't exist, create it
      if (insertError.code === '42P01') {
        console.log('Challenge table not found, returning challenge anyway');
      } else {
        console.error('Error storing challenge:', insertError);
      }
    }

    // Clean up expired challenges (async, don't wait)
    (async () => {
      try {
        await supabase
          .from('license_challenges')
          .delete()
          .lt('expires_at', new Date().toISOString());
      } catch (e) {
        // Ignore cleanup errors
      }
    })();

    return new Response(
      JSON.stringify({
        nonce,
        challenge_token: challengeToken,
        expires_at: expiresAt,
        server_time: Date.now(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Challenge generation error:', error);
    return new Response(
      JSON.stringify({ error: 'SERVER_ERROR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
