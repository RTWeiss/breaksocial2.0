import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, Users, Package, MessageCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import Tweet from '../components/Tweet';
import UserAvatar from '../components/UserAvatar';
import ListingCard from '../components/ListingCard';
import LoadingSpinner from '../components/LoadingSpinner';

type SearchResult = {
  type: 'user' | 'post' | 'listing';
  data: any;
  source?: string;
  index: number;
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'posts' | 'listings'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const tabs = [
    { id: 'all', label: 'All', icon: SearchIcon },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'posts', label: 'Posts', icon: MessageCircle },
    { id: 'listings', label: 'Items', icon: Package },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch();
    }
  };

  const performSearch = async (searchQuery = query) => {
    setLoading(true);
    try {
      let searchResults: SearchResult[] = [];
      let index = 0;

      if (activeTab === 'all' || activeTab === 'users') {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
          .limit(activeTab === 'all' ? 3 : 10);

        if (usersError) throw usersError;

        if (users) {
          searchResults.push(
            ...users.map(user => ({
              type: 'user',
              data: user,
              source: 'users',
              index: index++
            }))
          );
        }
      }

      if (activeTab === 'all' || activeTab === 'posts') {
        const { data: posts, error: postsError } = await supabase
          .from('tweets')
          .select(`
            *,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            ),
            likes (
              id,
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
          .ilike('content', `%${searchQuery}%`)
          .limit(activeTab === 'all' ? 3 : 10);

        if (postsError) throw postsError;

        if (posts) {
          searchResults.push(
            ...posts.map(post => ({
              type: 'post',
              data: post,
              source: 'posts',
              index: index++
            }))
          );
        }
      }

      if (activeTab === 'all' || activeTab === 'listings') {
        const { data: listings, error: listingsError } = await supabase
          .from('listings')
          .select(`
            *,
            profiles (
              id,
              username,
              full_name,
              avatar_url
            ),
            listing_likes (
              id,
              user_id
            )
          `)
          .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
          .eq('status', 'active')
          .limit(activeTab === 'all' ? 3 : 10);

        if (listingsError) throw listingsError;

        if (listings) {
          searchResults.push(
            ...listings.map(listing => ({
              type: 'listing',
              data: listing,
              source: 'listings',
              index: index++
            }))
          );
        }
      }

      setResults(searchResults);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingContent = async () => {
    setLoading(true);
    try {
      let trendingResults: SearchResult[] = [];
      let index = 0;

      if (activeTab === 'all') {
        // Fetch trending posts and listings
        const [postsResponse, listingsResponse] = await Promise.all([
          supabase.rpc('get_trending_posts', { limit_count: 5 }),
          supabase.rpc('get_trending_listings', { limit_count: 5 })
        ]);

        if (postsResponse.error) throw postsResponse.error;
        if (listingsResponse.error) throw listingsResponse.error;

        // Fetch full post details
        const { data: posts } = await supabase
          .from('tweets')
          .select(`
            *,
            profiles (id, username, full_name, avatar_url),
            likes (id, user_id),
            replies (id),
            retweets (id, user_id)
          `)
          .in('id', postsResponse.data.map(p => p.id));

        // Fetch full listing details
        const { data: listings } = await supabase
          .from('listings')
          .select(`
            *,
            profiles (id, username, full_name, avatar_url),
            listing_likes (id, user_id)
          `)
          .in('id', listingsResponse.data.map(l => l.id));

        trendingResults = [
          ...(posts?.map(post => ({
            type: 'post' as const,
            data: post,
            source: 'trending',
            index: index++
          })) || []),
          ...(listings?.map(listing => ({
            type: 'listing' as const,
            data: listing,
            source: 'trending',
            index: index++
          })) || [])
        ];
      } else if (activeTab === 'users') {
        // Fetch users with follower counts
        const { data: users } = await supabase.rpc('get_trending_users', { limit_count: 10 });
        
        if (users) {
          const { data: fullUsers } = await supabase
            .from('profiles')
            .select('*')
            .in('id', users.map(u => u.user_id));

          trendingResults = fullUsers?.map(user => ({
            type: 'user',
            data: {
              ...user,
              follower_count: users.find(u => u.user_id === user.id)?.follower_count || 0
            },
            source: 'trending',
            index: index++
          })) || [];
        }
      } else if (activeTab === 'posts') {
        // Fetch trending posts
        const { data: trendingPostIds } = await supabase.rpc('get_trending_posts', { limit_count: 10 });
        
        if (trendingPostIds) {
          const { data: posts } = await supabase
            .from('tweets')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url),
              likes (id, user_id),
              replies (id),
              retweets (id, user_id)
            `)
            .in('id', trendingPostIds.map(p => p.id));

          trendingResults = posts?.map(post => ({
            type: 'post',
            data: post,
            source: 'trending',
            index: index++
          })) || [];
        }
      } else if (activeTab === 'listings') {
        // Fetch trending listings
        const { data: trendingListingIds } = await supabase.rpc('get_trending_listings', { limit_count: 10 });
        
        if (trendingListingIds) {
          const { data: listings } = await supabase
            .from('listings')
            .select(`
              *,
              profiles (id, username, full_name, avatar_url),
              listing_likes (id, user_id)
            `)
            .in('id', trendingListingIds.map(l => l.id))
            .eq('status', 'active');

          trendingResults = listings?.map(listing => ({
            type: 'listing',
            data: listing,
            source: 'trending',
            index: index++
          })) || [];
        }
      }

      setResults(trendingResults);
    } catch (error) {
      console.error('Error fetching trending content:', error);
      toast.error('Failed to load trending content');
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'user':
        navigate(`/profile/${result.data.id}`);
        break;
      case 'post':
        navigate(`/tweet/${result.data.id}`);
        break;
      case 'listing':
        navigate(`/marketplace/${result.data.id}`);
        break;
    }
  };

  const renderUserResult = (user: any) => (
    <div 
      onClick={() => handleResultClick({ type: 'user', data: user, index: 0 })}
      className="flex items-center space-x-3 p-4 hover:bg-gray-900/50 transition cursor-pointer"
    >
      <UserAvatar
        userId={user.id}
        username={user.username}
        avatarUrl={user.avatar_url}
      />
      <div>
        <h3 className="font-bold">{user.full_name || user.username}</h3>
        <p className="text-gray-500">@{user.username}</p>
        {user.bio && (
          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{user.bio}</p>
        )}
        {user.follower_count !== undefined && (
          <p className="text-gray-500 text-sm mt-1">
            {user.follower_count} followers
          </p>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    const initialQuery = searchParams.get('q');
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    } else {
      fetchTrendingContent();
    }

    // Subscribe to changes
    const likesChannel = supabase.channel('explore-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        () => {
          if (initialQuery) {
            performSearch(initialQuery);
          } else {
            fetchTrendingContent();
          }
        }
      )
      .subscribe();

    const listingLikesChannel = supabase.channel('explore-listing-likes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'listing_likes' },
        () => {
          if (initialQuery) {
            performSearch(initialQuery);
          } else {
            fetchTrendingContent();
          }
        }
      )
      .subscribe();

    const followsChannel = supabase.channel('explore-follows')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'follows' },
        () => {
          if (!initialQuery && activeTab === 'users') {
            fetchTrendingContent();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(likesChannel);
      supabase.removeChannel(listingLikesChannel);
      supabase.removeChannel(followsChannel);
    };
  }, [searchParams, activeTab]);

  return (
    <div className="max-w-full">
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm">
        <div className="px-4 py-3">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Break"
                className="w-full bg-gray-900 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <SearchIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
            </div>
          </form>
          <div className="flex mt-3 border-b border-gray-800">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (query) {
                    performSearch();
                  } else {
                    fetchTrendingContent();
                  }
                }}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'text-purple-500 border-b-2 border-purple-500'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      <div className="divide-y divide-gray-800">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <LoadingSpinner />
          </div>
        ) : results.length > 0 ? (
          results.map((result) => (
            <div key={`${result.type}-${result.data.id}-${result.source}-${result.index}`}>
              {result.type === 'user' && renderUserResult(result.data)}
              {result.type === 'post' && (
                <div onClick={() => handleResultClick(result)} className="cursor-pointer">
                  <Tweet tweet={result.data} />
                </div>
              )}
              {result.type === 'listing' && (
                <div className="p-4">
                  <ListingCard listing={result.data} onLike={fetchTrendingContent} />
                </div>
              )}
            </div>
          ))
        ) : query ? (
          <div className="p-8 text-center text-gray-500">
            No results found for "{query}"
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            {activeTab === 'all' && 'Trending content will appear here'}
            {activeTab === 'users' && 'Most followed users will appear here'}
            {activeTab === 'posts' && 'Trending posts will appear here'}
            {activeTab === 'listings' && 'Trending items will appear here'}
          </div>
        )}
      </div>
    </div>
  );
}