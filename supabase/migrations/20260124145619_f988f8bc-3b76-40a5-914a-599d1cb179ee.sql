-- Drop the existing check constraint and recreate with 'bulk' allowed
ALTER TABLE public.licenses DROP CONSTRAINT IF EXISTS licenses_origin_check;

ALTER TABLE public.licenses ADD CONSTRAINT licenses_origin_check 
CHECK (origin IN ('automatic', 'manual', 'bulk'));