import React from 'react';
import ImageUpload from '../ImageUpload';

interface ImageFormProps {
  content: string;
  onContentChange: (content: string) => void;
  imageUrl: string;
  onImageChange: (url: string) => void;
}

export default function ImageForm({
  content,
  onContentChange,
  imageUrl,
  onImageChange,
}: ImageFormProps) {
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