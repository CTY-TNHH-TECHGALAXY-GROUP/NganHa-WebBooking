'use client';

import React, { Component, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Gift, Ticket, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { Z } from '@/lib/zIndex';
import type { WebClaimCampaign } from '@/lib/voucherWallet';
import { FRONT_BOARD, ORIA } from '@/components/Voucher/voucher.theme';
import { voucherBrush } from '@/components/Voucher/voucher.fonts';
import { formatPromoDate, formatPromoDateTime } from '@/components/Voucher/voucher.format';
import { VOUCHER_CARD_LABELS } from '@/components/Voucher/voucher-card.i18n';
import { formatPromotionConditions, pickPromotionText } from '@/components/Voucher/voucher-page.i18n';
import { WEB_VOUCHER_I18N, pickWebVoucherLang, webVoucherError, type WebVoucherStrings } from './WebVoucher.i18n';
import {
  cardStateOf,
  useCampaignStock,
  useReserve,
  useSavedVoucher,
  useWebClaimCampaigns,
  type CardState,
  type SavedSheet,
} from './WebVoucherCard.logic';

// 🔧 UI CONFIGURATION
const COPIED_FEEDBACK_MS = 1800;
/** Above the floating chat bubble / review badge (Z.FLOATING*), or they cover the sheet's buttons. */
const SHEET_Z = Z.FLOATING_TRIGGER + 1;
const STATE_PILL: Record<CardState, string> = {
  OPEN: 'bg-[#2E3913] text-[#F7D9A6]',
  NOT_STARTED: 'bg-[#FFF4E0] text-[#6B3410]',
  PAUSED: 'bg-[#FFF4E0] text-[#6B3410]',
  SOLD_OUT: 'bg-[#24160D] text-[#F4A64A]',
  ENDED: 'bg-[#24160D] text-[#F4A64A]',
};

const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)}đ`;

const voucherPath = (code: string, lang: string) => `/v/${encodeURIComponent(code)}?lang=${lang}`;

const useCopy = () => {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      window.setTimeout(() => setCopied(null), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard blocked (in-app browsers): the text stays visible and selectable.
    }
  };
  return { copied, copy };
};

interface SavedVoucherSheetProps {
  sheet: SavedSheet;
  s: WebVoucherStrings;
  lang: string;
  onClose: () => void;
  onContinue: () => void;
}

/** "Đã lưu!" — code, hold time, view / continue, and a link to reopen on another device (B15). */
const SavedVoucherSheet = ({ sheet, s, lang, onClose, onContinue }: SavedVoucherSheetProps) => {
  const { copied, copy } = useCopy();
  const closeRef = useRef<HTMLButtonElement>(null);
  const [link, setLink] = useState('');
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    setLink(`${window.location.origin}${voucherPath(sheet.code, lang)}`);
  }, [sheet.code, lang]);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Portal: an ancestor with transform / overflow must not clip the fixed overlay.
  return createPortal(
    <div className="fixed inset-0 flex items-end justify-center bg-[#24160D]/55 p-0 sm:items-center sm:p-6" style={{ zIndex: SHEET_Z }} onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="web-voucher-saved-title"
        className="relative w-full max-w-md rounded-t-3xl bg-[#FFF8EC] px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 text-[#2B1A0E] shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label={s.close}
          className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-full text-[#4A2C14] hover:bg-[#FCE6C2]"
        >
          <X size={20} aria-hidden />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#2E3913] text-[#F7D9A6]">
            <Check size={24} aria-hidden />
          </span>
          <h2 id="web-voucher-saved-title" className={`${voucherBrush.className} mt-3 text-4xl leading-none`}>
            {s.savedTitle}
          </h2>
          {sheet.reused && <p className="mt-2 text-sm text-[#4A2C14]">{s.savedReused}</p>}

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#6B4A2A]">{s.yourCode}</p>
          <div className="mt-2 flex w-full items-center justify-between gap-2 rounded-2xl border border-dashed border-[#E9C99A] bg-white/70 py-2 pl-4 pr-2">
            <span className="min-w-0 select-all whitespace-nowrap font-mono text-[22px] font-bold tracking-[0.08em]">{sheet.code}</span>
            <button
              type="button"
              onClick={() => copy('code', sheet.code)}
              className="flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-semibold text-[#6B3410] hover:bg-[#FCE6C2]"
            >
              {copied === 'code' ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
              {copied === 'code' ? s.copied : s.copyCode}
            </button>
          </div>
          {sheet.expiresAt && <p className="mt-3 text-sm font-medium text-[#6B3410]">{s.holdUntil(formatPromoDateTime(sheet.expiresAt))}</p>}
        </div>

        <div className="mt-6 grid gap-2">
          <a
            href={voucherPath(sheet.code, lang)}
            className="flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#E9C99A] bg-white text-sm font-bold text-[#2B1A0E] hover:bg-[#FFF4E0]"
          >
            <Ticket size={18} aria-hidden />
            {s.viewVoucher}
          </a>
          <button
            type="button"
            onClick={onContinue}
            className="flex min-h-12 items-center justify-center rounded-2xl bg-[#24160D] text-sm font-bold text-[#F4A64A] shadow-md hover:bg-[#382315]"
          >
            {s.continueBooking}
          </button>
        </div>

        <div className="mt-5 rounded-2xl bg-[#FCE6C2]/60 p-3 text-left">
          <p className="text-xs font-semibold text-[#4A2C14]">{s.otherDevice}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="min-w-0 flex-1 select-all break-all text-xs text-[#6B3410]">{link}</span>
            <button
              type="button"
              onClick={() => copy('link', link)}
              className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-xs font-semibold text-[#6B3410] hover:bg-[#FFF4E0]"
            >
              {copied === 'link' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              {copied === 'link' ? s.copied : s.copyLink}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

interface CampaignCardProps {
  campaign: WebClaimCampaign;
  s: WebVoucherStrings;
  lang: ReturnType<typeof pickWebVoucherLang>;
  onContinue: () => void;
}

const CampaignCard = ({ campaign, s, lang, onContinue }: CampaignCardProps) => {
  const stockApi = useCampaignStock(campaign.slug, campaign.stock);
  const saved = useSavedVoucher(campaign.slug);
  const { reserve, saving, errorCode, sheet, openSheet, closeSheet } = useReserve(campaign.slug, stockApi);
  const { stock, hidden } = stockApi;

  if (hidden) return null;

  const state = cardStateOf(stock);
  const labels = VOUCHER_CARD_LABELS[lang];
  const conditions = formatPromotionConditions(campaign.conditionsSummary, lang);
  const filled = stock.total > 0 ? Math.round((stock.available / stock.total) * 100) : 0;
  const stateLabel = state === 'NOT_STARTED' ? s.state.NOT_STARTED(formatPromoDateTime(stock.validFrom)) : s.state[state];

  return (
    <article className="relative overflow-hidden rounded-3xl p-5 text-[#2B1A0E] shadow-lg" style={FRONT_BOARD}>
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4A2C14]">
          <Gift size={14} aria-hidden />
          {s.eyebrow}
        </span>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${STATE_PILL[state]}`}>{stateLabel}</span>
      </div>

      <p className={`${voucherBrush.className} mt-3 text-5xl leading-none`} style={{ color: ORIA.ink }}>
        {labels.benefit(campaign.benefit)}
      </p>
      <h3 className="mt-2 text-lg font-bold leading-snug">{pickPromotionText(campaign.name, campaign.nameI18n, lang)}</h3>
      <p className="mt-1 text-sm text-[#4A2C14]">
        {s.appliesTo}: {conditions.length ? conditions.join('; ') : s.allServices}
        {campaign.maxDiscountAmount ? ` · ${s.maxDiscount(vnd(campaign.maxDiscountAmount))}` : ''}
      </p>
      <p className="mt-0.5 text-xs text-[#6B3410]">{s.validUntil(formatPromoDate(stock.validUntil))}</p>

      {state !== 'ENDED' && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm font-bold">
            <span aria-live="polite">{s.remaining(stock.available, stock.total)}</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#6B3410]/25" aria-hidden>
            <div className="h-full rounded-full bg-[#2E3913] transition-[width] duration-500" style={{ width: `${filled}%` }} />
          </div>
        </div>
      )}

      <div className="mt-5">
        {saved ? (
          <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center">
            <div className="flex min-h-12 flex-1 items-center justify-between gap-2 rounded-2xl bg-[#FFF8EC]/90 px-4">
              <span className="text-xs font-semibold text-[#6B4A2A]">{s.alreadySaved}</span>
              <span className="font-mono text-base font-bold tracking-wider">{saved.code}</span>
            </div>
            <button
              type="button"
              onClick={() => openSheet({ code: saved.code, expiresAt: saved.expiresAt, reused: false })}
              className="flex min-h-12 items-center justify-center rounded-2xl bg-[#24160D] px-5 text-sm font-bold text-[#F4A64A] shadow-md hover:bg-[#382315]"
            >
              {s.viewSaved}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={reserve}
            disabled={state !== 'OPEN' || saving}
            aria-busy={saving}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#24160D] px-5 text-base font-bold text-[#F4A64A] shadow-md transition-colors hover:bg-[#382315] disabled:cursor-not-allowed disabled:bg-[#24160D]/60 disabled:text-[#F7D9A6]/80"
          >
            <Ticket size={18} aria-hidden />
            {saving ? s.saving : state === 'OPEN' ? s.save : stateLabel}
          </button>
        )}
        {errorCode && (
          <p role="alert" className="mt-2 rounded-xl bg-[#FFF8EC]/90 px-3 py-2 text-sm font-medium text-[#6B3410]">
            {webVoucherError(s, errorCode)}
          </p>
        )}
      </div>

      {sheet && (
        <SavedVoucherSheet
          sheet={sheet}
          s={s}
          lang={lang}
          onClose={closeSheet}
          onContinue={() => {
            closeSheet();
            onContinue();
          }}
        />
      )}
    </article>
  );
};

const WebVoucherCards = () => {
  const { currentLang } = useTranslation();
  const lang = pickWebVoucherLang(currentLang);
  const campaigns = useWebClaimCampaigns();
  const rootRef = useRef<HTMLElement>(null);

  if (!campaigns.length) return null;
  const s = WEB_VOUCHER_I18N[lang];
  // "Tiếp tục đặt lịch": bring the menu (right below the card) into view.
  const onContinue = () => {
    const next = rootRef.current?.nextElementSibling;
    if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <section ref={rootRef} aria-label={s.eyebrow} className="mx-auto grid w-full max-w-xl gap-4 px-4 pb-2 pt-6">
      {campaigns.map((c) => (
        <CampaignCard key={c.slug} campaign={c} s={s} lang={lang} onContinue={onContinue} />
      ))}
    </section>
  );
};

/** Optional feature: a crash here must never take the booking menu down (CLAUDE.md 4.5). */
class WebVoucherBoundary extends Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[web-claim] voucher card crashed:', error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const WebVoucherCard = () => (
  <WebVoucherBoundary>
    <WebVoucherCards />
  </WebVoucherBoundary>
);

export default WebVoucherCard;
