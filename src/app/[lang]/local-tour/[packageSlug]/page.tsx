import type { Metadata } from 'next';
import LocalTourPackagePage from '@/components/LocalTour/LocalTourPackagePage';
import type { Locale } from '@/lib/constants';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { DEFAULT_LOCAL_TOUR_CONFIG, hydrateLocalTourConfig, getPackageBySlugOrId, type LocalTourConfig } from '@/data/localTourData';
import { getPageMetadata } from '@/lib/seo/metadata';
import SeoStructuredData from '@/components/Seo/SeoStructuredData';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ lang: string; packageSlug: string }>;
}

async function getServerTourConfig(): Promise<LocalTourConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const [{ data: sc }, { data: wbc }] = await Promise.all([
      supabase.from('SystemConfigs').select('value').eq('key', 'local_tour_content').maybeSingle(),
      supabase.from('WebBookingContent').select('value').eq('key', 'local_tour_content').maybeSingle(),
    ]);
    const remote = sc?.value || wbc?.value;
    if (remote) {
      return hydrateLocalTourConfig(remote);
    }
  } catch (e) {
    console.warn('[local-tour/page] Failed to load server config:', e);
  }
  return DEFAULT_LOCAL_TOUR_CONFIG;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { lang, packageSlug } = await params;
  const config = await getServerTourConfig();
  const pkg = getPackageBySlugOrId(packageSlug, config.packages);
  const locale = (lang || 'vi') as Locale;
  const title = pkg
    ? `${pkg.title[locale] || pkg.title.vi || pkg.title.en} · Local Tour | Oria Spa`
    : 'Local Tour | Oria Spa';
  const description = pkg?.tagline?.[locale] || pkg?.tagline?.vi || 'Discover Saigon the Oria Spa Way.';

  return getPageMetadata({
    routeKey: 'local-tour-detail',
    pathname: `/${lang}/local-tour/${packageSlug}`,
    locale,
    localized: true,
    defaultPathname: `/local-tour/${packageSlug}`,
  }, { title, description });
}

export default async function Page({ params }: PageProps) {
  const { lang, packageSlug } = await params;
  const initialConfig = await getServerTourConfig();
  const pkg = getPackageBySlugOrId(packageSlug, initialConfig.packages);
  const title = pkg?.title?.[lang] || pkg?.title?.vi || pkg?.title?.en || 'Local Tour';
  const description = pkg?.tagline?.[lang] || pkg?.tagline?.vi || pkg?.tagline?.en || 'Discover Saigon with Oria Spa.';
  return (
    <>
      <LocalTourPackagePage packageSlug={packageSlug} initialConfig={initialConfig} initialLang={lang as Locale} />
      <SeoStructuredData
        routeKey="local-tour-detail"
        locale={lang as Locale}
        pathname={`/${lang}/local-tour/${packageSlug}`}
        breadcrumbs={[{ name: 'Home', path: `/${lang}` }, { name: 'Local Tour', path: `/${lang}/local-tour` }, { name: title, path: `/${lang}/local-tour/${packageSlug}` }]}
        article={{ headline: title, description, image: pkg?.heroImage }}
      />
    </>
  );
}
