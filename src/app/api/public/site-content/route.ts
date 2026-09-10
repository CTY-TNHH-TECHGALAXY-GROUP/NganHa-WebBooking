import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sanitizePublicSiteContent } from '@/lib/config/siteContentSanitizer';

export const dynamic = 'force-dynamic';

const SYSTEM_CONFIG_KEYS = [
  'system_settings',
  'about_story_content',
  'brand_history',
  'homepage_content',
  'footer_content',
  'blog_content',
  'homepage_styling',
  'local_tour_content',
  'home_spa_content',
  'farm_retreat_content',
  'farm_store_content',
] as const;

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: configs, error: configError }, { data: content, error: contentError }] = await Promise.all([
      supabase.from('SystemConfigs').select('key, value').in('key', SYSTEM_CONFIG_KEYS),
      supabase.from('WebBookingContent').select('key, value'),
    ]);

    if (configError) throw configError;
    if (contentError) throw contentError;

    const systemConfigs = (configs || []).reduce<Record<string, unknown>>((result, item) => {
      result[item.key] = item.value;
      return result;
    }, {});
    const webBookingContent = (content || []).reduce<Record<string, unknown>>((result, item) => {
      result[item.key] = item.value;
      return result;
    }, {});

    const sanitizedPayload = sanitizePublicSiteContent({
      systemConfigs,
      webBookingContent,
    });

    return NextResponse.json(sanitizedPayload, {
      headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' },
    });
  } catch (error) {
    console.error('[public/site-content] Failed to load:', error);
    return NextResponse.json({ error: 'Unable to load site content' }, { status: 500 });
  }
}
