import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import LoadingSpinner from '../components/LoadingSpinner';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at: string | null;
  sender: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
  receiver: {
    id: string;
    username: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export default function Messages() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sellerId = searchParams.get('seller');
  const senderId = searchParams.get('sender');
  const listingId = searchParams.get('listing');

  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<Map<string, Message[]>>(new Map());
  const [profiles, setProfiles] = useState<Map<string, any>>(new Map());
  const [selectedUserId, setSelectedUserId] = useState<string | null>(sellerId || senderId || null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastMessageId, setLastMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const selectedConversationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      fetchMessages();
      const unsubscribe = subscribeToMessages();
      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  useEffect(() => {
    if (senderId) {
      setSelectedUserId(senderId);
    }
  }, [senderId]);

  useEffect(() => {
    if (selectedUserId) {
      const messages = conversations.get(selectedUserId);
      if (messages?.length) {
        const lastMessage = messages[messages.length - 1];
        if (lastMessage.id !== lastMessageId) {
          setLastMessageId(lastMessage.id);
          scrollToBottom();
        }
      }
    }
  }, [conversations, selectedUserId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: 'smooth',
        block: 'end'
      });
    }
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          read_at,
          sender_id,
          receiver_id,
          sender:profiles!messages_sender_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          ),
          receiver:profiles!messages_receiver_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${user?.id},receiver_id.eq.${user?.id}`)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const conversationsMap = new Map<string, Message[]>();
      const profilesMap = new Map<string, any>();

      messages?.forEach((message: Message) => {
        const otherId = message.sender_id === user?.id ? message.receiver_id : message.sender_id;
        const otherProfile = message.sender_id === user?.id ? message.receiver : message.sender;

        if (otherProfile) {
          profilesMap.set(otherId, otherProfile);
        }

        const existing = conversationsMap.get(otherId) || [];
        conversationsMap.set(otherId, [...existing, message]);
      });

      setConversations(conversationsMap);
      setProfiles(profilesMap);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${user?.id},receiver_id=eq.${user?.id}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: newMessage.trim(),
          sender_id: user.id,
          receiver_id: selectedUserId,
          listing_id: listingId || null,
        });

      if (error) throw error;

      setNewMessage('');
      await fetchMessages();
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = Array.from(conversations.entries())
    .filter(([userId]) => {
      const profile = profiles.get(userId);
      return (
        profile &&
        (profile.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    })
    .map(([userId, messages]) => ({
      userId,
      profile: profiles.get(userId),
      messages,
      lastMessage: messages[messages.length - 1],
    }));

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="max-w-full h-[calc(100vh-64px)] flex">
      <div className="w-full lg:w-96 border-r border-gray-800 flex flex-col">
        <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
          <div className="px-4 py-3">
            <h1 className="text-xl font-bold">Messages</h1>
          </div>
        </header>

        <div className="p-4">
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search messages"
              className="w-full bg-gray-900 text-white rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-500" />
          </div>

          <div className="space-y-1">
            {filteredConversations.map(({ userId, profile, lastMessage }) => (
              <button
                key={userId}
                onClick={() => setSelectedUserId(userId)}
                className={`w-full text-left p-3 hover:bg-gray-900 rounded-lg transition flex items-center space-x-3 ${
                  selectedUserId === userId ? 'bg-gray-900' : ''
                }`}
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {profile.full_name?.[0]?.toUpperCase() || profile.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-white font-semibold truncate">
                      {profile.full_name || profile.username}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(lastMessage.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm truncate">@{profile.username}</p>
                  <p className="text-gray-400 text-sm truncate">{lastMessage.content}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col flex-1">
        {selectedUserId ? (
          <>
            <header className="sticky top-0 z-10 bg-black/80 backdrop-blur-sm border-b border-gray-800">
              <div className="px-4 py-3 flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                  {profiles.get(selectedUserId)?.full_name?.[0]?.toUpperCase() ||
                    profiles.get(selectedUserId)?.username?.[0]?.toUpperCase()}
                </div>
                <div>
                  <h2 className="font-bold">
                    {profiles.get(selectedUserId)?.full_name ||
                      profiles.get(selectedUserId)?.username}
                  </h2>
                  <p className="text-sm text-gray-500">
                    @{profiles.get(selectedUserId)?.username}
                  </p>
                </div>
              </div>
            </header>

            <div className="flex-1 p-4 overflow-y-auto" ref={selectedConversationRef}>
              <div className="flex flex-col space-y-4">
                {conversations.get(selectedUserId)?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender_id === user?.id ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        message.sender_id === user?.id
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-800 text-white'
                      }`}
                    >
                      <p>{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-800">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-900 text-white rounded-full py-2 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="bg-purple-500 text-white px-6 rounded-full hover:bg-purple-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Send
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}