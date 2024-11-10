-- First, drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create replies" ON public.replies;
DROP POLICY IF EXISTS "Users can update their own replies" ON public.replies;
DROP POLICY IF EXISTS "Users can delete their own replies" ON public.replies;
DROP POLICY IF EXISTS "Anyone can read replies" ON public.replies;

-- Ensure replies table has the correct structure
ALTER TABLE public.replies 
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES public.replies(id),
ADD COLUMN IF NOT EXISTS is_nested BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_replies_parent_id ON public.replies(parent_reply_id);
CREATE INDEX IF NOT EXISTS idx_replies_tweet_id ON public.replies(tweet_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_created_at ON public.replies(created_at DESC);

-- Recreate policies
CREATE POLICY "Anyone can read replies"
ON public.replies FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can create replies"
ON public.replies FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
ON public.replies FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
ON public.replies FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to get nested replies count
CREATE OR REPLACE FUNCTION get_nested_replies_count(reply_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.replies
        WHERE parent_reply_id = reply_id
    );
END;
$$ LANGUAGE plpgsql;