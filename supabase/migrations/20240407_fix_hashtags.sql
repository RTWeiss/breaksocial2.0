-- Drop existing objects if they exist
DROP MATERIALIZED VIEW IF EXISTS public.hashtag_counts;
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON tweets;
DROP FUNCTION IF EXISTS public.process_tweet_hashtags();
DROP TABLE IF EXISTS public.hashtags;

-- Create hashtags table
CREATE TABLE public.hashtags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tag TEXT NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tag, tweet_id)
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies for hashtags
CREATE POLICY "Anyone can view hashtags"
ON public.hashtags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create function to process hashtags
CREATE OR REPLACE FUNCTION public.process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag TEXT;
BEGIN
    -- Delete existing hashtags for this tweet
    DELETE FROM public.hashtags WHERE tweet_id = NEW.id;
    
    -- Extract and insert hashtags
    FOR hashtag IN 
        SELECT DISTINCT SUBSTRING(word FROM 2) 
        FROM regexp_split_to_table(NEW.content, E'\\s+') word 
        WHERE word LIKE '#%'
    LOOP
        INSERT INTO public.hashtags (tag, tweet_id)
        VALUES (LOWER(hashtag), NEW.id)
        ON CONFLICT (tag, tweet_id) DO NOTHING;
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
    h.tag,
    COUNT(*) as count,
    MAX(h.created_at) as last_used
FROM public.hashtags h
GROUP BY h.tag
ORDER BY count DESC, last_used DESC;

-- Grant permissions
ALTER TABLE public.hashtags OWNER TO authenticated;
GRANT ALL ON public.hashtags TO authenticated;
GRANT SELECT ON public.hashtag_counts TO authenticated;