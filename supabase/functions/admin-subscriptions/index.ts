import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// Verify JWT token
function verifyAdminToken(authHeader: string | null): boolean {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
  
  try {
    const token = authHeader.replace('Bearer ', '');
    const [, payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64));
    
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      return false;
    }
    
    return payload.username === 'admin';
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Verify admin authentication
    const authHeader = req.headers.get('Authorization');
    if (!verifyAdminToken(authHeader)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const url = new URL(req.url);
    const method = req.method;

    // GET - List subscriptions with filters
    if (method === 'GET') {
      const status = url.searchParams.get('status');
      const productType = url.searchParams.get('product_type');
      const email = url.searchParams.get('email');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '50');
      const offset = (page - 1) * limit;

      let query = supabase
        .from('subscriptions')
        .select('*, licenses(license_key, status)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }
      if (productType && productType !== 'all') {
        query = query.eq('product_type', productType);
      }
      if (email) {
        query = query.ilike('customer_email', `%${email}%`);
      }

      const { data: subscriptions, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate summary stats
      const { data: allSubs } = await supabase
        .from('subscriptions')
        .select('status, amount, plan_type');

      const summary = {
        total: allSubs?.length || 0,
        active: allSubs?.filter(s => s.status === 'active').length || 0,
        expired: allSubs?.filter(s => s.status === 'expired').length || 0,
        cancelled: allSubs?.filter(s => s.status === 'cancelled').length || 0,
        suspended: allSubs?.filter(s => s.status === 'suspended').length || 0,
        mrr: allSubs?.filter(s => s.status === 'active' && s.plan_type === 'monthly')
          .reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
        arr: allSubs?.filter(s => s.status === 'active' && s.plan_type === 'yearly')
          .reduce((sum, s) => sum + (s.amount || 0), 0) || 0,
      };

      return new Response(
        JSON.stringify({
          success: true,
          data: subscriptions,
          summary,
          pagination: {
            page,
            limit,
            total: count || 0,
            totalPages: Math.ceil((count || 0) / limit),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Create or manage subscription
    if (method === 'POST') {
      const body = await req.json();
      const { action } = body;

      // Cancel subscription
      if (action === 'cancel') {
        const { subscription_id } = body;
        
        const { data: sub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('license_id')
          .eq('id', subscription_id)
          .single();

        if (fetchError) throw fetchError;

        // Update subscription status
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'cancelled', 
            cancelled_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription_id);

        if (subError) throw subError;

        // Suspend the license
        if (sub?.license_id) {
          await supabase
            .from('licenses')
            .update({ status: 'suspended' })
            .eq('id', sub.license_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription cancelled' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Reactivate subscription
      if (action === 'reactivate') {
        const { subscription_id, plan_type } = body;
        
        const { data: sub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('license_id, plan_type')
          .eq('id', subscription_id)
          .single();

        if (fetchError) throw fetchError;

        const usePlanType = plan_type || sub?.plan_type || 'monthly';
        const now = new Date();
        let periodEnd: Date;
        
        switch (usePlanType) {
          case 'weekly':
            periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            break;
          case 'yearly':
            periodEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        }

        // Update subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            status: 'active',
            current_period_start: now.toISOString(),
            current_period_end: periodEnd.toISOString(),
            next_billing_date: periodEnd.toISOString(),
            cancelled_at: null,
            updated_at: now.toISOString()
          })
          .eq('id', subscription_id);

        if (subError) throw subError;

        // Reactivate license
        if (sub?.license_id) {
          await supabase
            .from('licenses')
            .update({ status: 'active' })
            .eq('id', sub.license_id);
        }

        return new Response(
          JSON.stringify({ success: true, message: 'Subscription reactivated' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Extend subscription period
      if (action === 'extend') {
        const { subscription_id, days } = body;
        
        const { data: sub, error: fetchError } = await supabase
          .from('subscriptions')
          .select('current_period_end')
          .eq('id', subscription_id)
          .single();

        if (fetchError) throw fetchError;

        const currentEnd = new Date(sub.current_period_end);
        const newEnd = new Date(currentEnd.getTime() + (days || 30) * 24 * 60 * 60 * 1000);

        const { error: subError } = await supabase
          .from('subscriptions')
          .update({ 
            current_period_end: newEnd.toISOString(),
            next_billing_date: newEnd.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription_id);

        if (subError) throw subError;

        return new Response(
          JSON.stringify({ success: true, message: `Subscription extended by ${days} days` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: 'Invalid action' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // GET subscription payments history
    if (method === 'GET' && url.pathname.includes('/payments')) {
      const subscriptionId = url.searchParams.get('subscription_id');
      
      if (!subscriptionId) {
        return new Response(
          JSON.stringify({ success: false, error: 'subscription_id required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: payments, error } = await supabase
        .from('subscription_payments')
        .select('*, transactions(customer_name, customer_email)')
        .eq('subscription_id', subscriptionId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, data: payments }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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