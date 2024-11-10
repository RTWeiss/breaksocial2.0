import React, { useState } from 'react';
import { MessageCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface MarketplaceActionsProps {
  listingId: string;
  sellerId: string;
  price: number;
}

export default function MarketplaceActions({ listingId, sellerId, price }: MarketplaceActionsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleMakeOffer = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Create the offer
      const { error: offerError } = await supabase
        .from('offers')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          amount: price,
          status: 'pending'
        });

      if (offerError) throw offerError;

      // Create notification for the seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'offer',
          content: 'made an offer on your listing',
          related_profile_id: user.id,
          link: `/marketplace/listing/${listingId}`
        });

      if (notificationError) throw notificationError;

      // Create a message thread if it doesn't exist
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: sellerId,
          content: `I'm interested in your listing! I've made an offer of $${price}.`,
          listing_id: listingId
        });

      if (messageError) throw messageError;

      alert('Offer sent successfully!');
    } catch (error) {
      console.error('Error making offer:', error);
      alert('Failed to send offer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessageSeller = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // Create a message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: sellerId,
          content: "Hi! I'm interested in your listing.",
          listing_id: listingId
        });

      if (messageError) throw messageError;

      // Create notification for the seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: sellerId,
          type: 'message',
          content: 'sent you a message about your listing',
          related_profile_id: user.id,
          link: `/messages`
        });

      if (notificationError) throw notificationError;

      alert('Message sent successfully!');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={handleMakeOffer}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white disabled:opacity-50"
      >
        <DollarSign className="w-4 h-4" />
        Make Offer
      </button>
      <button
        onClick={handleMessageSeller}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white disabled:opacity-50"
      >
        <MessageCircle className="w-4 h-4" />
        Message Seller
      </button>
    </div>
  );
}