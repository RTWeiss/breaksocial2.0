import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export function useSupabaseQuery<T>(
  query: () => Promise<{ data: T | null; error: any }>,
  deps: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await query();
        
        if (error) {
          throw error;
        }
        
        setData(data);
      } catch (err: any) {
        setError(err);
        toast.error(err.message || 'An error occurred while fetching data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, deps);

  return { data, loading, error };
}

export function useSupabaseMutation<T>(
  mutation: () => Promise<{ data: T | null; error: any }>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await mutation();
      
      if (error) {
        throw error;
      }
      
      setData(data);
      return data;
    } catch (err: any) {
      setError(err);
      toast.error(err.message || 'An error occurred');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, data, loading, error };
}