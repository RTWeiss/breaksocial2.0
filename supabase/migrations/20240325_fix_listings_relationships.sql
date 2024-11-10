-- Drop existing foreign key if it exists
ALTER TABLE IF EXISTS public.listings 
DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;

-- Add the correct foreign key relationship
ALTER TABLE public.listings
ADD CONSTRAINT listings_seller_id_fkey 
FOREIGN KEY (seller_id) 
REFERENCES auth.users(id) 
ON DELETE CASCADE;

-- Create index for the foreign key
CREATE INDEX IF NOT EXISTS idx_listings_seller_id 
ON public.listings(seller_id);