import React from 'react';
import ImageUpload from '../ImageUpload';

interface ImagePostProps {
  content: string;
  imageUrl: string;
  onContentChange: (content: string) => void;
  onImageChange: (url: string) => void;
}

export default function ImagePost({
  content,
  imageUrl,
  onContentChange,
  onImageChange,
}: ImagePostProps) {
  return (
    <div className="space-y-4">
      <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/50">
        <ImageUpload
          onUpload={onImageChange}
          folder="tweets"
          currentImage={imageUrl}
          onRemove={() => onImageChange('')}
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => onContentChange(e.target.value)}
        placeholder="Add a caption..."
        className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
        rows={3}
        required
      />
    </div>
  );
}