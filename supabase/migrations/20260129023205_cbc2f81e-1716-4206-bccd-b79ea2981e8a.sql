-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criar cron job para limpeza automática a cada 15 minutos
SELECT cron.schedule(
  'cleanup-extension-uploads',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://gjzhntrcogbamirtudsp.supabase.co/functions/v1/cleanup-uploads',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqemhudHJjb2diYW1pcnR1ZHNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNDM1NzAsImV4cCI6MjA4MzkxOTU3MH0.e_cG4R49Je7Cs5420vyEoi05c4Jy29lmnP2ZYbKaSmM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);