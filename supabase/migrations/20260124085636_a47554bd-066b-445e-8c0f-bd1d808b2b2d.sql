-- Create rate_limit_logs table for rate limiting functionality
CREATE TABLE IF NOT EXISTS public.rate_limit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_logs_ip_endpoint_time 
ON public.rate_limit_logs (ip_address, endpoint, created_at DESC);

-- Enable RLS
ALTER TABLE public.rate_limit_logs ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can access
-- This table is only accessed by edge functions with service role key