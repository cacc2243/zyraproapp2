import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// HMAC-SHA256 implementation for JWT verification
async function createHmacSha256(key: ArrayBuffer, data: ArrayBuffer): Promise<ArrayBuffer> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return await crypto.subtle.sign('HMAC', cryptoKey, data);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Verify JWT token with HMAC-SHA256
async function verifySecureToken(token: string, secret: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    // Recreate the signature
    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret).buffer as ArrayBuffer;
    const dataBytes = encoder.encode(dataToVerify).buffer as ArrayBuffer;
    const expectedSignature = await createHmacSha256(secretKey, dataBytes);
    const expectedEncodedSignature = arrayBufferToBase64Url(expectedSignature);

    // Compare signatures
    if (encodedSignature !== expectedEncodedSignature) {
      return { valid: false };
    }

    // Decode payload
    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { valid } = await verifySecureToken(token, JWT_SECRET);

    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { transaction_ids, grant_access } = await req.json();

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'IDs de transação são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const updateData: Record<string, any> = {
      access_granted: grant_access === true,
      updated_at: new Date().toISOString()
    };

    if (grant_access === true) {
      updateData.access_granted_at = new Date().toISOString();
    } else {
      updateData.access_granted_at = null;
    }

    const { error: updateError, count } = await supabase
      .from('transactions')
      .update(updateData)
      .in('id', transaction_ids);

    if (updateError) {
      console.error('Error updating access:', updateError);
      throw updateError;
    }

    console.log(`Updated ${count} transactions with access_granted: ${grant_access}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        updated_count: count,
        access_granted: grant_access
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error updating access:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
