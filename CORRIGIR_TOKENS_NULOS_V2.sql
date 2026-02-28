-- O erro ocorreu porque a coluna 'phone' tem uma restrição UNIQUE,
-- ou seja, se definirmos '' (vazio) para dois usuários diferentes, 
-- o banco considera que eles têm "fones duplicados" (sendo dois fones vazios).
-- A coluna 'phone_change' e outras que disserem respeito a colunas UNIQUE no banco também podem dar esse erro.
-- O Supabase, por padrão, tolera que a coluna "phone" fique nula se ela não estiver em uso.

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL OR 
  recovery_token IS NULL OR 
  email_change_token_new IS NULL OR 
  email_change IS NULL;
