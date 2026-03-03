-- ============================================================
-- FIX: Correção completa para liberação de módulos via Auditoria
-- Execute este script no SQL Editor do Supabase (botão RUN)
-- ============================================================

-- 1. Garante que todas as colunas de permissão existem na tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS access_projects BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_rooms BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_audit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_medical BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_sheet_to_slide BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_medico BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_gerador BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_rede BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS access_guia_analise BOOLEAN DEFAULT false;

-- 2. Recria a função auxiliar anti-recursão para verificar se o usuário é admin
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Remove TODAS as políticas antigas de UPDATE na tabela profiles
DROP POLICY IF EXISTS "Profiles updateable by owner" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile or admins can update all." ON public.profiles;
DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;

-- 4. Cria a política de UPDATE correta (admin pode atualizar qualquer perfil)
CREATE POLICY "Profiles update policy" ON public.profiles
FOR UPDATE USING (
    id = auth.uid()
    OR public.check_is_admin()
);

-- 5. Remove e recria as políticas de SELECT para evitar conflito
DROP POLICY IF EXISTS "Profiles viewable by all" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Profiles access policy" ON public.profiles;

CREATE POLICY "Profiles access policy" ON public.profiles
FOR SELECT USING (true);

-- 6. Garante política de INSERT para novos usuários
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- 7. Corrige o trigger de auditoria para não falhar ao auditar profiles
-- O problema: se a FK exigir que user_id exista em auth.users E o trigger
-- tentar inserir com auth.uid() = NULL (ex: trigger de sistema), ele falha silenciosamente.
CREATE OR REPLACE FUNCTION public.handle_audit_log()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Pega o user_id de forma segura (pode ser NULL se for trigger de sistema)
    BEGIN
        current_user_id := auth.uid();
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
        VALUES (current_user_id, 'INSERT', TG_TABLE_NAME, NEW.id::text, to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
        VALUES (current_user_id, 'UPDATE', TG_TABLE_NAME, NEW.id::text, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
        VALUES (current_user_id, 'DELETE', TG_TABLE_NAME, OLD.id::text, to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Reaplica o trigger de auditoria na tabela profiles
DROP TRIGGER IF EXISTS audit_profiles ON public.profiles;
CREATE TRIGGER audit_profiles
AFTER INSERT OR UPDATE OR DELETE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_audit_log();

-- 9. Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';

-- 10. Verificação: lista os admins atuais
SELECT id, email, full_name, role, access_projects, access_rooms, access_audit, access_medical, access_guia_medico
FROM public.profiles
WHERE role = 'admin';
