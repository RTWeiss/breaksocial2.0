-- Drop existing messages table if it exists
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create messages table with proper relationships
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ,
    listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
    CONSTRAINT messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- Add foreign key references to profiles
ALTER TABLE public.messages
ADD CONSTRAINT fk_messages_sender
FOREIGN KEY (sender_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

ALTER TABLE public.messages
ADD CONSTRAINT fk_messages_receiver
FOREIGN KEY (receiver_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own messages"
ON public.messages FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own sent messages"
ON public.messages FOR UPDATE
USING (auth.uid() = sender_id);

-- Create indexes
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX idx_messages_listing_id ON public.messages(listing_id);