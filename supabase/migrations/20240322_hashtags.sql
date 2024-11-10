-- Create hashtags table
CREATE TABLE IF NOT EXISTS public.hashtags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create hashtag_usage table to track hashtag usage in tweets and listings
CREATE TABLE IF NOT EXISTS public.hashtag_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hashtag_id UUID REFERENCES public.hashtags(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL CHECK (content_type IN ('tweet', 'listing')),
    content_id UUID NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Hashtags are viewable by everyone"
ON public.hashtags FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create hashtags"
ON public.hashtags FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Hashtag usage is viewable by everyone"
ON public.hashtag_usage FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create hashtag usage"
ON public.hashtag_usage FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_hashtags_name ON public.hashtags(name);
CREATE INDEX idx_hashtag_usage_hashtag_id ON public.hashtag_usage(hashtag_id);
CREATE INDEX idx_hashtag_usage_content ON public.hashtag_usage(content_type, content_id);
CREATE INDEX idx_hashtag_usage_created_at ON public.hashtag_usage(created_at DESC);

-- Create function to extract and save hashtags
CREATE OR REPLACE FUNCTION process_hashtags(
    content TEXT,
    content_type TEXT,
    content_id UUID
) RETURNS void AS $$
DECLARE
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Extract hashtags using regex
    FOR hashtag IN
        SELECT DISTINCT LOWER(matches[1])
        FROM regexp_matches(content, '#(\w+)', 'g') AS matches
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (name)
        VALUES (hashtag)
        ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO hashtag_id;

        -- Create hashtag usage
        INSERT INTO public.hashtag_usage (hashtag_id, content_type, content_id)
        VALUES (hashtag_id, content_type, content_id)
        ON CONFLICT DO NOTHING;
    END LOOP;
END;
$$ LANGUAGE plpgsql;