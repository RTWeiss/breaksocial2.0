import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Tweet {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  likes: { user_id: string }[];
  replies: { id: string }[];
  retweets: { user_id: string }[];
}

interface TweetsState {
  tweets: Tweet[];
  loading: boolean;
  error: Error | null;
  createTweet: (content: string, imageUrl?: string) => Promise<void>;
  fetchTweets: () => Promise<void>;
  likeTweet: (tweetId: string) => Promise<void>;
  unlikeTweet: (tweetId: string) => Promise<void>;
  retweet: (tweetId: string) => Promise<void>;
  unretweet: (tweetId: string) => Promise<void>;
  subscribeToTweets: () => () => void;
}

export const useTweetsStore = create<TweetsState>((set, get) => ({
  tweets: [],
  loading: false,
  error: null,

  createTweet: async (content: string, imageUrl?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: tweet, error } = await supabase
        .from('tweets')
        .insert({
          content,
          user_id: user.id,
          image_url: imageUrl,
        })
        .select(`
          *,
          profiles!tweets_user_id_fkey (
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
        .single();

      if (error) throw error;

      // Update local state with new tweet
      set((state) => ({
        tweets: [tweet, ...state.tweets]
      }));

      toast.success('Tweet posted successfully!');
    } catch (error: any) {
      console.error('Error creating tweet:', error);
      toast.error(error.message || 'Failed to post tweet');
      throw error;
    }
  },

  fetchTweets: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles!tweets_user_id_fkey (
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
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ tweets: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching tweets:', error);
      set({ error, loading: false });
      toast.error('Failed to load tweets');
    }
  },

  likeTweet: async (tweetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .insert({
          tweet_id: tweetId,
          user_id: user.id
        });

      if (error && error.code !== '23505') throw error;
      await get().fetchTweets();
    } catch (error: any) {
      console.error('Error liking tweet:', error);
      toast.error('Failed to like tweet');
      throw error;
    }
  },

  unlikeTweet: async (tweetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('tweet_id', tweetId)
        .eq('user_id', user.id);

      if (error) throw error;
      await get().fetchTweets();
    } catch (error: any) {
      console.error('Error unliking tweet:', error);
      toast.error('Failed to unlike tweet');
      throw error;
    }
  },

  retweet: async (tweetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('retweets')
        .insert({
          tweet_id: tweetId,
          user_id: user.id
        });

      if (error && error.code !== '23505') throw error;
      await get().fetchTweets();
    } catch (error: any) {
      console.error('Error retweeting:', error);
      toast.error('Failed to retweet');
      throw error;
    }
  },

  unretweet: async (tweetId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('retweets')
        .delete()
        .eq('tweet_id', tweetId)
        .eq('user_id', user.id);

      if (error) throw error;
      await get().fetchTweets();
    } catch (error: any) {
      console.error('Error unretweeting:', error);
      toast.error('Failed to unretweet');
      throw error;
    }
  },

  subscribeToTweets: () => {
    const channel = supabase
      .channel('tweets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tweets'
        },
        () => {
          get().fetchTweets();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));