import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HashtagTextProps {
  text: string;
}

export default function HashtagText({ text }: HashtagTextProps) {
  const navigate = useNavigate();

  const handleHashtagClick = (hashtag: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/explore?q=%23${encodeURIComponent(hashtag)}`);
  };

  const renderText = () => {
    const words = text.split(' ');
    return words.map((word, index) => {
      if (word.startsWith('#')) {
        const hashtag = word.substring(1);
        return (
          <span key={index}>
            <span 
              className="text-purple-500 hover:underline cursor-pointer" 
              onClick={(e) => handleHashtagClick(hashtag, e)}
            >
              {word}
            </span>
            {' '}
          </span>
        );
      }
      return word + ' ';
    });
  };

  return <div>{renderText()}</div>;
}