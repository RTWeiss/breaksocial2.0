import React from 'react';
import { ImagePlus } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface RegularTweetFormProps {
  content: string;
  imageUrl: string;
  onContentChange: (content: string) => void;
  onImageUpload: (url: string) => void;
  onImageRemove: () => void;
}

export default function RegularTweetForm({
  content,
  imageUrl,
  onContentChange,
  onImageUpload,
  onImageRemove,
}: RegularTweetFormProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => imageUrl ? onImageRemove() : onImageUpload('pending')}
          className={`p-2 rounded-full transition ${
            imageUrl ? 'text-purple-500 bg-purple-500/10' : 'text-purple-500 hover:bg-purple-500/10'
          }`}
        >
          <ImagePlus className="w-5 h-5" />
        </button>
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="What's happening?"
        className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
        rows={3}
      />

      {imageUrl && (
        <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
          <ImageUpload
            onUpload={onImageUpload}
            folder="tweets"
            currentImage={imageUrl}
            onRemove={onImageRemove}
          />
        </div>
      )}
    </div>
  );
}