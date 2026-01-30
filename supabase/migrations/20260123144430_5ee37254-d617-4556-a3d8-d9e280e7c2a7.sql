-- Add license metadata columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS license_created_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS license_origin TEXT CHECK (license_origin IN ('automatic', 'manual'));

-- Update existing licenses to have origin 'manual' if they exist but don't have origin set
UPDATE public.transactions 
SET license_origin = 'manual', 
    license_created_at = updated_at 
WHERE license_key IS NOT NULL 
  AND license_origin IS NULL;