-- =============================================
-- TABELAS DE SEGURANÇA AVANÇADA
-- =============================================

-- 1. Tabela para Challenge-Response (Nonces temporários)
CREATE TABLE public.license_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nonce TEXT NOT NULL UNIQUE,
  challenge_token TEXT NOT NULL,
  device_fingerprint TEXT NOT NULL,
  extension_id TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. Tabela para Sessões Ativas (com Integrity Hash)
CREATE TABLE public.license_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  device_fingerprint TEXT NOT NULL,
  integrity_hash TEXT NOT NULL,
  ip_address TEXT,
  last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Tabela para Rate Limiting por Licença
CREATE TABLE public.license_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES public.licenses(id) ON DELETE CASCADE,
  window_start TIMESTAMP WITH TIME ZONE DEFAULT now(),
  request_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(license_id, window_start)
);

-- Índices para performance
CREATE INDEX idx_challenges_nonce ON public.license_challenges(nonce);
CREATE INDEX idx_challenges_expires ON public.license_challenges(expires_at);
CREATE INDEX idx_sessions_token ON public.license_sessions(session_token);
CREATE INDEX idx_sessions_license ON public.license_sessions(license_id);
CREATE INDEX idx_sessions_heartbeat ON public.license_sessions(last_heartbeat);
CREATE INDEX idx_rate_limits_license ON public.license_rate_limits(license_id);
CREATE INDEX idx_rate_limits_window ON public.license_rate_limits(window_start);

-- Enable RLS
ALTER TABLE public.license_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.license_rate_limits ENABLE ROW LEVEL SECURITY;

-- Deny all public access (service role only)
CREATE POLICY "Deny public access on license_challenges" ON public.license_challenges
  FOR ALL USING (false);

CREATE POLICY "Deny public access on license_sessions" ON public.license_sessions
  FOR ALL USING (false);

CREATE POLICY "Deny public access on license_rate_limits" ON public.license_rate_limits
  FOR ALL USING (false);

-- Função para limpar dados expirados
CREATE OR REPLACE FUNCTION public.clean_expired_security_data()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Limpar challenges expirados
  DELETE FROM public.license_challenges WHERE expires_at < now();
  
  -- Limpar sessões expiradas
  DELETE FROM public.license_sessions WHERE expires_at < now();
  
  -- Limpar rate limits antigos (mais de 1 hora)
  DELETE FROM public.license_rate_limits WHERE window_start < now() - interval '1 hour';
END;
$$;