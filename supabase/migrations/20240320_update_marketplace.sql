-- Update notifications for marketplace
ALTER TABLE public.notifications DROP COLUMN IF EXISTS related_user_id;

-- Ensure notifications table has the correct columns
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS related_profile_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS link TEXT;

-- Create or update RLS policies for notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create notifications" ON public.notifications;
CREATE POLICY "Users can create notifications" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create function for handling conversations
CREATE OR REPLACE FUNCTION create_or_get_conversation(
  other_user_id UUID,
  initial_message TEXT
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conversation_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Get or create conversation
  INSERT INTO conversations (participant1_id, participant2_id)
  SELECT current_user_id, other_user_id
  WHERE NOT EXISTS (
    SELECT 1 FROM conversations 
    WHERE (participant1_id = current_user_id AND participant2_id = other_user_id)
    OR (participant1_id = other_user_id AND participant2_id = current_user_id)
  )
  RETURNING id INTO conversation_id;
  
  IF conversation_id IS NULL THEN
    SELECT id INTO conversation_id
    FROM conversations
    WHERE (participant1_id = current_user_id AND participant2_id = other_user_id)
    OR (participant1_id = other_user_id AND participant2_id = current_user_id);
  END IF;
  
  -- Insert initial message
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (conversation_id, current_user_id, initial_message);
END;
$$;