-- 0. Garantir que a extensão pgcrypto está habilitada (necessária para crypt e gen_salt)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Adicionar colunas de validação na tabela profiles (se não existirem)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cpf TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

COMMENT ON COLUMN public.profiles.cpf IS 'CPF do usuário para validação e auditoria';
COMMENT ON COLUMN public.profiles.birth_date IS 'Data de nascimento do usuário para validação de segurança e recuperação de senha';

-- 2. Função para redefinir senha via validação de dados (E-mail, CPF e Nascimento)
-- Esta função roda como SECURITY DEFINER para poder alterar a senha na tabela auth.users.
CREATE OR REPLACE FUNCTION admin_reset_password_via_validation(
    email_input TEXT,
    cpf_input TEXT,
    birth_date_input DATE,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Validar se os dados coincidem na tabela profiles
    SELECT id INTO target_user_id
    FROM public.profiles
    WHERE email = email_input
      AND cpf = cpf_input
      AND birth_date = birth_date_input;

    IF target_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', 'Dados de validação incorretos. CPF ou Data de Nascimento não conferem.'
        );
    END IF;

    -- Atualizar a senha na tabela auth.users (usando pgcrypto do Supabase)
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Senha redefinida com sucesso!'
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'message', 'Erro ao processar redefinição: ' || SQLERRM
    );
END;
$$;

-- 3. Forçar refresh do cache da API
COMMENT ON TABLE public.profiles IS 'Hub Manager User Profiles - Schema Refreshed (v4)';
