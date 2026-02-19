-- Migration: Add access_guia_medico column to profiles table
-- Run this in the Supabase SQL Editor

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS access_guia_medico BOOLEAN DEFAULT FALSE;

-- Grant access to admin users
UPDATE profiles
SET access_guia_medico = TRUE
WHERE role = 'admin';

-- Verify
SELECT id, full_name, role, access_guia_medico FROM profiles LIMIT 10;
