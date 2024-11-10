import React, { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface LikeListingButtonProps {
  listingId: string;
  isLiked: boolean;
  likesCount: number;
  onLike: () => void;
  size?: 'sm' | 'md';
}

export default function LikeListingButton({
  listingId,
  isLiked: initialIsLiked,
  likesCount: initialLikesCount,
  onLike,
  size = 'md'
}: LikeListingButtonProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLiked(initialIsLiked);
    setLikesCount(initialLikesCount);
  }, [initialIsLiked, initialLikesCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || isSubmitting) {
      if (!user) toast.error('Please sign in to like listings');
      return;
    }

    setIsSubmitting(true);

    try {
      if (isLiked) {
        // Optimistic update
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));

        const { error } = await supabase
          .from('listing_likes')
          .delete()
          .match({ listing_id: listingId, user_id: user.id });

        if (error) throw error;
      } else {
        // Optimistic update
        setIsLiked(true);
        setLikesCount(prev => prev + 1);

        const { error } = await supabase
          .from('listing_likes')
          .insert({ listing_id: listingId, user_id: user.id })
          .single();

        // Ignore unique constraint violations as they just mean the user already liked
        if (error && error.code !== '23505') throw error;
      }

      onLike();
    } catch (error: any) {
      // Revert optimistic updates on error
      setIsLiked(initialIsLiked);
      setLikesCount(initialLikesCount);
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    } finally {
      setIsSubmitting(false);
    }
  };

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';
  const spacing = size === 'sm' ? 'space-x-1' : 'space-x-2';

  return (
    <button
      onClick={handleLike}
      disabled={isSubmitting}
      className={`flex items-center ${spacing} transition ${
        isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
      }`}
    >
      <Heart className={`${iconSize} ${isLiked ? 'fill-current' : ''}`} />
      {likesCount > 0 && <span className={textSize}>{likesCount}</span>}
    </button>
  );
}