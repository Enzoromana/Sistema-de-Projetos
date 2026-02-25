-- Função para redefinir senha via validação de dados (E-mail, CPF e Nascimento)
-- Esta função roda como SECURITY DEFINER para poder alterar a senha na tabela auth.users correspondente ao perfil validado.

CREATE OR REPLACE FUNCTION admin_reset_password_via_validation(
    email_input TEXT,
    cpf_input TEXT,
    birth_date_input DATE,
    new_password TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    target_user_id UUID;
    result JSONB;
BEGIN
    -- 1. Validar se os dados coincidem na tabela profiles
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

    -- 2. Atualizar a senha na tabela auth.users
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
