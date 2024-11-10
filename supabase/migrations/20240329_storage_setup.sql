-- First, drop all existing storage policies
DO $$ 
BEGIN
    -- Drop all policies from storage.objects
    DROP POLICY IF EXISTS "Public Access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
    DROP POLICY IF EXISTS "Allow individual ownership" ON storage.objects;
    DROP POLICY IF EXISTS "Allow individual delete" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
END $$;

-- Create listings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create new storage policies with unique names
CREATE POLICY "listings_select_policy" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listings');

CREATE POLICY "listings_insert_policy" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (
    bucket_id = 'listings' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "listings_update_policy" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (
    bucket_id = 'listings'
    AND owner = auth.uid()
);

CREATE POLICY "listings_delete_policy" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (
    bucket_id = 'listings'
    AND owner = auth.uid()
);

-- Grant necessary permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;

-- Create storage.foldername function if it doesn't exist
CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] LANGUAGE sql AS $$
    SELECT string_to_array(name, '/');
$$;