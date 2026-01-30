-- Remove the overly permissive SELECT policy
DROP POLICY IF EXISTS "Settings are publicly readable" ON public.settings;

-- Create a restrictive SELECT policy that denies all public access
-- Edge functions use service_role which bypasses RLS
CREATE POLICY "Deny all public SELECT on settings"
ON public.settings
FOR SELECT
TO public
USING (false);