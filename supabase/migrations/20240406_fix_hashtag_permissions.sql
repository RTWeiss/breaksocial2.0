-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS public.hashtag_counts;

-- Create regular view instead of materialized view for better permission handling
CREATE OR REPLACE VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(th.tweet_id) as usage_count,
    MAX(t.created_at) as last_used_at
FROM 
    hashtags h
    LEFT JOIN tweet_hashtags th ON h.id = th.hashtag_id
    LEFT JOIN tweets t ON th.tweet_id = t.id
GROUP BY 
    h.id, h.tag
ORDER BY 
    usage_count DESC, last_used_at DESC;

-- Grant permissions
ALTER VIEW public.hashtag_counts OWNER TO authenticated;
GRANT ALL ON public.hashtag_counts TO authenticated;
GRANT ALL ON public.hashtag_counts TO anon;

-- Ensure proper permissions on related tables
GRANT ALL ON public.hashtags TO authenticated;
GRANT ALL ON public.tweet_hashtags TO authenticated;
GRANT ALL ON public.tweets TO authenticated;

-- Update RLS policies
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can create hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view tweet hashtags"
ON public.tweet_hashtags FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anyone can create tweet hashtags"
ON public.tweet_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to process hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag_record RECORD;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtags for this tweet if updating
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM tweet_hashtags WHERE tweet_id = NEW.id;
    END IF;

    -- Extract and process hashtags
    FOR hashtag_record IN 
        SELECT DISTINCT LOWER(SUBSTRING(hashtag, 2)) as tag
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') as hashtag
    LOOP
        -- Insert hashtag if it doesn't exist and get its id
        INSERT INTO hashtags (tag)
        VALUES (hashtag_record.tag)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
        RETURNING id INTO hashtag_id;

        -- Create tweet-hashtag association
        INSERT INTO tweet_hashtags (tweet_id, hashtag_id)
        VALUES (NEW.id, hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON tweets;
CREATE TRIGGER process_tweet_hashtags_trigger
    AFTER INSERT OR UPDATE ON tweets
    FOR EACH ROW
    EXECUTE FUNCTION process_tweet_hashtags();