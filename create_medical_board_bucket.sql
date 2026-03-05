-- Create the medical-board bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-board', 'medical-board', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public access to read files
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'medical-board');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload files" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'medical-board' 
    AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete their own files or any files depending on requirements
CREATE POLICY "Authenticated users can update files" 
ON storage.objects FOR UPDATE 
USING (
    bucket_id = 'medical-board' 
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated users can delete files" 
ON storage.objects FOR DELETE 
USING (
    bucket_id = 'medical-board' 
    AND auth.role() = 'authenticated'
);
