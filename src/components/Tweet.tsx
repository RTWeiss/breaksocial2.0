import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Repeat2 } from 'lucide-react';
import { TweetActions } from './TweetActions';
import HashtagText from './HashtagText';
import { useAuthStore } from '../store/authStore';
import { useFeedStore } from '../store/feedStore';
import UserAvatar from './UserAvatar';
import ImagePreview from './ImagePreview';

interface TweetProps {
  tweet: {
    id: string;
    content: string;
    image_url?: string | null;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    likes: { user_id: string }[];
    replies: any[];
    retweets: { user_id: string }[];
    retweeted_by?: {
      username: string;
      full_name: string | null;
      avatar_url: string | null;
    };
    is_retweet?: boolean;
    original_tweet_id?: string;
    retweet_id?: string;
  };
  showActions?: boolean;
  isNested?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export default function Tweet({ 
  tweet, 
  showActions = true, 
  isNested = false,
  className = '',
  size = 'md'
}: TweetProps) {
  const { user } = useAuthStore();
  const { fetchFeed } = useFeedStore();
  const navigate = useNavigate();

  // Initialize counts and interaction states
  const likesCount = Array.isArray(tweet.likes) ? tweet.likes.length : 0;
  const repliesCount = Array.isArray(tweet.replies) ? tweet.replies.length : 0;
  const retweetsCount = Array.isArray(tweet.retweets) ? tweet.retweets.length : 0;

  const likedByUser = user ? tweet.likes?.some(like => like.user_id === user.id) ?? false : false;
  const retweetedByUser = user ? tweet.retweets?.some(retweet => retweet.user_id === user.id) ?? false : false;

  const handleTweetClick = () => {
    if (!isNested) {
      navigate(`/tweet/${tweet.original_tweet_id || tweet.id}`);
    }
  };

  const handleInteraction = async () => {
    await fetchFeed();
  };

  const textSize = size === 'sm' ? 'text-sm' : 'text-base';

  return (
    <article 
      className={`border-b border-gray-800 hover:bg-gray-900/50 transition cursor-pointer p-4 ${className}`}
      onClick={handleTweetClick}
    >
      {tweet.is_retweet && tweet.retweeted_by && (
        <div className="flex items-center text-gray-500 text-sm mb-2 ml-12">
          <Repeat2 className="w-4 h-4 mr-2" />
          <Link 
            to={`/profile/${tweet.retweeted_by.username}`}
            onClick={(e) => e.stopPropagation()}
            className="hover:text-gray-300"
          >
            {tweet.retweeted_by.full_name || tweet.retweeted_by.username} reposted
          </Link>
        </div>
      )}

      <div className="flex space-x-3">
        <Link 
          to={`/profile/${tweet.user_id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0"
        >
          <UserAvatar
            userId={tweet.user_id}
            username={tweet.profiles.username}
            avatarUrl={tweet.profiles.avatar_url}
            size={size === 'sm' ? 'sm' : 'md'}
          />
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-1">
            <Link 
              to={`/profile/${tweet.user_id}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              <span className={`font-medium text-white ${textSize}`}>
                {tweet.profiles.full_name || tweet.profiles.username}
              </span>
            </Link>
            <span className={`text-gray-500 ${textSize}`}>@{tweet.profiles.username}</span>
            <span className={`text-gray-500 ${textSize}`}>·</span>
            <span className={`text-gray-500 ${textSize}`}>
              {formatDistanceToNow(new Date(tweet.created_at), { addSuffix: true })}
            </span>
          </div>
          
          <div className={`text-white mt-1 ${textSize}`}>
            <HashtagText text={tweet.content} />
          </div>

          {tweet.image_url && (
            <div className="mt-3 rounded-lg overflow-hidden">
              <ImagePreview
                src={tweet.image_url}
                alt="Tweet image"
                className="max-h-96 w-full"
                objectFit="cover"
              />
            </div>
          )}

          {showActions && (
            <TweetActions
              tweetId={tweet.original_tweet_id || tweet.id}
              repostId={tweet.retweet_id}
              likesCount={likesCount}
              repliesCount={repliesCount}
              retweetsCount={retweetsCount}
              likedByUser={likedByUser}
              retweetedByUser={retweetedByUser}
              onInteraction={handleInteraction}
              size={size}
            />
          )}
        </div>
      </div>
    </article>
  );
}