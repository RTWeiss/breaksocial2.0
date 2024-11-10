import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface FeedState {
  items: any[];
  loading: boolean;
  error: Error | null;
  fetchFeed: () => Promise<void>;
  toggleListingLike: (listingId: string, userId: string) => Promise<void>;
  toggleTweetLike: (tweetId: string, userId: string) => Promise<void>;
  toggleRetweet: (tweetId: string, userId: string, repostId?: string) => Promise<void>;
  subscribeToFeed: () => () => void;
}

export const useFeedStore = create<FeedState>((set, get) => ({
  items: [],
  loading: false,
  error: null,

  fetchFeed: async () => {
    try {
      set({ loading: true, error: null });

      // Fetch tweets with proper error handling
      const { data: tweets, error: tweetsError } = await supabase
        .from('tweets')
        .select(`
          *,
          profiles!tweets_user_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          likes (
            id,
            user_id,
            created_at
          ),
          replies (
            id
          ),
          retweets (
            id,
            user_id,
            created_at
          )
        `)
        .order('created_at', { ascending: false });

      if (tweetsError) throw tweetsError;

      // Fetch retweets with user info
      const { data: retweets, error: retweetsError } = await supabase
        .from('retweets')
        .select(`
          id,
          user_id,
          created_at,
          tweet_id,
          profiles!retweets_user_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (retweetsError) throw retweetsError;

      // Transform tweets and retweets into feed items
      const feedItems = [];

      // Add original tweets
      tweets?.forEach(tweet => {
        feedItems.push({
          id: tweet.id,
          type: 'tweet',
          created_at: tweet.created_at,
          content: tweet
        });
      });

      // Add retweets
      retweets?.forEach(retweet => {
        const originalTweet = tweets?.find(t => t.id === retweet.tweet_id);
        if (originalTweet) {
          feedItems.push({
            id: `${retweet.id}-${originalTweet.id}`,
            type: 'tweet',
            created_at: retweet.created_at,
            content: {
              ...originalTweet,
              retweeted_by: retweet.profiles,
              is_retweet: true,
              original_tweet_id: originalTweet.id,
              retweet_id: retweet.id
            }
          });
        }
      });

      // Sort by created_at
      feedItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      set({ items: feedItems, loading: false });
    } catch (error: any) {
      console.error('Error fetching feed:', error);
      set({ error: new Error(error.message || 'Failed to load feed'), loading: false });
      toast.error('Failed to load feed');
    }
  },

  toggleListingLike: async (listingId: string, userId: string) => {
    const { items } = get();
    const listing = items.find(item => 
      item.type === 'listing' && item.content.id === listingId
    )?.content;

    if (!listing) return;

    const isLiked = listing.listing_likes?.some((like: any) => like.user_id === userId);

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
          .insert({ listing_id: listingId, user_id: userId });

        if (error && error.code !== '23505') throw error;
      }

      await get().fetchFeed();
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
    }
  },

  toggleTweetLike: async (tweetId: string, userId: string) => {
    const { items } = get();
    const itemIndex = items.findIndex(item => 
      item.type === 'tweet' && (item.content.id === tweetId || item.content.original_tweet_id === tweetId)
    );

    if (itemIndex === -1) return;

    const tweet = items[itemIndex].content;
    const targetTweetId = tweet.original_tweet_id || tweet.id;
    const isLiked = tweet.likes?.some((like: any) => like.user_id === userId);

    try {
      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .match({ tweet_id: targetTweetId, user_id: userId });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('likes')
          .insert({ tweet_id: targetTweetId, user_id: userId });

        if (error && error.code !== '23505') throw error;
      }

      await get().fetchFeed();
    } catch (error: any) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update like');
      throw error;
    }
  },

  toggleRetweet: async (tweetId: string, userId: string, repostId?: string) => {
    try {
      // Optimistically update the UI
      const { items } = get();
      const updatedItems = items.filter(item => {
        if (repostId) {
          // Remove the repost if we're unreposting
          return item.id !== `${repostId}-${tweetId}`;
        }
        return true;
      });
      set({ items: updatedItems });

      if (repostId) {
        // If repostId is provided, we're un-retweeting
        const { error } = await supabase
          .from('retweets')
          .delete()
          .eq('id', repostId);

        if (error) throw error;
        toast.success('Post unreposted');
      } else {
        // Check if already retweeted
        const { data: existingRetweet } = await supabase
          .from('retweets')
          .select('id')
          .eq('tweet_id', tweetId)
          .eq('user_id', userId)
          .single();

        if (existingRetweet) {
          // Un-retweet if already retweeted
          const { error } = await supabase
            .from('retweets')
            .delete()
            .eq('id', existingRetweet.id);

          if (error) throw error;
          toast.success('Post unreposted');
        } else {
          // Create new retweet
          const { error } = await supabase
            .from('retweets')
            .insert({ tweet_id: tweetId, user_id: userId });

          if (error && error.code !== '23505') throw error;
          toast.success('Post reposted successfully!');
        }
      }

      // Fetch updated feed
      await get().fetchFeed();
    } catch (error: any) {
      console.error('Error toggling retweet:', error);
      toast.error('Failed to repost');
      // Revert optimistic update on error
      await get().fetchFeed();
      throw error;
    }
  },

  subscribeToFeed: () => {
    const tweetsChannel = supabase.channel('tweets-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tweets' },
        () => get().fetchFeed()
      )
      .subscribe();

    const likesChannel = supabase.channel('likes-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => get().fetchFeed()
      )
      .subscribe();

    const retweetsChannel = supabase.channel('retweets-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'retweets' },
        () => get().fetchFeed()
      )
      .subscribe();

    const listingLikesChannel = supabase.channel('listing-likes-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listing_likes' },
        () => get().fetchFeed()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tweetsChannel);
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(retweetsChannel);
      supabase.removeChannel(listingLikesChannel);
    };
  }
}));