-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS extract_hashtags;
DROP FUNCTION IF EXISTS process_hashtags;

-- Create function to extract hashtags
CREATE OR REPLACE FUNCTION extract_hashtags(content text)
RETURNS text[] AS $$
DECLARE
  hashtags text[];
BEGIN
  -- Extract words starting with # using regexp_matches
  SELECT ARRAY(
    SELECT DISTINCT substring(word from 2) 
    FROM regexp_matches(content, '#([A-Za-z0-9_]+)', 'g') AS m(word)
  ) INTO hashtags;
  
  RETURN hashtags;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create tweets table with proper structure
CREATE TABLE IF NOT EXISTS public.tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    hashtags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create trigger to automatically extract hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
BEGIN
  NEW.hashtags = extract_hashtags(NEW.content);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS tweet_hashtags_trigger ON tweets;
CREATE TRIGGER tweet_hashtags_trigger
  BEFORE INSERT OR UPDATE ON tweets
  FOR EACH ROW
  EXECUTE FUNCTION process_tweet_hashtags();

-- Create hashtags table for tracking
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT NOT NULL UNIQUE,
    count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Function to update hashtag counts
CREATE OR REPLACE FUNCTION update_hashtag_counts()
RETURNS TRIGGER AS $$
BEGIN
  -- For new/updated tweets
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Insert or update hashtags
    INSERT INTO hashtags (tag, count, last_used)
    SELECT DISTINCT unnest(NEW.hashtags), 1, NOW()
    ON CONFLICT (tag) DO UPDATE
    SET count = hashtags.count + 1,
        last_used = NOW();
  END IF;

  -- For deleted/updated tweets, decrease old hashtag counts
  IF TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN
    UPDATE hashtags
    SET count = count - 1
    WHERE tag = ANY(OLD.hashtags);
    
    -- Clean up unused hashtags
    DELETE FROM hashtags WHERE count <= 0;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hashtag counting
DROP TRIGGER IF EXISTS update_hashtag_counts_trigger ON tweets;
CREATE TRIGGER update_hashtag_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON tweets
  FOR EACH ROW
  EXECUTE FUNCTION update_hashtag_counts();