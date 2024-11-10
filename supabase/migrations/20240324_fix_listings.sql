-- Drop existing listings table
DROP TABLE IF EXISTS public.listings CASCADE;

-- Create listings table with correct fields
CREATE TABLE public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    condition TEXT NOT NULL CHECK (condition IN ('mint', 'near_mint', 'excellent', 'good', 'fair')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'deleted')),
    image_url TEXT,
    hashtags TEXT[] DEFAULT ARRAY[]::TEXT[],
    views INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Listings are viewable by everyone"
ON public.listings FOR SELECT
USING (true);

CREATE POLICY "Users can create listings"
ON public.listings FOR INSERT
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can update their own listings"
ON public.listings FOR UPDATE
USING (auth.uid() = seller_id);

CREATE POLICY "Users can delete their own listings"
ON public.listings FOR DELETE
USING (auth.uid() = seller_id);

-- Create indexes
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listings_price ON public.listings(price);