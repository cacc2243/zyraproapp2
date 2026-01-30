-- Alterar o default de max_devices para 1
ALTER TABLE public.licenses ALTER COLUMN max_devices SET DEFAULT 1;

-- Atualizar licenças existentes que ainda não foram ativadas para ter max_devices = 1
UPDATE public.licenses SET max_devices = 1 WHERE activated_at IS NULL;