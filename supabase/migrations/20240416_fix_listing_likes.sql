-- Drop existing listing_likes table
DROP TABLE IF EXISTS public.listing_likes CASCADE;

-- Create listing_likes table with proper constraints
CREATE TABLE public.listing_likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT listing_likes_unique_constraint UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.listing_likes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Listing likes are viewable by everyone"
ON public.listing_likes FOR SELECT
USING (true);

CREATE POLICY "Users can create listing likes"
ON public.listing_likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listing likes"
ON public.listing_likes FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_listing_likes_listing_id ON public.listing_likes(listing_id);
CREATE INDEX idx_listing_likes_user_id ON public.listing_likes(user_id);