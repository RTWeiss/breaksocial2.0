-- Drop existing trigger and function
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON public.tweets;
DROP FUNCTION IF EXISTS process_tweet_hashtags();

-- Create improved function to process hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag_record RECORD;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtags for this tweet if updating
    DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;

    -- Extract and process hashtags
    FOR hashtag_record IN 
        SELECT DISTINCT LOWER(matches[1]) as tag
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') as matches
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag_record.tag)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
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