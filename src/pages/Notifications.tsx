import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { formatDistanceToNow } from 'date-fns';
import { Package, MessageCircle, Heart, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { useSupabaseQuery } from '../hooks/useSupabase';

interface Notification {
  id: string;
  type: string;
  message: string;
  data: {
    listing_id?: string;
    offer_id?: string;
    sender_id?: string;
  };
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: notifications, loading, error } = useSupabaseQuery<Notification[]>(
    () =>
      supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false }),
    [user?.id]
  );

  useEffect(() => {
    if (notifications?.length) {
      markNotificationsAsRead();
    }
  }, [notifications]);

  const markNotificationsAsRead = async () => {
    try {
      const unreadIds = notifications
        ?.filter(n => !n.read)
        .map(n => n.id);

      if (!unreadIds?.length) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    try {
      if (notification.type === 'new_offer' && notification.data?.sender_id) {
        // Navigate to messages with the sender
        navigate(`/messages?sender=${notification.data.sender_id}&listing=${notification.data.listing_id}`);
      } else if (notification.type === 'new_message') {
        navigate('/messages');
      } else if (notification.type === 'listing' && notification.data?.listing_id) {
        navigate(`/marketplace/${notification.data.listing_id}`);
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error('Failed to navigate to notification content');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_offer':
        return <DollarSign className="h-5 w-5 text-green-500" />;
      case 'new_message':
        return <MessageCircle className="h-5 w-5 text-blue-500" />;
      case 'like':
        return <Heart className="h-5 w-5 text-red-500" />;
      case 'listing':
        return <Package className="h-5 w-5 text-purple-500" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Failed to load notifications. Please try again later.
      </div>
    );
  }

  return (
    <div>
      <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">Notifications</h1>
        </div>
      </header>

      <div className="divide-y divide-gray-800">
        {notifications?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Package className="h-8 w-8 mx-auto mb-4 opacity-50" />
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications?.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 hover:bg-gray-900/50 transition cursor-pointer ${
                !notification.read ? 'bg-gray-900/25' : ''
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300">{notification.message}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}