-- Enum para tipo de plano
DO $$ BEGIN
  CREATE TYPE public.subscription_plan_type AS ENUM ('weekly', 'monthly', 'yearly');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para status da assinatura
DO $$ BEGIN
  CREATE TYPE public.subscription_status AS ENUM ('active', 'expired', 'cancelled', 'suspended');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Enum para tipo de produto
DO $$ BEGIN
  CREATE TYPE public.product_type AS ENUM ('lovable', 'v0', 'manus', 'google_ai_ultra', 'metodo_conta_pro');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Tabela de assinaturas
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_document TEXT,
  customer_phone TEXT,
  
  -- Produto e Plano
  product_type TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  
  -- Status da Assinatura
  status TEXT NOT NULL DEFAULT 'active',
  
  -- Datas importantes
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  next_billing_date TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  
  -- Vinculo com licenca
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de historico de pagamentos
CREATE TABLE public.subscription_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Deny all public access
CREATE POLICY "Deny all public access on subscriptions" 
ON public.subscriptions 
FOR ALL 
TO public 
USING (false);

CREATE POLICY "Deny all public access on subscription_payments" 
ON public.subscription_payments 
FOR ALL 
TO public 
USING (false);

-- Função para calcular fim do período baseado no tipo de plano
CREATE OR REPLACE FUNCTION public.calculate_period_end(start_date TIMESTAMPTZ, plan TEXT)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  CASE plan
    WHEN 'weekly' THEN
      RETURN start_date + INTERVAL '7 days';
    WHEN 'monthly' THEN
      RETURN start_date + INTERVAL '1 month';
    WHEN 'yearly' THEN
      RETURN start_date + INTERVAL '1 year';
    ELSE
      RETURN start_date + INTERVAL '1 month';
  END CASE;
END;
$$;

-- Trigger para atualizar updated_at
CREATE TRIGGER update_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_subscriptions_customer_email ON public.subscriptions(customer_email);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_license_id ON public.subscriptions(license_id);
CREATE INDEX idx_subscriptions_current_period_end ON public.subscriptions(current_period_end);
CREATE INDEX idx_subscription_payments_subscription_id ON public.subscription_payments(subscription_id);

-- Adicionar coluna na transactions para vincular com subscription
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS plan_type TEXT,
ADD COLUMN IF NOT EXISTS is_subscription BOOLEAN DEFAULT false;