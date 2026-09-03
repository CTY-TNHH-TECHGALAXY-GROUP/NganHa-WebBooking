import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = getSupabaseAdmin();
    
    // Fetch system_settings, about_story_content, brand_history, homepage_content
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('key, value')
      .in('key', ['system_settings', 'about_story_content', 'brand_history', 'homepage_content', 'footer_content']);

    if (error) {
      console.error('Error fetching system settings:', error);
      return NextResponse.json({ error: 'Failed to fetch system settings' }, { status: 500 });
    }

    const result = {
      system_settings: {},
      about_story_content: {},
      brand_history: [],
      homepage_content: {},
      footer_content: {}
    };

    if (data) {
      data.forEach(item => {
        if (item.key === 'system_settings') result.system_settings = item.value;
        if (item.key === 'about_story_content') result.about_story_content = item.value;
        if (item.key === 'brand_history') result.brand_history = item.value;
        if (item.key === 'homepage_content') result.homepage_content = item.value;
        if (item.key === 'footer_content') result.footer_content = item.value;
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { system_settings, about_story_content, brand_history, homepage_content, footer_content } = await request.json();
    const supabase = getSupabaseAdmin();

    const upsertData = [];

    if (system_settings !== undefined) {
      upsertData.push({
        key: 'system_settings',
        value: system_settings,
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
      upsertData.push({
        key: 'footer_content',
        value: footer_content,
        updated_at: new Date().toISOString()
      });
    }

    if (upsertData.length > 0) {
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
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
