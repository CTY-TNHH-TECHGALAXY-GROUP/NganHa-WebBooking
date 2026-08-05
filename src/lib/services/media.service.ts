import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../api/apiError';

export class MediaService {
  constructor(private supabase: SupabaseClient) {}

  async uploadFile(file: File, path: string) {
    const { data, error } = await this.supabase
      .storage
      .from('media-uploads')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      throw new ApiError(error.message, 'UPLOAD_ERROR', 500);
    }

    const { data: { publicUrl } } = this.supabase
      .storage
      .from('media-uploads')
      .getPublicUrl(data.path);

    return publicUrl;
  }

  async deleteFile(path: string) {
    const { error } = await this.supabase
      .storage
      .from('media-uploads')
      .remove([path]);

    if (error) {
      throw new ApiError(error.message, 'DELETE_ERROR', 500);
    }

    return true;
  }
}
