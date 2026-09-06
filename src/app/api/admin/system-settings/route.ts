import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/withAuth';
import { recordContentRevisions } from '@/lib/api/contentRevision';

export const GET = withAuth(async (_request, { supabase }) => {
  try {
    
    // Fetch editable site-content collections.
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('key, value')
      .in('key', ['system_settings', 'about_story_content', 'brand_history', 'homepage_content', 'footer_content', 'blog_content']);

    if (error) {
      console.error('Error fetching system settings:', error);
      return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
    }

    const result = {
      system_settings: {},
      about_story_content: {},
      brand_history: [],
      homepage_content: {},
      footer_content: {},
      blog_content: {}
    };

    if (data) {
      data.forEach((item: { key: string; value: any }) => {
        if (item.key === 'system_settings') result.system_settings = item.value;
        if (item.key === 'about_story_content') result.about_story_content = item.value;
        if (item.key === 'brand_history') result.brand_history = item.value;
        if (item.key === 'homepage_content') result.homepage_content = item.value;
        if (item.key === 'footer_content') result.footer_content = item.value;
        if (item.key === 'blog_content') result.blog_content = item.value;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const POST = withAuth(async (request: NextRequest, { supabase, user }) => {
  try {
    const { system_settings, about_story_content, brand_history, homepage_content, footer_content, blog_content } = await request.json();

    const upsertData = [];

    if (system_settings !== undefined) {
      const { data: existingSettings } = await supabase
        .from('SystemConfigs')
        .select('value')
        .eq('key', 'system_settings')
        .maybeSingle();

      upsertData.push({
        key: 'system_settings',
        value: { ...(existingSettings?.value || {}), ...system_settings },
        updated_at: new Date().toISOString()
      });
    }

    if (about_story_content !== undefined) {
      upsertData.push({
        key: 'about_story_content',
        value: about_story_content,
        updated_at: new Date().toISOString()
      });
    }

    if (brand_history !== undefined) {
      upsertData.push({
        key: 'brand_history',
        value: brand_history,
        updated_at: new Date().toISOString()
      });
    }
    
    if (homepage_content !== undefined) {
      upsertData.push({
        key: 'homepage_content',
        value: homepage_content,
        updated_at: new Date().toISOString()
      });
    }

    if (footer_content !== undefined) {
      const { data: existingFooter } = await supabase
        .from('SystemConfigs')
        .select('value')
        .eq('key', 'footer_content')
        .maybeSingle();

      upsertData.push({
        key: 'footer_content',
        value: { ...(existingFooter?.value || {}), ...footer_content },
        updated_at: new Date().toISOString()
      });
    }

    if (blog_content !== undefined) {
      upsertData.push({
        key: 'blog_content',
        value: blog_content,
        updated_at: new Date().toISOString()
      });
    }

    if (upsertData.length > 0) {
      const { data: previous } = await supabase
        .from('SystemConfigs')
        .select('key, value')
        .in('key', upsertData.map(item => item.key));

      await recordContentRevisions(supabase, (previous || []).map((item: { key: string; value: Record<string, unknown> | unknown[] }) => ({
        content_key: `SystemConfigs:${item.key}`,
        payload: item.value,
        changed_by: user.id,
      })));

      const { error } = await supabase
        .from('SystemConfigs')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) {
        console.error('Error updating system settings:', error);
        return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 });
      }
    }

    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/[lang]', 'layout');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});
