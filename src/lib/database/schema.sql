-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.offers CASCADE;
DROP TABLE IF EXISTS public.listings CASCADE;

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create listings table with proper structure
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
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

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Listings policies
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

-- Offers policies
CREATE POLICY "Users can view offers they made or received"
ON public.offers FOR SELECT
USING (
    auth.uid() = buyer_id OR 
    auth.uid() IN (
        SELECT seller_id FROM public.listings WHERE id = listing_id
    )
);

CREATE POLICY "Users can create offers"
ON public.offers FOR INSERT
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own offers"
ON public.offers FOR UPDATE
USING (
    auth.uid() = buyer_id OR 
    auth.uid() IN (
        SELECT seller_id FROM public.listings WHERE id = listing_id
    )
);

-- Create indexes
CREATE INDEX idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX idx_listings_status ON public.listings(status);
CREATE INDEX idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX idx_listings_price ON public.listings(price);
CREATE INDEX idx_offers_listing_id ON public.offers(listing_id);
CREATE INDEX idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX idx_offers_status ON public.offers(status);