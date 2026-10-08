'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck } from 'lucide-react';
import type { SpaContact, PromotionEmailLang } from './voucher.types';
import VoucherCard3D from './VoucherCard3D';
import { voucherCardFromWebClaim } from './VoucherCard3D.logic';
import { VOUCHER_CARD_LABELS } from './voucher-card.i18n';
import { WEB_VOUCHER_I18N } from '@/components/Promotions/WebVoucher.i18n';
import { removeFromWallet, saveToWallet, type WebVoucherStatus } from '@/lib/voucherWallet';

interface WebVoucherCardViewProps {
  voucher: WebVoucherStatus;
  lang: PromotionEmailLang;
  pageUrl: string;
  contact: SpaContact;
}

/** Card labels hold formatter functions, so they are picked here on the client (same as VoucherCardLocalized). */
export const WebVoucherCardView = ({ voucher, lang, pageUrl, contact }: WebVoucherCardViewProps) => {
  const labels = { ...VOUCHER_CARD_LABELS[lang], qrInstruction: WEB_VOUCHER_I18N[lang].qrOpenOnDevice };
  // Keep this browser's wallet in line with the server (B16): drop codes no longer on hold.
  useEffect(() => {
    if (voucher.status !== 'RESERVED') removeFromWallet(voucher.voucherCode);
  }, [voucher.status, voucher.voucherCode]);

  return (
    <VoucherCard3D
      data={voucherCardFromWebClaim(voucher, lang, pageUrl)}
      labels={labels}
      brandName={contact.brandName}
      contact={contact}
    />
  );
};

interface WebVoucherBookButtonProps {
  voucher: WebVoucherStatus | null;
  lang: PromotionEmailLang;
  label: string;
}

/**
 * Opened on another device (Zalo → Safari): put the code in THIS browser's wallet
 * so checkout finds it, then go to the menu.
 */
export const WebVoucherBookButton = ({ voucher, lang, label }: WebVoucherBookButtonProps) => {
  const router = useRouter();
  const onClick = () => {
    if (voucher?.status === 'RESERVED' && voucher.campaign.slug) {
      saveToWallet({ code: voucher.voucherCode, slug: voucher.campaign.slug, savedAt: new Date().toISOString(), expiresAt: voucher.expiresAt });
    }
    router.push(`/${lang}/pure-relaxation`);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-[#24160D] px-5 text-sm font-bold text-[#F4A64A] shadow-md ring-1 ring-[#F4A64A]/30 transition-all hover:bg-[#382315] active:scale-[0.99]"
    >
      <CalendarCheck size={18} className="shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
};
