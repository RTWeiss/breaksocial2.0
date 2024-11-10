import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface CreateReplyProps {
  tweetId: string;
  onReplyCreated?: () => void;
}

export default function CreateReply({ tweetId, onReplyCreated }: CreateReplyProps) {
  const [content, setContent] = useState('');
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('replies')
        .insert({
          content: content.trim(),
          user_id: user.id,
          tweet_id: tweetId
        });

      if (error) throw error;

      setContent('');
      toast.success('Reply posted successfully!');
      if (onReplyCreated) {
        onReplyCreated();
      }
    } catch (error) {
      console.error('Error creating reply:', error);
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex space-x-4">
      <img
        src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user.email}`}
        alt="Profile"
        className="w-12 h-12 rounded-full"
      />
      <div className="flex-1">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Post your reply"
          className="w-full bg-transparent text-white resize-none focus:outline-none"
          rows={2}
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Replying...' : 'Reply'}
          </button>
        </div>
      </div>
    </form>
  );
}