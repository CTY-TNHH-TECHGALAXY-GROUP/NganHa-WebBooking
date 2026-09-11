import type { Locale } from '@/lib/constants';

export const SEO_CAPABILITIES = {
  read: 'seo.read',
  write: 'seo.write',
  publish: 'seo.publish',
} as const;

export const AEO_CAPABILITIES = {
  read: 'aeo.read',
  write: 'aeo.write',
  publish: 'aeo.publish',
} as const;

export type SeoCapability = (typeof SEO_CAPABILITIES)[keyof typeof SEO_CAPABILITIES];
export type AeoCapability = (typeof AEO_CAPABILITIES)[keyof typeof AEO_CAPABILITIES];
export type ContentStatus = 'draft' | 'published';

export interface SeoLocaleFields {
  title: string;
  description: string;
  keywords: string[];
  ogImage: string;
  ogImageAlt: string;
  twitterCard: 'summary' | 'summary_large_image';
  canonicalPath: string;
  indexable: boolean;
}

export interface AeoFaq {
  question: string;
  answer: string;
}

export interface AeoLocaleFields {
  serviceName: string;
  answer: string;
  audience: string;
  duration: string;
  price: string;
  inclusions: string[];
  location: string;
  hours: string;
  bookingProcess: string;
  faqs: AeoFaq[];
  sourceLabel: string;
  sourceUrl: string;
}

export interface VersionedLocale<T> {
  draft?: T;
  published?: T;
  updatedAt?: string;
}

export type LocalizedSeo = Partial<Record<Locale, VersionedLocale<SeoLocaleFields>>>;
export type LocalizedAeo = Partial<Record<Locale, VersionedLocale<AeoLocaleFields>>>;

export interface SeoPageDocument {
  locales: LocalizedSeo;
}

export interface AeoPageDocument {
  locales: LocalizedAeo;
}

export interface SeoConfig {
  version: 2;
  global: LocalizedSeo;
  pages: Record<string, SeoPageDocument>;
  aeo: Record<string, AeoPageDocument>;
}

export interface SeoRouteDescriptor {
  routeKey: string;
  pathname: string;
  locale?: Locale;
  localized?: boolean;
  defaultPathname?: string;
}

export interface PublicAeoContent extends AeoLocaleFields {
  routeKey: string;
  locale: Locale;
}
