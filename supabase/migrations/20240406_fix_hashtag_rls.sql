-- Enable RLS on hashtag tables
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Authenticated users can create hashtags" ON public.hashtags;
DROP POLICY IF EXISTS "Anyone can view tweet hashtags" ON public.tweet_hashtags;
DROP POLICY IF EXISTS "Authenticated users can create tweet hashtags" ON public.tweet_hashtags;

-- Create policies for hashtags table
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policies for tweet_hashtags table
CREATE POLICY "Anyone can view tweet hashtags"
ON public.tweet_hashtags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create tweet hashtags"
ON public.tweet_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Grant necessary permissions
GRANT ALL ON public.hashtags TO authenticated;
GRANT ALL ON public.tweet_hashtags TO authenticated;
GRANT ALL ON public.hashtag_counts TO authenticated;

-- Ensure the hashtag_counts view is accessible
GRANT SELECT ON public.hashtag_counts TO authenticated;