-- Function to get trending posts
CREATE OR REPLACE FUNCTION get_trending_posts(limit_count integer)
RETURNS TABLE (
    id uuid,
    like_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        COUNT(l.id) as like_count
    FROM tweets t
    LEFT JOIN likes l ON t.id = l.tweet_id
    GROUP BY t.id
    ORDER BY like_count DESC, t.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending listings
CREATE OR REPLACE FUNCTION get_trending_listings(limit_count integer)
RETURNS TABLE (
    id uuid,
    like_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        COUNT(ll.id) as like_count
    FROM listings l
    LEFT JOIN listing_likes ll ON l.id = ll.listing_id
    WHERE l.status = 'active'
    GROUP BY l.id
    ORDER BY like_count DESC, l.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get trending users
CREATE OR REPLACE FUNCTION get_trending_users(limit_count integer)
RETURNS TABLE (
    user_id uuid,
    follower_count bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        COUNT(f.follower_id) as follower_count
    FROM profiles p
    LEFT JOIN follows f ON p.id = f.following_id
    GROUP BY p.id
    ORDER BY follower_count DESC, p.created_at DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;