-- Adicionar coluna device_info para guardar detalhes do dispositivo
ALTER TABLE public.license_devices 
ADD COLUMN IF NOT EXISTS device_info jsonb DEFAULT '{}'::jsonb;

-- Adicionar novo status à licença: awaiting_activation (paga mas não ativada ainda)
-- O campo status atual já é text, então podemos usar qualquer valor
-- Vamos apenas garantir um comentário explicativo
COMMENT ON COLUMN public.licenses.status IS 'Status: active, suspended, revoked, awaiting_activation';