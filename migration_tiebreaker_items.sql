-- Add conclusao_desempate column to medical_procedures
ALTER TABLE medical_procedures 
ADD COLUMN IF NOT EXISTS conclusao_desempate TEXT;

-- Add conclusao_desempate column to medical_materials
ALTER TABLE medical_materials 
ADD COLUMN IF NOT EXISTS conclusao_desempate TEXT;
