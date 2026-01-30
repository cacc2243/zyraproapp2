import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    console.log('Starting subscription expiry check...');

    // Find all active subscriptions that have expired
    const { data: expiredSubs, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, license_id, customer_email, product_type, plan_type')
      .eq('status', 'active')
      .lt('current_period_end', new Date().toISOString());

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${expiredSubs?.length || 0} expired subscriptions`);

    let suspendedCount = 0;

    for (const sub of expiredSubs || []) {
      try {
        // Update subscription status to expired
        const { error: subUpdateError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id);

        if (subUpdateError) {
          console.error(`Error updating subscription ${sub.id}:`, subUpdateError);
          continue;
        }

        // Suspend the linked license
        if (sub.license_id) {
          const { error: licenseError } = await supabase
            .from('licenses')
            .update({ status: 'suspended' })
            .eq('id', sub.license_id);

          if (licenseError) {
            console.error(`Error suspending license ${sub.license_id}:`, licenseError);
          } else {
            // Log the suspension
            const { data: license } = await supabase
              .from('licenses')
              .select('license_key')
              .eq('id', sub.license_id)
              .single();

            if (license) {
              await supabase.from('license_logs').insert({
                license_id: sub.license_id,
                license_key: license.license_key,
                action: 'subscription_expired',
                metadata: {
                  subscription_id: sub.id,
                  product_type: sub.product_type,
                  plan_type: sub.plan_type,
                  reason: 'automatic_expiry'
                }
              });
            }
          }
        }

        suspendedCount++;
        console.log(`Suspended subscription ${sub.id} for ${sub.customer_email}`);
      } catch (err) {
        console.error(`Error processing subscription ${sub.id}:`, err);
      }
    }

    console.log(`Subscription expiry check complete. Suspended: ${suspendedCount}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Processed ${expiredSubs?.length || 0} expired subscriptions, suspended ${suspendedCount}` 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in subscription expiry check:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});