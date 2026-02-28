-- PASSO 4: Rode este comando no SQL Editor do PROJETO ANTIGO
-- Ele vai gerar os comandos para levar os nomes e permissões dos usuários.

SELECT string_agg(
  'INSERT INTO public.profiles (id, email, full_name, role, is_approved, access_projects, access_rooms, access_audit, access_medical, cpf, birth_date, setor, created_at) VALUES (' ||
  quote_nullable(id) || ', ' ||
  quote_nullable(email) || ', ' ||
  quote_nullable(full_name) || ', ' ||
  quote_nullable(role) || ', ' ||
  quote_nullable(is_approved) || ', ' ||
  quote_nullable(access_projects) || ', ' ||
  quote_nullable(access_rooms) || ', ' ||
  quote_nullable(access_audit) || ', ' ||
  quote_nullable(access_medical) || ', ' ||
  quote_nullable(cpf) || ', ' ||
  quote_nullable(birth_date) || ', ' ||
  quote_nullable(setor) || ', ' ||
  quote_nullable(created_at) || ') ON CONFLICT (id) DO UPDATE SET ' ||
  'full_name = EXCLUDED.full_name, role = EXCLUDED.role, is_approved = EXCLUDED.is_approved, ' ||
  'access_projects = EXCLUDED.access_projects, access_rooms = EXCLUDED.access_rooms, ' ||
  'access_audit = EXCLUDED.access_audit, access_medical = EXCLUDED.access_medical, ' ||
  'cpf = EXCLUDED.cpf, birth_date = EXCLUDED.birth_date, setor = EXCLUDED.setor;',
  E'\n'
) as profile_inserts
FROM public.profiles;
