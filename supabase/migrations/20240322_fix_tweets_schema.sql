-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.hashtag_counts CASCADE;
DROP TABLE IF EXISTS public.hashtags CASCADE;
DROP TABLE IF EXISTS public.tweet_hashtags CASCADE;
DROP TABLE IF EXISTS public.tweets CASCADE;

-- Create tweets table with proper relationships
CREATE TABLE IF NOT EXISTS public.tweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tweet_hashtags junction table
CREATE TABLE IF NOT EXISTS public.tweet_hashtags (
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (tweet_id, hashtag_id)
);

-- Create materialized view for hashtag counts
CREATE MATERIALIZED VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(th.tweet_id) as usage_count,
    MAX(t.created_at) as last_used_at
FROM public.hashtags h
LEFT JOIN public.tweet_hashtags th ON th.hashtag_id = h.id
LEFT JOIN public.tweets t ON t.id = th.tweet_id
GROUP BY h.id, h.tag;

-- Create function to refresh hashtag counts
CREATE OR REPLACE FUNCTION refresh_hashtag_counts()
RETURNS TRIGGER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.hashtag_counts;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to refresh counts
CREATE TRIGGER refresh_hashtag_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.tweet_hashtags
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_hashtag_counts();

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tweets are viewable by everyone"
ON public.tweets FOR SELECT
USING (true);

CREATE POLICY "Users can create tweets"
ON public.tweets FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tweets"
ON public.tweets FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tweets"
ON public.tweets FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_tweets_user_id ON public.tweets(user_id);
CREATE INDEX idx_tweets_created_at ON public.tweets(created_at DESC);
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX idx_tweet_hashtags_tweet_id ON public.tweet_hashtags(tweet_id);
CREATE INDEX idx_tweet_hashtags_hashtag_id ON public.tweet_hashtags(hashtag_id);

-- Create function to extract and save hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtag associations
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;
    END IF;

    -- Extract and process hashtags
    FOR hashtag IN
        SELECT DISTINCT LOWER(SUBSTRING(word FROM 2))
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS matches(word)
    LOOP
        -- Get or create hashtag
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
        RETURNING id INTO hashtag_id;

        -- Create association
        INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
        VALUES (NEW.id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hashtag processing
CREATE TRIGGER process_tweet_hashtags_trigger
AFTER INSERT OR UPDATE ON public.tweets
FOR EACH ROW
EXECUTE FUNCTION process_tweet_hashtags();