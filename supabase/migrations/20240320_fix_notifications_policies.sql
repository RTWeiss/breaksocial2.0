-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;

-- Ensure notifications table has correct structure
ALTER TABLE public.notifications 
DROP COLUMN IF EXISTS related_user_id CASCADE,
ADD COLUMN IF NOT EXISTS related_profile_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS link TEXT,
ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT FALSE;

-- Recreate policies
CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Recreate notifications view
DROP VIEW IF EXISTS public.notifications_with_details;
CREATE VIEW public.notifications_with_details AS
SELECT 
    n.id,
    n.created_at,
    n.user_id,
    n.type,
    n.content,
    n.related_profile_id,
    n.link,
    n.is_read,
    p.username as related_username,
    p.avatar_url as related_avatar_url,
    p.full_name as related_full_name
FROM 
    public.notifications n
    LEFT JOIN public.profiles p ON p.id = n.related_profile_id;

-- Grant access to the view
GRANT SELECT ON public.notifications_with_details TO authenticated;