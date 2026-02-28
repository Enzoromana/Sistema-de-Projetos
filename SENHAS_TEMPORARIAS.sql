-- SCRIPT PARA REDEFINIR A SENHA DE TODOS OS USUÁRIOS
-- Rode este script no SQL Editor do projeto NOVO
--
-- O que isso faz? Como descobrimos que o problema final é a incompatibilidade
-- das senhas criptografadas importadas com os requisitos do novo projeto Supabase,
-- vamos definir uma senha temporária padrão para todos (ex: Mudar@123)
-- para que eles consigam entrar e, posteriormente, trocarem no próprio perfil.

-- A função crypt usa a própria extensão pgcrypto do PostgreSQL
UPDATE auth.users
SET encrypted_password = crypt('Mudar@123', gen_salt('bf'));

-- Importante: Após rodar, comunique aos usuários que a senha provisória é Mudar@123
