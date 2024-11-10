import React from 'react';
import { MessageCircle, DollarSign } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ListingActionsProps {
  listingId: string;
  sellerId: string;
  title: string;
  className?: string;
  size?: 'sm' | 'lg';
  onOfferClick?: () => void;
}

export default function ListingActions({ 
  listingId, 
  sellerId, 
  title,
  className = '',
  size = 'lg',
  onOfferClick
}: ListingActionsProps) {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleMessage = async () => {
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }

    try {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: sellerId,
          content: `Hi! I'm interested in your listing: "${title}"`,
        });

      if (messageError) throw messageError;

      toast.success('Message sent!');
      navigate('/messages');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const buttonClasses = {
    sm: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconClasses = {
    sm: 'w-4 h-4',
    lg: 'w-5 h-5'
  };

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={onOfferClick}
        className={`flex-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center justify-center space-x-2 ${buttonClasses[size]}`}
      >
        <DollarSign className={iconClasses[size]} />
        <span>Make Offer</span>
      </button>
      <button
        onClick={handleMessage}
        className={`flex-1 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition flex items-center justify-center space-x-2 ${buttonClasses[size]}`}
      >
        <MessageCircle className={iconClasses[size]} />
        <span>Message</span>
      </button>
    </div>
  );
}