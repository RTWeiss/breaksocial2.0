export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          status: 'active' | 'sold' | 'deleted';
          image_url: string | null;
          hashtags: string[] | null;
          views: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          seller_id: string;
          title: string;
          description: string;
          price: number;
          condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          status?: 'active' | 'sold' | 'deleted';
          image_url?: string | null;
          hashtags?: string[] | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          seller_id?: string;
          title?: string;
          description?: string;
          price?: number;
          condition?: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          status?: 'active' | 'sold' | 'deleted';
          image_url?: string | null;
          hashtags?: string[] | null;
          views?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          buyer_id: string;
          amount: number;
          status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          buyer_id: string;
          amount: number;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          listing_id?: string;
          buyer_id?: string;
          amount?: number;
          status?: 'pending' | 'accepted' | 'rejected' | 'cancelled';
          message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}