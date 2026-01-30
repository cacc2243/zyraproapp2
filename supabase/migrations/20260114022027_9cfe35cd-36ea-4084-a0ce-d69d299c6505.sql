-- Allow updates to settings (for admin panel)
CREATE POLICY "Settings can be updated by everyone" 
ON public.settings 
FOR UPDATE 
USING (true)
WITH CHECK (true);