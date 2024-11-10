-- Drop existing triggers
DROP TRIGGER IF EXISTS process_tweet_hashtags_trigger ON tweets;
DROP FUNCTION IF EXISTS process_tweet_hashtags CASCADE;

-- Create improved function to process hashtags
CREATE OR REPLACE FUNCTION process_tweet_hashtags()
RETURNS TRIGGER AS $$
DECLARE
    hashtag TEXT;
    hashtag_id UUID;
BEGIN
    -- Delete existing hashtags for this tweet if updating
    IF TG_OP = 'UPDATE' THEN
        DELETE FROM public.tweet_hashtags WHERE tweet_id = NEW.id;
    END IF;

    -- Extract hashtags using regex
    FOR hashtag IN
        SELECT DISTINCT LOWER(SUBSTRING(word FROM 2))
        FROM regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g') AS matches(word)
    LOOP
        -- Insert hashtag if it doesn't exist
        INSERT INTO public.hashtags (tag)
        VALUES (hashtag)
        ON CONFLICT (tag) DO UPDATE SET tag = EXCLUDED.tag
        RETURNING id INTO hashtag_id;

        -- Link hashtag to tweet
        IF hashtag_id IS NOT NULL THEN
            INSERT INTO public.tweet_hashtags (tweet_id, hashtag_id)
            VALUES (NEW.id, hashtag_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for hashtag processing
CREATE TRIGGER process_tweet_hashtags_trigger
    AFTER INSERT OR UPDATE ON public.tweets
    FOR EACH ROW
    EXECUTE FUNCTION process_tweet_hashtags();

-- Create function to handle tweet notifications
CREATE OR REPLACE FUNCTION notify_tweet_changes()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM pg_notify(
        'tweet_changes',
        json_build_object(
            'table', TG_TABLE_NAME,
            'type', TG_OP,
            'record', row_to_json(NEW)
        )::text
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for tweet notifications
DROP TRIGGER IF EXISTS notify_tweet_changes ON tweets;
CREATE TRIGGER notify_tweet_changes
    AFTER INSERT OR UPDATE ON tweets
    FOR EACH ROW
    EXECUTE FUNCTION notify_tweet_changes();