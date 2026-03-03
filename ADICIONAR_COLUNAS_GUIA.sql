-- Adiciona as colunas dos novos módulos na tabela profiles (se não existirem)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS access_sheet_to_slide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_medico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_gerador BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_rede BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_analise BOOLEAN DEFAULT false;

-- Atualiza o schema cache do PostgREST para reconhecer as novas colunas imediatamente
NOTIFY pgrst, 'reload schema';
