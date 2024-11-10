-- Create a view for notifications with user details
CREATE OR REPLACE VIEW public.notifications_with_details AS
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