-- Drop existing view
DROP VIEW IF EXISTS public.trending_hashtags;

-- Create trending hashtags view with proper columns
CREATE VIEW public.trending_hashtags AS
WITH recent_hashtags AS (
    SELECT 
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
        h.tag
    HAVING 
        COUNT(DISTINCT th.tweet_id) > 0
)
SELECT 
    tag,
    tweet_count as count,
    last_used as last_used_at
FROM 
    recent_hashtags
ORDER BY 
    tweet_count DESC,
    last_used DESC
LIMIT 10;

-- Grant permissions
GRANT SELECT ON public.trending_hashtags TO authenticated;
GRANT SELECT ON public.trending_hashtags TO anon;