-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Anyone can create hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Anyone can view tweet hashtags" ON public.tweet_hashtags;
DROP POLICY IF EXISTS "Anyone can create tweet hashtags" ON public.tweet_hashtags;

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies for hashtags
CREATE POLICY "Enable read access for all users"
ON public.hashtags FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users"
ON public.hashtags FOR UPDATE
TO authenticated
USING (true);

-- Create policies for tweet_hashtags
CREATE POLICY "Enable read access for all users"
ON public.tweet_hashtags FOR SELECT
USING (true);

CREATE POLICY "Enable insert access for authenticated users"
ON public.tweet_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.hashtags TO authenticated;
GRANT ALL ON public.tweet_hashtags TO authenticated;
GRANT SELECT ON public.hashtags TO anon;
GRANT SELECT ON public.tweet_hashtags TO anon;