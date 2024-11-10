-- Drop existing notifications view and table
DROP VIEW IF EXISTS notifications_with_details CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;

-- Recreate notifications table with proper structure
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    read BOOLEAN DEFAULT FALSE
);

-- Create view for notifications with user details
CREATE VIEW notifications_with_details AS
SELECT 
    n.*,
    sender_profile.username as sender_username,
    sender_profile.full_name as sender_full_name,
    sender_profile.avatar_url as sender_avatar_url,
    l.title as listing_title,
    l.price as listing_price,
    o.amount as offer_amount
FROM notifications n
LEFT JOIN profiles sender_profile ON n.sender_id = sender_profile.id
LEFT JOIN listings l ON n.listing_id = l.id
LEFT JOIN offers o ON n.offer_id = o.id;

-- Set up RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
ON notifications FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);