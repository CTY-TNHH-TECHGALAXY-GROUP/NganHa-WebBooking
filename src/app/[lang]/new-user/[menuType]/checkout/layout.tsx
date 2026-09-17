import type { Metadata, ResolvingMetadata } from 'next';
import type { ReactNode } from 'react';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, type Locale } from '@/lib/constants';
import { getPageMetadata } from '@/lib/seo/metadata';

export async function generateMetadata(
  { params }: { params: Promise<{ lang: string; menuType: string }> },
  parent: ResolvingMetadata,
): Promise<Metadata> {
  const { lang, menuType } = await params;
  const locale = (SUPPORTED_LOCALES as readonly string[]).includes(lang) ? lang as Locale : DEFAULT_LOCALE;
  const metadata = await getPageMetadata({
    routeKey: 'booking-checkout', locale, localized: true,
    pathname: `/${locale}/new-user/${encodeURIComponent(menuType)}/checkout`,
  });
  return {
    alternates: metadata.alternates,
    openGraph: { ...(await parent).openGraph, url: metadata.openGraph?.url },
  };
}

export default function CheckoutMetadataLayout({ children }: { children: ReactNode }) {
  return children;
}
