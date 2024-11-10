-- Drop existing notifications table and related objects
DROP TRIGGER IF EXISTS message_notification_trigger ON messages;
DROP FUNCTION IF EXISTS handle_message_notification();
DROP TABLE IF EXISTS notifications CASCADE;

-- Create notifications table with proper structure
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'new_message',
        'new_offer',
        'like_post',
        'like_listing',
        'retweet',
        'reply',
        'follow'
    )),
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications"
ON notifications FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Function for message notifications
CREATE OR REPLACE FUNCTION handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (
        user_id,
        type,
        message,
        data
    ) VALUES (
        NEW.receiver_id,
        'new_message',
        'You have a new message',
        jsonb_build_object(
            'sender_id', NEW.sender_id,
            'listing_id', NEW.listing_id
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for like notifications
CREATE OR REPLACE FUNCTION handle_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    tweet_author_id UUID;
    listing_author_id UUID;
BEGIN
    -- For tweet likes
    IF TG_TABLE_NAME = 'likes' THEN
        SELECT user_id INTO tweet_author_id FROM tweets WHERE id = NEW.tweet_id;
        IF tweet_author_id != NEW.user_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                message,
                data
            ) VALUES (
                tweet_author_id,
                'like_post',
                'Someone liked your post',
                jsonb_build_object(
                    'tweet_id', NEW.tweet_id,
                    'user_id', NEW.user_id
                )
            );
        END IF;
    -- For listing likes
    ELSIF TG_TABLE_NAME = 'listing_likes' THEN
        SELECT seller_id INTO listing_author_id FROM listings WHERE id = NEW.listing_id;
        IF listing_author_id != NEW.user_id THEN
            INSERT INTO notifications (
                user_id,
                type,
                message,
                data
            ) VALUES (
                listing_author_id,
                'like_listing',
                'Someone liked your listing',
                jsonb_build_object(
                    'listing_id', NEW.listing_id,
                    'user_id', NEW.user_id
                )
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for retweet notifications
CREATE OR REPLACE FUNCTION handle_retweet_notification()
RETURNS TRIGGER AS $$
DECLARE
    tweet_author_id UUID;
BEGIN
    SELECT user_id INTO tweet_author_id FROM tweets WHERE id = NEW.tweet_id;
    IF tweet_author_id != NEW.user_id THEN
        INSERT INTO notifications (
            user_id,
            type,
            message,
            data
        ) VALUES (
            tweet_author_id,
            'retweet',
            'Someone reposted your post',
            jsonb_build_object(
                'tweet_id', NEW.tweet_id,
                'user_id', NEW.user_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for reply notifications
CREATE OR REPLACE FUNCTION handle_reply_notification()
RETURNS TRIGGER AS $$
DECLARE
    tweet_author_id UUID;
BEGIN
    SELECT user_id INTO tweet_author_id FROM tweets WHERE id = NEW.tweet_id;
    IF tweet_author_id != NEW.user_id THEN
        INSERT INTO notifications (
            user_id,
            type,
            message,
            data
        ) VALUES (
            tweet_author_id,
            'reply',
            'Someone replied to your post',
            jsonb_build_object(
                'tweet_id', NEW.tweet_id,
                'reply_id', NEW.id,
                'user_id', NEW.user_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for offer notifications
CREATE OR REPLACE FUNCTION handle_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
    listing_author_id UUID;
BEGIN
    SELECT seller_id INTO listing_author_id FROM listings WHERE id = NEW.listing_id;
    IF listing_author_id != NEW.buyer_id THEN
        INSERT INTO notifications (
            user_id,
            type,
            message,
            data
        ) VALUES (
            listing_author_id,
            'new_offer',
            'Someone made an offer on your listing',
            jsonb_build_object(
                'listing_id', NEW.listing_id,
                'offer_id', NEW.id,
                'user_id', NEW.buyer_id,
                'amount', NEW.amount
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER message_notification_trigger
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION handle_message_notification();

CREATE TRIGGER tweet_like_notification_trigger
    AFTER INSERT ON likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_like_notification();

CREATE TRIGGER listing_like_notification_trigger
    AFTER INSERT ON listing_likes
    FOR EACH ROW
    EXECUTE FUNCTION handle_like_notification();

CREATE TRIGGER retweet_notification_trigger
    AFTER INSERT ON retweets
    FOR EACH ROW
    EXECUTE FUNCTION handle_retweet_notification();

CREATE TRIGGER reply_notification_trigger
    AFTER INSERT ON replies
    FOR EACH ROW
    EXECUTE FUNCTION handle_reply_notification();

CREATE TRIGGER offer_notification_trigger
    AFTER INSERT ON offers
    FOR EACH ROW
    EXECUTE FUNCTION handle_offer_notification();