-- 1. Corrige o relacionamento estrutural para a API (PostgREST)
-- Isso resolve o erro "PGRST200: Could not find a relationship between 'audit_logs' and 'user_id'"
ALTER TABLE public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. Recarrega o cache do Supabase para ele enxergar a tabela imediatamente
NOTIFY pgrst, 'reload schema';
