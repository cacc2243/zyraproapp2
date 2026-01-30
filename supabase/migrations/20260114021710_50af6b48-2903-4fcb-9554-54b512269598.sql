-- Create settings table for storing API configuration
CREATE TABLE public.settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  payment_api TEXT NOT NULL DEFAULT 'pixup' CHECK (payment_api IN ('pepper', 'pixup')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default setting
INSERT INTO public.settings (id, payment_api) VALUES ('default', 'pixup');

-- Enable RLS
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Allow read for everyone (edge functions need this)
CREATE POLICY "Settings are readable by everyone" 
ON public.settings 
FOR SELECT 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_settings_updated_at
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();