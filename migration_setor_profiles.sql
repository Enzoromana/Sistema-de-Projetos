-- Add setor column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS setor TEXT;
