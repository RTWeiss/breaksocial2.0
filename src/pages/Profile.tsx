import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Package } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import ListingCard from '../components/ListingCard';
import UserAvatar from '../components/UserAvatar';
import FollowButton from '../components/FollowButton';
import { useFollow } from '../hooks/useFollow';
import LoadingSpinner from '../components/LoadingSpinner';
import Tweet from '../components/Tweet';

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at: string;
}

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tweets' | 'listings' | 'likes'>('tweets');
  const [tweets, setTweets] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [likedListings, setLikedListings] = useState<any[]>([]);
  const { isFollowing, followersCount, followingCount, checkFollowStatus } = useFollow(id || '');

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTweets = async () => {
    try {
      // Fetch user's tweets
      const { data: userTweets, error: tweetsError } = await supabase
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
            id,
            user_id
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (tweetsError) throw tweetsError;

      // Fetch user's retweets
      const { data: retweets, error: retweetsError } = await supabase
        .from('retweets')
        .select(`
          id,
          user_id,
          created_at,
          tweet_id,
          tweets!inner (
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
              id,
              user_id
            )
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (retweetsError) throw retweetsError;

      // Transform tweets and retweets into feed items
      const feedItems = [];

      // Add original tweets
      userTweets?.forEach(tweet => {
        feedItems.push({
          id: tweet.id,
          type: 'tweet',
          created_at: tweet.created_at,
          content: tweet
        });
      });

      // Add retweets
      retweets?.forEach(retweet => {
        feedItems.push({
          id: `${retweet.id}-${retweet.tweets.id}`,
          type: 'tweet',
          created_at: retweet.created_at,
          content: {
            ...retweet.tweets,
            retweeted_by: profile,
            is_retweet: true,
            original_tweet_id: retweet.tweets.id,
            retweet_id: retweet.id
          }
        });
      });

      // Sort by created_at
      feedItems.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setTweets(feedItems);
    } catch (error) {
      console.error('Error fetching tweets:', error);
      toast.error('Failed to load tweets');
    }
  };

  const fetchListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          profiles!listings_seller_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          listing_likes (
            user_id
          )
        `)
        .eq('seller_id', id)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load listings');
    }
  };

  const fetchLikedListings = async () => {
    try {
      const { data, error } = await supabase
        .from('listing_likes')
        .select(`
          listings (
            *,
            profiles!listings_seller_id_fkey (
              username,
              full_name,
              avatar_url
            ),
            listing_likes (
              user_id
            )
          )
        `)
        .eq('user_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const transformedListings = data
        ?.map(item => item.listings)
        .filter(Boolean)
        .map(listing => ({
          ...listing,
          listing_likes: listing.listing_likes || []
        }));

      setLikedListings(transformedListings || []);
    } catch (error) {
      console.error('Error fetching liked listings:', error);
      toast.error('Failed to load liked listings');
    }
  };

  useEffect(() => {
    if (id) {
      fetchProfile();
      fetchTweets();
      fetchListings();
      fetchLikedListings();

      // Subscribe to changes
      const tweetsChannel = supabase.channel('profile-tweets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tweets', filter: `user_id=eq.${id}` },
          () => fetchTweets()
        )
        .subscribe();

      const retweetsChannel = supabase.channel('profile-retweets')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'retweets', filter: `user_id=eq.${id}` },
          () => fetchTweets()
        )
        .subscribe();

      const listingsChannel = supabase.channel('profile-listings')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'listings', filter: `seller_id=eq.${id}` },
          () => fetchListings()
        )
        .subscribe();

      const likesChannel = supabase.channel('profile-likes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'listing_likes', filter: `user_id=eq.${id}` },
          () => {
            fetchLikedListings();
            fetchListings();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(tweetsChannel);
        supabase.removeChannel(retweetsChannel);
        supabase.removeChannel(listingsChannel);
        supabase.removeChannel(likesChannel);
      };
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-4 text-gray-500" />
        <p className="text-gray-500">Profile not found</p>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-purple-500 to-pink-500"></div>
        <div className="absolute -bottom-16 left-4">
          <UserAvatar
            userId={profile.id}
            username={profile.username}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
        </div>
      </div>

      <div className="mt-20 px-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
            <p className="text-gray-500">@{profile.username}</p>
            {profile.bio && (
              <p className="mt-2 text-gray-300">{profile.bio}</p>
            )}
            <div className="mt-2 flex items-center text-gray-500">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            </div>
            <div className="mt-2 flex space-x-4 text-gray-500">
              <span>{followingCount} Following</span>
              <span>{followersCount} Followers</span>
            </div>
          </div>
          {user?.id !== profile.id && (
            <FollowButton
              userId={profile.id}
              isFollowing={isFollowing}
              onFollowChange={checkFollowStatus}
            />
          )}
        </div>

        <div className="mt-6 border-b border-gray-800">
          <nav className="flex space-x-4">
            <button
              onClick={() => setActiveTab('tweets')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'tweets'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('listings')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'listings'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Listings
            </button>
            <button
              onClick={() => setActiveTab('likes')}
              className={`px-4 py-2 font-medium ${
                activeTab === 'likes'
                  ? 'text-white border-b-2 border-purple-500'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              Liked Items
            </button>
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'tweets' && (
            <div className="space-y-4">
              {tweets.map((tweet) => (
                <Tweet key={tweet.id} tweet={tweet.content} />
              ))}
              {tweets.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No posts yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'listings' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isOwner={user?.id === listing.seller_id}
                  onLike={fetchListings}
                />
              ))}
              {listings.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No listings yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'likes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  isOwner={user?.id === listing.seller_id}
                  onLike={fetchLikedListings}
                />
              ))}
              {likedListings.length === 0 && (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No liked items yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}