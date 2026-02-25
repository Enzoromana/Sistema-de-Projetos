-- Adicionar coluna birth_date na tabela de perfis
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.birth_date IS 'Data de nascimento do usuário para validação de segurança e recuperação de senha';
