import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rate-limit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validate email format
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

// Get client IP from request
function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
         req.headers.get('x-real-ip') || 
         'unknown';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const clientIP = getClientIP(req);
    
    // Rate limiting: uses config from rate-limit.ts
    const rateLimitResult = await checkRateLimit(supabase, clientIP, 'update-email');
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for update-email from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Muitas tentativas. Tente novamente em 15 minutos.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { transaction_id, new_email, original_email, update_token } = await req.json();

    // Validate required fields
    if (!transaction_id || !new_email || !original_email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Campos obrigatórios faltando' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    if (!isValidEmail(new_email)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify the transaction exists and belongs to the original email
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, customer_email, pepper_transaction_id, email_update_token, email_update_token_expires_at')
      .eq('pepper_transaction_id', transaction_id)
      .maybeSingle();

    if (fetchError || !transaction) {
      console.error('Transaction not found:', transaction_id);
      return new Response(
        JSON.stringify({ success: false, error: 'Transação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify original email matches (authorization check)
    if (transaction.customer_email !== original_email) {
      console.error(`Email mismatch for transaction ${transaction_id}. IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ success: false, error: 'Não autorizado' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Verify email update token if provided (required if token exists)
    if (transaction.email_update_token) {
      if (!update_token) {
        console.error(`Email update attempted without token for transaction ${transaction_id}. IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Token de atualização necessário' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check token match
      if (transaction.email_update_token !== update_token) {
        console.error(`Invalid email update token for transaction ${transaction_id}. IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ success: false, error: 'Token de atualização inválido' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check token expiration
      if (transaction.email_update_token_expires_at) {
        const expiresAt = new Date(transaction.email_update_token_expires_at);
        if (expiresAt < new Date()) {
          console.error(`Expired email update token for transaction ${transaction_id}. IP: ${clientIP}`);
          return new Response(
            JSON.stringify({ success: false, error: 'Token de atualização expirado' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Update the email and invalidate the token
    const { error: updateError } = await supabase
      .from('transactions')
      .update({ 
        customer_email: new_email,
        updated_at: new Date().toISOString(),
        email_update_token: null, // Invalidate token after use
        email_update_token_expires_at: null
      })
      .eq('id', transaction.id);

    if (updateError) {
      console.error('Error updating email:', updateError);
      throw updateError;
    }

    console.log(`Email updated for transaction ${transaction_id}: ${original_email} -> ${new_email}. IP: ${clientIP}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error updating email:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
