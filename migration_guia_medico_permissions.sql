-- MIGRAR PERMISSÕES (EXECUTE COM O BOTÃO "RUN")
-- Clique no botão "RUN" (Quadrado verde ou azul no topo/lateral). 
-- NÃO CLIQUE EM "EXPLAIN" OU "ANALYZE".

-- 1. Cria colunas se não existirem
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_guia_medico BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_guia_gerador BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_guia_rede BOOLEAN DEFAULT TRUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS access_guia_analise BOOLEAN DEFAULT TRUE;

-- 2. Atualiza permissões de administradores
UPDATE profiles
SET 
  access_guia_medico = TRUE,
  access_guia_gerador = TRUE,
  access_guia_rede = TRUE,
  access_guia_analise = TRUE
WHERE role = 'admin';

-- 3. Lista para conferência
SELECT id, full_name, role, access_guia_medico FROM profiles LIMIT 5;
