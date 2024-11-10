-- Create likes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Create retweets table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.retweets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Create replies table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Users can create their own likes"
ON public.likes FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.likes FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone"
ON public.likes FOR SELECT TO authenticated
USING (true);

-- Retweets policies
CREATE POLICY "Users can create their own retweets"
ON public.retweets FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retweets"
ON public.retweets FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Retweets are viewable by everyone"
ON public.retweets FOR SELECT TO authenticated
USING (true);

-- Replies policies
CREATE POLICY "Users can create their own replies"
ON public.replies FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own replies"
ON public.replies FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Replies are viewable by everyone"
ON public.replies FOR SELECT TO authenticated
USING (true);

-- Grant necessary permissions
GRANT ALL ON public.likes TO authenticated;
GRANT ALL ON public.retweets TO authenticated;
GRANT ALL ON public.replies TO authenticated;