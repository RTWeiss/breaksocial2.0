-- Drop existing views and tables
DROP VIEW IF EXISTS public.hashtag_counts;
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

-- Create trending hashtags view
CREATE OR REPLACE VIEW public.trending_hashtags AS
WITH recent_hashtags AS (
    SELECT 
        h.id,
        h.tag,
        COUNT(DISTINCT th.tweet_id) as tweet_count,
        MAX(t.created_at) as last_used
    FROM 
        public.hashtags h
        INNER JOIN public.tweet_hashtags th ON h.id = th.hashtag_id
        INNER JOIN public.tweets t ON th.tweet_id = t.id
    WHERE 
        t.created_at > NOW() - INTERVAL '7 days'
    GROUP BY 
        h.id, h.tag
    HAVING 
        COUNT(DISTINCT th.tweet_id) > 0
)
SELECT 
    id,
    tag,
    tweet_count as count,
    last_used as last_used_at
FROM 
    recent_hashtags
ORDER BY 
    tweet_count DESC,
    last_used DESC
LIMIT 10;

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tweet_hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users"
ON public.hashtags FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable read access for all users"
ON public.tweet_hashtags FOR SELECT
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON public.tweet_hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to process hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag_text TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtags for this tweet
    DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;
    
    -- Extract and process hashtags
    FOR hashtag_text IN 
        SELECT DISTINCT LOWER(matches[1])
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') as matches
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag_text)
        ON CONFLICT (tag) DO UPDATE 
        SET tag = EXCLUDED.tag
        RETURNING id INTO hashtag_id;

        -- Create tweet-hashtag association
        IF hashtag_id IS NOT NULL THEN
            INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
            VALUES (NEW.id, hashtag_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER process_tweet_hashtags_trigger
    AFTER INSERT OR UPDATE ON public.tweets
    FOR EACH ROW
    EXECUTE FUNCTION process_tweet_hashtags();

-- Grant permissions
GRANT SELECT ON public.trending_hashtags TO authenticated;
GRANT SELECT ON public.trending_hashtags TO anon;