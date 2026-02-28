-- PASSO 1: Rode este comando no SQL Editor do PROJETO ANTIGO
-- Ele vai gerar UM ÚNICO RESULTADO com todos os comandos juntos.

SELECT string_agg(
  'INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, is_super_admin, aud) VALUES (' ||
  quote_nullable(id) || ', ' ||
  quote_nullable(instance_id) || ', ' ||
  quote_nullable(email) || ', ' ||
  quote_nullable(encrypted_password) || ', ' ||
  quote_nullable(email_confirmed_at) || ', ' ||
  quote_nullable(raw_app_meta_data) || ', ' ||
  quote_nullable(raw_user_meta_data) || ', ' ||
  quote_nullable(created_at) || ', ' ||
  quote_nullable(updated_at) || ', ' ||
  quote_nullable(role) || ', ' ||
  quote_nullable(is_super_admin) || ', ' ||
  quote_nullable('authenticated') || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as all_inserts
FROM auth.users;

-- OBSERVAÇÃO: Após rodar, a coluna "sql_insert" terá os comandos prontos. 
-- Copie todos eles para rodar no novo projeto.
