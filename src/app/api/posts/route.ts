import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('WebbookingBlogPosts')
      .select('id, slug, title, excerpt, content, cover_image, cover_type, category_i18n, read_time_i18n, cover_alt, created_at, published_at')
      .in('status', ['published', 'scheduled'])
      .lte('published_at', now)
      .order('published_at', { ascending: false })
      .limit(12);

    if (!error) return NextResponse.json(data || []);

    // The legacy table remains readable during the one-release migration window.
    if (error.code === '42P01' || /WebbookingBlogPosts/i.test(error.message || '')) {
      const legacy = await supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, content, cover_image, cover_type, category, read_time, created_at, published_at')
        .eq('status', 'published')
        .lte('published_at', now)
        .order('published_at', { ascending: false })
        .limit(12);

      if (legacy.error) throw legacy.error;
      return NextResponse.json((legacy.data || []).map((post: any) => ({
        ...post,
        category_i18n: { vi: post.category || '', en: post.category || '' },
        read_time_i18n: { vi: post.read_time || '', en: post.read_time || '' },
        cover_alt: {},
      })));
    }

    throw error;
  } catch (error) {
    console.error('Public posts API error:', error);
    return NextResponse.json([]);
  }
}
