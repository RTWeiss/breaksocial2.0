import React, { useEffect } from 'react';
import { useFeedStore } from '../store/feedStore';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Tweet from '../components/Tweet';
import ListingCard from '../components/ListingCard';
import CreateTweet from '../components/CreateTweet';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Home() {
  const { items, loading, error, fetchFeed, subscribeToFeed } = useFeedStore();

  useEffect(() => {
    fetchFeed();
    const unsubscribe = subscribeToFeed();
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>Failed to load feed. Please try again later.</p>
        <button
          onClick={() => fetchFeed()}
          className="mt-2 text-purple-500 hover:text-purple-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Home</h1>
        </div>
      </header>

      <CreateTweet />

      <div className="divide-y divide-gray-800">
        <ErrorBoundary>
          {items.map((item) => (
            <div key={item.id}>
              {item.type === 'tweet' ? (
                <Tweet tweet={item.content} />
              ) : (
                <div className="p-4">
                  <ListingCard listing={item.content} inFeed={true} />
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              No posts yet. Be the first to post!
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}