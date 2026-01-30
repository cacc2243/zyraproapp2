-- Create table for member credentials
CREATE TABLE public.member_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.member_credentials ENABLE ROW LEVEL SECURITY;

-- Deny all public access - only edge functions with service_role can access
CREATE POLICY "Deny all public access on member_credentials" 
ON public.member_credentials FOR ALL 
USING (false);

-- Create trigger for updated_at
CREATE TRIGGER update_member_credentials_updated_at
BEFORE UPDATE ON public.member_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();