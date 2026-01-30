-- Add email update token and expiration for secure email changes
ALTER TABLE public.transactions
ADD COLUMN IF NOT EXISTS email_update_token TEXT,
ADD COLUMN IF NOT EXISTS email_update_token_expires_at TIMESTAMP WITH TIME ZONE;

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS idx_transactions_email_update_token ON public.transactions(email_update_token) WHERE email_update_token IS NOT NULL;

-- Fix search_path for clean_old_rate_limit_logs function
CREATE OR REPLACE FUNCTION public.clean_old_rate_limit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  DELETE FROM public.rate_limit_logs WHERE created_at < now() - interval '1 hour';
END;
$function$;

-- Fix search_path for generate_license_key function
CREATE OR REPLACE FUNCTION public.generate_license_key()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $function$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'ZYRA-';
  i INTEGER;
  j INTEGER;
BEGIN
  FOR j IN 1..3 LOOP
    IF j > 1 THEN
      result := result || '-';
    END IF;
    FOR i IN 1..4 LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
  END LOOP;
  RETURN result;
END;
$function$;

-- Fix search_path for update_licenses_updated_at function
CREATE OR REPLACE FUNCTION public.update_licenses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;