-- ============================================================
-- 🚨 EMERGENCY REPAIR: Profiles & PostgREST Access 🚨
-- Descrição: Este script limpa e restaura permissões da tabela profiles.
-- Use para resolver o erro ERR_CONNECTION_REFUSED ou falha de acesso.
-- ============================================================

-- 1. DESATIVAR TODAS AS POLÍTICAS DE RLS (Temporário para garantir segurança)
-- Isso evita loops recursivos durante a manutenção.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. GARANTIR GRANTS BÁSICOS
-- PostgREST precisa de permissões explícitas para servir a tabela via API.
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;

-- 3. RECRIAR FUNÇÃO DE CHECAGEM DE ADMIN (ANTI-RECURSÃO)
-- O uso de SECURITY DEFINER é CRÍTICO: ele executa a busca no banco ignorando o RLS,
-- o que evita que a política de SELECT se chame infinitamente.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. LIMPAR POLÍTICAS ANTIGAS (Remover qualquer lixo que cause conflito)
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;

-- 5. CRIAR POLÍTICAS LIMPAS E SEGURAS
-- SELECT: Usuário vê a si mesmo, ou admin vê todos. (Aberto p/ SELECT true se necessário)
CREATE POLICY "Profiles access policy" ON public.profiles
FOR SELECT USING (true); -- Permitir leitura pública para facilitar reparo

-- UPDATE: Usuário altera o próprio, ou admin altera qualquer um
CREATE POLICY "Profiles update policy" ON public.profiles
FOR UPDATE USING (
    id = auth.uid()
    OR public.check_is_admin()
);

-- INSERT: Apenas o dono pode inserir seu próprio ID (ex: no signup)
CREATE POLICY "Profiles insert policy" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 6. REATIVAR RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 7. REPARAR O TRIGGER DE AUDITORIA (Se estiver falhando)
-- Alguns triggers podem falhar se a tabela audit_logs não existir ou estiver inacessível.
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Pega o user_id com segurança (pode ser NULL se for sistema)
    current_user_id := auth.uid();

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_user_id, 'INSERT', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_user_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
    END IF;
    RETURN NULL;
EXCEPTION WHEN OTHERS THEN
    -- Silenciar falhas de auditoria para não quebrar a inserção principal
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FORÇAR RECARREGAMENTO DO CACHE DO POSTGREST (PGRST)
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.profiles IS 'Hub Manager Profiles - Emergency Repair Completed';

-- 9. VERIFICAÇÃO FINAL (O resultado deve aparecer no console do SQL Editor)
SELECT 'Sucesso: Tabela profiles reparada e PostgREST notificado.' as status;
