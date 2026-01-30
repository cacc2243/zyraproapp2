-- Enable RLS on admin_users table (if not already enabled)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Block all public SELECT access to admin_users table
-- Only edge functions with service_role can access this table
CREATE POLICY "Deny all public SELECT on admin_users"
ON public.admin_users
FOR SELECT
TO anon, authenticated
USING (false);

-- Block all public INSERT on admin_users
CREATE POLICY "Deny all public INSERT on admin_users"
ON public.admin_users
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

-- Block all public UPDATE on admin_users
CREATE POLICY "Deny all public UPDATE on admin_users"
ON public.admin_users
FOR UPDATE
TO anon, authenticated
USING (false);

-- Block all public DELETE on admin_users
CREATE POLICY "Deny all public DELETE on admin_users"
ON public.admin_users
FOR DELETE
TO anon, authenticated
USING (false);