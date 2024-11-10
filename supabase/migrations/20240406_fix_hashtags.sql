-- Drop existing views and functions with proper dependency handling
DROP MATERIALIZED VIEW IF EXISTS public.hashtag_counts;
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON public.tweets;
DROP FUNCTION IF EXISTS process_tweet_hashtags() CASCADE;

-- Create materialized view for hashtag counts with proper grouping
CREATE MATERIALIZED VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(th.tweet_id) as count,
    MAX(t.created_at) as last_used_at
FROM public.hashtags h
LEFT JOIN public.tweet_hashtags th ON th.hashtag_id = h.id
LEFT JOIN public.tweets t ON t.id = th.tweet_id
GROUP BY h.id, h.tag
ORDER BY COUNT(th.tweet_id) DESC, MAX(t.created_at) DESC NULLS LAST;

-- Create improved function to extract and save hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtags for this tweet if updating
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;
    END IF;

    -- Extract hashtags using improved regex
    FOR hashtag IN
        SELECT DISTINCT LOWER(matches[1])
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS matches
    LOOP
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

        -- Link hashtag to tweet
        INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
        VALUES (NEW.id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER process_tweet_hashtags_trigger
AFTER INSERT OR UPDATE ON public.tweets
FOR EACH ROW
EXECUTE FUNCTION process_tweet_hashtags();

-- Refresh the view
REFRESH MATERIALIZED VIEW public.hashtag_counts;