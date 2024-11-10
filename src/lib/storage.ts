import { supabase } from './supabase';

const BUCKET_NAME = 'images';

export async function uploadFile(file: File, options: { folder?: string } = {}): Promise<string> {
  try {
    // Validate file
    if (!file) throw new Error('No file provided');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only images are allowed.');
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new Error('File size must be less than 5MB');
    }

    // Generate unique file path
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filePath = `${options.folder || 'uploads'}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

    // Upload file
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;
    if (!data?.path) throw new Error('Upload failed - no path returned');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path);

    if (!publicUrl) throw new Error('Failed to get public URL');

    return publicUrl;
  } catch (error: any) {
    console.error('Upload error:', error);
    throw error;
  }
}

export async function deleteFile(path: string): Promise<void> {
  try {
    if (!path) throw new Error('No file path provided');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) throw error;
  } catch (error: any) {
    console.error('Delete error:', error);
    throw error;
  }
}