import { NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { withAuth } from '@/lib/api/withAuth';
import { apiResponse } from '@/lib/api/apiResponse';
import { recordContentRevisions } from '@/lib/api/contentRevision';
import { hasSeoAeoCapability } from '@/lib/seo/capabilities';
import { getSeoConfigSnapshot, saveSeoConfigIfCurrent } from '@/lib/seo/config';
import { isSupportedSeoLocale, isValidSeoRouteKey, validateAeoFields, validateSeoFields } from '@/lib/seo/validation';
import { AEO_CAPABILITIES, SEO_CAPABILITIES, type ContentStatus, type SeoConfig } from '@/lib/seo/types';

type Section = 'seo' | 'aeo';

function revisionToken(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}

function sectionFrom(value: unknown): Section | null {
  return value === 'seo' || value === 'aeo' ? value : null;
}

function getSectionDocument(config: SeoConfig, section: Section) {
  return section === 'seo'
    ? { version: config.version, global: config.global, pages: config.pages }
    : { version: config.version, pages: config.aeo };
}

function revalidateSeoRoute(routeKey: string, locale: string) {
  const paths = routeKey === 'home' || routeKey === 'global'
    ? ['/', `/${locale}`]
    : routeKey === 'local-tour-detail'
      ? [`/${locale}/local-tour`, '/local-tour']
      : [`/${locale}/${routeKey}`, `/${routeKey}`];
  for (const path of paths) {
    try { revalidatePath(path); } catch (error) { console.warn('[seo] Unable to revalidate path:', path, error); }
  }
  try { revalidatePath('/sitemap.xml'); } catch (error) { console.warn('[seo] Unable to revalidate sitemap:', error); }
}

export const GET = withAuth(async (request, access) => {
  const requested = new URL(request.url).searchParams.get('section');
  const section: Section = requested === 'aeo' ? 'aeo' : 'seo';
  const capability = section === 'seo' ? SEO_CAPABILITIES.read : AEO_CAPABILITIES.read;
  if (!(await hasSeoAeoCapability(access, capability))) {
    return apiResponse.error('Tài khoản chưa được cấp quyền đọc nội dung SEO/AEO', 'CAPABILITY_REQUIRED', 403);
  }

  const snapshot = await getSeoConfigSnapshot(access.supabase);
  return apiResponse.success({
    ...getSectionDocument(snapshot.config, section),
    revision: revisionToken(snapshot.rawValue),
  });
});

export const POST = withAuth(async (request: NextRequest, access) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return apiResponse.error('Payload JSON không hợp lệ', 'INVALID_JSON', 400);
  }

  const legacyPayload = body.section === undefined && body.routeKey === undefined;
  const section = body.section === undefined ? 'seo' : sectionFrom(body.section);
  const routeKey = body.routeKey === undefined && legacyPayload ? 'global' : body.routeKey;
  const locale = body.locale === undefined && legacyPayload ? 'vi' : body.locale;
  const status = body.status === undefined && legacyPayload
    ? 'published'
    : body.status === 'published'
      ? 'published'
      : body.status === 'draft'
        ? 'draft'
        : null;
  if (!section || !isValidSeoRouteKey(routeKey) || !isSupportedSeoLocale(locale) || !status) {
    return apiResponse.error('section, routeKey, locale và status không hợp lệ', 'INVALID_PAYLOAD', 400);
  }

  const writeCapability = section === 'seo' ? SEO_CAPABILITIES.write : AEO_CAPABILITIES.write;
  const publishCapability = section === 'seo' ? SEO_CAPABILITIES.publish : AEO_CAPABILITIES.publish;
  if (!(await hasSeoAeoCapability(access, writeCapability))) {
    return apiResponse.error('Tài khoản chưa được cấp quyền chỉnh sửa SEO/AEO', 'CAPABILITY_REQUIRED', 403);
  }
  if (status === 'published' && !(await hasSeoAeoCapability(access, publishCapability))) {
    return apiResponse.error('Tài khoản chưa được cấp quyền xuất bản SEO/AEO', 'CAPABILITY_REQUIRED', 403);
  }

  const rawData = body.data !== undefined
    ? body.data
    : legacyPayload
      ? { title: body.title, description: body.description, keywords: body.keywords, ogImage: body.ogImage, ogImageAlt: '', twitterCard: 'summary_large_image', canonicalPath: '', indexable: true }
      : body;
  const validated = section === 'seo' ? validateSeoFields(rawData) : validateAeoFields(rawData);
  if (!validated.ok) return apiResponse.error(validated.errors.join('; '), 'INVALID_CONTENT', 422);

  const snapshot = await getSeoConfigSnapshot(access.supabase);
  const config = snapshot.config;
  if (typeof body.expectedRevision !== 'string' || body.expectedRevision !== revisionToken(snapshot.rawValue)) {
    return apiResponse.error('Nội dung đã được thay đổi ở cửa sổ khác. Hãy tải lại trước khi lưu.', 'SEO_CONTENT_CONFLICT', 409);
  }

  const nextConfig = JSON.parse(JSON.stringify(config)) as SeoConfig;
  if (section === 'seo' && routeKey === 'global') {
    const entry = nextConfig.global[locale] || {};
    nextConfig.global[locale] = {
      ...entry,
      [status]: { ...validated.value, canonicalPath: '' },
      updatedAt: new Date().toISOString(),
    };
  } else if (section === 'seo') {
    const page = nextConfig.pages[routeKey] || { locales: {} };
    const entry = page.locales[locale] || {};
    page.locales[locale] = { ...entry, [status]: validated.value, updatedAt: new Date().toISOString() };
    nextConfig.pages[routeKey] = page;
  } else {
    const page = nextConfig.aeo[routeKey] || { locales: {} };
    const entry = page.locales[locale] || {};
    page.locales[locale] = { ...entry, [status]: validated.value, updatedAt: new Date().toISOString() };
    nextConfig.aeo[routeKey] = page;
  }

  const saved = await saveSeoConfigIfCurrent(access.supabase, nextConfig, snapshot.rawValue, snapshot.exists);
  if (!saved.ok) {
    if (saved.conflict) return apiResponse.error('Nội dung đã được thay đổi ở cửa sổ khác. Hãy tải lại trước khi lưu.', 'SEO_CONTENT_CONFLICT', 409);
    return apiResponse.error('Không thể lưu cấu hình SEO/AEO', 'DB_ERROR', 500);
  }

  await recordContentRevisions(access.supabase, [{
    content_key: `SystemConfigs:${section}:${routeKey}:${locale}:${status}`,
    payload: nextConfig as unknown as Record<string, unknown>,
    changed_by: access.user.id,
  }]);

  revalidateSeoRoute(routeKey, locale);
  return apiResponse.success({
    section,
    document: getSectionDocument(nextConfig, section),
    status: status as ContentStatus,
    revision: revisionToken(nextConfig),
  });
});
