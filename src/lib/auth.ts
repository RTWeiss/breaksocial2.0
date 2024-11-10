import { supabase } from './supabase';
import type { Database } from './supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export async function createOrUpdateProfile(
  userId: string,
  data: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(
        {
          id: userId,
          ...data,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'id',
          ignoreDuplicates: false,
        }
      )
      .select('*')
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error creating/updating profile:', error);
    return null;
  }
}

export async function getProfile(userId: string): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error loading profile:', error);
    return null;
  }
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<Profile | null> {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('*')
      .single();

    if (error) throw error;
    return profile;
  } catch (error) {
    console.error('Error updating profile:', error);
    return null;
  }
}