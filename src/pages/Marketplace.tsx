import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Package, Search, SlidersHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import ListingCard from '../components/ListingCard';
import LoadingSpinner from '../components/LoadingSpinner';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  condition: string;
  image_url: string | null;
  seller_id: string;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  listing_likes: { user_id: string }[];
}

interface Filters {
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>({});
  const { user } = useAuthStore();

  const fetchListings = async () => {
    try {
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          description,
          price,
          condition,
          image_url,
          seller_id,
          created_at,
          profiles!listings_seller_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          listing_likes (
            user_id
          )
        `)
        .eq('status', 'active');

      // Apply search query
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply filters
      if (filters.minPrice !== undefined) {
        query = query.gte('price', filters.minPrice);
      }
      if (filters.maxPrice !== undefined) {
        query = query.lte('price', filters.maxPrice);
      }
      if (filters.condition) {
        query = query.eq('condition', filters.condition);
      }

      // Order by most recent
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Failed to load marketplace listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();

    // Subscribe to changes
    const channel = supabase
      .channel('marketplace')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listings'
        },
        () => fetchListings()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'listing_likes'
        },
        () => fetchListings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [searchQuery, filters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search listings..."
            className="w-full bg-gray-900 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </form>

        {showFilters && (
          <div className="bg-gray-900 rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Min Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
                  placeholder="Min price"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Max Price
                </label>
                <input
                  type="number"
                  min="0"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                  className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
                  placeholder="Max price"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Condition
              </label>
              <select
                value={filters.condition || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value || undefined }))}
                className="w-full bg-gray-800 text-white rounded-lg px-3 py-2"
              >
                <option value="">Any condition</option>
                <option value="mint">Mint</option>
                <option value="near_mint">Near Mint</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setFilters({});
                  setSearchQuery('');
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition"
              >
                Clear All
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {listings.length > 0 ? (
          listings.map((listing) => (
            <ListingCard 
              key={listing.id} 
              listing={listing}
              isOwner={user?.id === listing.seller_id}
              onLike={fetchListings}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No listings found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}