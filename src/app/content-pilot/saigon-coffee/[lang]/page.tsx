import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SaigonCoffeePilot } from '@/components/ContentPilot/SaigonCoffeePilot';
import { SAIGON_COFFEE_PILOT_LOCALES } from '@/content/saigonCoffeePilot';
import type { SupportedLocale } from '@/types/content';

type PageProps = { params: Promise<{ lang: string }> };

export const metadata: Metadata = {
  title: 'Saigon Coffee Renderer Pilot | Oria',
  description: 'Fixture-backed Phase 2 visual parity pilot for the Saigon Coffee article.',
  robots: { index: false, follow: false },
};

export default async function SaigonCoffeePilotPage({ params }: PageProps) {
  if (process.env.NODE_ENV === 'production') notFound();
  const { lang } = await params;
  if (!SAIGON_COFFEE_PILOT_LOCALES.includes(lang as SupportedLocale)) notFound();
  return <SaigonCoffeePilot locale={lang} />;
}
