import React, { useState } from 'react';
import { Send, Package, ImagePlus, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import TextForm from './TextForm';
import ImageForm from './ImageForm';
import ProductForm from './ProductForm';

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
        // Create regular tweet or image tweet
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
          <ImagePlus className="w-5 h-5" />
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

      {/* Form Content */}
      {postType === 'text' && (
        <TextForm
          content={content}
          onContentChange={setContent}
        />
      )}

      {postType === 'image' && (
        <ImageForm
          content={content}
          onContentChange={setContent}
          imageUrl={imageUrl}
          onImageChange={setImageUrl}
        />
      )}

      {postType === 'product' && (
        <ProductForm
          content={content}
          imageUrl={imageUrl}
          productData={productData}
          onContentChange={setContent}
          onImageChange={setImageUrl}
          onProductDataChange={setProductData}
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
          className="bg-purple-500 text-white px-6 py-2 rounded-full font-bold hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
              <span>Posting...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>{postType === 'product' ? 'List Product' : 'Post'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}