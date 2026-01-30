import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const jwtSecret = Deno.env.get('JWT_SECRET')!;

async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
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
      encoder.encode(jwtSecret),
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const auth = await verifyAdminToken(token);
    
    if (!auth.valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // GET - List licenses
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
      const offset = (page - 1) * limit;

      // If searching, first find matching transaction IDs by email, name, or phone
      let transactionIds: string[] | null = null;
      if (search) {
        const searchTerm = search.trim();
        const phoneDigits = searchTerm.replace(/\D/g, '');
        
        let txQuery = supabase.from('transactions').select('id');
        
        // Build OR conditions for email, name, and phone
        if (phoneDigits.length >= 4) {
          // If search looks like a phone number, include phone search
          txQuery = txQuery.or(`customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%,customer_phone.ilike.%${phoneDigits}%`);
        } else {
          // Otherwise just search email and name
          txQuery = txQuery.or(`customer_email.ilike.%${searchTerm}%,customer_name.ilike.%${searchTerm}%`);
        }
        
        const { data: matchingTransactions } = await txQuery;
        
        if (matchingTransactions && matchingTransactions.length > 0) {
          transactionIds = matchingTransactions.map(t => t.id);
        }
      }

      let query = supabase
        .from('licenses')
        .select(`
          *,
          license_devices (
            id,
            device_fingerprint,
            device_name,
            is_active,
            first_seen_at,
            last_seen_at,
            ip_address,
            device_info
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      // Search by license key OR by transaction_id (for email/name/phone search)
      if (search) {
        if (transactionIds && transactionIds.length > 0) {
          // Search by transaction data - use matching transaction IDs
          query = query.or(`license_key.ilike.%${search}%,transaction_id.in.(${transactionIds.join(',')})`);
        } else {
          // Search only by license key
          query = query.ilike('license_key', `%${search}%`);
        }
      }

      const { data: licenses, error, count } = await query;

      if (error) {
        console.error('Error fetching licenses:', error);
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get transaction info for each license
      const licensesWithTransaction = await Promise.all(
        (licenses || []).map(async (license) => {
          if (license.transaction_id) {
            const { data: transaction } = await supabase
              .from('transactions')
              .select('customer_name, customer_email')
              .eq('id', license.transaction_id)
              .single();
            
            return { ...license, transaction };
          }
          return { ...license, transaction: null };
        })
      );

      // Summary
      const { data: allLicenses } = await supabase
        .from('licenses')
        .select('status');

      const summary = {
        total: allLicenses?.length || 0,
        active: allLicenses?.filter(l => l.status === 'active').length || 0,
        suspended: allLicenses?.filter(l => l.status === 'suspended').length || 0,
        revoked: allLicenses?.filter(l => l.status === 'revoked').length || 0,
        awaiting_activation: allLicenses?.filter(l => l.status === 'awaiting_activation').length || 0,
      };

      const totalItems = count || 0;
      const totalPages = Math.ceil(totalItems / limit);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: licensesWithTransaction, 
          summary,
          pagination: {
            page,
            limit,
            total: totalItems,
            totalPages
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // POST - Update license status
    if (req.method === 'POST') {
      const body = await req.json();
      const { license_id, action } = body;

      if (!license_id || !action) {
        return new Response(
          JSON.stringify({ success: false, error: 'Missing license_id or action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      let newStatus: string;
      switch (action) {
        case 'activate':
          newStatus = 'active';
          break;
        case 'suspend':
          newStatus = 'suspended';
          break;
        case 'revoke':
          newStatus = 'revoked';
          break;
        case 'reset_device':
          // Delete all devices for this license
          const { error: deleteError } = await supabase
            .from('license_devices')
            .delete()
            .eq('license_id', license_id);

          if (deleteError) {
            return new Response(
              JSON.stringify({ success: false, error: deleteError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Reset activated_at
          await supabase
            .from('licenses')
            .update({ activated_at: null })
            .eq('id', license_id);

          // Log the action
          const { data: resetLicense } = await supabase
            .from('licenses')
            .select('license_key')
            .eq('id', license_id)
            .single();

          await supabase.from('license_logs').insert({
            license_id,
            license_key: resetLicense?.license_key || '',
            action: 'device_reset_by_admin',
            metadata: { admin: auth.username }
          });

          return new Response(
            JSON.stringify({ success: true, message: 'Dispositivo resetado com sucesso' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'enforce_device_limit':
          // Update max_devices to 1 for all licenses
          const { error: enforceError } = await supabase
            .from('licenses')
            .update({ max_devices: 1 })
            .neq('max_devices', 1);

          if (enforceError) {
            return new Response(
              JSON.stringify({ success: false, error: enforceError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(
            JSON.stringify({ success: true, message: 'Todas as licenças agora têm limite de 1 dispositivo' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'reset_all_devices':
          // Delete all devices from all licenses
          const { error: resetAllError } = await supabase
            .from('license_devices')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Match all records

          if (resetAllError) {
            return new Response(
              JSON.stringify({ success: false, error: resetAllError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Reset activated_at for all licenses
          await supabase
            .from('licenses')
            .update({ activated_at: null })
            .neq('id', '00000000-0000-0000-0000-000000000000');

          // Log the action
          await supabase.from('license_logs').insert({
            license_key: 'BULK_ACTION',
            action: 'all_devices_reset_by_admin',
            metadata: { admin: auth.username }
          });

          return new Response(
            JSON.stringify({ success: true, message: 'Todos os dispositivos foram resetados com sucesso' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'suspend_all':
          // Suspend all active licenses
          const { error: suspendAllError, count: suspendedCount } = await supabase
            .from('licenses')
            .update({ status: 'suspended' })
            .eq('status', 'active');

          if (suspendAllError) {
            return new Response(
              JSON.stringify({ success: false, error: suspendAllError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Log the action
          await supabase.from('license_logs').insert({
            license_key: 'BULK_ACTION',
            action: 'all_licenses_suspended_by_admin',
            metadata: { admin: auth.username, count: suspendedCount }
          });

          return new Response(
            JSON.stringify({ success: true, message: 'Todas as licenças ativas foram suspensas' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        case 'reset_password':
          // Get license with transaction to find the customer email
          const { data: licenseWithTx, error: licenseError } = await supabase
            .from('licenses')
            .select('license_key, transaction_id')
            .eq('id', license_id)
            .single();

          if (licenseError || !licenseWithTx) {
            return new Response(
              JSON.stringify({ success: false, error: 'Licença não encontrada' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Get customer email from transaction
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .select('customer_email')
            .eq('id', licenseWithTx.transaction_id)
            .single();

          if (txError || !transaction?.customer_email) {
            return new Response(
              JSON.stringify({ success: false, error: 'Email do cliente não encontrado' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Delete password from member_credentials
          const { error: deleteCredError, count } = await supabase
            .from('member_credentials')
            .delete()
            .eq('email', transaction.customer_email.toLowerCase().trim());

          if (deleteCredError) {
            return new Response(
              JSON.stringify({ success: false, error: deleteCredError.message }),
              { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Log the action
          await supabase.from('license_logs').insert({
            license_id,
            license_key: licenseWithTx.license_key || '',
            action: 'password_reset_by_admin',
            metadata: { admin: auth.username, email: transaction.customer_email }
          });

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: count && count > 0 
                ? 'Senha redefinida com sucesso. O usuário pode cadastrar nova senha.' 
                : 'Usuário ainda não tinha senha cadastrada.'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );

        default:
          return new Response(
            JSON.stringify({ success: false, error: 'Invalid action' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
      }

      const { error: updateError } = await supabase
        .from('licenses')
        .update({ status: newStatus })
        .eq('id', license_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ success: false, error: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      const { data: license } = await supabase
        .from('licenses')
        .select('license_key')
        .eq('id', license_id)
        .single();

      await supabase.from('license_logs').insert({
        license_id,
        license_key: license?.license_key || '',
        action: `status_changed_to_${newStatus}`,
        metadata: { admin: auth.username, previous_action: action }
      });

      return new Response(
        JSON.stringify({ success: true, message: `Licença ${newStatus === 'active' ? 'ativada' : newStatus === 'suspended' ? 'suspensa' : 'revogada'} com sucesso` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
