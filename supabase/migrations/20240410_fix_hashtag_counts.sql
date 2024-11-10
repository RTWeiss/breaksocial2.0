-- Drop existing view if it exists
DROP VIEW IF EXISTS public.hashtag_counts;

-- Create hashtag counts view
CREATE OR REPLACE VIEW public.hashtag_counts AS
SELECT 
    h.id,
    h.tag,
    COUNT(DISTINCT th.tweet_id) as count,
    MAX(t.created_at) as last_used_at
FROM public.hashtags h
LEFT JOIN public.tweet_hashtags th ON h.id = th.hashtag_id
LEFT JOIN public.tweets t ON th.tweet_id = t.id
GROUP BY h.id, h.tag
ORDER BY COUNT(DISTINCT th.tweet_id) DESC, MAX(t.created_at) DESC NULLS LAST;

-- Grant access to the view
GRANT SELECT ON public.hashtag_counts TO authenticated;
GRANT SELECT ON public.hashtag_counts TO anon;