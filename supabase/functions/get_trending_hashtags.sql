CREATE OR REPLACE FUNCTION get_trending_hashtags(time_window TEXT)
RETURNS TABLE (
    hashtag TEXT,
    count BIGINT,
    type TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH hashtag_counts AS (
        SELECT
            h.name as hashtag,
            COUNT(*) as count,
            hu.content_type as type
        FROM
            public.hashtags h
            JOIN public.hashtag_usage hu ON h.id = hu.hashtag_id
        WHERE
            hu.created_at >= (NOW() - time_window::INTERVAL)
        GROUP BY
            h.name,
            hu.content_type
        HAVING
            COUNT(*) > 1
    )
    SELECT
        hashtag,
        count,
        type
    FROM
        hashtag_counts
    ORDER BY
        count DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;