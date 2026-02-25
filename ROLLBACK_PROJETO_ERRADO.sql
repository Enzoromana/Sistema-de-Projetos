-- 1. Remover a função de reset de senha
DROP FUNCTION IF EXISTS public.admin_reset_password_via_validation(TEXT, TEXT, DATE, TEXT);

-- 2. Remover as colunas adicionadas na tabela profiles
-- CUIDADO: Isto apagará os dados destas colunas se elas já existissem por outro motivo.
ALTER TABLE public.profiles DROP COLUMN IF EXISTS birth_date;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS cpf;

-- 3. Resetar o comentário da tabela (opcional)
COMMENT ON TABLE public.profiles IS NULL;
