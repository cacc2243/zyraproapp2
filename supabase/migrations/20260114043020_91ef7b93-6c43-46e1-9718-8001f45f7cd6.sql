-- Drop all existing policies on settings and recreate properly
DROP POLICY IF EXISTS "Settings are readable by everyone" ON public.settings;
DROP POLICY IF EXISTS "Settings can be updated by everyone" ON public.settings;
DROP POLICY IF EXISTS "Only service role can update settings" ON public.settings;
DROP POLICY IF EXISTS "Allow public to read settings" ON public.settings;

-- Settings: Allow everyone to read, but no one can update via client (only edge functions with service role)
CREATE POLICY "Settings are publicly readable"
ON public.settings
FOR SELECT
USING (true);

-- No INSERT/UPDATE/DELETE policies - only service role can modify

-- Transactions: Only allow INSERT from anonymous (for checkout)
-- No SELECT/UPDATE/DELETE from client - only edge functions can manage
CREATE POLICY "Allow anonymous insert on transactions"
ON public.transactions
FOR INSERT
WITH CHECK (true);

-- No SELECT policy for anonymous users - transactions are only managed by edge functions