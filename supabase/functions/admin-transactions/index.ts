import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

// Format CPF for display
function formatCPF(cpf: string | null): string | null {
  if (!cpf) return null;
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
}

// Format phone for display
function formatPhone(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 11) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  } else if (digits.length === 10) {
    return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  }
  return phone;
}

// Format transaction data for admin view (no masking)
function formatTransactionData(transaction: any): any {
  return {
    ...transaction,
    customer_document: formatCPF(transaction.customer_document),
    customer_phone: formatPhone(transaction.customer_phone),
    // Remove fields that admins don't need for daily operations
    pix_code: undefined,
    qr_code_base64: undefined,
  };
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
    const { valid, username } = await verifySecureToken(token, JWT_SECRET);

    if (!valid) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token inválido ou expirado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');
    const searchQuery = url.searchParams.get('search') || url.searchParams.get('email'); // Support both 'search' and legacy 'email' param
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100); // Cap at 100
    const offset = (page - 1) * limit;

    // Select only necessary fields instead of SELECT *
    let query = supabase
      .from('transactions')
      .select(`
        id,
        customer_name,
        customer_email,
        customer_phone,
        customer_document,
        amount,
        payment_status,
        payment_method,
        access_granted,
        access_granted_at,
        license_key,
        license_origin,
        license_created_at,
        pepper_transaction_id,
        offer_title,
        product_title,
        utm_source,
        utm_medium,
        utm_campaign,
        ip_address,
        created_at,
        updated_at,
        paid_at
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('payment_status', status);
    }

    // Search filter - by email, name or phone (case insensitive partial match)
    if (searchQuery && searchQuery.trim()) {
      const search = searchQuery.trim();
      // Remove non-digit characters for phone search
      const phoneDigits = search.replace(/\D/g, '');
      
      // Build OR conditions for email, name, and phone
      if (phoneDigits.length >= 4) {
        // If search looks like a phone number, include phone search
        query = query.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%,customer_phone.ilike.%${phoneDigits}%`);
      } else {
        // Otherwise just search email and name
        query = query.or(`customer_email.ilike.%${search}%,customer_name.ilike.%${search}%`);
      }
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }
    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      throw error;
    }

    // Log admin access for audit trail
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    console.log(`Admin access: username=${username}, records=${transactions?.length || 0}, IP=${clientIP}, timestamp=${new Date().toISOString()}`);

    // Apply PII masking to all transactions
    const formattedTransactions = transactions?.map(formatTransactionData) || [];

    // Get summary stats with same date filter
    let statsQuery = supabase
      .from('transactions')
      .select('payment_status, amount');

    if (dateFrom) {
      statsQuery = statsQuery.gte('created_at', dateFrom);
    }
    if (dateTo) {
      statsQuery = statsQuery.lte('created_at', dateTo);
    }

    const { data: stats } = await statsQuery;

    const summary = {
      total: stats?.length || 0,
      paid: stats?.filter(t => t.payment_status === 'paid').length || 0,
      waiting_payment: stats?.filter(t => t.payment_status === 'waiting_payment').length || 0,
      refused: stats?.filter(t => t.payment_status === 'refused').length || 0,
      total_revenue: stats?.filter(t => t.payment_status === 'paid').reduce((acc, t) => acc + (t.amount || 0), 0) || 0
    };

    return new Response(
      JSON.stringify({
        success: true,
        data: formattedTransactions,
        pagination: {
          page,
          limit,
          total: count,
          totalPages: Math.ceil((count || 0) / limit)
        },
        summary
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
