-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view offers they made or received" ON public.offers;
DROP POLICY IF EXISTS "Users can create offers" ON public.offers;
DROP POLICY IF EXISTS "Users can update their own offers" ON public.offers;

-- Create offers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE NOT NULL,
    buyer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view offers they made or received" ON public.offers
    FOR SELECT USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (
            SELECT seller_id FROM public.listings WHERE id = listing_id
        )
    );

CREATE POLICY "Users can create offers" ON public.offers
    FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can update their own offers" ON public.offers
    FOR UPDATE USING (
        auth.uid() = buyer_id OR 
        auth.uid() IN (
            SELECT seller_id FROM public.listings WHERE id = listing_id
        )
    );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON public.offers(listing_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer_id ON public.offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);