import type { PromotionBenefit, PromotionConditionsSummary, PromotionTextI18n } from '@/components/Voucher/voucher.types';

/**
 * Browser-side voucher wallet for the web-claim e-voucher.
 *
 * localStorage is a convenience, NEVER the source of truth: every status shown
 * comes from the server. In-app browsers (Zalo / Facebook) and private Safari may
 * block storage, so every access is wrapped and falls back to memory (plan B15).
 * Uses its own keys, so clearBookingCart() never touches it (plan B16).
 */

// 🔧 CONFIGURATION
export const VOUCHER_WALLET_KEY = 'oria_saved_vouchers';
const DEVICE_ID_KEY = 'oria_device_id';
const MAX_WALLET_ENTRIES = 10;

// ─── Shared DTOs (server routes ↔ UI) ──────────────────────────────────────────

export type WebClaimStockStatus = 'OPEN' | 'PAUSED' | 'SOLD_OUT' | 'ENDED' | 'INACTIVE' | 'NOT_STARTED';

export interface WebClaimStock {
  status: WebClaimStockStatus;
  available: number;
  total: number;
  /** Bumped on every change: realtime is unordered, keep the highest only. */
  version: number;
  validFrom: string;
  validUntil: string;
}

export interface WebClaimCampaign {
  slug: string;
  name: string;
  nameI18n: PromotionTextI18n | null;
  benefit: PromotionBenefit;
  maxDiscountAmount: number | null;
  conditionsSummary: PromotionConditionsSummary | null;
  stock: WebClaimStock;
}

export type WebVoucherClaimStatus = 'RESERVED' | 'ACTIVE' | 'REDEEMED' | 'EXPIRED' | 'CANCELLED';

/** promo_web_voucher_status — no phone, no name, booking id only as its last 3 chars. */
export interface WebVoucherStatus {
  voucherCode: string;
  status: WebVoucherClaimStatus;
  expiresAt: string | null;
  activatedAt: string | null;
  bookingRef: string | null;
  campaign: {
    slug: string | null;
    name: string;
    nameI18n: PromotionTextI18n | null;
    benefitType: PromotionBenefit['type'];
    benefitValue: number;
    benefitConfig: { maxDiscountAmount?: number } | null;
    conditions: PromotionConditionsSummary | null;
    validUntil: string;
  };
}

export interface SavedVoucher {
  code: string;
  slug: string;
  savedAt: string;
  /** End of the reservation hold when saved (display hint only). */
  expiresAt: string | null;
}

/** Newer version wins; equal is a no-op refresh. */
export const isNewerStock = (incoming: WebClaimStock, current: WebClaimStock | null) =>
  !current || incoming.version >= current.version;

// ─── Storage (guarded) ─────────────────────────────────────────────────────────

const memory = new Map<string, string>();

// Once a write fails (quota / blocked), this page view keeps using memory only.
let storageBroken = false;

const safeGet = (key: string): string | null => {
  if (!storageBroken) {
    try {
      // Readable storage is authoritative (another tab may have removed the key).
      return window.localStorage.getItem(key);
    } catch {
      storageBroken = true;
    }
  }
  return memory.get(key) ?? null;
};

const safeSet = (key: string, value: string) => {
  memory.set(key, value);
  if (storageBroken) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    storageBroken = true;
  }
};

const randomId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
  }
};

/** Random per-browser id; the server hashes it before it reaches the DB. */
export const getDeviceId = (): string => {
  const existing = safeGet(DEVICE_ID_KEY);
  if (existing && /^[A-Za-z0-9-]{16,64}$/.test(existing)) return existing;
  const id = randomId();
  safeSet(DEVICE_ID_KEY, id);
  return id;
};

const isSavedVoucher = (v: unknown): v is SavedVoucher =>
  !!v && typeof v === 'object' && typeof (v as SavedVoucher).code === 'string' && typeof (v as SavedVoucher).slug === 'string';

export const readWallet = (): SavedVoucher[] => {
  try {
    const parsed = JSON.parse(safeGet(VOUCHER_WALLET_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter(isSavedVoucher) : [];
  } catch {
    return [];
  }
};

const writeWallet = (list: SavedVoucher[]) => {
  safeSet(VOUCHER_WALLET_KEY, JSON.stringify(list.slice(0, MAX_WALLET_ENTRIES)));
  // `storage` only fires in OTHER tabs: notify this tab's listeners too.
  window.dispatchEvent(new CustomEvent(WALLET_EVENT));
};

export const saveToWallet = (entry: SavedVoucher) => {
  const rest = readWallet().filter((v) => v.code !== entry.code && v.slug !== entry.slug);
  writeWallet([entry, ...rest]);
};

export const removeFromWallet = (code: string) => {
  const list = readWallet();
  if (list.some((v) => v.code === code)) writeWallet(list.filter((v) => v.code !== code));
};

/**
 * After a booking: drop the code only once the server says it was used
 * (ACTIVE / REDEEMED). The booking response may echo a code that was not applied.
 */
export const removeFromWalletIfUsed = async (code: string) => {
  try {
    const res = await fetch(`/api/vouchers/${encodeURIComponent(code)}`, { cache: 'no-store' });
    const body = (await res.json()) as { success?: boolean; data?: { status?: WebVoucherClaimStatus } };
    if (body.success && (body.data?.status === 'ACTIVE' || body.data?.status === 'REDEEMED')) removeFromWallet(code);
  } catch {
    // offline: the wallet re-checks the code on its next sync
  }
};

export const findSavedForSlug = (slug: string) => readWallet().find((v) => v.slug === slug) ?? null;

const WALLET_EVENT = 'oria-voucher-wallet';

/** Fires when the wallet changes in this tab or another tab (`storage`). Returns unsubscribe. */
export const subscribeWallet = (onChange: () => void) => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === VOUCHER_WALLET_KEY) onChange();
  };
  window.addEventListener('storage', onStorage);
  window.addEventListener(WALLET_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(WALLET_EVENT, onChange);
  };
};
