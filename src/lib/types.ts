export interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url: string;
  bio?: string;
  website?: string;
  created_at: string;
}

export interface Message {
  id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  sender_id: string;
  receiver_id: string;
  profiles: Profile;
}