-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create conditions table for standardizing item conditions
CREATE TABLE IF NOT EXISTS public.conditions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    rank INTEGER NOT NULL -- For ordering (e.g., Mint = 1, Near Mint = 2, etc.)
);

-- Create grading_companies table
CREATE TABLE IF NOT EXISTS public.grading_companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    abbreviation TEXT NOT NULL UNIQUE,
    website TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create listings table
CREATE TABLE IF NOT EXISTS public.listings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id),
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    condition_id UUID REFERENCES public.conditions(id),
    grading_company_id UUID REFERENCES public.grading_companies(id),
    grade TEXT, -- The actual grade (e.g., "PSA 10", "CGC 9.8")
    year INTEGER, -- Year of the item
    manufacturer TEXT, -- Company that made the item
    card_number TEXT, -- For trading cards (e.g., "1/99")
    series TEXT, -- For comics or card sets
    edition TEXT, -- First edition, unlimited, etc.
    images TEXT[], -- Array of image URLs
    status TEXT NOT NULL DEFAULT 'active', -- active, sold, cancelled
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sold_at TIMESTAMP WITH TIME ZONE,
    sold_price DECIMAL(12,2),
    views INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT false,
    CONSTRAINT valid_status CHECK (status IN ('active', 'sold', 'cancelled')),
    CONSTRAINT positive_price CHECK (price > 0)
);

-- Create saved_listings table (for watchlist/favorites)
CREATE TABLE IF NOT EXISTS public.saved_listings (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, listing_id)
);

-- Create offers table
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
    buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT valid_offer_status CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    CONSTRAINT positive_offer CHECK (amount > 0)
);

-- Insert default categories
INSERT INTO public.categories (name, slug, description) VALUES
    ('Sports Cards', 'sports-cards', 'Baseball, basketball, football, and other sports trading cards'),
    ('Trading Cards', 'trading-cards', 'Pokemon, Magic: The Gathering, Yu-Gi-Oh!, and other collectible card games'),
    ('Comics', 'comics', 'Comic books, graphic novels, and manga'),
    ('Action Figures', 'action-figures', 'Collectible action figures and statues'),
    ('Memorabilia', 'memorabilia', 'Sports and entertainment memorabilia'),
    ('Vintage', 'vintage', 'Vintage collectibles and antiques')
ON CONFLICT (name) DO NOTHING;

-- Insert default conditions
INSERT INTO public.conditions (name, description, rank) VALUES
    ('Mint', 'Perfect condition with no visible flaws', 1),
    ('Near Mint', 'Almost perfect with minimal wear', 2),
    ('Excellent', 'Minor wear but still in great condition', 3),
    ('Very Good', 'Shows some wear but still presentable', 4),
    ('Good', 'Shows significant wear but still intact', 5),
    ('Fair', 'Heavy wear and may have damage', 6),
    ('Poor', 'Significant damage or deterioration', 7)
ON CONFLICT (name) DO NOTHING;

-- Insert major grading companies
INSERT INTO public.grading_companies (name, abbreviation, website) VALUES
    ('Professional Sports Authenticator', 'PSA', 'https://www.psacard.com'),
    ('Beckett Grading Services', 'BGS', 'https://www.beckett.com/grading'),
    ('CGC Comics', 'CGC', 'https://www.cgccomics.com'),
    ('Certified Guaranty Company', 'CGC', 'https://www.cgccomics.com'),
    ('Sportscard Guaranty Corporation', 'SGC', 'https://www.gosgc.com')
ON CONFLICT (abbreviation) DO NOTHING;

-- Set up RLS policies
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Listings policies
CREATE POLICY "Anyone can view active listings"
    ON public.listings FOR SELECT
    USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Users can create listings"
    ON public.listings FOR INSERT
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
    ON public.listings FOR UPDATE
    USING (auth.uid() = seller_id);

-- Saved listings policies
CREATE POLICY "Users can view their saved listings"
    ON public.saved_listings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can save listings"
    ON public.saved_listings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their saved listings"
    ON public.saved_listings FOR DELETE
    USING (auth.uid() = user_id);

-- Offers policies
CREATE POLICY "Users can view offers on their listings"
    ON public.offers FOR SELECT
    USING (
        auth.uid() IN (
            SELECT seller_id FROM public.listings WHERE id = listing_id
        )
        OR auth.uid() = buyer_id
    );

CREATE POLICY "Users can make offers"
    ON public.offers FOR INSERT
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own offers"
    ON public.offers FOR UPDATE
    USING (auth.uid() = buyer_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_category ON public.listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON public.listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON public.listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_price ON public.listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_offers_listing ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_saved_listings_user ON public.saved_listings(user_id);

-- Update function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER handle_listings_updated_at
    BEFORE UPDATE ON public.listings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_offers_updated_at
    BEFORE UPDATE ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();