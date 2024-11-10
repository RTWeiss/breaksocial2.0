import React from 'react';
import ImageUpload from './ImageUpload';

interface MarketplaceFormProps {
  content: string;
  listingData: {
    title: string;
    price: string;
    condition: string;
  };
  imageUrl: string;
  onContentChange: (content: string) => void;
  onListingDataChange: (data: any) => void;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
}

export default function MarketplaceForm({
  content,
  listingData,
  imageUrl,
  onContentChange,
  onListingDataChange,
  onImageUpload,
  onImageRemove,
}: MarketplaceFormProps) {
  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Item title"
        value={listingData.title}
        onChange={(e) => onListingDataChange({ ...listingData, title: e.target.value })}
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
            onChange={(e) => onListingDataChange({ ...listingData, price: e.target.value })}
            className="w-full pl-8 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />
        </div>
        <select
          value={listingData.condition}
          onChange={(e) => onListingDataChange({ ...listingData, condition: e.target.value })}
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
          required
        >
          <option value="mint">Mint</option>
          <option value="near_mint">Near Mint</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
        </select>
      </div>

      <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Product Image (Required)</h3>
        <ImageUpload
          onUpload={onImageUpload}
          folder="listings"
          currentImage={imageUrl}
          onRemove={onImageRemove}
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Describe your item..."
        className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
        rows={3}
        required
      />
    </div>
  );
}