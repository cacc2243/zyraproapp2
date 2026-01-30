import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
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

async function verifySecureToken(token: string, secret: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const dataToVerify = `${encodedHeader}.${encodedPayload}`;

    const encoder = new TextEncoder();
    const secretKey = encoder.encode(secret).buffer as ArrayBuffer;
    const dataBytes = encoder.encode(dataToVerify).buffer as ArrayBuffer;
    const expectedSignature = await createHmacSha256(secretKey, dataBytes);
    const expectedEncodedSignature = arrayBufferToBase64Url(expectedSignature);

    if (encodedSignature !== expectedEncodedSignature) {
      return { valid: false };
    }

    const payloadJson = atob(encodedPayload.replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(payloadJson);

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

// Hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!JWT_SECRET) {
      console.error('JWT_SECRET not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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

    const { transaction_id, license_key } = await req.json();

    if (!transaction_id || !license_key) {
      return new Response(
        JSON.stringify({ success: false, error: 'ID da transação e licença são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if license already exists in licenses table
    const { data: existingLicense } = await supabase
      .from('licenses')
      .select('id')
      .eq('license_key', license_key)
      .maybeSingle();

    if (existingLicense) {
      return new Response(
        JSON.stringify({ success: false, error: 'Esta licença já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if license already exists on another transaction
    const { data: existingTx } = await supabase
      .from('transactions')
      .select('id')
      .eq('license_key', license_key)
      .neq('id', transaction_id)
      .single();

    if (existingTx) {
      return new Response(
        JSON.stringify({ success: false, error: 'Esta licença já está em uso' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get transaction details for hashing
    const { data: transaction } = await supabase
      .from('transactions')
      .select('customer_email, customer_document')
      .eq('id', transaction_id)
      .single();

    // Prepare hashes for secure storage
    const emailHash = transaction?.customer_email ? await hashData(transaction.customer_email) : null;
    const documentHash = transaction?.customer_document ? await hashData(transaction.customer_document.replace(/\D/g, '')) : null;

    // Save to licenses table
    const { error: licenseError } = await supabase
      .from('licenses')
      .insert({
        license_key,
        transaction_id,
        customer_email_hash: emailHash,
        customer_document_hash: documentHash,
        status: 'active',
        origin: 'manual',
        max_devices: 3
      });

    if (licenseError) {
      console.error('Error saving to licenses table:', licenseError);
    }

    // Update the transaction with the license and metadata (manual origin)
    const { error } = await supabase
      .from('transactions')
      .update({ 
        license_key,
        license_created_at: new Date().toISOString(),
        license_origin: 'manual'
      })
      .eq('id', transaction_id);

    if (error) {
      console.error('Error saving license:', error);
      throw error;
    }

    // Log the creation
    await supabase.from('license_logs').insert({
      license_key,
      action: 'created',
      metadata: { 
        origin: 'manual', 
        transaction_id,
        source: 'admin-panel'
      }
    });

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
