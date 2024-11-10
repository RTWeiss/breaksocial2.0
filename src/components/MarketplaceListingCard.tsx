import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    image_url: string;
    seller_id: string;
    seller: {
      username: string;
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function MarketplaceListingCard({ listing }: ListingCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleMakeOffer = async () => {
    if (!user) {
      toast.error('Please sign in to make an offer');
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the offer
      const { data: offer, error: offerError } = await supabase
        .from('offers')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          seller_id: listing.seller_id,
          amount: listing.price,
          status: 'pending'
        })
        .select()
        .single();

      if (offerError) throw offerError;

      // Create notification for the seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: listing.seller_id,
          type: 'new_offer',
          message: `New offer received for ${listing.title}`,
          sender_id: user.id,
          listing_id: listing.id,
          offer_id: offer.id
        });

      if (notificationError) throw notificationError;

      // Start a conversation
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: listing.seller_id,
          content: `Hi! I'm interested in your listing: ${listing.title}`,
          listing_id: listing.id
        });

      if (messageError) throw messageError;

      toast.success('Offer sent successfully!');
      navigate('/messages');
    } catch (error: any) {
      toast.error('Error making offer: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: listing.seller_id,
          content: `Hi! I'm interested in your listing: ${listing.title}`,
          listing_id: listing.id
        });

      if (messageError) throw messageError;

      // Create notification for the seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: listing.seller_id,
          type: 'new_message',
          message: `New message about ${listing.title}`,
          sender_id: user.id,
          listing_id: listing.id
        });

      if (notificationError) throw notificationError;

      toast.success('Message sent!');
      navigate('/messages');
    } catch (error: any) {
      toast.error('Error sending message: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
      <img
        src={listing.image_url}
        alt={listing.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {listing.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {listing.description}
        </p>
        <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-white">
            ${listing.price}
          </span>
          <span className="mx-2">•</span>
          <span>{listing.condition}</span>
        </div>
        <div className="mt-4 flex items-center space-x-2">
          <img
            src={listing.seller.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${listing.seller.username}`}
            alt={listing.seller.username}
            className="h-6 w-6 rounded-full"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {listing.seller.full_name || listing.seller.username}
          </span>
        </div>
        <div className="mt-4 flex space-x-2">
          <button
            onClick={handleMakeOffer}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Make Offer
          </button>
          <button
            onClick={handleMessage}
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center px-4 py-2 border border-purple-600 text-sm font-medium rounded-md text-purple-600 bg-transparent hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50"
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Message
          </button>
        </div>
      </div>
    </div>
  );
}