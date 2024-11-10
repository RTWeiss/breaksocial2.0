import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import { MessageCircle, Heart, Share } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import UserAvatar from './UserAvatar';

interface ReplyProps {
  reply: {
    id: string;
    content: string;
    created_at: string;
    user_id: string;
    tweet_id: string;
    parent_reply_id: string | null;
    is_nested: boolean;
    profiles: {
      full_name: string | null;
      username: string;
      avatar_url: string | null;
    };
  };
  tweetId: string;
  onReplyPosted?: () => void;
}

export default function Reply({ reply, tweetId, onReplyPosted }: ReplyProps) {
  const { user } = useAuthStore();
  const [isLiked, setIsLiked] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [likesCount, setLikesCount] = useState(0);
  const [repliesCount, setRepliesCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    try {
      if (!isLiked) {
        await supabase
          .from('reply_likes')
          .insert([{ reply_id: reply.id, user_id: user.id }]);
        setLikesCount(prev => prev + 1);
      } else {
        await supabase
          .from('reply_likes')
          .delete()
          .match({ reply_id: reply.id, user_id: user.id });
        setLikesCount(prev => prev - 1);
      }
      setIsLiked(!isLiked);
    } catch (error) {
      console.error('Error liking reply:', error);
      toast.error('Failed to like reply');
    }
  };

  const handleReply = async () => {
    if (!user || !replyContent.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('replies')
        .insert({
          content: replyContent.trim(),
          user_id: user.id,
          tweet_id: tweetId,
          parent_reply_id: reply.id,
          is_nested: true
        });

      if (error) throw error;

      setReplyContent('');
      setShowReplyInput(false);
      toast.success('Reply posted!');
      if (onReplyPosted) {
        onReplyPosted();
      }
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: 'Share Reply',
        text: reply.content,
        url: window.location.href
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const displayName = reply.profiles?.full_name || reply.profiles?.username || 'Anonymous';
  const username = reply.profiles?.username || 'anonymous';
  const firstLetter = displayName.charAt(0) || 'A';

  return (
    <article className="p-4 border-b border-gray-800 hover:bg-gray-900/50 transition">
      <div className="flex space-x-3">
        <div className="flex-shrink-0">
          <UserAvatar
            userId={reply.user_id}
            username={username}
            avatarUrl={reply.profiles?.avatar_url}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">{displayName}</span>
            <span className="text-gray-500">@{username}</span>
            <span className="text-gray-500">·</span>
            <span className="text-gray-500">
              {formatDistanceToNow(new Date(reply.created_at))} ago
            </span>
          </div>
          <p className="mt-1 text-white">{reply.content}</p>
          <div className="mt-2 flex items-center space-x-8">
            <button
              onClick={() => setShowReplyInput(!showReplyInput)}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>{repliesCount}</span>
            </button>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 transition ${
                isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
              <span>{likesCount}</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition"
            >
              <Share className="w-5 h-5" />
            </button>
          </div>
          {showReplyInput && (
            <div className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                placeholder="Write your reply..."
                rows={3}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Posting...' : 'Reply'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}