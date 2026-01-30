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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const JWT_SECRET = Deno.env.get('JWT_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!JWT_SECRET) {
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
    const section = url.searchParams.get('section') || 'all';

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Extension Logs (last hour)
    let extensionLogs: any[] = [];
    if (section === 'all' || section === 'logs') {
      const { data: logs } = await supabase
        .from('extension_logs')
        .select('*')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      extensionLogs = logs || [];
    }

    // Count errors in last hour
    const proxyErrors1h = extensionLogs.filter(l => l.log_type === 'error').length;

    // Active Sessions with customer name
    let activeSessions: any[] = [];
    if (section === 'all' || section === 'sessions') {
      const { data: sessions } = await supabase
        .from('license_sessions')
        .select(`
          id,
          session_token,
          device_fingerprint,
          ip_address,
          integrity_hash,
          created_at,
          last_heartbeat,
          expires_at,
          license_id,
          licenses (
            license_key,
            status,
            transaction_id,
            transactions (
              customer_name,
              customer_email
            )
          )
        `)
        .gte('expires_at', now.toISOString())
        .order('last_heartbeat', { ascending: false })
        .limit(100);

      activeSessions = sessions || [];
    }

    // Integrity Violations (from license_logs)
    let integrityViolations: any[] = [];
    if (section === 'all' || section === 'violations') {
      const { data: violations } = await supabase
        .from('license_logs')
        .select(`
          id,
          license_id,
          license_key,
          action,
          ip_address,
          device_fingerprint,
          metadata,
          created_at
        `)
        .in('action', [
          'integrity_violation',
          'invalid_signature',
          'tampered_extension',
          'debug_detected',
          'session_invalidated',
          'unknown_hash_blocked',
          'validation_failed'
        ])
        .gte('created_at', oneDayAgo)
        .order('created_at', { ascending: false })
        .limit(100);

      integrityViolations = violations || [];

      // Count violations per license and auto-suspend if > 4
      const violationCountByLicense: Record<string, { count: number; license_id: string | null }> = {};
      for (const v of integrityViolations) {
        const key = v.license_key;
        if (!violationCountByLicense[key]) {
          violationCountByLicense[key] = { count: 0, license_id: v.license_id };
        }
        violationCountByLicense[key].count++;
      }

      // Auto-suspend licenses with more than 4 violations
      const licensesToSuspend: string[] = [];
      for (const [licenseKey, data] of Object.entries(violationCountByLicense)) {
        if (data.count > 4 && data.license_id) {
          licensesToSuspend.push(data.license_id);
        }
      }

      if (licensesToSuspend.length > 0) {
        // Update licenses to suspended status
        const { error: suspendError } = await supabase
          .from('licenses')
          .update({ status: 'blocked' })
          .in('id', licensesToSuspend)
          .eq('status', 'active'); // Only suspend if currently active

        if (!suspendError) {
          // Log the auto-suspension
          for (const licenseId of licensesToSuspend) {
            const license = integrityViolations.find(v => v.license_id === licenseId);
            if (license) {
              await supabase.from('license_logs').insert({
                license_id: licenseId,
                license_key: license.license_key,
                action: 'auto_suspended',
                metadata: { reason: 'more_than_4_violations_24h', suspended_at: now.toISOString() }
              });
              console.log(`[AUTO-SUSPEND] License ${license.license_key} suspended due to ${violationCountByLicense[license.license_key]?.count || 0} violations`);
            }
          }
        }
      }

      // Enrich violations with customer name
      const licenseKeys = [...new Set(integrityViolations.map(v => v.license_key))];
      if (licenseKeys.length > 0) {
        const { data: licensesWithCustomer } = await supabase
          .from('licenses')
          .select(`
            license_key,
            transactions (
              customer_name,
              customer_email
            )
          `)
          .in('license_key', licenseKeys);

        const customerMap: Record<string, { name: string; email: string }> = {};
        for (const lic of licensesWithCustomer || []) {
          if (lic.transactions) {
            customerMap[lic.license_key] = {
              name: (lic.transactions as any).customer_name || '',
              email: (lic.transactions as any).customer_email || ''
            };
          }
        }

        // Add customer info to violations
        integrityViolations = integrityViolations.map(v => ({
          ...v,
          customer_name: customerMap[v.license_key]?.name || null,
          customer_email: customerMap[v.license_key]?.email || null,
          violation_count: violationCountByLicense[v.license_key]?.count || 1
        }));
      }
    }

    // Rate Limit Violations
    let rateLimitViolations: any[] = [];
    if (section === 'all' || section === 'ratelimits') {
      const { data: rateLimits } = await supabase
        .from('rate_limit_logs')
        .select('*')
        .gte('created_at', oneHourAgo)
        .order('created_at', { ascending: false })
        .limit(200);

      // Group by IP and endpoint to find abuse patterns
      const grouped: Record<string, { count: number; ip: string; endpoint: string; lastSeen: string }> = {};
      for (const log of rateLimits || []) {
        const key = `${log.ip_address}-${log.endpoint}`;
        if (!grouped[key]) {
          grouped[key] = { count: 0, ip: log.ip_address, endpoint: log.endpoint, lastSeen: log.created_at };
        }
        grouped[key].count++;
        if (new Date(log.created_at) > new Date(grouped[key].lastSeen)) {
          grouped[key].lastSeen = log.created_at;
        }
      }

      // Filter for high-volume IPs (potential abuse)
      rateLimitViolations = Object.values(grouped)
        .filter(g => g.count >= 5) // 5+ requests in 1 hour is noteworthy
        .sort((a, b) => b.count - a.count);
    }

    // Count auto-suspended in this run
    const autoSuspendedCount = integrityViolations.filter(v => v.violation_count > 4).length > 0 ? 
      [...new Set(integrityViolations.filter(v => v.violation_count > 4).map(v => v.license_key))].length : 0;

    // Summary Stats
    const summary = {
      active_sessions: activeSessions.length,
      integrity_violations_24h: integrityViolations.length,
      rate_limit_alerts: rateLimitViolations.length,
      auto_suspended: autoSuspendedCount,
      extension_logs_1h: extensionLogs.length,
      proxy_errors_1h: proxyErrors1h,
      timestamp: now.toISOString()
    };

    // Log admin access
    console.log(`[MONITORING] Admin access: username=${username}, timestamp=${now.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        data: {
          sessions: activeSessions,
          violations: integrityViolations,
          ratelimits: rateLimitViolations,
          extensionLogs
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
