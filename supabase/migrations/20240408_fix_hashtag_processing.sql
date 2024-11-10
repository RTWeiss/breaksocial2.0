-- Drop existing function if it exists
DROP FUNCTION IF EXISTS process_tweet_hashtags CASCADE;

-- Create improved function to process hashtags
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

    -- Extract hashtags using regexp_matches
    FOR hashtag IN 
        SELECT DISTINCT LOWER(matches[1])
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS matches
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
        RETURNING id INTO hashtag_id;

        -- Link hashtag to tweet
        INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
        VALUES (NEW.id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON public.tweets;

-- Create trigger for hashtag processing
CREATE TRIGGER process_tweet_hashtags_trigger
    AFTER INSERT OR UPDATE ON public.tweets
    FOR EACH ROW
    EXECUTE FUNCTION process_tweet_hashtags();

-- Create or replace view for hashtag counts
CREATE OR REPLACE VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(DISTINCT th.tweet_id) as count,
    MAX(t.created_at) as last_used_at
FROM 
    hashtags h
    LEFT JOIN tweet_hashtags th ON h.id = th.hashtag_id
    LEFT JOIN tweets t ON th.tweet_id = t.id
WHERE 
    t.created_at > NOW() - INTERVAL '7 days'
    OR t.created_at IS NULL
GROUP BY 
    h.id, h.tag
HAVING 
    COUNT(DISTINCT th.tweet_id) > 0
ORDER BY 
    COUNT(DISTINCT th.tweet_id) DESC,
    MAX(t.created_at) DESC NULLS LAST;