import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface TweetHeaderProps {
  fullName: string;
  username: string;
  avatarUrl: string;
  createdAt: string;
}

export const TweetHeader: React.FC<TweetHeaderProps> = ({
  fullName,
  username,
  avatarUrl,
  createdAt,
}) => {
  const formattedDate = React.useMemo(() => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  }, [createdAt]);

  return (
    <div className="flex items-center space-x-3">
      <img
        src={avatarUrl}
        alt={`${username}'s avatar`}
        className="w-10 h-10 rounded-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://via.placeholder.com/40?text=?';
        }}
      />
      <div>
        <h2 className="font-semibold text-white">{fullName}</h2>
        <div className="flex items-center space-x-1 text-gray-500">
          <span>@{username}</span>
          {formattedDate && (
            <>
              <span>·</span>
              <span>{formattedDate}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};