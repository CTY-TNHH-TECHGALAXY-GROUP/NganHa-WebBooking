import type { Metadata } from 'next';
import LocalTourPackagePage from '@/components/LocalTour/LocalTourPackagePage';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { DEFAULT_LOCAL_TOUR_CONFIG, hydrateLocalTourConfig, getPackageBySlugOrId, type LocalTourConfig } from '@/data/localTourData';
import { getPageMetadata } from '@/lib/seo/metadata';
import SeoStructuredData from '@/components/Seo/SeoStructuredData';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ packageSlug: string }>;
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
  const { packageSlug } = await params;
  const config = await getServerTourConfig();
  const pkg = getPackageBySlugOrId(packageSlug, config.packages);
  const title = pkg ? `${pkg.title.vi || pkg.title.en} · Local Tour | Oria Spa` : 'Local Tour | Oria Spa';
  const description = pkg?.tagline?.vi || 'Khám phá Sài Gòn theo cách của Oria Spa: tour di sản văn hóa kết hợp trị liệu phục hồi.';

  return getPageMetadata({
    routeKey: 'local-tour-detail',
    pathname: `/local-tour/${packageSlug}`,
    locale: 'vi',
    localized: true,
    defaultPathname: `/local-tour/${packageSlug}`,
  }, { title, description });
}

export default async function Page({ params }: PageProps) {
  const { packageSlug } = await params;
  const initialConfig = await getServerTourConfig();
  const pkg = getPackageBySlugOrId(packageSlug, initialConfig.packages);
  const title = pkg?.title?.vi || pkg?.title?.en || 'Local Tour';
  const description = pkg?.tagline?.vi || pkg?.tagline?.en || 'Khám phá Sài Gòn theo cách của Oria Spa.';
  return (
    <>
      <LocalTourPackagePage packageSlug={packageSlug} initialConfig={initialConfig} />
      <SeoStructuredData
        routeKey="local-tour-detail"
        locale="vi"
        pathname={`/local-tour/${packageSlug}`}
        breadcrumbs={[{ name: 'Trang chủ', path: '/' }, { name: 'Local Tour', path: '/local-tour' }, { name: title, path: `/local-tour/${packageSlug}` }]}
        article={{ headline: title, description, image: pkg?.heroImage }}
      />
    </>
  );
}
