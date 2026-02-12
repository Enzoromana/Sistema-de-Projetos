-- Adicionar coluna CPF na tabela de perfis
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cpf TEXT;

-- Comentário para documentação
COMMENT ON COLUMN profiles.cpf IS 'CPF do usuário para validação e auditoria';
