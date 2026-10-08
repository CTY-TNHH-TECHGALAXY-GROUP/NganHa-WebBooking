import type {
  PromotionBenefit,
  PromotionConditionsSummary,
  PromotionEmailLang,
  PromotionPassEffectiveStatus,
  PromotionUsageRule,
} from './voucher.types';
import type { WebVoucherClaimStatus, WebVoucherStatus } from '@/lib/voucherWallet';
import { pickPromotionText } from './voucher-page.i18n';

/**
 * What the voucher card renders (same shape as the admin card, Quan_Tri_Va_KTV
 * `components/promotions/VoucherCard3D.logic.ts`).
 */
export interface VoucherCardData {
  campaignName: string;
  benefit: PromotionBenefit;
  usage: Pick<PromotionUsageRule, 'type' | 'limit' | 'maxPerOrder'> & { usedCount: number | null };
  validUntil: string | null;
  /** Real code, or null on templates (a placeholder mask is shown instead). */
  voucherCode: string | null;
  voucherPrefix: string;
  customerName: string | null;
  status: PromotionPassEffectiveStatus | null;
  /** QR value; null hides the QR. */
  qrPayload: string | null;
  isTemplate: boolean;
  /** Engine conditions with labels; formatted by formatPromotionConditions. Empty → "complimentary" line. */
  conditionsSummary?: PromotionConditionsSummary;
}

/** Web-claim lifecycle → the card's status vocabulary (on hold / applied both still usable). */
const CLAIM_TO_CARD_STATUS: Record<WebVoucherClaimStatus, PromotionPassEffectiveStatus> = {
  RESERVED: 'ACTIVE',
  ACTIVE: 'ACTIVE',
  REDEEMED: 'USED_UP',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
};

/** /v/{code}: the QR opens this same page on another phone (no personal data on the card). */
export const voucherCardFromWebClaim = (v: WebVoucherStatus, lang: PromotionEmailLang, pageUrl: string): VoucherCardData => ({
  campaignName: pickPromotionText(v.campaign.name, v.campaign.nameI18n, lang),
  benefit: { type: v.campaign.benefitType, value: Number(v.campaign.benefitValue) },
  usage: { type: 'ONE_TIME', limit: 1, maxPerOrder: 1, usedCount: v.status === 'REDEEMED' ? 1 : 0 },
  validUntil: v.campaign.validUntil,
  voucherCode: v.voucherCode,
  voucherPrefix: v.voucherCode.split('-')[0] ?? v.voucherCode,
  customerName: null,
  status: CLAIM_TO_CARD_STATUS[v.status] ?? 'CANCELLED',
  qrPayload: pageUrl,
  isTemplate: false,
  conditionsSummary: v.campaign.conditions ?? undefined,
});
