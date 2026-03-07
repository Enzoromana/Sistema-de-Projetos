-- Migration to add council type fields to medical_requests
-- Run this in the Supabase SQL Editor

ALTER TABLE public.medical_requests 
ADD COLUMN IF NOT EXISTS aud_conselho_tipo text DEFAULT 'CRM',
ADD COLUMN IF NOT EXISTS ass_conselho_tipo text DEFAULT 'CRM',
ADD COLUMN IF NOT EXISTS des_conselho_tipo text DEFAULT 'CRM';

COMMENT ON COLUMN public.medical_requests.aud_conselho_tipo IS 'Tipo de conselho do médico auditor (CRM, CRO, etc.)';
COMMENT ON COLUMN public.medical_requests.ass_conselho_tipo IS 'Tipo de conselho do médico assistente (CRM, CRO, etc.)';
COMMENT ON COLUMN public.medical_requests.des_conselho_tipo IS 'Tipo de conselho do médico desempatador (CRM, CRO, etc.)';
