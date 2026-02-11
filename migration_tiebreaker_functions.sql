-- 1. Add tiebreaker_token column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_requests' AND column_name = 'tiebreaker_token') THEN
        ALTER TABLE public.medical_requests ADD COLUMN tiebreaker_token uuid DEFAULT gen_random_uuid();
        ALTER TABLE public.medical_requests ADD CONSTRAINT medical_requests_tiebreaker_token_key UNIQUE (tiebreaker_token);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_requests' AND column_name = 'tiebreaker_verify_crm') THEN
        ALTER TABLE public.medical_requests ADD COLUMN tiebreaker_verify_crm text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'medical_requests' AND column_name = 'tiebreaker_verify_cpf') THEN
        ALTER TABLE public.medical_requests ADD COLUMN tiebreaker_verify_cpf text;
    END IF;
END $$;

-- 2. Secure Function to GET data by token (Public Access)
CREATE OR REPLACE FUNCTION public.get_tiebreaker_request_by_token(token_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner privileges to bypass RLS for unauthenticated users
AS $$
DECLARE
    req public.medical_requests;
    procs jsonb;
    mats jsonb;
BEGIN
    -- Fetch the request
    SELECT * INTO req FROM public.medical_requests WHERE tiebreaker_token = token_input;

    IF req IS NULL THEN
        RETURN NULL;
    END IF;

    -- Fetch procedures
    SELECT jsonb_agg(to_jsonb(p)) INTO procs 
    FROM public.medical_procedures p 
    WHERE p.request_id = req.id;

    -- Fetch materials
    SELECT jsonb_agg(to_jsonb(m)) INTO mats 
    FROM public.medical_materials m 
    WHERE m.request_id = req.id;

    -- Return filtered object (Safety: Only needed fields)
    RETURN jsonb_build_object(
        'id', req.id,
        'requisicao', req.requisicao,
        'ben_nome', req.ben_nome,
        'ben_sexo', req.ben_sexo,
        'ben_nascimento', req.ben_nascimento,
        'ass_nome', req.ass_nome,
        'ass_crm', req.ass_crm,
        'ass_especialidade', req.ass_especialidade,
        'div_especialidade', req.div_especialidade,
        'div_motivos', req.div_motivos,
        'medical_procedures', COALESCE(procs, '[]'::jsonb),
        'medical_materials', COALESCE(mats, '[]'::jsonb),
        'situacao', req.situacao,
        'tiebreaker_verify_crm', req.tiebreaker_verify_crm,
        'tiebreaker_verify_cpf', req.tiebreaker_verify_cpf
    );
END;
$$;

-- 3. Secure Function to SUBMIT opinion (Public Access)
CREATE OR REPLACE FUNCTION public.submit_tiebreaker_opinion(
    token_input uuid,
    desempatador_data jsonb,
    procedure_conclusions jsonb, -- array of {id, conclusion}
    material_conclusions jsonb   -- array of {id, conclusion}
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_id bigint;
    item jsonb;
BEGIN
    -- Get Request ID
    SELECT id INTO req_id FROM public.medical_requests WHERE tiebreaker_token = token_input;

    IF req_id IS NULL THEN
        RETURN false;
    END IF;

    -- Update Request Data
    UPDATE public.medical_requests
    SET 
        desempatador_nome = desempatador_data->>'desempatador_nome',
        desempatador_crm = desempatador_data->>'desempatador_crm',
        desempatador_especialidade = desempatador_data->>'desempatador_especialidade',
        parecer_conclusao = desempatador_data->>'parecer_conclusao',
        referencias_bibliograficas = desempatador_data->>'referencias_bibliograficas',
        situacao = 'Finalizado', -- Auto-finalize
        updated_at = now() -- Assuming updated_at exists or just good practice
    WHERE id = req_id;

    -- Update Procedures
    IF procedure_conclusions IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(procedure_conclusions)
        LOOP
            UPDATE public.medical_procedures
            SET conclusao_desempate = item->>'conclusao_desempate'
            WHERE id = (item->>'id')::bigint AND request_id = req_id;
        END LOOP;
    END IF;

    -- Update Materials
    IF material_conclusions IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(material_conclusions)
        LOOP
            UPDATE public.medical_materials
            SET conclusao_desempate = item->>'conclusao_desempate'
            WHERE id = (item->>'id')::bigint AND request_id = req_id;
        END LOOP;
    END IF;

    RETURN true;
END;
$$;
