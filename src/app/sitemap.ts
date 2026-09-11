import type { MetadataRoute } from 'next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import { DEFAULT_LOCAL_TOUR_CONFIG } from '@/data/localTourData';
import { getSeoConfig, resolvePublicSeoFields } from '@/lib/seo/config';
import { absoluteUrl, localizedPath } from '@/lib/seo/metadata';
import { PUBLIC_LOCALIZED_SITEMAP_ROUTES, PUBLIC_SITEMAP_ROUTES, type SitemapRoute } from '@/lib/seo/routes';

function isIndexable(config: Awaited<ReturnType<typeof getSeoConfig>>, route: SitemapRoute, locale: Locale) {
  return resolvePublicSeoFields(config, route.routeKey, locale).indexable;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const config = await getSeoConfig();
  const entries: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  const add = (route: SitemapRoute, locale?: Locale) => {
    const pathname = locale ? localizedPath(route.pathname, locale) : route.pathname;
    const url = absoluteUrl(pathname);
    if (seen.has(url)) return;
    if (!isIndexable(config, route, locale || DEFAULT_LOCALE)) return;
    seen.add(url);
    entries.push({ url });
  };

  for (const route of PUBLIC_SITEMAP_ROUTES) add(route);
  for (const route of PUBLIC_LOCALIZED_SITEMAP_ROUTES) {
    for (const locale of SUPPORTED_LOCALES) add(route, locale);
  }

  for (const pkg of DEFAULT_LOCAL_TOUR_CONFIG.packages) {
    const slug = pkg.slug || pkg.id;
    const route = { routeKey: 'local-tour-detail', pathname: `/local-tour/${slug}`, localized: true, defaultPathname: `/local-tour/${slug}` };
    add(route);
    for (const locale of SUPPORTED_LOCALES) add(route, locale);
  }

  return entries;
}
