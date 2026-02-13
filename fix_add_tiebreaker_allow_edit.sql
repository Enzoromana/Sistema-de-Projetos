-- FIX: Add missing "tiebreaker_allow_edit" column to medical_requests
-- Run this in the Supabase SQL Editor

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
