import React, { useState } from 'react';
import { Package, Image, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

type PostType = 'text' | 'image' | 'product';

export default function TweetBox() {
  const [postType, setPostType] = useState<PostType>('text');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [productData, setProductData] = useState({
    title: '',
    price: '',
    condition: 'mint',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user || isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (postType === 'product') {
        if (!imageUrl) {
          toast.error('Please upload a product image');
          return;
        }

        const price = parseFloat(productData.price);
        if (isNaN(price) || price <= 0) {
          toast.error('Please enter a valid price');
          return;
        }

        // Create listing
        const { error: listingError } = await supabase
          .from('listings')
          .insert({
            seller_id: user.id,
            title: productData.title.trim(),
            description: content.trim(),
            price,
            condition: productData.condition,
            image_url: imageUrl,
            status: 'active'
          });

        if (listingError) throw listingError;

        // Create tweet about the listing
        const tweetContent = `🛍️ New listing: ${productData.title}\n💰 $${price}\n\n${content}\n\n#marketplace`;
        
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
            image_url: postType === 'image' ? imageUrl : null
          });

        if (error) throw error;
        toast.success('Post created successfully!');
      }

      // Reset form
      setContent('');
      setImageUrl('');
      setPostType('text');
      setProductData({
        title: '',
        price: '',
        condition: 'mint',
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
      {/* Post Type Selector */}
      <div className="flex space-x-2 mb-4">
        <button
          type="button"
          onClick={() => {
            setPostType('text');
            setImageUrl('');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
            postType === 'text' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          <span>Text</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPostType('image');
            setImageUrl('');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
            postType === 'image' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
          }`}
        >
          <Image className="w-5 h-5" />
          <span>Image</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setPostType('product');
            setImageUrl('');
          }}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
            postType === 'product' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
          }`}
        >
          <Package className="w-5 h-5" />
          <span>Product</span>
        </button>
      </div>

      {/* Product Form */}
      {postType === 'product' && (
        <div className="space-y-4">
          {/* Product Image Upload - Always First */}
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Product Image (Required)</h3>
            <ImageUpload
              onUpload={setImageUrl}
              folder="listings"
              currentImage={imageUrl}
              onRemove={() => setImageUrl('')}
            />
          </div>

          {/* Product Details */}
          <input
            type="text"
            placeholder="Product title"
            value={productData.title}
            onChange={(e) => setProductData({ ...productData, title: e.target.value })}
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
                value={productData.price}
                onChange={(e) => setProductData({ ...productData, price: e.target.value })}
                className="w-full pl-8 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <select
              value={productData.condition}
              onChange={(e) => setProductData({ ...productData, condition: e.target.value })}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
            >
              <option value="mint">Mint</option>
              <option value="near_mint">Near Mint</option>
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>

          {/* Product Description */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Describe your product..."
            className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
            rows={3}
            required
          />
        </div>
      )}

      {/* Image Post */}
      {postType === 'image' && (
        <div className="space-y-4">
          <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
            <ImageUpload
              onUpload={setImageUrl}
              folder="tweets"
              currentImage={imageUrl}
              onRemove={() => setImageUrl('')}
            />
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add a caption..."
            className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
            rows={3}
            required
          />
        </div>
      )}

      {/* Text Post */}
      {postType === 'text' && (
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
          rows={3}
          required
        />
      )}

      {/* Submit Button */}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={
            !content.trim() || 
            isSubmitting || 
            (postType === 'product' && (!productData.title || !productData.price || !imageUrl)) ||
            (postType === 'image' && !imageUrl)
          }
          className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting 
            ? 'Posting...' 
            : postType === 'product' 
            ? 'List Product' 
            : 'Post'
          }
        </button>
      </div>
    </form>
  );
}