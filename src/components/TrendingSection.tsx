import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface TrendingHashtag {
  tag: string;
  count: number;
  last_used_at: string;
}

export default function TrendingSection() {
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTrendingHashtags();

    // Subscribe to both tweets and tweet_hashtags changes
    const tweetsChannel = supabase.channel('tweets-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tweets' },
        () => fetchTrendingHashtags()
      )
      .subscribe();

    const hashtagsChannel = supabase.channel('hashtags-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tweet_hashtags' },
        () => fetchTrendingHashtags()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tweetsChannel);
      supabase.removeChannel(hashtagsChannel);
    };
  }, []);

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('trending_hashtags')
        .select('*');

      if (error) throw error;
      setTrendingHashtags(data || []);
    } catch (error) {
      console.error('Error fetching trending hashtags:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleHashtagClick = (tag: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/explore?q=%23${encodeURIComponent(tag)}`);
  };

  if (loading) {
    return (
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Trending Topics</h2>
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (trendingHashtags.length === 0) {
    return (
      <div className="bg-gray-900 rounded-2xl p-4">
        <h2 className="text-xl font-bold mb-4">Trending Topics</h2>
        <div className="text-center py-8">
          <Package className="w-12 h-12 mx-auto mb-3 text-gray-600" />
          <p className="text-gray-500">No trending topics yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-2xl p-4">
      <h2 className="text-xl font-bold mb-4">Trending Topics</h2>
      <div className="space-y-4">
        {trendingHashtags.map((hashtag) => (
          <button
            key={hashtag.tag}
            onClick={(e) => handleHashtagClick(hashtag.tag, e)}
            className="block w-full text-left hover:bg-gray-800 p-3 rounded-lg transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-bold text-purple-500">#{hashtag.tag}</p>
                <p className="text-sm text-gray-400">{hashtag.count} posts</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}