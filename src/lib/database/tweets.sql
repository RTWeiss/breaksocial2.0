-- Create tweets table
CREATE TABLE IF NOT EXISTS public.tweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Create replies table
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create retweets table
CREATE TABLE IF NOT EXISTS public.retweets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;

-- Tweets policies
CREATE POLICY "Anyone can view tweets"
    ON public.tweets FOR SELECT
    USING (true);

CREATE POLICY "Users can create tweets"
    ON public.tweets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tweets"
    ON public.tweets FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tweets"
    ON public.tweets FOR DELETE
    USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes"
    ON public.likes FOR SELECT
    USING (true);

CREATE POLICY "Users can like tweets"
    ON public.likes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike tweets"
    ON public.likes FOR DELETE
    USING (auth.uid() = user_id);

-- Replies policies
CREATE POLICY "Anyone can view replies"
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

-- Retweets policies
CREATE POLICY "Anyone can view retweets"
    ON public.retweets FOR SELECT
    USING (true);

CREATE POLICY "Users can retweet"
    ON public.retweets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unretweet"
    ON public.retweets FOR DELETE
    USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON public.tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON public.tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_tweet_id ON public.likes(tweet_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_tweet_id ON public.replies(tweet_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);
CREATE INDEX IF NOT EXISTS idx_retweets_tweet_id ON public.retweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_retweets_user_id ON public.retweets(user_id);