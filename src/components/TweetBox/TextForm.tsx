import React from 'react';

interface TextFormProps {
  content: string;
  onContentChange: (content: string) => void;
}

export default function TextForm({ content, onContentChange }: TextFormProps) {
  return (
    <textarea
      value={content}
      onChange={(e) => onContentChange(e.target.value)}
      placeholder="What's happening?"
      className="w-full bg-transparent text-white resize-none focus:outline-none text-xl min-h-[100px]"
      rows={3}
      required
    />
  );
}