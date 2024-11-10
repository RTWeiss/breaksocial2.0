import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import toast from 'react-hot-toast';
import LikeButton from './LikeButton';
import MakeOfferModal from './MakeOfferModal';
import UserAvatar from './UserAvatar';

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price: number;
    condition: string;
    image_url: string;
    seller_id: string;
    profiles: {
      username: string;
      full_name: string;
      avatar_url: string;
    };
    listing_likes: { user_id: string }[];
  };
  isOwner?: boolean;
  onLike?: () => void;
  inFeed?: boolean;
}

export default function ListingCard({ listing, isOwner = false, onLike, inFeed = false }: ListingCardProps) {
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { toggleListingLike } = useFeedStore();
  const isLiked = listing.listing_likes?.some(like => like.user_id === user?.id) || false;
  const likesCount = listing.listing_likes?.length || 0;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to like listings');
      return;
    }

    if (inFeed) {
      await toggleListingLike(listing.id, user.id);
    } else {
      setIsSubmitting(true);

      try {
        if (isLiked) {
          const { error } = await supabase
            .from('listing_likes')
            .delete()
            .match({ listing_id: listing.id, user_id: user.id });

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('listing_likes')
            .insert({ listing_id: listing.id, user_id: user.id });

          if (error && error.code !== '23505') throw error;

          // Create notification for the seller
          if (listing.seller_id !== user.id) {
            await supabase.from('notifications').insert({
              user_id: listing.seller_id,
              type: 'like_listing',
              message: `Someone liked your listing "${listing.title}"`,
              data: {
                listing_id: listing.id,
                user_id: user.id
              }
            });
          }
        }

        if (onLike) {
          onLike();
        }
      } catch (error: any) {
        console.error('Error toggling like:', error);
        toast.error('Failed to update like');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleMessage = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.error('Please sign in to message the seller');
      return;
    }

    if (user.id === listing.seller_id) {
      toast.error('You cannot message yourself');
      return;
    }

    try {
      setIsSubmitting(true);
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: listing.seller_id,
          content: `Hi! I'm interested in your listing: "${listing.title}"`,
          listing_id: listing.id
        });

      if (messageError) throw messageError;

      // Create notification for the seller
      await supabase.from('notifications').insert({
        user_id: listing.seller_id,
        type: 'new_message',
        message: `Someone sent you a message about "${listing.title}"`,
        data: {
          listing_id: listing.id,
          user_id: user.id
        }
      });

      toast.success('Message sent!');
      navigate('/messages');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Only navigate if not clicking on a button or modal
    if (
      !(e.target as HTMLElement).closest('button') &&
      !(e.target as HTMLElement).closest('.modal')
    ) {
      navigate(`/marketplace/${listing.id}`);
    }
  };

  return (
    <>
      <article 
        className="bg-gray-900 rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="aspect-w-16 aspect-h-9 bg-gray-800">
          {listing.image_url ? (
            <img
              src={listing.image_url}
              alt={listing.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
              <span className="text-white text-lg font-bold">{listing.title[0]}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center space-x-2 mb-2">
            <UserAvatar
              userId={listing.seller_id}
              username={listing.profiles.username}
              avatarUrl={listing.profiles.avatar_url}
              size="sm"
            />
            <span className="text-gray-300 text-sm">
              {listing.profiles.full_name || listing.profiles.username}
            </span>
          </div>

          <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{listing.title}</h3>
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">{listing.description}</p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-green-500 font-bold">${listing.price}</span>
            <span className="text-sm text-gray-400 capitalize">{listing.condition.replace('_', ' ')}</span>
          </div>

          {!isOwner && (
            <div className="flex space-x-2">
              <LikeButton
                isLiked={isLiked}
                likesCount={likesCount}
                onClick={handleLike}
                size="sm"
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOfferModalOpen(true);
                }}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">Offer</span>
              </button>
              <button
                onClick={handleMessage}
                className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="text-sm">Message</span>
              </button>
            </div>
          )}
        </div>
      </article>

      {isOfferModalOpen && (
        <MakeOfferModal
          listing={listing}
          onClose={() => setIsOfferModalOpen(false)}
        />
      )}
    </>
  );
}