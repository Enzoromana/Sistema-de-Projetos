-- PASSO EXTRA: CORRIGIR COLUNAS DE TOKENS NULAS
-- Rode este script no SQL Editor do projeto NOVO
--
-- O que isso faz? Como os usuários foram inseridos manualmente (via INSERT puro),
-- algumas colunas secundárias de controle do Supabase (como tokens de confirmação)
-- podem ter recebido o valor NULL ao invés de um texto vazio ('').
-- O servidor de login (GoTrue) do Supabase não sabe lidar com esses campos como NULL 
-- na hora em que tenta atualizar o último login do usuário, disparando o erro:
-- "Database error querying schema".

UPDATE auth.users
SET 
  confirmation_token = COALESCE(confirmation_token, ''),
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change = COALESCE(email_change, ''),
  phone = COALESCE(phone, ''),
  phone_change = COALESCE(phone_change, ''),
  phone_change_token = COALESCE(phone_change_token, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  reauthentication_token = COALESCE(reauthentication_token, '')
WHERE 
  confirmation_token IS NULL OR 
  recovery_token IS NULL OR 
  email_change_token_new IS NULL OR 
  email_change IS NULL;
