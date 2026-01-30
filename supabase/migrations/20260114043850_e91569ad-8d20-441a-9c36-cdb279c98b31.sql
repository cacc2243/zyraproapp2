-- Add access_granted column to transactions table
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS access_granted BOOLEAN NOT NULL DEFAULT false;

-- Add granted_at timestamp
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;