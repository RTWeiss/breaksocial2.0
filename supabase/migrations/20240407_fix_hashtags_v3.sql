-- Drop existing objects with proper dependency handling
DROP MATERIALIZED VIEW IF EXISTS public.hashtag_counts CASCADE;
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON tweets CASCADE;
DROP FUNCTION IF EXISTS public.process_tweet_hashtags() CASCADE;
DROP TABLE IF EXISTS public.tweet_hashtags CASCADE;
DROP TABLE IF EXISTS public.hashtags CASCADE;

-- Create hashtags table
CREATE TABLE public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
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

CREATE POLICY "Authenticated users can create hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view tweet hashtags"
ON public.tweet_hashtags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create tweet hashtags"
ON public.tweet_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to process hashtags with fixed substring handling
CREATE OR REPLACE FUNCTION public.process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    matches TEXT[];
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtag associations
    DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;
    
    -- Extract hashtags using regexp_matches
    FOR matches IN 
        SELECT regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g')
    LOOP
        -- Get the hashtag text (first capture group)
        hashtag := LOWER(matches[1]);
        
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag)
        ON CONFLICT (tag) DO NOTHING
        RETURNING id INTO hashtag_id;

        -- If hashtag already existed, get its id
        IF hashtag_id IS NULL THEN
            SELECT id INTO hashtag_id
            FROM public.hashtags
            WHERE tag = hashtag;
        END IF;

        -- Create tweet-hashtag association
        INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
        VALUES (NEW.id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER process_tweet_hashtags_trigger
    AFTER INSERT OR UPDATE ON public.tweets
    FOR EACH ROW
    EXECUTE FUNCTION public.process_tweet_hashtags();

-- Create view for hashtag counts
CREATE VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(th.tweet_id) as count,
    MAX(h.created_at) as last_used
FROM public.hashtags h
LEFT JOIN public.tweet_hashtags th ON h.id = th.hashtag_id
GROUP BY h.id, h.tag
ORDER BY count DESC, last_used DESC;

-- Create indexes
CREATE INDEX idx_tweet_hashtags_tweet_id ON public.tweet_hashtags(tweet_id);
CREATE INDEX idx_tweet_hashtags_hashtag_id ON public.tweet_hashtags(hashtag_id);
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);

-- Grant permissions
GRANT ALL ON public.hashtags TO authenticated;
GRANT ALL ON public.tweet_hashtags TO authenticated;
GRANT SELECT ON public.hashtag_counts TO authenticated;