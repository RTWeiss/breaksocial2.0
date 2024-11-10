import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

export default function CreateTweet() {
  const [content, setContent] = useState('');
  const [showListingForm, setShowListingForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();
  const [listingData, setListingData] = useState({
    title: '',
    price: '',
    condition: 'mint'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (showListingForm) {
        if (!imageUrl) {
          toast.error('Please upload a product image');
          return;
        }

        const price = parseFloat(listingData.price);
        if (isNaN(price) || price <= 0) {
          toast.error('Please enter a valid price');
          return;
        }

        // Create listing
        const { error: listingError } = await supabase
          .from('listings')
          .insert({
            seller_id: user.id,
            title: listingData.title.trim(),
            description: content.trim(),
            price,
            condition: listingData.condition,
            image_url: imageUrl,
            status: 'active'
          });

        if (listingError) throw listingError;

        // Create tweet about the listing
        const tweetContent = `🛍️ New listing: ${listingData.title}\n💰 $${price}\n\n${content}\n\n#marketplace`;
        
        const { error: tweetError } = await supabase
          .from('tweets')
          .insert({
            content: tweetContent,
            user_id: user.id,
            image_url: imageUrl
          });

        if (tweetError) throw tweetError;

        toast.success('Product listed successfully!');
      } else {
        const { error } = await supabase
          .from('tweets')
          .insert({
            content,
            user_id: user.id,
            image_url: imageUrl || null
          });

        if (error) throw error;
        toast.success('Tweet posted successfully!');
      }

      // Reset form
      setContent('');
      setImageUrl('');
      setShowListingForm(false);
      setListingData({
        title: '',
        price: '',
        condition: 'mint'
      });
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-b border-gray-800 p-4">
      {showListingForm ? (
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Product Image (Required)</h3>
            <ImageUpload
              onUpload={setImageUrl}
              folder="listings"
              currentImage={imageUrl}
              onRemove={() => setImageUrl('')}
            />
          </div>

          <input
            type="text"
            placeholder="Product title"
            value={listingData.title}
            onChange={(e) => setListingData({ ...listingData, title: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />

          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={listingData.price}
                onChange={(e) => setListingData({ ...listingData, price: e.target.value })}
                className="w-full pl-8 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <select
              value={listingData.condition}
              onChange={(e) => setListingData({ ...listingData, condition: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="mint">Mint</option>
              <option value="near_mint">Near Mint</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>
      ) : null}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={showListingForm ? "Describe your product..." : "What's happening?"}
        className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
        rows={3}
        required
      />

      <div className="flex justify-between items-center mt-4">
        <button
          type="button"
          onClick={() => setShowListingForm(!showListingForm)}
          className={`px-4 py-2 rounded-lg transition ${
            showListingForm 
              ? 'bg-purple-500/10 text-purple-500' 
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {showListingForm ? 'Cancel Listing' : 'List Product'}
        </button>

        <button
          type="submit"
          disabled={
            !content.trim() || 
            isSubmitting || 
            (showListingForm && (!listingData.title || !listingData.price || !imageUrl))
          }
          className="bg-purple-500 text-white px-6 py-2 rounded-lg font-bold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{showListingForm ? 'List Product' : 'Post'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}