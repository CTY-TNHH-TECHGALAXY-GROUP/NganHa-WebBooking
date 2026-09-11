import type { Locale } from '@/lib/constants';
import { getSeoConfig, resolvePublicAeoContent } from '@/lib/seo/config';
import { absoluteUrl } from '@/lib/seo/metadata';
import { createArticleJsonLd, createBreadcrumbJsonLd, createFaqJsonLd, createLocalBusinessJsonLd, createServiceJsonLd, createWebSiteJsonLd } from '@/lib/seo/jsonLd';
import JsonLd from './JsonLd';

type ArticleInput = { headline: string; description: string; image?: string };

export default async function SeoStructuredData({
  routeKey,
  locale,
  pathname,
  breadcrumbs,
  article,
}: {
  routeKey: string;
  locale: Locale;
  pathname: string;
  breadcrumbs?: Array<{ name: string; path: string }>;
  article?: ArticleInput;
}) {
  const config = await getSeoConfig();
  const url = absoluteUrl(pathname);
  const aeo = resolvePublicAeoContent(config, routeKey, locale);
  const graph: unknown[] = [createLocalBusinessJsonLd(url, locale), ...(routeKey === 'home' ? [createWebSiteJsonLd(url)] : [])];
  if (breadcrumbs?.length) graph.push(createBreadcrumbJsonLd(url, breadcrumbs));
  if (aeo) {
    const faq = createFaqJsonLd(aeo);
    const service = createServiceJsonLd(aeo, url);
    if (faq) graph.push(faq);
    if (service) graph.push(service);
  }
  if (article) graph.push(createArticleJsonLd({ ...article, url, locale }));
  return <JsonLd value={{ '@context': 'https://schema.org', '@graph': graph.filter(Boolean) }} />;
}
