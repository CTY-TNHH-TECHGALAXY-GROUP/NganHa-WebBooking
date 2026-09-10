import type { Metadata } from 'next';
import HomeSpaPage from '@/components/HomeSpa/HomeSpaPage';
import type { Locale } from '@/lib/constants';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export const metadata: Metadata = {
  title: 'Oria Home Spa | Oria Spa',
  description: 'Oria Spa sends a technician directly to where you are - your home, apartment, or hotel room.',
};

export default async function LocalizedHomeSpaPage({ params }: PageProps) {
  const { lang } = await params;
  return <HomeSpaPage initialLang={lang as Locale} />;
}
