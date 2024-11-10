-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual ownership" ON storage.objects;
DROP POLICY IF EXISTS "Allow individual delete" ON storage.objects;

-- Create public bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('public', 'public', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create simplified policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (true);

CREATE POLICY "Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;