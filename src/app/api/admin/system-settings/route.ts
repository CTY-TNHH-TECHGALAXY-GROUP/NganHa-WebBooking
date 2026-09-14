import { NextRequest, NextResponse } from 'next/server';
import { withCapabilities } from '@/lib/api/withAuth';
import { recordContentRevisions } from '@/lib/api/contentRevision';
import { authorizeCapability } from '@/lib/auth/adminCapabilities';
import { validateHomepageStyling, sanitizeHomepageStyling } from '@/lib/config/stylingSanitizer';
import { CTA_KEYS, normalizeReceptionEmail, sanitizeCtaLinks, validateConfigUrl } from '@/lib/config/urlSettings';
import { systemConfigRevision } from '@/lib/config/systemConfigRevision';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export const GET = withCapabilities(async (_request, access) => {
  const { supabase } = access;
  try {
    // Fetch editable site-content collections.
    const { data, error } = await supabase
      .from('SystemConfigs')
      .select('key, value')
      .in('key', [
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
      ]);

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
      blog_content: {},
      homepage_styling: null as unknown,
      local_tour_content: null as unknown,
      home_spa_content: null as unknown,
      farm_retreat_content: null as unknown,
      farm_store_content: null as unknown,
      revisions: {
        about_story_content: null as string | null,
        brand_history: null as string | null,
      },
    };

    if (data) {
      data.forEach((item: { key: string; value: any }) => {
        if (item.key === 'system_settings') result.system_settings = item.value;
        if (item.key === 'about_story_content') result.about_story_content = item.value;
        if (item.key === 'brand_history') result.brand_history = item.value;
        if (item.key === 'homepage_content') result.homepage_content = item.value;
        if (item.key === 'footer_content') result.footer_content = item.value;
        if (item.key === 'blog_content') result.blog_content = item.value;
        if (item.key === 'homepage_styling') result.homepage_styling = sanitizeHomepageStyling(item.value) ?? item.value;
        if (item.key === 'local_tour_content') result.local_tour_content = item.value;
        if (item.key === 'home_spa_content') result.home_spa_content = item.value;
        if (item.key === 'farm_retreat_content') result.farm_retreat_content = item.value;
        if (item.key === 'farm_store_content') result.farm_store_content = item.value;
      });

      for (const item of data) {
        if (item.key === 'about_story_content') result.revisions.about_story_content = systemConfigRevision(item.value ?? null);
        if (item.key === 'brand_history') result.revisions.brand_history = systemConfigRevision(item.value ?? null);
      }
    }

    const notificationAuthorization = await authorizeCapability(
      access,
      'notification_settings.manage',
    );
    if (!notificationAuthorization.allowed) {
      result.system_settings = isRecord(result.system_settings)
        ? { ...result.system_settings, receptionEmail: '' }
        : result.system_settings;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['content.read']);

export const POST = withCapabilities(async (request: NextRequest, access) => {
  const { supabase, user } = access;
  try {
    const {
      system_settings,
      about_story_content,
      brand_history,
      homepage_content,
      footer_content,
      blog_content,
      homepage_styling,
      local_tour_content,
      home_spa_content,
      farm_retreat_content,
      farm_store_content,
      expectedRevision,
    } = await request.json();

    const upsertData = [];
    let protectedContentMutation: {
      key: 'brand_history' | 'about_story_content';
      exists: boolean;
      value: Record<string, unknown> | null;
      nextValue: Record<string, unknown>;
    } | null = null;

    const hasUnprotectedMutation = [
      system_settings,
      homepage_content,
      footer_content,
      blog_content,
      homepage_styling,
      local_tour_content,
      home_spa_content,
      farm_retreat_content,
      farm_store_content,
    ].some(value => value !== undefined);
    const protectedMutationCount = Number(about_story_content !== undefined) + Number(brand_history !== undefined);
    if (protectedMutationCount > 1 || (protectedMutationCount > 0 && hasUnprotectedMutation)) {
      return NextResponse.json(
        { error: 'brand_history hoặc about_story_content phải được lưu trong một yêu cầu riêng để bảo toàn concurrent update.', code: 'VALIDATION_ERROR' },
        { status: 400 },
      );
    }

    if (isRecord(system_settings) && Object.prototype.hasOwnProperty.call(system_settings, 'receptionEmail')) {
      const notificationAuthorization = await authorizeCapability(
        access,
        'notification_settings.manage',
        { mutation: true },
      );
      if (!notificationAuthorization.allowed) {
        return NextResponse.json(
          { error: notificationAuthorization.error, code: notificationAuthorization.code },
          { status: notificationAuthorization.status },
        );
      }
    }

    if (system_settings !== undefined) {
      const { data: existingSettings } = await supabase
        .from('SystemConfigs')
        .select('value')
        .eq('key', 'system_settings')
        .maybeSingle();

      if (!isRecord(system_settings)) {
        return NextResponse.json({ error: 'system_settings must be an object' }, { status: 400 });
      }

      const previousSettings = isRecord(existingSettings?.value) ? existingSettings.value : {};
      const nextSettings: Record<string, unknown> = { ...previousSettings, ...system_settings };

      if ('ctaLinks' in system_settings) {
        if (!isRecord(system_settings.ctaLinks)) {
          return NextResponse.json({ error: 'ctaLinks must be an object' }, { status: 400 });
        }

        const previousCtaLinks = isRecord(previousSettings.ctaLinks) ? previousSettings.ctaLinks : {};
        const requestedCtaLinks = system_settings.ctaLinks;
        for (const key of CTA_KEYS) {
          if (!(key in requestedCtaLinks)) continue;
          const validation = validateConfigUrl(requestedCtaLinks[key]);
          if (!validation.isValid) {
            return NextResponse.json({ error: `Invalid ${key}: ${validation.error}` }, { status: 400 });
          }
        }
        nextSettings.ctaLinks = sanitizeCtaLinks({ ...previousCtaLinks, ...requestedCtaLinks });
      }

      if ('receptionEmail' in system_settings) {
        const receptionEmail = system_settings.receptionEmail;
        if (receptionEmail !== '') {
          const normalized = normalizeReceptionEmail(receptionEmail);
          if (!normalized) {
            return NextResponse.json({ error: 'Invalid receptionEmail' }, { status: 400 });
          }
          nextSettings.receptionEmail = normalized;
        } else {
          nextSettings.receptionEmail = '';
        }
      }

      upsertData.push({
        key: 'system_settings',
        value: nextSettings,
        updated_at: new Date().toISOString(),
      });
    }

    const protectedContent = brand_history !== undefined
      ? { key: 'brand_history' as const, value: brand_history }
      : about_story_content !== undefined
        ? { key: 'about_story_content' as const, value: about_story_content }
        : null;
    if (protectedContent) {
      if (!isRecord(protectedContent.value)) {
        return NextResponse.json({ error: `${protectedContent.key} must be an object` }, { status: 400 });
      }
      const { data: currentHistory, error: currentHistoryError } = await supabase
        .from('SystemConfigs')
        .select('value')
        .eq('key', protectedContent.key)
        .maybeSingle();
      if (currentHistoryError) {
        return NextResponse.json({ error: `Failed to read ${protectedContent.key}` }, { status: 500 });
      }
      const expectedHistoryRevision = typeof expectedRevision === 'string' ? expectedRevision : null;
      if (expectedHistoryRevision && systemConfigRevision(currentHistory?.value ?? null) !== expectedHistoryRevision) {
        return NextResponse.json(
          { error: 'Nội dung đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', code: 'CONTENT_CONFLICT' },
          { status: 409 },
        );
      }
      protectedContentMutation = {
        key: protectedContent.key,
        exists: Boolean(currentHistory),
        value: isRecord(currentHistory?.value) ? currentHistory.value : null,
        nextValue: protectedContent.value,
      };
    }

    if (homepage_content !== undefined) {
      upsertData.push({
        key: 'homepage_content',
        value: homepage_content,
        updated_at: new Date().toISOString(),
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
        updated_at: new Date().toISOString(),
      });
    }

    if (blog_content !== undefined) {
      upsertData.push({
        key: 'blog_content',
        value: blog_content,
        updated_at: new Date().toISOString(),
      });
    }

    if (homepage_styling !== undefined) {
      if (homepage_styling === null) {
        upsertData.push({
          key: 'homepage_styling',
          value: null,
          updated_at: new Date().toISOString(),
        });
      } else {
        const validation = validateHomepageStyling(homepage_styling);
        if (!validation.isValid || !validation.sanitized) {
          return NextResponse.json(
            { error: `Invalid homepage_styling: ${validation.errors.join(', ')}` },
            { status: 400 },
          );
        }

        upsertData.push({
          key: 'homepage_styling',
          value: validation.sanitized,
          updated_at: new Date().toISOString(),
        });
      }
    }

    if (local_tour_content !== undefined) {
      upsertData.push({
        key: 'local_tour_content',
        value: local_tour_content,
        updated_at: new Date().toISOString(),
      });
    }

    if (home_spa_content !== undefined) {
      upsertData.push({
        key: 'home_spa_content',
        value: home_spa_content,
        updated_at: new Date().toISOString(),
      });
    }

    if (farm_retreat_content !== undefined) {
      upsertData.push({
        key: 'farm_retreat_content',
        value: farm_retreat_content,
        updated_at: new Date().toISOString(),
      });
    }

    if (farm_store_content !== undefined) {
      upsertData.push({
        key: 'farm_store_content',
        value: farm_store_content,
        updated_at: new Date().toISOString(),
      });
    }

    if (upsertData.length > 0) {
      const { data: previous } = await supabase
        .from('SystemConfigs')
        .select('key, value')
        .in('key', upsertData.map((item) => item.key));

      await recordContentRevisions(
        supabase,
        (previous || []).map((item: { key: string; value: Record<string, unknown> | unknown[] }) => ({
          content_key: `SystemConfigs:${item.key}`,
          payload: item.value,
          changed_by: user.id,
        })),
      );

      const { error } = await supabase
        .from('SystemConfigs')
        .upsert(upsertData, { onConflict: 'key' });

      if (error) {
        console.error('Error updating system settings:', error);
        return NextResponse.json({ error: 'Failed to update system settings' }, { status: 500 });
      }
    }

    if (protectedContentMutation) {
      const { data, error } = await supabase.rpc('webbooking_compare_and_swap_system_config', {
        p_key: protectedContentMutation.key,
        p_expected_exists: protectedContentMutation.exists,
        p_expected_value: protectedContentMutation.value,
        p_next_value: protectedContentMutation.nextValue,
      });
      if (error) {
        return NextResponse.json({ error: `Failed to atomically update ${protectedContentMutation.key}` }, { status: 500 });
      }
      const updated = Array.isArray(data) ? data[0] : data;
      if (!updated || typeof updated !== 'object' || !Object.prototype.hasOwnProperty.call(updated, 'value')) {
        return NextResponse.json(
          { error: 'Nội dung đã được thay đổi ở cửa sổ khác. Bản nháp của bạn vẫn được giữ lại.', code: 'CONTENT_CONFLICT' },
          { status: 409 },
        );
      }
      await recordContentRevisions(supabase, protectedContentMutation.exists && protectedContentMutation.value ? [{
        content_key: `SystemConfigs:${protectedContentMutation.key}`,
        payload: protectedContentMutation.value,
        changed_by: user.id,
      }] : []);
    }

    try {
      const { revalidatePath } = require('next/cache');
      revalidatePath('/', 'layout');
      revalidatePath('/');
      revalidatePath('/history');
      revalidatePath('/[lang]', 'layout');
      revalidatePath('/local-tour', 'layout');
      revalidatePath('/[lang]/local-tour', 'layout');
      revalidatePath('/[lang]/local-tour/[packageSlug]', 'page');
      revalidatePath('/local-tour/[packageSlug]', 'page');
      revalidatePath('/oriahome', 'layout');
      revalidatePath('/[lang]/oriahome', 'layout');
      revalidatePath('/oriafarm-retreat', 'layout');
      revalidatePath('/[lang]/oriafarm-retreat', 'layout');
      revalidatePath('/oriafarm-store', 'layout');
      revalidatePath('/[lang]/oriafarm-store', 'layout');
      revalidatePath('/api/public/site-content');
    } catch (e) {
      console.error('Revalidation error:', e);
    }

    return NextResponse.json({
      success: true,
      data: protectedContentMutation ? { revision: systemConfigRevision(protectedContentMutation.nextValue) } : undefined,
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}, ['content.write', 'content.publish'], { mutation: true });
