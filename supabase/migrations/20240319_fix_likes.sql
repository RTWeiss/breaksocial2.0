-- Drop existing likes table if it exists
DROP TABLE IF EXISTS likes;

-- Recreate likes table with proper constraints
CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tweet_id UUID NOT NULL REFERENCES tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Add RLS policies
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own likes"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone"
ON likes FOR SELECT
TO authenticated
USING (true);

-- Create function to get likes count
CREATE OR REPLACE FUNCTION get_likes_count(tweet_row tweets)
RETURNS INTEGER AS $$
  SELECT COUNT(*)::INTEGER
  FROM likes
  WHERE tweet_id = tweet_row.id;
$$ LANGUAGE sql STABLE;

-- Create function to check if user liked tweet
CREATE OR REPLACE FUNCTION is_liked_by_user(tweet_row tweets, user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM likes
    WHERE tweet_id = tweet_row.id
    AND user_id = $2
  );
$$ LANGUAGE sql STABLE;