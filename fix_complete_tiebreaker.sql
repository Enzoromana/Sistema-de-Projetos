-- =======================================================================
-- FIX COMPLETO: Adicionar coluna + atualizar funções RPC
-- Execute TUDO de uma vez no Supabase SQL Editor
-- =======================================================================

-- 1. Adicionar coluna tiebreaker_allow_edit (se não existir)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'medical_requests' 
        AND column_name = 'tiebreaker_allow_edit'
    ) THEN
        ALTER TABLE public.medical_requests ADD COLUMN tiebreaker_allow_edit boolean DEFAULT false;
    END IF;
END $$;

-- 2. Recriar função GET (leitura por token)
CREATE OR REPLACE FUNCTION public.get_tiebreaker_request_by_token(token_input uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req public.medical_requests;
    procs jsonb;
    mats jsonb;
BEGIN
    SELECT * INTO req FROM public.medical_requests WHERE tiebreaker_token = token_input;

    IF req IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT jsonb_agg(to_jsonb(p)) INTO procs 
    FROM public.medical_procedures p 
    WHERE p.request_id = req.id;

    SELECT jsonb_agg(to_jsonb(m)) INTO mats 
    FROM public.medical_materials m 
    WHERE m.request_id = req.id;

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
        'tiebreaker_verify_cpf', req.tiebreaker_verify_cpf,
        'tiebreaker_allow_edit', req.tiebreaker_allow_edit,
        'parecer_conclusao', req.parecer_conclusao,
        'desempatador_nome', req.desempatador_nome,
        'desempatador_crm', req.desempatador_crm,
        'desempatador_especialidade', req.desempatador_especialidade,
        'referencias_bibliograficas', req.referencias_bibliograficas
    );
END;
$$;

-- 3. Recriar função SUBMIT (envio do parecer)
CREATE OR REPLACE FUNCTION public.submit_tiebreaker_opinion(
    token_input uuid,
    desempatador_data jsonb,
    procedure_conclusions jsonb,
    material_conclusions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    req_id bigint;
    item jsonb;
BEGIN
    SELECT id INTO req_id FROM public.medical_requests WHERE tiebreaker_token = token_input;

    IF req_id IS NULL THEN
        RETURN false;
    END IF;

    UPDATE public.medical_requests
    SET 
        desempatador_nome = desempatador_data->>'desempatador_nome',
        desempatador_crm = desempatador_data->>'desempatador_crm',
        desempatador_especialidade = desempatador_data->>'describe_especialidade',
        parecer_conclusao = desempatador_data->>'parecer_conclusao',
        referencias_bibliograficas = desempatador_data->>'referencias_bibliograficas',
        situacao = 'Finalizado Junta Médica',
        tiebreaker_allow_edit = false
    WHERE id = req_id;

    IF procedure_conclusions IS NOT NULL THEN
        FOR item IN SELECT * FROM jsonb_array_elements(procedure_conclusions)
        LOOP
            UPDATE public.medical_procedures
            SET conclusao_desempate = item->>'conclusao_desempate'
            WHERE id = (item->>'id')::bigint AND request_id = req_id;
        END LOOP;
    END IF;

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
