-- Migration to add 'guia' field to medical_requests
ALTER TABLE public.medical_requests 
ADD COLUMN IF NOT EXISTS guia text;

COMMENT ON COLUMN public.medical_requests.guia IS 'Número da guia associado à junta médica.';
