import { create } from 'zustand';
import { supabase } from '../lib/supabase';

interface Post {
  id: string;
  content: string;
  image_url?: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
  likes: number;
  replies: number;
}

interface PostsState {
  posts: Post[];
  loading: boolean;
  createPost: (content: string, imageUrl?: string) => Promise<void>;
  fetchPosts: () => Promise<void>;
  fetchTrending: () => Promise<{ tag: string; category: string; count: number }[]>;
}

export const usePostsStore = create<PostsState>((set, get) => ({
  posts: [],
  loading: false,
  createPost: async (content, imageUrl) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // First, ensure the user has a profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        throw new Error('Please complete your profile first');
      }

      const { error } = await supabase
        .from('tweets')
        .insert({
          user_id: user.id,
          content,
          image_url: imageUrl,
        });

      if (error) throw error;
      await get().fetchPosts();
    } catch (error: any) {
      throw new Error(error.message);
    }
  },
  fetchPosts: async () => {
    try {
      set({ loading: true });
      const { data, error } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles:user_id (
            username,
            full_name,
            avatar_url
          ),
          likes: likes(count),
          replies: replies(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ posts: data || [], loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },
  fetchTrending: async () => {
    // In a real app, this would be a database query aggregating hashtags
    return [
      { tag: 'PokemonTCG', category: 'Trading Cards', count: 50400 },
      { tag: 'Funko', category: 'Collectibles', count: 32100 },
      { tag: 'VintageToys', category: 'Toys', count: 28300 },
    ];
  },
}));