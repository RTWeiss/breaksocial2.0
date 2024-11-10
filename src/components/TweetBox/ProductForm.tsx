import React from 'react';
import ImageUpload from '../ImageUpload';

interface ProductFormProps {
  content: string;
  imageUrl: string;
  productData: {
    title: string;
    price: string;
    condition: string;
  };
  onContentChange: (content: string) => void;
  onImageChange: (url: string) => void;
  onProductDataChange: (data: any) => void;
}

export default function ProductForm({
  content,
  imageUrl,
  productData,
  onContentChange,
  onImageChange,
  onProductDataChange,
}: ProductFormProps) {
  return (
    <div className="space-y-4">
      <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
        <h3 className="text-sm font-medium text-gray-300 mb-3">Product Image (Required)</h3>
        <ImageUpload
          onUpload={onImageChange}
          folder="listings"
          currentImage={imageUrl}
          onRemove={() => onImageChange('')}
        />
      </div>

      <input
        type="text"
        placeholder="Product title"
        value={productData.title}
        onChange={(e) => onProductDataChange({ ...productData, title: e.target.value })}
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
            onChange={(e) => onProductDataChange({ ...productData, price: e.target.value })}
            className="w-full pl-8 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
            required
          />
        </div>

        <select
          value={productData.condition}
          onChange={(e) => onProductDataChange({ ...productData, condition: e.target.value })}
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-800 rounded-lg text-white focus:outline-none focus:border-purple-500"
        >
          <option value="mint">Mint</option>
          <option value="near_mint">Near Mint</option>
          <option value="excellent">Excellent</option>
          <option value="good">Good</option>
          <option value="fair">Fair</option>
        </select>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Describe your product..."
        className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
        rows={3}
        required
      />
    </div>
  );
}