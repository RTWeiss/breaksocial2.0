-- Drop dependent views first
DROP VIEW IF EXISTS public.notifications_with_details;

-- Drop existing notifications table
DROP TABLE IF EXISTS public.notifications CASCADE;

-- Create notifications table with correct structure
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  type VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  listing_id UUID REFERENCES listings(id),
  offer_id UUID REFERENCES offers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create view for notifications with user details
CREATE OR REPLACE VIEW public.notifications_with_details AS
SELECT 
  n.*,
  p.username as sender_username,
  p.full_name as sender_full_name,
  p.avatar_url as sender_avatar_url
FROM notifications n
LEFT JOIN profiles p ON n.sender_id = p.id;

-- Grant access to the view
GRANT SELECT ON public.notifications_with_details TO authenticated;