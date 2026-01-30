-- Create table for proxy/extension logs
CREATE TABLE public.extension_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text,
  log_type text NOT NULL DEFAULT 'info',
  message text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.extension_logs ENABLE ROW LEVEL SECURITY;

-- Deny public access
CREATE POLICY "Deny all public access on extension_logs"
ON public.extension_logs
FOR ALL
USING (false);

-- Create index for faster queries
CREATE INDEX idx_extension_logs_created_at ON public.extension_logs(created_at DESC);
CREATE INDEX idx_extension_logs_log_type ON public.extension_logs(log_type);
CREATE INDEX idx_extension_logs_license_key ON public.extension_logs(license_key);

-- Create function to clean old logs (keep 7 days)
CREATE OR REPLACE FUNCTION public.clean_old_extension_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.extension_logs WHERE created_at < now() - interval '7 days';
END;
$$;