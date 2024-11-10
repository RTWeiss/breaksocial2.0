import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, MessageCircle, Share2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface MarketplaceListingProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    image_url: string;
    seller_id: string;
    created_at: string;
    profiles: {
      username: string;
      full_name: string;
      avatar_url: string;
    };
  };
}

export default function MarketplaceListing({ listing }: MarketplaceListingProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerAmount, setOfferAmount] = useState(listing.price.toString());
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleMakeOffer = async () => {
    try {
      if (!user) {
        toast.error('Please sign in to make an offer');
        return;
      }

      const amount = parseFloat(offerAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid offer amount');
        return;
      }

      const { error: offerError } = await supabase
        .from('offers')
        .insert({
          listing_id: listing.id,
          buyer_id: user.id,
          amount: amount,
          status: 'pending'
        });

      if (offerError) throw offerError;

      toast.success('Offer sent successfully!');
      setIsOfferModalOpen(false);
      
      // Create message thread
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: listing.seller_id,
          content: `Hi! I'm interested in your listing: ${listing.title}. I've made an offer of $${amount}.`
        });

      if (messageError) throw messageError;

    } catch (error) {
      console.error('Error making offer:', error);
      toast.error('Failed to send offer');
    }
  };

  const handleMessageSeller = () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }
    navigate('/messages', { state: { recipientId: listing.seller_id } });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: listing.title,
        text: `Check out this listing on Break: ${listing.title}`,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-lg">
      {listing.image_url && (
        <img
          src={listing.image_url}
          alt={listing.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-4">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
            {listing.profiles?.full_name?.[0]?.toUpperCase() || 'B'}
          </div>
          <div>
            <p className="font-semibold">{listing.profiles?.full_name}</p>
            <p className="text-sm text-gray-400">@{listing.profiles?.username}</p>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold mb-2">{listing.title}</h3>
        <p className="text-gray-400 mb-3">{listing.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-xl font-bold">${listing.price}</span>
          <span className="text-sm text-gray-400">Condition: {listing.condition}</span>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={() => setIsOfferModalOpen(true)}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Make Offer</span>
          </button>
          <button
            onClick={handleMessageSeller}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button
            onClick={handleShare}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isOfferModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Make an Offer</h3>
            <input
              type="number"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4"
              placeholder="Enter amount"
              min="0"
              step="0.01"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleMakeOffer}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg"
              >
                Send Offer
              </button>
              <button
                onClick={() => setIsOfferModalOpen(false)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}