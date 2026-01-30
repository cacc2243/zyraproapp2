import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

const defaultConfigs: Record<string, RateLimitConfig> = {
  'admin-login': { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 min
  'create-pix': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute
  'admin-transactions': { maxRequests: 30, windowMs: 60 * 1000 }, // 30 per minute
  'update-email': { maxRequests: 3, windowMs: 15 * 60 * 1000 }, // 3 attempts per 15 min
  'validate-license': { maxRequests: 10, windowMs: 60 * 1000 }, // 10 per minute per IP
  'default': { maxRequests: 60, windowMs: 60 * 1000 }, // 60 per minute
};

export async function checkRateLimit(
  supabase: SupabaseClient,
  ip: string,
  endpoint: string
): Promise<{ allowed: boolean; remaining: number; resetIn: number }> {
  const config = defaultConfigs[endpoint] || defaultConfigs['default'];
  const windowStart = new Date(Date.now() - config.windowMs).toISOString();

  // Count recent requests from this IP for this endpoint
  const { count, error } = await supabase
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart);

  if (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return { allowed: true, remaining: config.maxRequests, resetIn: 0 };
  }

  const currentCount = count || 0;
  const remaining = Math.max(0, config.maxRequests - currentCount);
  const allowed = currentCount < config.maxRequests;

  return {
    allowed,
    remaining,
    resetIn: Math.ceil(config.windowMs / 1000),
  };
}

export async function logRequest(
  supabase: SupabaseClient,
  ip: string,
  endpoint: string
): Promise<void> {
  const { error } = await supabase
    .from('rate_limit_logs')
    .insert({ ip_address: ip, endpoint });

  if (error) {
    console.error('Rate limit log error:', error);
  }
}

export function getClientIP(req: Request): string {
  // Try various headers that might contain the real IP
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  const realIP = req.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnecting = req.headers.get('cf-connecting-ip');
  if (cfConnecting) {
    return cfConnecting;
  }

  return 'unknown';
}

export function rateLimitResponse(remaining: number, resetIn: number, corsHeaders: Record<string, string>) {
  return new Response(
    JSON.stringify({ 
      success: false, 
      error: 'Muitas tentativas. Tente novamente mais tarde.',
      retryAfter: resetIn
    }),
    { 
      status: 429, 
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': remaining.toString(),
        'Retry-After': resetIn.toString()
      } 
    }
  );
}
