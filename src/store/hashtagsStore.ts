import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface HashtagsState {
  trending: Array<{
    tag: string;
    count: number;
  }>;
  loading: boolean;
  error: Error | null;
  fetchTrending: () => Promise<void>;
  subscribeToHashtags: () => () => void;
}

export const useHashtagsStore = create<HashtagsState>((set) => ({
  trending: [],
  loading: false,
  error: null,

  fetchTrending: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('hashtag_counts')
        .select('*')
        .order('count', { ascending: false })
        .limit(10);

      if (error) throw error;

      set({ trending: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching trending hashtags:', error);
      set({ error, loading: false });
      toast.error('Failed to load trending topics');
    }
  },

  subscribeToHashtags: () => {
    const channel = supabase
      .channel('hashtags')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tweet_hashtags'
        },
        () => {
          useHashtagsStore.getState().fetchTrending();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));