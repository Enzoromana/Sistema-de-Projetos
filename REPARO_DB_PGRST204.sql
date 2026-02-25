-- 1. Garantir que a coluna existe no schema PUBLIC
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Garantir permissões de acesso (caso tenha havido restrição inesperada)
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 3. Forçar o Supabase a recarregar o cache do esquema
COMMENT ON TABLE public.profiles IS 'Hub Manager User Profiles - Schema Repair Sync';

-- 4. CONSULTA DE DIAGNÓSTICO (Copie o resultado desta consulta se o erro persistir)
SELECT 
    table_schema, 
    table_name, 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY table_schema, ordinal_position;
