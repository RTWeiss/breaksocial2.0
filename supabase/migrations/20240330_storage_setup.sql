-- Create listings bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, owner, created_at, updated_at, public)
VALUES ('listings', 'listings', null, now(), now(), true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "listings_select_policy" ON storage.objects;
DROP POLICY IF EXISTS "listings_insert_policy" ON storage.objects;
DROP POLICY IF EXISTS "listings_update_policy" ON storage.objects;
DROP POLICY IF EXISTS "listings_delete_policy" ON storage.objects;

-- Create new policies
CREATE POLICY "listings_select_policy" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'listings');

CREATE POLICY "listings_insert_policy" 
ON storage.objects FOR INSERT 
TO authenticated 
WITH CHECK (bucket_id = 'listings');

CREATE POLICY "listings_update_policy" 
ON storage.objects FOR UPDATE 
TO authenticated 
USING (auth.uid() = owner);

CREATE POLICY "listings_delete_policy" 
ON storage.objects FOR DELETE 
TO authenticated 
USING (auth.uid() = owner);

-- Grant permissions
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;