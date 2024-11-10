import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface TweetData {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  likes: { id: string; user_id: string }[];
  replies: { id: string }[];
  retweets: { id: string; user_id: string }[];
}

export function useTweet(tweetId: string | undefined) {
  const { user } = useAuthStore();
  const [tweet, setTweet] = useState<TweetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTweet = async () => {
    if (!tweetId) {
      setError('Invalid tweet ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles:user_id (*),
          likes (id, user_id),
          replies (id),
          retweets (id, user_id)
        `)
        .eq('id', tweetId)
        .single();

      if (fetchError) throw fetchError;
      setTweet(data);
    } catch (err) {
      console.error('Error fetching tweet:', err);
      setError('Failed to load tweet');
    } finally {
      setLoading(false);
    }
  };

  const like = async () => {
    if (!user || !tweet) return;

    const isLiked = tweet.likes.some(like => like.user_id === user.id);
    
    try {
      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('tweet_id', tweet.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('likes')
          .insert({ tweet_id: tweet.id, user_id: user.id });
      }
      await fetchTweet();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const retweet = async () => {
    if (!user || !tweet) return;

    const isRetweeted = tweet.retweets.some(retweet => retweet.user_id === user.id);
    
    try {
      if (isRetweeted) {
        await supabase
          .from('retweets')
          .delete()
          .eq('tweet_id', tweet.id)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('retweets')
          .insert({ tweet_id: tweet.id, user_id: user.id });
      }
      await fetchTweet();
    } catch (err) {
      console.error('Error toggling retweet:', err);
    }
  };

  useEffect(() => {
    fetchTweet();
  }, [tweetId]);

  return {
    tweet,
    loading,
    error,
    like,
    retweet,
    refresh: fetchTweet,
    isLiked: tweet?.likes.some(like => like.user_id === user?.id) ?? false,
    isRetweeted: tweet?.retweets.some(retweet => retweet.user_id === user?.id) ?? false
  };
}