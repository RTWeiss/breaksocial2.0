-- Drop existing tables and functions
DROP TABLE IF EXISTS public.tweets CASCADE;
DROP TABLE IF EXISTS public.hashtags CASCADE;

-- Create tweets table with proper structure
CREATE TABLE public.tweets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hashtags table
CREATE TABLE public.hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    count INTEGER DEFAULT 1,
    last_used TIMESTAMPTZ DEFAULT NOW()
);

-- Create function to extract hashtags
CREATE OR REPLACE FUNCTION extract_hashtags(content TEXT) 
RETURNS TEXT[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT DISTINCT SUBSTRING(word FROM 2)
        FROM regexp_matches(content, '#([A-Za-z0-9_]+)', 'g') AS m(word)
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Create function to process tweet hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract hashtags from content
    NEW.hashtags := extract_hashtags(NEW.content);
    
    -- Update hashtags table
    INSERT INTO hashtags (tag)
    SELECT UNNEST(NEW.hashtags)
    ON CONFLICT (tag) 
    DO UPDATE SET 
        count = hashtags.count + 1,
        last_used = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for processing hashtags
DROP TRIGGER IF EXISTS tweet_hashtags_trigger ON tweets;
CREATE TRIGGER tweet_hashtags_trigger
    BEFORE INSERT OR UPDATE ON tweets
    FOR EACH ROW
    EXECUTE FUNCTION process_tweet_hashtags();

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view tweets"
    ON public.tweets FOR SELECT
    USING (true);

CREATE POLICY "Users can create tweets"
    ON public.tweets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tweets"
    ON public.tweets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tweets"
    ON public.tweets FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view hashtags"
    ON public.hashtags FOR SELECT
    USING (true);

CREATE POLICY "System can manage hashtags"
    ON public.hashtags FOR ALL
    USING (true);