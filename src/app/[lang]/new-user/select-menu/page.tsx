import { redirect } from 'next/navigation';
import { SUPPORTED_LOCALES } from '@/lib/constants';

/** Keep old bookmarks working after the retired menu-type selector. */
export default async function SelectMenuPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const safeLang = (SUPPORTED_LOCALES as readonly string[]).includes(lang) ? lang : 'vi';
  redirect(`/${safeLang}/pure-relaxation`);
}
