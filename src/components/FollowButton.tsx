import React from 'react';
import { UserPlus, UserMinus } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onFollowChange: (following: boolean) => void;
}

export default function FollowButton({ userId, isFollowing, onFollowChange }: FollowButtonProps) {
  const { user } = useAuthStore();

  const handleFollow = async () => {
    if (!user) {
      toast.error('Please sign in to follow users');
      return;
    }

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) throw error;

        // Create notification
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'follow',
            message: `${user.user_metadata.full_name || user.email} started following you`,
            sender_id: user.id
          });
      }

      onFollowChange(!isFollowing);
      toast.success(isFollowing ? 'Unfollowed successfully' : 'Following successfully');
    } catch (error) {
      console.error('Error toggling follow:', error);
      toast.error('Failed to update follow status');
    }
  };

  if (user?.id === userId) return null;

  return (
    <button
      onClick={handleFollow}
      className={`px-4 py-2 rounded-full font-bold flex items-center space-x-2 ${
        isFollowing
          ? 'bg-gray-800 text-white hover:bg-red-600'
          : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          <span>Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}