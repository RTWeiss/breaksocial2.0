-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tag TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hashtag_usage table to track where hashtags are used
CREATE TABLE IF NOT EXISTS public.hashtag_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('tweet', 'listing')),
    content_id UUID NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create view for hashtag counts
CREATE OR REPLACE VIEW public.hashtag_counts AS
SELECT 
    h.tag,
    CASE
        WHEN hu.content_type = 'listing' THEN 'Marketplace'
        ELSE 'Posts'
    END as category,
    COUNT(*) as count
FROM public.hashtags h
JOIN public.hashtag_usage hu ON h.id = hu.hashtag_id
WHERE hu.created_at > NOW() - INTERVAL '7 days'
GROUP BY h.tag, hu.content_type
ORDER BY count DESC;

-- Create function to extract and save hashtags
CREATE OR REPLACE FUNCTION public.extract_and_save_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtag usage for this content
    DELETE FROM public.hashtag_usage 
    WHERE content_type = TG_ARGV[0] 
    AND content_id = NEW.id;

    -- Extract hashtags using regex
    FOR hashtag IN 
        SELECT DISTINCT LOWER(substring(word from 2))
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') as match(word)
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag)
        ON CONFLICT (tag) DO NOTHING
        RETURNING id INTO hashtag_id;

        -- If hashtag_id is null, get it from existing hashtag
        IF hashtag_id IS NULL THEN
            SELECT id INTO hashtag_id
            FROM public.hashtags
            WHERE tag = hashtag;
        END IF;

        -- Insert hashtag usage
        INSERT INTO public.hashtag_usage (hashtag_id, content_type, content_id, user_id)
        VALUES (hashtag_id, TG_ARGV[0], NEW.id, NEW.user_id);
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for tweets and listings
DROP TRIGGER IF EXISTS extract_tweet_hashtags ON public.tweets;
CREATE TRIGGER extract_tweet_hashtags
    AFTER INSERT OR UPDATE OF content
    ON public.tweets
    FOR EACH ROW
    EXECUTE FUNCTION public.extract_and_save_hashtags('tweet');

DROP TRIGGER IF EXISTS extract_listing_hashtags ON public.listings;
CREATE TRIGGER extract_listing_hashtags
    AFTER INSERT OR UPDATE OF description
    ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.extract_and_save_hashtags('listing');

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hashtags are viewable by everyone"
    ON public.hashtags FOR SELECT
    USING (true);

CREATE POLICY "Hashtag usage is viewable by everyone"
    ON public.hashtag_usage FOR SELECT
    USING (true);

-- Create indexes
CREATE INDEX idx_hashtags_tag ON public.hashtags(tag);
CREATE INDEX idx_hashtag_usage_hashtag_id ON public.hashtag_usage(hashtag_id);
CREATE INDEX idx_hashtag_usage_content ON public.hashtag_usage(content_type, content_id);
CREATE INDEX idx_hashtag_usage_created_at ON public.hashtag_usage(created_at DESC);