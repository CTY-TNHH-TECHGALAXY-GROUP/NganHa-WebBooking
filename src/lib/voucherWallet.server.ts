import { createHash } from 'crypto';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { PromotionConditionsSummary, PromotionTextI18n, SpaContact } from '@/components/Voucher/voucher.types';
import type { WebClaimCampaign, WebClaimStock, WebClaimStockStatus, WebVoucherStatus } from '@/lib/voucherWallet';

/**
 * Server side of the web-claim e-voucher (promotion engine v15, Supabase).
 * DB contract: Quan_Tri_Va_KTV `TableInSupabase.md` → [v15]. Only RPCs and the public
 * stock table are used; no promotion table is written from here.
 * Every function is isolated from the booking hot path: callers wrap errors and hide the card.
 */

// 🔧 CONFIGURATION
const FEATURE_FLAG_KEY = 'promotion_web_claim_enabled';
const LISTED_STOCK_STATUSES: WebClaimStockStatus[] = ['OPEN', 'PAUSED', 'SOLD_OUT'];
const MAX_LISTED_CAMPAIGNS = 3;
const SLUG_RE = /^[a-z0-9][a-z0-9-]{1,59}$/;
const VOUCHER_CODE_RE = /^[A-Z0-9]{2,10}-[A-Z0-9]{6}$/; // <voucher_prefix>-<promo_random_code(6)>
const DEVICE_ID_RE = /^[A-Za-z0-9-]{16,64}$/;
const CONTACT_KEYS = ['email_brand_name', 'email_hotline', 'email_branch_address', 'email_branch_name', 'email_website_url'] as const;
const CONTACT_DEFAULTS: SpaContact = {
  brandName: 'Oria Spa',
  hotline: '+84 964 090 277',
  address: '11 Ngô Đức Kế, P. Sài Gòn, TP. Hồ Chí Minh, Việt Nam',
  websiteUrl: null,
};

export type RpcResult<T> = { success: true; data: T } | { success: false; error: { code: string; message: string }; data?: unknown };

const requireAdmin = (): SupabaseClient => {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error('Supabase admin client is not configured');
  return admin;
};

const parseBool = (value: unknown): boolean => {
  const v = String(typeof value === 'string' ? value : JSON.stringify(value ?? '')).replace(/"/g, '').trim().toLowerCase();
  return v === 'true' || v === '1' || v === 'yes' || v === 'on';
};

const parseText = (value: unknown): string | null => {
  if (value == null) return null;
  const v = typeof value === 'string' ? value : String(value);
  return v.trim() || null;
};

export const isValidSlug = (slug: string) => SLUG_RE.test(slug);
export const normalizeVoucherCode = (raw: string) => raw.trim().toUpperCase();
export const isValidVoucherCode = (code: string) => VOUCHER_CODE_RE.test(code);
export const isValidDeviceId = (id: unknown): id is string => typeof id === 'string' && DEVICE_ID_RE.test(id);

/** Kill switch (SystemConfigs). Missing row = off, same default as the RPCs. */
export const isWebClaimEnabled = async (admin: SupabaseClient = requireAdmin()): Promise<boolean> => {
  const { data, error } = await admin.from('SystemConfigs').select('value').eq('key', FEATURE_FLAG_KEY).maybeSingle();
  if (error) throw error;
  return parseBool(data?.value);
};

export const toStock = (row: Record<string, unknown>): WebClaimStock => ({
  status: row.status as WebClaimStockStatus,
  available: Number(row.available),
  total: Number(row.total),
  version: Number(row.version),
  validFrom: String(row.valid_from ?? row.validFrom),
  validUntil: String(row.valid_until ?? row.validUntil),
});

/** Campaigns shown as a card: switch on + stock OPEN / PAUSED / SOLD_OUT. Never throws for "nothing to show". */
export const listWebClaimCampaigns = async (): Promise<WebClaimCampaign[]> => {
  const admin = requireAdmin();
  if (!(await isWebClaimEnabled(admin))) return [];

  const { data: stocks, error } = await admin
    .from('PromotionCampaignStock')
    .select('campaign_id, public_slug, status, benefit_type, benefit_value, total, available, valid_from, valid_until, version')
    .in('status', LISTED_STOCK_STATUSES)
    .order('valid_until', { ascending: true })
    .limit(MAX_LISTED_CAMPAIGNS);
  if (error) throw error;
  if (!stocks?.length) return [];

  const { data: campaigns, error: cErr } = await admin
    .from('PromotionCampaigns')
    .select('id, name, name_i18n, benefit_config, apply_conditions')
    .in('id', stocks.map((s) => s.campaign_id));
  if (cErr) throw cErr;
  const byId = new Map((campaigns ?? []).map((c) => [c.id, c]));

  return Promise.all(
    stocks
      .filter((s) => byId.has(s.campaign_id))
      .map(async (s) => {
        const c = byId.get(s.campaign_id)!;
        const { data: summary } = await admin.rpc('promo_conditions_summary', { p_conditions: c.apply_conditions ?? {} });
        return {
          slug: s.public_slug,
          name: c.name,
          nameI18n: (c.name_i18n ?? null) as PromotionTextI18n | null,
          benefit: { type: s.benefit_type, value: Number(s.benefit_value) },
          maxDiscountAmount: Number(c.benefit_config?.maxDiscountAmount) || null,
          conditionsSummary: (summary ?? null) as PromotionConditionsSummary | null,
          stock: toStock(s),
        };
      }),
  );
};

/** Public stock of one campaign; null when not a web-claim campaign or the switch is off. */
export const getWebClaimStock = async (slug: string): Promise<WebClaimStock | null> => {
  const admin = requireAdmin();
  if (!(await isWebClaimEnabled(admin))) return null;
  const { data, error } = await admin
    .from('PromotionCampaignStock')
    .select('status, total, available, valid_from, valid_until, version')
    .eq('public_slug', slug)
    .maybeSingle();
  if (error) throw error;
  return data ? toStock(data) : null;
};

export const reserveWebVoucher = async (slug: string, deviceId: string, ip: string) => {
  const { data, error } = await requireAdmin().rpc('promo_web_reserve', {
    p_slug: slug,
    p_device_hash: sha256(`device:${deviceId}`),
    p_ip_hash: hashIp(ip),
  });
  if (error) throw error;
  return data as RpcResult<{ reused: boolean; voucherCode: string; status: 'RESERVED'; expiresAt: string; stock: Record<string, unknown> | null }>;
};

export const getWebVoucherStatus = async (code: string) => {
  const { data, error } = await requireAdmin().rpc('promo_web_voucher_status', { p_code: code });
  if (error) throw error;
  return data as RpcResult<WebVoucherStatus>;
};

/** Spa contact printed on the e-voucher: same SystemConfigs keys as the admin /voucher page. */
export const getSpaContact = async (): Promise<SpaContact> => {
  try {
    const { data } = await requireAdmin().from('SystemConfigs').select('key, value').in('key', CONTACT_KEYS as unknown as string[]);
    const cfg = new Map((data ?? []).map((r) => [r.key as string, parseText(r.value)]));
    return {
      brandName: cfg.get('email_brand_name') ?? CONTACT_DEFAULTS.brandName,
      hotline: cfg.get('email_hotline') ?? CONTACT_DEFAULTS.hotline,
      address: cfg.get('email_branch_address') ?? cfg.get('email_branch_name') ?? CONTACT_DEFAULTS.address,
      websiteUrl: null, // already on the booking site: the page links to the menu instead
    };
  } catch {
    return CONTACT_DEFAULTS;
  }
};

// ─── Abuse protection ──────────────────────────────────────────────────────────

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** Raw IPs never leave this server: the DB only sees SHA-256(IP + server secret). */
const hashIp = (ip: string) => {
  const secret = process.env.VOUCHER_IP_HASH_SECRET;
  if (!secret) throw new Error('VOUCHER_IP_HASH_SECRET is not configured');
  return sha256(`${ip}|${secret}`);
};

export const clientIp = (request: NextRequest) =>
  request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown-network';

const rateBuckets = new Map<string, { startedAt: number; count: number }>();

/**
 * Per-instance fixed window. A light first layer only: the DB already caps
 * reservations (1 per device, 3 per IP) and BotID screens the reserve route.
 */
export const isRateLimited = (key: string, limit: number, windowMs: number, now = Date.now()) => {
  const bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= windowMs) {
    if (rateBuckets.size > 5000) rateBuckets.clear();
    rateBuckets.set(key, { startedAt: now, count: 1 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > limit;
};
