-- Criar bucket para uploads temporários da extensão
INSERT INTO storage.buckets (id, name, public)
VALUES ('extension-uploads', 'extension-uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Política para leitura pública (necessário para a API do Lovable)
CREATE POLICY "Public read access for extension-uploads"
ON storage.objects FOR SELECT
USING (bucket_id = 'extension-uploads');

-- Política para upload via service role (edge function)
CREATE POLICY "Service role can upload to extension-uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'extension-uploads');

-- Política para deleção via service role (limpeza automática)
CREATE POLICY "Service role can delete from extension-uploads"
ON storage.objects FOR DELETE
USING (bucket_id = 'extension-uploads');