-- ROLLBACK: Desfazer alterações dos módulos de Junta Médica e Desempate

-- 1. Remover Funções
DROP FUNCTION IF EXISTS public.get_tiebreaker_request_by_token(uuid);
DROP FUNCTION IF EXISTS public.submit_tiebreaker_opinion(uuid, jsonb, jsonb, jsonb);

-- 2. Remover Tabelas (Em ordem reversa devido às chaves estrangeiras)
DROP TABLE IF EXISTS public.medical_attachments;
DROP TABLE IF EXISTS public.medical_materials;
DROP TABLE IF EXISTS public.medical_procedures;
DROP TABLE IF EXISTS public.medical_requests;

-- 3. Remover coluna adicionada à tabela de profiles
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'access_medical') THEN
        ALTER TABLE public.profiles DROP COLUMN access_medical;
    END IF;
END $$;
