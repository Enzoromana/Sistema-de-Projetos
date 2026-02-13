-- FIX: Remove non-existent "updated_at" column reference and fix key mismatch
-- Run this in the Supabase SQL Editor to fix the 400 error on tiebreaker submission.

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
        desempatador_especialidade = desempatador_data->>'describe_especialidade',
        parecer_conclusao = desempatador_data->>'parecer_conclusao',
        referencias_bibliograficas = desempatador_data->>'referencias_bibliograficas',
        situacao = 'Finalizado',
        tiebreaker_allow_edit = false
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
