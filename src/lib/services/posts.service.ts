import { SupabaseClient } from '@supabase/supabase-js';
import { ApiError } from '../api/apiError';

export interface BlogPost {
  id: string;
  slug: string;
  title: Record<string, string>;
  content: Record<string, string>;
  excerpt: Record<string, string>;
  cover_image: string | null;
  category: string;
  status: 'draft' | 'published';
  author: string | null;
  read_time: string | null;
  seo_metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export class PostsService {
  constructor(private supabase: SupabaseClient) {}

  async getPosts() {
    const { data, error } = await this.supabase
      .from('content_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new ApiError(error.message, 'DB_ERROR', 500);
    }
    return data as BlogPost[];
  }

  async getPostById(id: string) {
    const { data, error } = await this.supabase
      .from('content_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') throw ApiError.NotFound('Post not found');
      throw new ApiError(error.message, 'DB_ERROR', 500);
    }
    return data as BlogPost;
  }

  async createPost(payload: Partial<BlogPost>) {
    const { data, error } = await this.supabase
      .from('content_posts')
      .insert([payload])
      .select()
      .single();

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return data;
  }

  async updatePost(id: string, payload: Partial<BlogPost>) {
    const { data, error } = await this.supabase
      .from('content_posts')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return data;
  }

  async deletePost(id: string) {
    const { error } = await this.supabase
      .from('content_posts')
      .delete()
      .eq('id', id);

    if (error) throw new ApiError(error.message, 'DB_ERROR', 500);
    return true;
  }
}
