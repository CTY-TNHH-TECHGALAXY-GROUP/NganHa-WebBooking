import type { Metadata } from 'next';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import { getSeoConfig, resolvePublicSeoFields } from './config';
import type { SeoConfig, SeoRouteDescriptor } from './types';

const LOCALE_HREFLANG: Record<Locale, string> = {
  vi: 'vi',
  en: 'en',
  cn: 'zh-CN',
  jp: 'ja',
  kr: 'ko',
};

export function getSiteOrigin(): URL {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const fallback = 'https://oria-spa.vercel.app';
  try {
    const candidate = new URL(configured || fallback);
    if (candidate.protocol !== 'https:' && candidate.hostname !== 'localhost' && candidate.hostname !== '127.0.0.1') {
      return new URL(fallback);
    }
    if (candidate.username || candidate.password || candidate.search || candidate.hash) {
      return new URL(fallback);
    }
    return new URL(`${candidate.protocol}//${candidate.host}`);
  } catch {
    return new URL(fallback);
  }
}

export function normalizePathname(pathname: string): string {
  const path = pathname.trim() || '/';
  const withSlash = path.startsWith('/') ? path : `/${path}`;
  return withSlash.length > 1 ? withSlash.replace(/\/+$/, '') : '/';
}

function absoluteUrl(pathname: string): string {
  return new URL(normalizePathname(pathname), getSiteOrigin()).toString();
}

function localizedPath(pathname: string, locale: Locale): string {
  const path = normalizePathname(pathname);
  const firstSegment = path.split('/')[1];
  if (path === '/' || (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)) {
    const remainder = path === '/' || (SUPPORTED_LOCALES as readonly string[]).includes(firstSegment)
      ? path === '/' ? '' : path.split('/').slice(2).join('/')
      : '';
    return `/${locale}${remainder ? `/${remainder}` : ''}`;
  }
  return `/${locale}${path}`;
}

function routeAllowsDefault(descriptor: SeoRouteDescriptor): boolean {
  return Boolean(descriptor.defaultPathname) && descriptor.localized !== false;
}

function getLocaleAlternates(config: SeoConfig, descriptor: SeoRouteDescriptor): Record<string, string> {
  if (descriptor.localized === false) return {};
  const languages: Record<string, string> = {};
  for (const locale of SUPPORTED_LOCALES) {
    const fields = resolvePublicSeoFields(config, descriptor.routeKey, locale);
    if (!fields.indexable) continue;
    const localizedCanonical = fields.canonicalPath || localizedPath(descriptor.pathname, locale);
    languages[LOCALE_HREFLANG[locale]] = absoluteUrl(localizedCanonical);
  }
  if (routeAllowsDefault(descriptor)) {
    const defaultFields = resolvePublicSeoFields(config, descriptor.routeKey, DEFAULT_LOCALE);
    if (defaultFields.indexable) {
      languages['x-default'] = absoluteUrl(defaultFields.canonicalPath || (descriptor.defaultPathname as string));
    }
  }
  return languages;
}

export function buildPageMetadata(config: SeoConfig, descriptor: SeoRouteDescriptor, fallback: Partial<ReturnType<typeof resolvePublicSeoFields>> = {}): Metadata {
  const locale = descriptor.locale || DEFAULT_LOCALE;
  const fields = resolvePublicSeoFields(config, descriptor.routeKey, locale, fallback);
  const looksLikeHostnamePath = /^\/[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+(?=\/|$)/i.test(fields.canonicalPath);
  const configuredCanonical = /^\/(?!\/)[^?#\\\u0000-\u001f\u007f]*$/.test(fields.canonicalPath) && !looksLikeHostnamePath ? fields.canonicalPath : '';
  const canonicalPath = configuredCanonical || descriptor.pathname;
  const canonical = absoluteUrl(canonicalPath);
  const image = fields.ogImage
    ? fields.ogImage.startsWith('/')
      ? absoluteUrl(fields.ogImage)
      : /^https:\/\//.test(fields.ogImage)
        ? fields.ogImage
        : undefined
    : undefined;
  const languages = getLocaleAlternates(config, descriptor);

  return {
    metadataBase: getSiteOrigin(),
    title: fields.title,
    description: fields.description,
    keywords: fields.keywords,
    alternates: {
      canonical,
      ...(Object.keys(languages).length ? { languages } : {}),
    },
    robots: fields.indexable ? { index: true, follow: true } : { index: false, follow: false },
    openGraph: {
      title: fields.title,
      description: fields.description,
      url: canonical,
      type: 'website',
      ...(image ? { images: [{ url: image, alt: fields.ogImageAlt || fields.title }] } : {}),
    },
    twitter: {
      card: fields.twitterCard,
      title: fields.title,
      description: fields.description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export async function getPageMetadata(descriptor: SeoRouteDescriptor, fallback: Partial<ReturnType<typeof resolvePublicSeoFields>> = {}): Promise<Metadata> {
  return buildPageMetadata(await getSeoConfig(), descriptor, fallback);
}

export { LOCALE_HREFLANG, localizedPath, absoluteUrl };
