-- Create listings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Listings Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Listings Upload Access" ON storage.objects;
DROP POLICY IF EXISTS "Listings Update Access" ON storage.objects;
DROP POLICY IF EXISTS "Listings Delete Access" ON storage.objects;

-- Create storage policies with unique names
CREATE POLICY "Listings Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

CREATE POLICY "Listings Upload Access"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'listings');

CREATE POLICY "Listings Update Access"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid() = owner);

CREATE POLICY "Listings Delete Access"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid() = owner);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;