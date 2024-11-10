import React from 'react';
import { Heart } from 'lucide-react';

interface LikeButtonProps {
  isLiked: boolean;
  likesCount: number;
  onClick: (e: React.MouseEvent) => void;
  size?: 'sm' | 'md';
}

export default function LikeButton({
  isLiked,
  likesCount,
  onClick,
  size = 'md'
}: LikeButtonProps) {
  const iconSize = size === 'sm' ? 'w-4 h-4' : 'w-5 h-5';
  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
        isLiked
          ? 'bg-red-500/10 text-red-500'
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
      }`}
    >
      <Heart className={`${iconSize} ${isLiked ? 'fill-current' : ''}`} />
      <span className={textSize}>{likesCount}</span>
    </button>
  );
}