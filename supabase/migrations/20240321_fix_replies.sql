-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.reply_likes CASCADE;
DROP TABLE IF EXISTS public.replies CASCADE;

-- Create replies table
CREATE TABLE public.replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create reply_likes table
CREATE TABLE public.reply_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reply_id UUID REFERENCES public.replies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(reply_id, user_id)
);

-- Enable RLS
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reply_likes ENABLE ROW LEVEL SECURITY;

-- Create policies for replies
CREATE POLICY "Replies are viewable by everyone"
    ON public.replies FOR SELECT
    USING (true);

CREATE POLICY "Users can create replies"
    ON public.replies FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own replies"
    ON public.replies FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
    ON public.replies FOR DELETE
    USING (auth.uid() = user_id);

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

-- Create indexes
CREATE INDEX idx_replies_tweet_id ON public.replies(tweet_id);
CREATE INDEX idx_replies_user_id ON public.replies(user_id);
CREATE INDEX idx_reply_likes_reply_id ON public.reply_likes(reply_id);
CREATE INDEX idx_reply_likes_user_id ON public.reply_likes(user_id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.replies
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();