-- Drop and recreate the transactions license_origin check constraint to include 'bulk'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_license_origin_check;

ALTER TABLE public.transactions ADD CONSTRAINT transactions_license_origin_check 
CHECK (license_origin IS NULL OR license_origin IN ('automatic', 'manual', 'bulk'));