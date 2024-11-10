import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Tweet from '../components/Tweet';
import Reply from '../components/Reply';
import ReplyForm from '../components/ReplyForm';
import LoadingSpinner from '../components/LoadingSpinner';

interface Reply {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  likes_count: number;
}

export default function TweetDetail() {
  const { id } = useParams<{ id: string }>();
  const [tweet, setTweet] = useState<any>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchTweet();
      fetchReplies();
    }
  }, [id]);

  const fetchTweet = async () => {
    try {
      const { data, error } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          likes (
            user_id
          ),
          replies (
            id
          ),
          retweets (
            user_id
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      setTweet(data);
    } catch (error) {
      console.error('Error fetching tweet:', error);
    }
  };

  const fetchReplies = async () => {
    try {
      const { data, error } = await supabase
        .from('replies')
        .select(`
          *,
          profiles (
            username,
            full_name,
            avatar_url
          ),
          likes:reply_likes(count)
        `)
        .eq('tweet_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setReplies(data || []);
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReplyPosted = () => {
    fetchReplies();
    fetchTweet(); // Refresh tweet to update reply count
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!tweet) {
    return (
      <div className="p-4 text-center text-gray-500">
        Tweet not found
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3">
        <Link to="/" className="inline-flex items-center text-white hover:text-gray-300">
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span className="text-xl font-bold">Thread</span>
        </Link>
      </header>

      <Tweet 
        tweet={tweet} 
        isNested={true}
        onInteraction={() => fetchTweet()}
      />

      <div className="border-t border-gray-800">
        <ReplyForm tweetId={id} onReplyPosted={handleReplyPosted} />
        {replies.map((reply) => (
          <Reply
            key={reply.id}
            reply={reply}
            tweetId={id}
            onReplyPosted={handleReplyPosted}
          />
        ))}
      </div>
    </div>
  );
}