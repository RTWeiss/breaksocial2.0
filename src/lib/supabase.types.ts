export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          created_at: string
          content: string
          sender_id: string
          receiver_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          content: string
          sender_id: string
          receiver_id: string
        }
        Update: {
          id?: string
          created_at?: string
          content?: string
          sender_id?: string
          receiver_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
        }
        Insert: {
          id: string
          created_at?: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
        }
      }
    }
  }
}