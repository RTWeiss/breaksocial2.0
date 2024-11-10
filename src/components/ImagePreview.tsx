import React, { useState } from 'react';
import { Package, ImageOff } from 'lucide-react';

interface ImagePreviewProps {
  src: string | null;
  alt?: string;
  className?: string;
  objectFit?: 'cover' | 'contain';
  fallbackText?: string;
}

export default function ImagePreview({ 
  src, 
  alt = '', 
  className = '',
  objectFit = 'cover',
  fallbackText
}: ImagePreviewProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className={`bg-gradient-to-r from-gray-800 to-gray-900 flex flex-col items-center justify-center ${className}`}>
        {hasError ? (
          <>
            <ImageOff className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-500">Failed to load image</span>
          </>
        ) : (
          <>
            <Package className="w-8 h-8 text-gray-500 mb-2" />
            <span className="text-sm text-gray-500">{fallbackText || 'No image available'}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-gray-800 ${className}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-${objectFit}`}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    </div>
  );
}