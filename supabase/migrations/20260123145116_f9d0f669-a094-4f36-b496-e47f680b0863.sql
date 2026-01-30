-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Allow anonymous insert on transactions" ON public.transactions;

-- Create a restrictive INSERT policy that denies all public inserts
-- Edge functions use service_role which bypasses RLS, so this is safe
CREATE POLICY "Deny all public INSERT on transactions"
ON public.transactions
FOR INSERT
TO public
WITH CHECK (false);