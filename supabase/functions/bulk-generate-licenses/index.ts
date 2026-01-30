import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Generate cryptographically secure license key
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);
  
  const parts: string[] = ['ZYRA'];
  for (let i = 0; i < 3; i++) {
    let segment = '';
    for (let j = 0; j < 4; j++) {
      segment += chars[randomBytes[i * 4 + j] % chars.length];
    }
    parts.push(segment);
  }
  
  return parts.join('-');
}

// Hash data using SHA-256
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify admin token
async function verifyAdminToken(token: string, secret: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    if (!headerB64 || !payloadB64 || !signature) {
      return { valid: false };
    }

    const payload = JSON.parse(atob(payloadB64));
    
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false };
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const data = encoder.encode(`${headerB64}.${payloadB64}`);
    const signatureBytes = await crypto.subtle.sign('HMAC', key, data);
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    if (signature !== expectedSignature) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!JWT_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração do servidor incompleta' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify auth token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token não fornecido' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { valid, username } = await verifyAdminToken(token, JWT_SECRET);

    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transaction_ids } = await req.json();

    if (!transaction_ids || !Array.isArray(transaction_ids) || transaction_ids.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'IDs de transações são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Limit to 50 transactions at a time
    if (transaction_ids.length > 50) {
      return new Response(
        JSON.stringify({ success: false, error: 'Máximo de 50 transações por vez' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch transactions that don't have licenses yet
    const { data: transactions, error: fetchError } = await supabase
      .from('transactions')
      .select('id, customer_email, customer_document, license_key')
      .in('id', transaction_ids);

    if (fetchError) {
      console.error('Error fetching transactions:', fetchError);
      throw fetchError;
    }

    const results = {
      success: 0,
      skipped: 0,
      errors: 0,
      details: [] as { id: string; status: string; license_key?: string; error?: string }[]
    };

    for (const tx of transactions || []) {
      // Skip if already has a license
      if (tx.license_key) {
        results.skipped++;
        results.details.push({ 
          id: tx.id, 
          status: 'skipped', 
          license_key: tx.license_key,
          error: 'Já possui licença' 
        });
        continue;
      }

      try {
        const licenseKey = generateLicenseKey();
        
        // Check if license already exists
        const { data: existingLicense } = await supabase
          .from('licenses')
          .select('id')
          .eq('license_key', licenseKey)
          .maybeSingle();

        if (existingLicense) {
          // Regenerate if collision (very rare)
          continue;
        }

        // Prepare hashes
        const emailHash = tx.customer_email ? await hashData(tx.customer_email) : null;
        const documentHash = tx.customer_document ? await hashData(tx.customer_document.replace(/\D/g, '')) : null;

        // Insert into licenses table
        const { error: licenseError } = await supabase
          .from('licenses')
          .insert({
            license_key: licenseKey,
            transaction_id: tx.id,
            customer_email_hash: emailHash,
            customer_document_hash: documentHash,
            status: 'active',
            origin: 'bulk',
            max_devices: 1
          });

        if (licenseError) {
          console.error('Error creating license:', licenseError);
          results.errors++;
          results.details.push({ id: tx.id, status: 'error', error: licenseError.message });
          continue;
        }

        // Update transaction
        const { error: updateError } = await supabase
          .from('transactions')
          .update({
            license_key: licenseKey,
            license_created_at: new Date().toISOString(),
            license_origin: 'bulk'
          })
          .eq('id', tx.id);

        if (updateError) {
          console.error('Error updating transaction:', updateError);
          results.errors++;
          results.details.push({ id: tx.id, status: 'error', error: updateError.message });
          continue;
        }

        // Log the creation
        await supabase.from('license_logs').insert({
          license_key: licenseKey,
          action: 'created',
          metadata: { 
            origin: 'bulk', 
            transaction_id: tx.id,
            admin: username,
            source: 'bulk-generate'
          }
        });

        results.success++;
        results.details.push({ id: tx.id, status: 'success', license_key: licenseKey });

      } catch (error) {
        console.error('Error processing transaction:', tx.id, error);
        results.errors++;
        results.details.push({ 
          id: tx.id, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido' 
        });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${results.success} licenças geradas, ${results.skipped} já existentes, ${results.errors} erros`,
        results
      }),
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
