import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read_at: string | null;
}

interface Profile {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface MessagesState {
  conversations: Map<string, Message[]>;
  profiles: Map<string, Profile>;
  loading: boolean;
  error: Error | null;
  sendMessage: (receiverId: string, content: string) => Promise<void>;
  fetchMessages: (userId: string) => Promise<void>;
  subscribeToMessages: (userId: string) => () => void;
}

export const useMessagesStore = create<MessagesState>((set, get) => ({
  conversations: new Map(),
  profiles: new Map(),
  loading: false,
  error: null,

  sendMessage: async (receiverId: string, content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
        });

      if (error) throw error;

      // Fetch messages to update the UI
      await get().fetchMessages(user.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  },

  fetchMessages: async (userId: string) => {
    try {
      set({ loading: true, error: null });

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, username, full_name, avatar_url),
          receiver:receiver_id(id, username, full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      // Group messages by conversation
      const conversationsMap = new Map<string, Message[]>();
      const profilesMap = new Map<string, Profile>();

      messages?.forEach((message: any) => {
        const otherId = message.sender_id === userId ? message.receiver_id : message.sender_id;
        const otherProfile = message.sender_id === userId ? message.receiver : message.sender;

        if (otherProfile) {
          profilesMap.set(otherId, otherProfile);
        }

        const existing = conversationsMap.get(otherId) || [];
        conversationsMap.set(otherId, [...existing, message]);
      });

      set({
        conversations: conversationsMap,
        profiles: profilesMap,
        loading: false,
      });
    } catch (error: any) {
      console.error('Error fetching messages:', error);
      set({ error, loading: false });
      toast.error('Failed to load messages');
    }
  },

  subscribeToMessages: (userId: string) => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `sender_id=eq.${userId},receiver_id=eq.${userId}`,
        },
        () => {
          get().fetchMessages(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));