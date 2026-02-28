-- PASSO ÚNICO PARA RECUPERAR O LOGIN DOS USUÁRIOS
-- Rode este script no SQL Editor do NOVO PROJETO (onde os usuários já foram importados).
-- 
-- O que isso faz? Supabase exige que cada usuário ('auth.users') 
-- tenha uma identidade correspondente ('auth.identities') para conseguir logar.
-- Quando migramos apenas as senhas e os usuários, as identidades ficaram faltando 
-- (causando o erro 500 no login).
-- 
-- Este script varre todos os usuários atuais e recria automaticamente 
-- a identidade de email para eles, restaurando o login imediatamente 
-- e mantendo as senhas originais que você já copiou.

INSERT INTO auth.identities (
  id, 
  user_id, 
  provider_id, 
  identity_data, 
  provider, 
  last_sign_in_at, 
  created_at, 
  updated_at
)
SELECT 
  gen_random_uuid(),  -- Gera um novo ID para a identidade
  id,                 -- Conecta com o ID do usuário da auth.users
  id::text,           -- No Supabase, o provider_id do email costuma ser o próprio User ID (ou o email)
  jsonb_build_object(
    'sub', id::text, 
    'email', email, 
    'email_verified', true
  ),                  -- Monta o pacote de dados exigido
  'email',            -- Define que o método de login é email
  created_at, 
  created_at, 
  updated_at
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM auth.identities) -- Apenas para quem está sem identidade
  AND email IS NOT NULL;
