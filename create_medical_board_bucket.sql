-- 1. Create the medical-board bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-board', 'medical-board', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Clean up policies (using unique names to avoid conflicts with other buckets)
DO $$ 
BEGIN
    -- Select Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'medical_board_select_policy') THEN
        CREATE POLICY "medical_board_select_policy" ON storage.objects FOR SELECT USING (bucket_id = 'medical-board');
    END IF;

    -- Insert Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'medical_board_insert_policy') THEN
        CREATE POLICY "medical_board_insert_policy" ON storage.objects FOR INSERT WITH CHECK (
            bucket_id = 'medical-board' AND auth.role() = 'authenticated'
        );
    END IF;

    -- Update Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'medical_board_update_policy') THEN
        CREATE POLICY "medical_board_update_policy" ON storage.objects FOR UPDATE USING (
            bucket_id = 'medical-board' AND auth.role() = 'authenticated'
        );
    END IF;

    -- Delete Policy
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'medical_board_delete_policy') THEN
        CREATE POLICY "medical_board_delete_policy" ON storage.objects FOR DELETE USING (
            bucket_id = 'medical-board' AND auth.role() = 'authenticated'
        );
    END IF;
END $$;

