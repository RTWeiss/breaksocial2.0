-- Ensure tweets table exists with proper structure
CREATE TABLE IF NOT EXISTS public.tweets (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tweets' 
        AND policyname = 'Tweets are viewable by everyone'
    ) THEN
        CREATE POLICY "Tweets are viewable by everyone" 
        ON public.tweets FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tweets' 
        AND policyname = 'Users can create their own tweets'
    ) THEN
        CREATE POLICY "Users can create their own tweets" 
        ON public.tweets FOR INSERT 
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'tweets' 
        AND policyname = 'Users can delete their own tweets'
    ) THEN
        CREATE POLICY "Users can delete their own tweets" 
        ON public.tweets FOR DELETE 
        USING (auth.uid() = user_id);
    END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.tweets ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON public.tweets TO authenticated;