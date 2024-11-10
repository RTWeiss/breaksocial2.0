import React from 'react';
import { Heart, MessageCircle, Repeat2, Share } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import toast from 'react-hot-toast';

interface TweetActionsProps {
  tweetId: string;
  likesCount: number;
  repliesCount: number;
  retweetsCount: number;
  likedByUser: boolean;
  retweetedByUser: boolean;
  onInteraction?: () => void;
  className?: string;
  size?: 'sm' | 'md';
  repostId?: string;
}

export function TweetActions({
  tweetId,
  likesCount,
  repliesCount,
  retweetsCount,
  likedByUser,
  retweetedByUser,
  onInteraction,
  className = '',
  size = 'md',
  repostId
}: TweetActionsProps) {
  const { user } = useAuthStore();
  const { toggleTweetLike, toggleRetweet } = useFeedStore();
  const navigate = useNavigate();

  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';
  const spacing = size === 'sm' ? 'space-x-1' : 'space-x-2';

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to like posts');
      return;
    }

    try {
      await toggleTweetLike(tweetId, user.id);
      if (onInteraction) onInteraction();
    } catch (error) {
      toast.error('Failed to like post');
    }
  };

  const handleRetweet = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to repost');
      return;
    }

    try {
      await toggleRetweet(tweetId, user.id, repostId);
      if (onInteraction) onInteraction();
    } catch (error) {
      toast.error('Failed to repost');
    }
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tweet/${tweetId}`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: 'Share Post',
        url: `${window.location.origin}/tweet/${tweetId}`
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className={`flex justify-between mt-4 text-gray-500 ${className}`}>
      <button 
        onClick={handleComment}
        className={`flex items-center ${spacing} hover:text-blue-500 transition`}
      >
        <MessageCircle className={iconSize} />
        {repliesCount > 0 && <span className={textSize}>{repliesCount}</span>}
      </button>

      <button 
        onClick={handleRetweet}
        className={`flex items-center ${spacing} transition ${
          retweetedByUser ? 'text-green-500' : 'hover:text-green-500'
        }`}
      >
        <Repeat2 className={`${iconSize} ${retweetedByUser ? 'fill-current' : ''}`} />
        {retweetsCount > 0 && <span className={textSize}>{retweetsCount}</span>}
      </button>

      <button 
        onClick={handleLike}
        className={`flex items-center ${spacing} transition ${
          likedByUser ? 'text-red-500' : 'hover:text-red-500'
        }`}
      >
        <Heart className={`${iconSize} ${likedByUser ? 'fill-current' : ''}`} />
        {likesCount > 0 && <span className={textSize}>{likesCount}</span>}
      </button>

      <button 
        onClick={handleShare}
        className={`flex items-center ${spacing} hover:text-blue-500 transition`}
      >
        <Share className={iconSize} />
      </button>
    </div>
  );
}