-- Migration to add Third Opinion (Desempatador) fields
ALTER TABLE medical_requests 
ADD COLUMN IF NOT EXISTS desempatador_nome text,
ADD COLUMN IF NOT EXISTS desempatador_crm text,
ADD COLUMN IF NOT EXISTS desempatador_especialidade text,
ADD COLUMN IF NOT EXISTS desempate_ass_nome text,
ADD COLUMN IF NOT EXISTS desempate_ass_crm text,
ADD COLUMN IF NOT EXISTS desempate_ass_especialidade text,
ADD COLUMN IF NOT EXISTS parecer_conclusao text;
