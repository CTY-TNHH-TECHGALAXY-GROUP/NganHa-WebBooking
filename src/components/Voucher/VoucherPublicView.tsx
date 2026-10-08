import React from 'react';
import { AlertTriangle, MapPin, Phone } from 'lucide-react';
import type { PromotionEmailLang, SpaContact } from './voucher.types';
import type { WebVoucherStatus } from '@/lib/voucherWallet';
import { formatPromoDate, formatPromoDateTime } from './voucher.format';
import { VOUCHER_CARD_LABELS, VOUCHER_LANG_NAMES } from './voucher-card.i18n';
import { voucherBrush } from './voucher.fonts';
import { formatPromotionConditions, PROMOTION_VOUCHER_PAGE_I18N } from './voucher-page.i18n';
import { WEB_VOUCHER_I18N } from '@/components/Promotions/WebVoucher.i18n';
import { WebVoucherBookButton, WebVoucherCardView } from './WebVoucherCardView';

export type WebVoucherView = { mode: 'CUSTOMER'; voucher: WebVoucherStatus } | { mode: 'INVALID' };

interface VoucherPublicViewProps {
  view: WebVoucherView;
  contact: SpaContact;
  lang: PromotionEmailLang;
  code: string;
  pageUrl: string;
  langs: PromotionEmailLang[];
}

/**
 * Customer page of a web-claim e-voucher (/v/{code}). Same layout as the admin
 * /voucher page (Quan_Tri_Va_KTV, feat/bit-lo-hong-phase1). No phone, name or
 * full booking id: promo_web_voucher_status never returns them.
 */
const VoucherPublicView = ({ view, contact, lang, code, pageUrl, langs }: VoucherPublicViewProps) => {
  const page = PROMOTION_VOUCHER_PAGE_I18N[lang];
  const s = WEB_VOUCHER_I18N[lang];
  const card = VOUCHER_CARD_LABELS[lang];
  const href = (l: PromotionEmailLang) => `/v/${encodeURIComponent(code)}?lang=${l}`;

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#FFF4E0] via-[#FCE6C2] to-[#F6CF94] px-4 pb-12 pt-6 text-[#2B1A0E]">
      <div className="mx-auto flex max-w-md flex-col items-center">
        <header className="flex w-full items-center justify-between gap-3">
          <span className={`${voucherBrush.className} min-w-0 truncate text-2xl leading-none text-[#2B1A0E]`}>{contact.brandName}</span>
          <nav aria-label="Language" className="flex shrink-0 gap-1">
            {langs.map((l) => (
              <a
                key={l}
                href={href(l)}
                aria-current={l === lang ? 'true' : undefined}
                className={`flex h-11 min-w-11 items-center justify-center rounded-lg px-2 text-xs font-semibold ${l === lang ? 'bg-[#2B1A0E] text-[#F7D9A6]' : 'text-[#4A2C14] hover:bg-[#FFF4E0]'}`}
              >
                {VOUCHER_LANG_NAMES[l]}
              </a>
            ))}
          </nav>
        </header>

        {view.mode === 'INVALID' ? (
          <section role="alert" className="mt-16 w-full rounded-3xl border border-[#E9C99A] bg-[#FFF8EC] p-8 text-center shadow-sm">
            <AlertTriangle size={40} className="mx-auto text-[#B4531A]" aria-hidden />
            <h1 className="mt-4 text-xl font-semibold">{page.invalidTitle}</h1>
            <p className="mt-2 text-sm text-[#4A2C14]">{page.invalidBody(contact.brandName)}</p>
          </section>
        ) : (
          <>
            <h1 className={`${voucherBrush.className} mb-6 mt-8 text-center text-4xl leading-none text-[#2B1A0E]`}>{s.pageTitle}</h1>
            <WebVoucherCardView voucher={view.voucher} lang={lang} pageUrl={pageUrl} contact={contact} />

            <dl className="mt-8 w-full divide-y divide-[#F0D9B5] rounded-2xl border border-[#E9C99A] bg-[#FFF8EC]/90 text-sm shadow-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-[#6B4A2A]">{card.voucherCode}</dt>
                <dd className="select-all font-mono font-semibold tracking-wider">{view.voucher.voucherCode}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-[#6B4A2A]">{page.validUntil}</dt>
                <dd className="font-medium">{formatPromoDate(view.voucher.campaign.validUntil)}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="shrink-0 text-[#6B4A2A]">{page.applicableMenus}</dt>
                <dd className="text-right font-medium">
                  {formatPromotionConditions(view.voucher.campaign.conditions, lang).join('; ') || page.allMenus}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <dt className="text-[#6B4A2A]">{card.statusLabel}</dt>
                <dd className={`text-right font-semibold ${view.voucher.status === 'RESERVED' || view.voucher.status === 'ACTIVE' ? 'text-[#3E6B1E]' : 'text-[#6B3410]'}`}>
                  {s.claimStatus[view.voucher.status]}
                  {view.voucher.status === 'RESERVED' && view.voucher.expiresAt ? ` · ${formatPromoDateTime(view.voucher.expiresAt)}` : ''}
                  {view.voucher.bookingRef ? ` · ${s.bookingRef(view.voucher.bookingRef)}` : ''}
                </dd>
              </div>
            </dl>

            <p className="mt-6 text-center text-sm font-semibold text-[#4A2C14]">{s.claimHint[view.voucher.status]}</p>
          </>
        )}

        <section className="mt-4 flex w-full flex-col gap-2">
          <WebVoucherBookButton
            voucher={view.mode === 'CUSTOMER' ? view.voucher : null}
            lang={lang}
            label={view.mode === 'CUSTOMER' && view.voucher.status === 'RESERVED' ? s.bookWithVoucher : s.backToMenu}
          />
          {contact.address && (
            <p className="flex items-start justify-center gap-2 px-2 text-center text-sm text-[#4A2C14]">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {page.address}: {contact.address}
              </span>
            </p>
          )}
          {contact.hotline && (
            <a
              href={`tel:${contact.hotline.replace(/\s+/g, '')}`}
              className="flex min-h-11 items-center justify-center gap-2 text-sm font-medium text-[#6B3410] hover:underline"
            >
              <Phone size={16} aria-hidden />
              <span>
                {page.hotline}: {contact.hotline}
              </span>
            </a>
          )}
        </section>
      </div>
    </main>
  );
};

export default VoucherPublicView;
