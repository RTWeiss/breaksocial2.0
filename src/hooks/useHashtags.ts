import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface TrendingHashtag {
  hashtag: string;
  count: number;
  type: string;
}

export function useHashtags() {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingHashtags();
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_trending_hashtags', {
          time_window: '7 days'
        });

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  return { trendingHashtags, loading };
}