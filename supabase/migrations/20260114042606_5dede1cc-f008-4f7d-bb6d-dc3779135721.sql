-- Drop existing UPDATE policy on settings that allows anyone to update
DROP POLICY IF EXISTS "Allow public to update settings" ON public.settings;

-- Create restrictive policy - only allow service role (edge functions) to update settings
-- This effectively makes settings read-only from client side
CREATE POLICY "Only service role can update settings"
ON public.settings
FOR UPDATE
USING (false)
WITH CHECK (false);

-- Ensure SELECT is still allowed for the app to read settings
DROP POLICY IF EXISTS "Allow public to read settings" ON public.settings;
CREATE POLICY "Allow public to read settings"
ON public.settings
FOR SELECT
USING (true);

-- Remove any policies that allow direct client updates on transactions
DROP POLICY IF EXISTS "Allow anonymous to update transactions" ON public.transactions;
DROP POLICY IF EXISTS "Allow public to update transactions" ON public.transactions;