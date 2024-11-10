import React from 'react';
import { Link } from 'react-router-dom';

interface UserLinkProps {
  userId: string;
  username: string;
  fullName?: string | null;
  className?: string;
}

export default function UserLink({ userId, username, fullName, className = '' }: UserLinkProps) {
  return (
    <Link 
      to={`/profile/${userId}`}
      className={`hover:underline ${className}`}
    >
      <span className="font-bold">{fullName || username}</span>
      <span className="text-gray-500 ml-1">@{username}</span>
    </Link>
  );
}