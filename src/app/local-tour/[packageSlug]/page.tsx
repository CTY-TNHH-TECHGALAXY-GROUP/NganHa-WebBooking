import type { Metadata } from 'next';
import LocalTourPackagePage from '@/components/LocalTour/LocalTourPackagePage';
import { DEFAULT_LOCAL_TOUR_CONFIG, getPackageBySlugOrId } from '@/data/localTourData';

interface PageProps {
  params: Promise<{ packageSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { packageSlug } = await params;
  const pkg = getPackageBySlugOrId(packageSlug, DEFAULT_LOCAL_TOUR_CONFIG.packages);
  const title = pkg ? `${pkg.title.vi || pkg.title.en} · Local Tour | Oria Spa` : 'Local Tour | Oria Spa';
  const description = pkg?.tagline?.vi || 'Khám phá Sài Gòn theo cách của Oria Spa: tour di sản văn hóa kết hợp trị liệu phục hồi.';

  return {
    title,
    description,
  };
}

export default async function Page({ params }: PageProps) {
  const { packageSlug } = await params;
  return <LocalTourPackagePage packageSlug={packageSlug} />;
}
