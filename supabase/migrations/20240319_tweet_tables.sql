-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tweets table first
CREATE TABLE IF NOT EXISTS public.tweets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Create retweets table
CREATE TABLE IF NOT EXISTS public.retweets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, tweet_id)
);

-- Create replies table
CREATE TABLE IF NOT EXISTS public.replies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    tweet_id UUID REFERENCES public.tweets(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retweets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Tweets are viewable by everyone" ON public.tweets;
DROP POLICY IF EXISTS "Users can create tweets" ON public.tweets;
DROP POLICY IF EXISTS "Users can update their tweets" ON public.tweets;
DROP POLICY IF EXISTS "Users can delete their tweets" ON public.tweets;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can create likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their likes" ON public.likes;
DROP POLICY IF EXISTS "Retweets are viewable by everyone" ON public.retweets;
DROP POLICY IF EXISTS "Users can create retweets" ON public.retweets;
DROP POLICY IF EXISTS "Users can delete their retweets" ON public.retweets;
DROP POLICY IF EXISTS "Replies are viewable by everyone" ON public.replies;
DROP POLICY IF EXISTS "Users can create replies" ON public.replies;
DROP POLICY IF EXISTS "Users can update their replies" ON public.replies;
DROP POLICY IF EXISTS "Users can delete their replies" ON public.replies;

-- Create RLS policies
CREATE POLICY "Tweets are viewable by everyone" ON public.tweets
    FOR SELECT USING (true);

CREATE POLICY "Users can create tweets" ON public.tweets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their tweets" ON public.tweets
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their tweets" ON public.tweets
    FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can create likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Retweets policies
CREATE POLICY "Retweets are viewable by everyone" ON public.retweets
    FOR SELECT USING (true);

CREATE POLICY "Users can create retweets" ON public.retweets
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their retweets" ON public.retweets
    FOR DELETE USING (auth.uid() = user_id);

-- Replies policies
CREATE POLICY "Replies are viewable by everyone" ON public.replies
    FOR SELECT USING (true);

CREATE POLICY "Users can create replies" ON public.replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their replies" ON public.replies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their replies" ON public.replies
    FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tweets_user_id ON public.tweets(user_id);
CREATE INDEX IF NOT EXISTS idx_tweets_created_at ON public.tweets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_tweet_id ON public.likes(tweet_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON public.likes(user_id);
CREATE INDEX IF NOT EXISTS idx_retweets_tweet_id ON public.retweets(tweet_id);
CREATE INDEX IF NOT EXISTS idx_retweets_user_id ON public.retweets(user_id);
CREATE INDEX IF NOT EXISTS idx_replies_tweet_id ON public.replies(tweet_id);
CREATE INDEX IF NOT EXISTS idx_replies_user_id ON public.replies(user_id);