-- Fix relationship between audit_logs and profiles for PostgREST
-- This allows joining audit_logs with profiles via the user_id column

ALTER TABLE IF EXISTS public.audit_logs
DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;

ALTER TABLE public.audit_logs
ADD CONSTRAINT audit_logs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id)
ON DELETE SET NULL;

-- Ensure the relationship is visible to PostgREST
NOTIFY pgrst, 'reload schema';
