-- Add explicit deny policy for rate_limit_logs to block all public access
-- Edge functions using service_role key will bypass this policy
CREATE POLICY "Deny all public access on rate_limit_logs"
ON public.rate_limit_logs
FOR ALL
USING (false);