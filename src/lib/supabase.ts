import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://jrbxskhyptdvurbxydxq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyYnhza2h5cHRkdnVyYnh5ZHhxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEwMzA5MDAsImV4cCI6MjA0NjYwNjkwMH0.jl8g7ShZ96mi0Km_gMIbmngwlCX-KQG1d52kpKnlOLs';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'break-app'
    }
  }
});