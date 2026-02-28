-- PASSO FINAL PARA CORRIGIR O ERRO 500 NO LOGIN
-- Rode este script no SQL Editor do projeto NOVO
--
-- O que isso faz? 
-- Verifiquei o seu script de migração original (LIMPEZA_USUARIOS.sql) 
-- e notei que a coluna "aud" (Audience) faltou no comando INSERT.
-- O Supabase (GoTrue) exige obrigatoriamente que usuários comuns tenham 
-- o valor 'authenticated' nessa coluna. Se ela estiver nula, 
-- a plataforma dá erro 500 no momento de gerar o token de login.

UPDATE auth.users 
SET aud = 'authenticated' 
WHERE aud IS NULL;
