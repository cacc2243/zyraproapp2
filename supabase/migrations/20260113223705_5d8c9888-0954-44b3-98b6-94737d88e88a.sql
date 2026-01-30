-- Create enum for payment status
CREATE TYPE public.payment_status AS ENUM (
  'processing',
  'authorized',
  'paid',
  'refunded',
  'waiting_payment',
  'waiting_refund',
  'refused',
  'chargeback',
  'analyzing',
  'pending_review',
  'antifraud',
  'cancelled',
  'checkout_abandoned'
);

-- Create enum for payment method
CREATE TYPE public.payment_method AS ENUM (
  'credit_card',
  'billet',
  'pix'
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_hash TEXT UNIQUE,
  pepper_transaction_id TEXT,
  
  -- Customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  customer_document TEXT,
  
  -- Payment info
  amount INTEGER NOT NULL, -- in cents
  payment_method public.payment_method DEFAULT 'pix',
  payment_status public.payment_status DEFAULT 'waiting_payment',
  
  -- PIX data
  pix_code TEXT,
  pix_url TEXT,
  qr_code_base64 TEXT,
  
  -- Tracking/UTM
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  src TEXT,
  ip_address TEXT,
  fbp TEXT,
  fbc TEXT,
  
  -- Offer/Product info
  offer_hash TEXT,
  offer_title TEXT,
  product_hash TEXT,
  product_title TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  paid_at TIMESTAMP WITH TIME ZONE
);

-- Create admin_users table for panel authentication
CREATE TABLE public.admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Transactions policies - only edge functions can access (via service role)
-- No public access needed for transactions

-- Admin users - only accessible via service role (edge functions)
-- No public RLS policies needed

-- Create index for faster queries
CREATE INDEX idx_transactions_status ON public.transactions(payment_status);
CREATE INDEX idx_transactions_email ON public.transactions(customer_email);
CREATE INDEX idx_transactions_created_at ON public.transactions(created_at DESC);
CREATE INDEX idx_transactions_pepper_id ON public.transactions(pepper_transaction_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_transactions_updated_at
BEFORE UPDATE ON public.transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Using a simple hash for demo purposes
INSERT INTO public.admin_users (username, password_hash) 
VALUES ('admin', 'admin123');