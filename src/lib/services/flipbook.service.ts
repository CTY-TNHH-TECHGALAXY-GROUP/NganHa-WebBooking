import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../api/apiError';

export interface FlipbookPage {
  id: string;
  page_number: number;
  title: string;
  media_url: string;
  media_type: 'image' | 'video';
  is_active: boolean;
  service_id?: string;
  created_at: string;
}

export class FlipbookService {
  constructor(private supabase: SupabaseClient) {}

  async getPages() {
    const { data, error } = await this.supabase
      .from('flipbook_pages')
      .select('*')
      .order('page_number', { ascending: true });

    if (error) {
      throw new ApiError(error.message, 'DB_ERROR', 500);
    }
    return data as FlipbookPage[];
  }

  async getPageById(id: string) {
    const { data, error } = await this.supabase
      .from('flipbook_pages')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw ApiError.NotFound('Page not found');
      throw new ApiError(error.message, 'DB_ERROR', 500);
    }
    return data as FlipbookPage;
  }

  async createPage(payload: Partial<FlipbookPage>) {
    const { data, error } = await this.supabase
      .from('flipbook_pages')
      .insert([payload])
      .select()
      .single();

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return data;
  }

  async updatePage(id: string, payload: Partial<FlipbookPage>) {
    const { data, error } = await this.supabase
      .from('flipbook_pages')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return data;
  }

  async deletePage(id: string) {
    const { error } = await this.supabase
      .from('flipbook_pages')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return true;
  }
}
