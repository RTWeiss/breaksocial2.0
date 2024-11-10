import React from 'react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    description: string;
    data: any;
    created_at: string;
    read: boolean;
  };
  onRead: (id: string) => void;
}

export default function NotificationItem({ notification, onRead }: NotificationItemProps) {
  const handleClick = () => {
    if (!notification.read) {
      onRead(notification.id);
    }
  };

  return (
    <div 
      className={`p-4 border-b ${notification.read ? 'bg-white' : 'bg-blue-50'} hover:bg-gray-50 cursor-pointer`}
      onClick={handleClick}
    >
      <h3 className="font-semibold text-lg">{notification.title}</h3>
      <p className="text-gray-600">{notification.description}</p>
      <p className="text-sm text-gray-500 mt-2">
        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
      </p>
    </div>
  );
}