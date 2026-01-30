import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const url = new URL(req.url);
    const transactionId = url.searchParams.get('transaction_id');

    if (!transactionId) {
      return new Response(
        JSON.stringify({ success: false, error: 'transaction_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try to find by transaction_hash or pepper_transaction_id
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('id, payment_status, access_granted, paid_at, customer_name, customer_email, customer_phone, customer_document, amount, fbp, fbc')
      .or(`transaction_hash.eq.${transactionId},pepper_transaction_id.eq.${transactionId}`)
      .maybeSingle();

    if (error) {
      console.error('Error fetching transaction:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'Error fetching transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!transaction) {
      return new Response(
        JSON.stringify({ success: false, error: 'Transaction not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          status: transaction.payment_status,
          is_paid: transaction.payment_status === 'paid',
          access_granted: transaction.access_granted,
          paid_at: transaction.paid_at,
          // Return customer data for Facebook event
          customer: {
            name: transaction.customer_name,
            email: transaction.customer_email,
            phone: transaction.customer_phone,
            document: transaction.customer_document,
          },
          amount: transaction.amount,
          fbp: transaction.fbp,
          fbc: transaction.fbc,
          transaction_id: transaction.id
        }
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
