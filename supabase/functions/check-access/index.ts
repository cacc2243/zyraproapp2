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

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ success: false, error: 'Email é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const emailLower = email.toLowerCase().trim();

    // Check if email has access granted OR payment is approved (paid)
    const { data: transaction, error } = await supabase
      .from('transactions')
      .select('id, customer_email, customer_name, customer_document, customer_phone, access_granted, payment_status, license_key')
      .eq('customer_email', emailLower)
      .or('access_granted.eq.true,payment_status.eq.paid')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking access:', error);
      throw error;
    }

    const hasAccess = !!transaction;

    // If has access, also get the fingerprint from license_devices if license exists
    let fingerprint = null;
    if (hasAccess && transaction?.license_key) {
      // Get the license to find devices
      const { data: license } = await supabase
        .from('licenses')
        .select('id')
        .eq('license_key', transaction.license_key)
        .maybeSingle();

      if (license) {
        // Get the first active device fingerprint
        const { data: device } = await supabase
          .from('license_devices')
          .select('device_fingerprint')
          .eq('license_id', license.id)
          .eq('is_active', true)
          .order('last_seen_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        fingerprint = device?.device_fingerprint || null;
      }
    }

    // Format CPF for display
    const formatCPF = (cpf: string | null) => {
      if (!cpf) return null;
      const cleaned = cpf.replace(/\D/g, '');
      if (cleaned.length !== 11) return cpf;
      return `${cleaned.slice(0,3)}.${cleaned.slice(3,6)}.${cleaned.slice(6,9)}-${cleaned.slice(9)}`;
    };

    return new Response(
      JSON.stringify({ 
        success: true, 
        has_access: hasAccess,
        payment_status: transaction?.payment_status || null,
        user_data: hasAccess ? {
          name: transaction?.customer_name || null,
          email: transaction?.customer_email || null,
          document: formatCPF(transaction?.customer_document),
          phone: transaction?.customer_phone || null,
          license_key: transaction?.license_key || null,
          fingerprint: fingerprint,
        } : null
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error checking access:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});