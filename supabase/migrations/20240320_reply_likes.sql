-- Create reply_likes table
CREATE TABLE IF NOT EXISTS public.reply_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(user_id, reply_id)
);

-- Enable RLS
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for reply_likes
CREATE POLICY "Reply likes are viewable by everyone"
    ON public.reply_likes FOR SELECT
    USING (true);

CREATE POLICY "Users can create reply likes"
    ON public.reply_likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reply likes"
    ON public.reply_likes FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reply_likes_reply_id ON public.reply_likes(reply_id);
CREATE INDEX IF NOT EXISTS idx_reply_likes_user_id ON public.reply_likes(user_id);

-- Add nested replies support to replies table
ALTER TABLE public.replies 
ADD COLUMN IF NOT EXISTS parent_reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_nested BOOLEAN DEFAULT FALSE;