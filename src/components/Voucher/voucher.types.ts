/**
 * Promotion types needed by the e-voucher card on WebBooking.
 * Subset of the admin repo `lib/types/promotion.ts` / `promotion-client.ts`
 * (Quan_Tri_Va_KTV, branch feat/bit-lo-hong-phase1). Values match the DB CHECKs.
 */

export type PromotionBenefitType = 'FREE_MINUTES' | 'PERCENT_DISCOUNT' | 'FIXED_DISCOUNT' | 'FREE_SERVICE' | 'FREE_UPGRADE';
export type PromotionUsageType = 'ONE_TIME' | 'LIMITED' | 'UNLIMITED';
export type PromotionPassEffectiveStatus = 'ACTIVE' | 'NOT_STARTED' | 'INACTIVE' | 'EXPIRED' | 'USED_UP' | 'SUSPENDED' | 'CANCELLED';
export type PromotionEmailLang = 'vi' | 'en' | 'cn' | 'jp' | 'kr';
export type PromotionTextI18n = Partial<Record<Exclude<PromotionEmailLang, 'en'>, string>>;
export type PromotionOrderChannel = 'WEB_BOOKING' | 'WALK_IN' | 'ADVANCE_BOOKING';

export interface PromotionBenefit {
  type: PromotionBenefitType;
  /** Minutes for FREE_MINUTES, % for PERCENT_DISCOUNT, VND for FIXED_DISCOUNT. */
  value: number;
}

export interface PromotionUsageRule {
  type: PromotionUsageType;
  limit: number | null;
  usedCount: number;
  maxPerOrder: number;
}

/** Labels resolved for display (menu names, category labels, service names). */
export interface PromotionConditionsSummary {
  match: 'ALL' | 'ANY';
  conditions: {
    menus: string[];
    categories: string[];
    services: string[];
    minMinutes: number | null;
    minOrderAmount: number | null;
    sources?: PromotionOrderChannel[];
  }[];
}

/** Spa contact printed on the e-voucher. */
export interface SpaContact {
  brandName: string;
  hotline: string | null;
  address: string | null;
  websiteUrl: string | null;
}
