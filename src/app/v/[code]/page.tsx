import type { Metadata } from 'next';
import { headers } from 'next/headers';
import VoucherPublicView, { type WebVoucherView } from '@/components/Voucher/VoucherPublicView';
import { VOUCHER_LANG_ORDER } from '@/components/Voucher/voucher-card.i18n';
import { pickVoucherLang } from '@/components/Voucher/voucher-page.i18n';
import {
  getSpaContact,
  getWebVoucherStatus,
  isValidVoucherCode,
  normalizeVoucherCode,
} from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'E-Voucher | Oria Spa',
  // The code in the URL is the voucher itself: keep it out of search engines and referrers.
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ lang?: string | string[] }>;
};

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

const resolveView = async (code: string): Promise<WebVoucherView> => {
  if (!isValidVoucherCode(code)) return { mode: 'INVALID' };
  try {
    const res = await getWebVoucherStatus(code);
    return res.success ? { mode: 'CUSTOMER', voucher: res.data } : { mode: 'INVALID' };
  } catch (error) {
    console.error('[web-claim] /v status failed:', error);
    return { mode: 'INVALID' };
  }
};

/** Public web-claim e-voucher page: /v/{code}?lang= (link shown after "Lưu voucher"). */
const VoucherCodePage = async ({ params, searchParams }: PageProps) => {
  const [{ code: rawCode }, query, h] = await Promise.all([params, searchParams, headers()]);
  const code = normalizeVoucherCode(decodeURIComponent(rawCode));
  const lang = pickVoucherLang(first(query.lang));
  const [view, contact] = await Promise.all([resolveView(code), getSpaContact()]);
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? '';
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const pageUrl = `${proto}://${host}/v/${encodeURIComponent(code)}`;

  return <VoucherPublicView view={view} contact={contact} lang={lang} code={code} pageUrl={pageUrl} langs={VOUCHER_LANG_ORDER} />;
};

export default VoucherCodePage;
