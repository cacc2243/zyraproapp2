-- Add columns for E2E encryption keys to license_challenges
ALTER TABLE public.license_challenges 
ADD COLUMN IF NOT EXISTS server_private_key TEXT,
ADD COLUMN IF NOT EXISTS client_public_key TEXT;

-- Add column for encrypted session data in license_sessions
ALTER TABLE public.license_sessions
ADD COLUMN IF NOT EXISTS shared_key_hash TEXT;

-- Add index for faster cleanup
CREATE INDEX IF NOT EXISTS idx_license_challenges_expires_at ON public.license_challenges(expires_at);