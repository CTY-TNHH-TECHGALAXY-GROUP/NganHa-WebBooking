'use client';

import React, { Component, useEffect, useState } from 'react';
import { Ticket, X } from 'lucide-react';
import { formatPromoDateTime } from '@/components/Voucher/voucher.format';
import { formatPromotionConditions } from '@/components/Voucher/voucher-page.i18n';
import { WEB_VOUCHER_I18N, pickWebVoucherLang, webVoucherError } from './WebVoucher.i18n';
import { useCheckoutVoucher, type AppliedVoucher, type CheckoutCartLine } from './CheckoutVoucher.logic';

// 🔧 UI CONFIGURATION
const CODE_MAX_LENGTH = 20;

const vnd = (n: number) => `${new Intl.NumberFormat('vi-VN').format(n)} VND`;

interface CheckoutVoucherProps {
  cart: CheckoutCartLine[];
  lang: string;
  onChange: (applied: AppliedVoucher | null) => void;
}

const CheckoutVoucherBlock = ({ cart, lang, onChange }: CheckoutVoucherProps) => {
  const l = pickWebVoucherLang(lang);
  const s = WEB_VOUCHER_I18N[l];
  const c = s.checkout;
  const { visible, candidate, applied, busy, errorCode, unmet, apply, remove } = useCheckoutVoucher(cart);
  const [input, setInput] = useState('');
  const [showInput, setShowInput] = useState(false);

  useEffect(() => {
    onChange(applied);
  }, [applied, onChange]);

  if (!visible || !cart.length) return null;

  const unmetText = unmet
    ? c.notEligible(formatPromotionConditions(unmet.conditions, l).join('; ') || s.allServices)
    : null;

  return (
    <section aria-label={c.title} className="mt-4 rounded-2xl border border-[#c9a96e]/30 bg-[#c9a96e]/[0.06] p-3.5 text-[#f1e9dc]">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-[#c9a96e]">
        <Ticket size={14} aria-hidden />
        {c.title}
      </p>

      {applied ? (
        <div className="mt-3 space-y-1.5 text-sm">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono font-bold tracking-wider text-[#f2d58d]">{applied.code}</span>
            <button
              type="button"
              onClick={remove}
              className="flex min-h-11 items-center gap-1 rounded-xl px-2 text-xs font-semibold text-[#c9a96e] hover:text-white"
            >
              <X size={14} aria-hidden />
              {c.remove}
            </button>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-white/70">{c.discountLabel}</span>
            <span className="font-semibold text-[#9FD08C]">−{vnd(applied.discountAmount)}</span>
          </div>
          <div className="flex justify-between gap-3 text-base font-bold">
            <span>{c.totalAfter}</span>
            <span className="text-[#f2d58d]">{vnd(applied.totalAmount)}</span>
          </div>
          <p className="text-[11px] text-white/50">{c.estimateNote}</p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {candidate && (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2">
              <div className="min-w-0">
                <p className="text-[11px] text-white/60">{c.savedFound}</p>
                <p className="font-mono text-sm font-bold tracking-wider text-[#f2d58d]">{candidate.code}</p>
                {candidate.expiresAt && <p className="text-[11px] text-[#c9a96e]">{s.holdUntil(formatPromoDateTime(candidate.expiresAt))}</p>}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void apply(candidate.code)}
                className="min-h-11 shrink-0 rounded-xl bg-[#c9a96e] px-4 text-sm font-bold text-[#1a120b] disabled:opacity-60"
              >
                {busy ? c.applying : c.apply}
              </button>
            </div>
          )}

          {showInput ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (input.trim()) void apply(input.trim());
              }}
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                maxLength={CODE_MAX_LENGTH}
                placeholder={c.placeholder}
                aria-label={c.placeholder}
                autoCapitalize="characters"
                autoComplete="off"
                className="min-h-11 min-w-0 flex-1 rounded-xl border border-white/15 bg-black/30 px-3 font-mono text-sm uppercase tracking-wider text-white placeholder:normal-case placeholder:tracking-normal placeholder:text-white/40"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="min-h-11 shrink-0 rounded-xl border border-[#c9a96e]/60 px-4 text-sm font-bold text-[#f2d58d] disabled:opacity-50"
              >
                {busy ? c.applying : c.apply}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setShowInput(true)}
              className="min-h-11 text-sm font-semibold text-[#c9a96e] underline-offset-4 hover:underline"
            >
              {c.haveCode}
            </button>
          )}

          {(errorCode || unmetText) && (
            <p role="alert" className="rounded-xl bg-black/25 px-3 py-2 text-xs text-[#f5c08a]">
              {unmetText ?? webVoucherError(s, errorCode)}
            </p>
          )}
        </div>
      )}
    </section>
  );
};

/** Optional feature: a crash here must never block the booking button (CLAUDE.md 4.5). */
class CheckoutVoucherBoundary extends Component<{ children: React.ReactNode; onFail: () => void }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error('[web-claim] checkout voucher crashed:', error);
    this.props.onFail();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const CheckoutVoucher = (props: CheckoutVoucherProps) => (
  <CheckoutVoucherBoundary onFail={() => props.onChange(null)}>
    <CheckoutVoucherBlock {...props} />
  </CheckoutVoucherBoundary>
);

export default CheckoutVoucher;
