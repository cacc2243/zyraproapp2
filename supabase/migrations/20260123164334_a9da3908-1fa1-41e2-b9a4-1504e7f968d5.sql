-- Tabela de licenças com controle de dispositivos (sem expiração)
CREATE TABLE public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT UNIQUE NOT NULL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  
  -- Vínculo com cliente (hash para segurança)
  customer_document_hash TEXT,
  customer_email_hash TEXT,
  
  -- Status e controle
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  origin TEXT NOT NULL DEFAULT 'automatic' CHECK (origin IN ('automatic', 'manual')),
  
  -- Controle de dispositivos
  max_devices INTEGER NOT NULL DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at TIMESTAMPTZ,
  last_validated_at TIMESTAMPTZ
);

-- Tabela de dispositivos vinculados
CREATE TABLE public.license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES public.licenses(id) ON DELETE CASCADE,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  ip_address TEXT,
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  UNIQUE(license_id, device_fingerprint)
);

-- Tabela de logs de auditoria
CREATE TABLE public.license_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE SET NULL,
  license_key TEXT NOT NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  device_fingerprint TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_licenses_key ON public.licenses(license_key);
CREATE INDEX idx_licenses_status ON public.licenses(status);
CREATE INDEX idx_licenses_transaction ON public.licenses(transaction_id);
CREATE INDEX idx_license_devices_license ON public.license_devices(license_id);
CREATE INDEX idx_license_devices_fingerprint ON public.license_devices(device_fingerprint);
CREATE INDEX idx_license_logs_license ON public.license_logs(license_id);
CREATE INDEX idx_license_logs_created ON public.license_logs(created_at DESC);

-- RLS (todas negam acesso público - gerenciado via Edge Functions)
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all public access on licenses" ON public.licenses FOR ALL USING (false);
CREATE POLICY "Deny all public access on license_devices" ON public.license_devices FOR ALL USING (false);
CREATE POLICY "Deny all public access on license_logs" ON public.license_logs FOR ALL USING (false);

-- Migrar licenças existentes da tabela transactions para licenses
INSERT INTO public.licenses (license_key, transaction_id, status, origin, created_at)
SELECT 
  license_key,
  id as transaction_id,
  CASE WHEN access_granted THEN 'active' ELSE 'suspended' END as status,
  COALESCE(license_origin, 'automatic')::text as origin,
  COALESCE(license_created_at, created_at) as created_at
FROM public.transactions
WHERE license_key IS NOT NULL
ON CONFLICT (license_key) DO NOTHING;