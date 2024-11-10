-- Drop existing tables and recreate with proper structure
DROP TABLE IF EXISTS public.tweet_hashtags CASCADE;
DROP TABLE IF EXISTS public.hashtags CASCADE;

-- Create hashtags table
CREATE TABLE public.hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tweet_hashtags junction table
CREATE TABLE public.tweet_hashtags (
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tweet_id, hashtag_id)
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
USING (true);

CREATE POLICY "System can manage hashtags"
ON public.hashtags FOR ALL
USING (true);

CREATE POLICY "Anyone can view tweet hashtags"
ON public.tweet_hashtags FOR SELECT
USING (true);

CREATE POLICY "System can manage tweet hashtags"
ON public.tweet_hashtags FOR ALL
USING (true);

-- Create indexes
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX idx_tweet_hashtags_tweet_id ON public.tweet_hashtags(tweet_id);
CREATE INDEX idx_tweet_hashtags_hashtag_id ON public.tweet_hashtags(hashtag_id);