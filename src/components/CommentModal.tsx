import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useTweetsStore } from '../store/tweetsStore';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tweetId: string;
  originalTweet: {
    content: string;
    user: {
      name: string;
      username: string;
      avatar: string;
    };
  };
}

export default function CommentModal({ isOpen, onClose, tweetId, originalTweet }: CommentModalProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { replyToTweet } = useTweetsStore();
  const { user } = useAuthStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setIsSubmitting(true);
      await replyToTweet(tweetId, content.trim());
      toast.success('Reply posted successfully!');
      setContent('');
      onClose();
    } catch (error: any) {
      toast.error('Failed to post reply');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-black w-full max-w-lg rounded-xl border border-gray-800 p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Reply</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-400">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="border-l-2 border-gray-800 ml-6 pl-4 mb-4">
          <div className="flex items-start space-x-3">
            <img
              src={originalTweet.user.avatar}
              alt={originalTweet.user.name}
              className="w-10 h-10 rounded-full"
            />
            <div>
              <div className="flex items-center space-x-1">
                <span className="font-bold">{originalTweet.user.name}</span>
                <span className="text-gray-500">@{originalTweet.user.username}</span>
              </div>
              <p className="text-gray-300">{originalTweet.content}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex space-x-4">
            <img
              src={`https://api.dicebear.com/7.x/avatars/svg?seed=${user?.email}`}
              alt="Your avatar"
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Post your reply"
                className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
              />
              <div className="flex justify-end mt-4">
                <button
                  type="submit"
                  disabled={!content.trim() || isSubmitting}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Reply
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}