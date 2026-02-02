-- FUNÇÃO DE REDEFINIÇÃO DE SENHA POR ADMINISTRADOR
-- Esta função permite que um usuário com a role 'admin' altere a senha de qualquer outro usuário.

-- Habilita a extensão pgcrypto (necessária para hashing de senha)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Permite que a função rode com privilégios de sistema (postgres)
AS $$
BEGIN
    -- 1. VALIDAÇÃO DE SEGURANÇA: Verifica se quem está chamando é um Admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem redefinir senhas.';
    END IF;

    -- 2. VALIDAÇÃO DE ENTRADA: Verifica se a senha tem o tamanho mínimo
    IF length(new_password) < 6 THEN
        RAISE EXCEPTION 'A senha deve ter pelo menos 6 caracteres.';
    END IF;

    -- 3. AÇÃO: Atualiza a senha criptografada diretamente na tabela de autenticação
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$;

-- Permissões de execução
REVOKE ALL ON FUNCTION public.admin_reset_user_password(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_reset_user_password(UUID, TEXT) TO service_role;
