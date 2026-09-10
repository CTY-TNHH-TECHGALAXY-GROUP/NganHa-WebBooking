import type { Metadata } from 'next';
import LocalTourPackagePage from '@/components/LocalTour/LocalTourPackagePage';
import type { Locale } from '@/lib/constants';
import { DEFAULT_LOCAL_TOUR_CONFIG, getPackageBySlugOrId } from '@/data/localTourData';

interface PageProps {
  params: Promise<{ lang: string; packageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, packageSlug } = await params;
  const pkg = getPackageBySlugOrId(packageSlug, DEFAULT_LOCAL_TOUR_CONFIG.packages);
  const locale = (lang || 'vi') as Locale;
  const title = pkg
    ? `${pkg.title[locale] || pkg.title.vi || pkg.title.en} · Local Tour | Oria Spa`
    : 'Local Tour | Oria Spa';
  const description = pkg?.tagline?.[locale] || pkg?.tagline?.vi || 'Discover Saigon the Oria Spa Way.';

  return {
    title,
    description,
  };
}

export default async function Page({ params }: PageProps) {
  const { lang, packageSlug } = await params;
  return <LocalTourPackagePage packageSlug={packageSlug} initialLang={lang as Locale} />;
}
