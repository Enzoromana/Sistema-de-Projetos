-- SQL Migration: Add access_sheet_to_slide permission
-- Execute this in the Supabase SQL Editor

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS access_sheet_to_slide BOOLEAN DEFAULT false;

-- Re-verify RLS or views if necessary (not usually needed for simple column addition)
COMMENT ON COLUMN profiles.access_sheet_to_slide IS 'Permissão de acesso ao módulo Planilha para Slide';