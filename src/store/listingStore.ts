import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface ListingStore {
  listings: any[];
  loading: boolean;
  error: Error | null;
  fetchListings: () => Promise<void>;
  toggleLike: (listingId: string, userId: string) => Promise<void>;
  subscribeToLikes: () => () => void;
}

export const useListingStore = create<ListingStore>((set, get) => ({
  listings: [],
  loading: false,
  error: null,

  fetchListings: async () => {
    try {
      set({ loading: true, error: null });

      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles:seller_id (
            username,
            full_name,
            avatar_url
          ),
          listing_likes (
            user_id
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ listings: data || [], loading: false });
    } catch (error: any) {
      console.error('Error fetching listings:', error);
      set({ error, loading: false });
    }
  },

  toggleLike: async (listingId: string, userId: string) => {
    const { listings } = get();
    const listing = listings.find(l => l.id === listingId);
    if (!listing) return;

    const isLiked = listing.listing_likes?.some((like: any) => like.user_id === userId);
    const optimisticLikes = isLiked 
      ? listing.listing_likes.filter((like: any) => like.user_id !== userId)
      : [...(listing.listing_likes || []), { user_id: userId }];

    // Optimistic update
    set({
      listings: listings.map(l => 
        l.id === listingId 
          ? { ...l, listing_likes: optimisticLikes }
          : l
      )
    });

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('listing_likes')
          .delete()
          .match({ listing_id: listingId, user_id: userId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('listing_likes')
          .insert({ listing_id: listingId, user_id: userId })
          .single();

        if (error && error.code !== '23505') throw error;

        // Create notification for the listing owner
        if (listing.seller_id !== userId) {
          await supabase.from('notifications').insert({
            user_id: listing.seller_id,
            type: 'like_listing',
            message: `Someone liked your listing "${listing.title}"`,
            data: {
              listing_id: listingId,
              user_id: userId
            }
          });
        }
      }
    } catch (error: any) {
      // Revert optimistic update on error
      set({
        listings: listings.map(l => 
          l.id === listingId 
            ? { ...l, listing_likes: listing.listing_likes }
            : l
        )
      });
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  },

  subscribeToLikes: () => {
    const channel = supabase.channel('listing-likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_likes'
        },
        () => {
          get().fetchListings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}));