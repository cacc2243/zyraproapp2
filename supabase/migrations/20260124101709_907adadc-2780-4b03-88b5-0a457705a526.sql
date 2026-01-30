-- Create private bucket for extension files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'extensions',
  'extensions',
  false,  -- PRIVATE bucket - no public access
  104857600,  -- 100MB limit
  ARRAY['application/zip', 'application/x-zip-compressed', 'application/octet-stream']
);

-- RLS policy: Deny all public access (only service role can access)
CREATE POLICY "No public access to extensions"
ON storage.objects
FOR ALL
USING (bucket_id != 'extensions');

-- Only service role (edge functions) can read extension files
CREATE POLICY "Service role can access extensions"
ON storage.objects
FOR SELECT
TO service_role
USING (bucket_id = 'extensions');