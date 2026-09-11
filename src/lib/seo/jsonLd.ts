import { BRANCHES, type Locale } from '@/lib/constants';
import type { PublicAeoContent } from './types';

export function serializeJsonLd(value: unknown): string {
  return (JSON.stringify(value) || '')
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

function languageTag(locale: Locale): string {
  return locale === 'cn' ? 'zh-CN' : locale === 'jp' ? 'ja' : locale === 'kr' ? 'ko' : locale;
}

export function createLocalBusinessJsonLd(url: string, locale: Locale) {
  const origin = new URL(url).origin;
  return {
    '@type': 'BeautySalon',
    '@id': `${origin}#local-business`,
    name: BRANCHES.BARBERSHOP.name,
    url: origin,
    inLanguage: languageTag(locale),
    address: {
      '@type': 'PostalAddress',
      streetAddress: BRANCHES.BARBERSHOP.address,
      addressLocality: 'Ho Chi Minh City',
      addressCountry: 'VN',
    },
    hasMap: BRANCHES.BARBERSHOP.googleMaps,
  };
}

export function createWebSiteJsonLd(url: string) {
  const origin = new URL(url).origin;
  return {
    '@type': 'WebSite',
    '@id': `${origin}#website`,
    name: 'Oria Spa',
    url,
    publisher: { '@id': `${origin}#local-business` },
  };
}

export function createBreadcrumbJsonLd(url: string, items: Array<{ name: string; path: string }>) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, url).toString(),
    })),
  };
}

export function createFaqJsonLd(content: PublicAeoContent) {
  if (!content.faqs.length) return null;
  return {
    '@type': 'FAQPage',
    mainEntity: content.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}

export function createServiceJsonLd(content: PublicAeoContent, url: string) {
  if (!content.serviceName) return null;
  return {
    '@type': 'Service',
    name: content.serviceName,
    serviceType: 'Spa service',
    description: content.answer || undefined,
    url,
    provider: { '@id': `${new URL(url).origin}#local-business` },
    areaServed: 'Ho Chi Minh City',
  };
}

export function createArticleJsonLd(input: { url: string; headline: string; description: string; image?: string; locale: Locale }) {
  return {
    '@type': 'Article',
    mainEntityOfPage: input.url,
    headline: input.headline,
    description: input.description,
    inLanguage: languageTag(input.locale),
    ...(input.image ? { image: [input.image] } : {}),
    publisher: { '@id': `${new URL(input.url).origin}#local-business` },
  };
}
