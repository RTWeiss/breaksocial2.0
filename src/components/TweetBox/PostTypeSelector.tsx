import React from 'react';
import { MessageCircle, Image, Package } from 'lucide-react';

type PostType = 'text' | 'image' | 'product';

interface PostTypeSelectorProps {
  postType: PostType;
  onTypeChange: (type: PostType) => void;
}

export default function PostTypeSelector({ postType, onTypeChange }: PostTypeSelectorProps) {
  return (
    <div className="flex space-x-2 mb-4">
      <button
        type="button"
        onClick={() => onTypeChange('text')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
          postType === 'text' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
        }`}
      >
        <MessageCircle className="w-5 h-5" />
        <span>Text</span>
      </button>
      <button
        type="button"
        onClick={() => onTypeChange('image')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
          postType === 'image' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
        }`}
      >
        <Image className="w-5 h-5" />
        <span>Image</span>
      </button>
      <button
        type="button"
        onClick={() => onTypeChange('product')}
        className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg transition ${
          postType === 'product' ? 'bg-purple-500/10 text-purple-500' : 'bg-gray-800 text-gray-400'
        }`}
      >
        <Package className="w-5 h-5" />
        <span>Product</span>
      </button>
    </div>
  );
}