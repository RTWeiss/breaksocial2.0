import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface CommentBoxProps {
  tweetId: string;
  onCommentPosted?: () => void;
}

export default function CommentBox({ tweetId, onCommentPosted }: CommentBoxProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('replies')
        .insert({
          content: content.trim(),
          parent_id: tweetId,
          user_id: user.id
        });

      if (error) throw error;

      setContent('');
      if (onCommentPosted) {
        onCommentPosted();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post your reply"
        className="w-full bg-transparent border border-gray-700 rounded-lg p-2 text-white resize-none focus:outline-none focus:border-blue-500"
        rows={3}
      />
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={!content.trim() || isSubmitting}
          className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Posting...' : 'Reply'}
        </button>
      </div>
    </form>
  );
}