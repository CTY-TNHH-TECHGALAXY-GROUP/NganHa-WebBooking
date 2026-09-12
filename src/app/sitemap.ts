import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import { DEFAULT_LOCAL_TOUR_CONFIG, hydrateLocalTourConfig, type LocalTourConfig } from '@/data/localTourData';
import { getSeoConfig, resolvePublicSeoFields } from '@/lib/seo/config';
import { absoluteUrl, localizedPath } from '@/lib/seo/metadata';
import { PUBLIC_LOCALIZED_SITEMAP_ROUTES, PUBLIC_SITEMAP_ROUTES, type SitemapRoute } from '@/lib/seo/routes';
import { getSupabaseAdmin } from '@/lib/supabase-server';

function isIndexable(config: Awaited<ReturnType<typeof getSeoConfig>>, route: SitemapRoute, locale: Locale) {
  return resolvePublicSeoFields(config, route.routeKey, locale).indexable;
}

async function getPublishedTourConfig(): Promise<LocalTourConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: systemConfig }, { data: contentConfig }] = await Promise.all([
      supabase.from('SystemConfigs').select('value').eq('key', 'local_tour_content').maybeSingle(),
      supabase.from('WebBookingContent').select('value').eq('key', 'local_tour_content').maybeSingle(),
    ]);
    const remote = systemConfig?.value || contentConfig?.value;
    if (remote) return hydrateLocalTourConfig(remote);
  } catch (error) {
    console.warn('[sitemap] Failed to load published local-tour config:', error);
  }
  return DEFAULT_LOCAL_TOUR_CONFIG;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getSeoConfig();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const add = (route: SitemapRoute, locale?: Locale) => {
    if (!isIndexable(config, route, locale || DEFAULT_LOCALE)) return;
    const localized = locale ? localizedPath(route.pathname, locale) : route.pathname;
    const fields = resolvePublicSeoFields(config, route.routeKey, locale || DEFAULT_LOCALE);
    const url = absoluteUrl(fields.canonicalPath || localized);
    if (seen.has(url)) return;
    seen.add(url);
    entries.push({ url });
  };

  for (const route of PUBLIC_SITEMAP_ROUTES) add(route);
  for (const route of PUBLIC_LOCALIZED_SITEMAP_ROUTES) {
    for (const locale of SUPPORTED_LOCALES) add(route, locale);
  }

  const tourConfig = await getPublishedTourConfig();
  for (const pkg of tourConfig.packages) {
    const slug = pkg.slug || pkg.id;
    const route = { routeKey: 'local-tour-detail', pathname: `/local-tour/${slug}`, localized: true, defaultPathname: `/local-tour/${slug}` };
    add(route);
    for (const locale of SUPPORTED_LOCALES) add(route, locale);
  }

  return entries;
}
