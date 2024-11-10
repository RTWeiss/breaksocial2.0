export interface Database {
  public: {
    Tables: {
      listings: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          title: string;
          description: string | null;
          price: number;
          condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          images: string[];
          seller_id: string;
          status: 'active' | 'sold' | 'deleted';
          category: string;
          views: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title: string;
          description?: string | null;
          price: number;
          condition: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          images?: string[];
          seller_id: string;
          status?: 'active' | 'sold' | 'deleted';
          category?: string;
          views?: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          title?: string;
          description?: string | null;
          price?: number;
          condition?: 'mint' | 'near_mint' | 'excellent' | 'good' | 'fair';
          images?: string[];
          seller_id?: string;
          status?: 'active' | 'sold' | 'deleted';
          category?: string;
          views?: number;
        };
      };
    };
  };
}