// POST /api/bookings/voucher-preview — "Áp dụng" at checkout (display only).
// Prices the cart with the same pipeline as /api/bookings, builds the exact rows the
// atomic writer would receive (buildBookingItems), then asks promo_web_preview (v16).
// The real discount is whatever the writer returns at booking time.
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  MAX_BODY_BYTES,
  MAX_ITEMS,
  PRIVATE_ROOM_SERVICE_ID,
  buildCanonicalPricing,
  canonicalizeOptionsForService,
  normalizeOptions,
  validateCatalogOptions,
  type CatalogService,
  type NormalizedService,
} from '@/lib/booking/contract';
import { buildBookingItems } from '@/lib/booking/dispatchItems';
import { clientIp, isRateLimited, isValidVoucherCode, normalizeVoucherCode } from '@/lib/voucherWallet.server';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const PREVIEW_LIMIT_PER_MINUTE = 20;
const PREVIEW_BOOKING_ID = 'WB-PREVIEW';
const MAX_ITEM_QUANTITY = 20;

const fail = (code: string, status: number) =>
  NextResponse.json({ success: false, error: { code, message: code } }, { status, headers: { 'Cache-Control': 'no-store' } });

export async function POST(request: NextRequest) {
  if (isRateLimited(`voucher-preview:${clientIp(request)}`, PREVIEW_LIMIT_PER_MINUTE, 60_000)) return fail('RATE_LIMITED', 429);

  let body: { items?: unknown; voucherCode?: unknown };
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return fail('INVALID_REQUEST', 413);
    body = JSON.parse(raw);
  } catch {
    return fail('INVALID_REQUEST', 400);
  }
  const code = typeof body?.voucherCode === 'string' ? normalizeVoucherCode(body.voucherCode) : '';
  if (!isValidVoucherCode(code)) return fail('VOUCHER_NOT_FOUND', 404);
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > MAX_ITEMS) return fail('INVALID_REQUEST', 400);

  const selected: NormalizedService[] = [];
  for (let index = 0; index < body.items.length; index += 1) {
    const item = body.items[index] as Record<string, unknown> | null;
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !item.id.trim()) return fail('INVALID_REQUEST', 400);
    const quantity = item.quantity === undefined ? 1 : Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_ITEM_QUANTITY) return fail('INVALID_REQUEST', 400);
    const options = normalizeOptions(item.options, `items[${index}].options`);
    if (options.errors.length || !options.value) return fail('INVALID_REQUEST', 400);
    selected.push({ id: item.id.trim(), quantity, options: options.value });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) return fail('INTERNAL_ERROR', 503);
  const supabase = getSupabaseAdmin();
  try {
    const ids = Array.from(new Set([...selected.map((item) => item.id), PRIVATE_ROOM_SERVICE_ID]));
    const { data: rows, error: catalogError } = await supabase
      .from('Services')
      .select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive, showCustomForYou, showPreferences, showNotes, showGender, showStrength, strengthConfig, showFocus, focusConfig, tags')
      .in('id', ids);
    if (catalogError) throw catalogError;
    const catalog = (rows || []) as CatalogService[];
    const map = new Map(catalog.map((service) => [service.id, service]));
    const canonical: NormalizedService[] = [];
    for (const item of selected) {
      const service = map.get(item.id);
      if (!service || service.isActive !== true) return fail('SERVICE_NOT_BOOKABLE', 409);
      const options = canonicalizeOptionsForService(item.options, service).options;
      if (validateCatalogOptions(options, service, 'items').length) return fail('SERVICE_NOT_BOOKABLE', 409);
      canonical.push({ ...item, options });
    }
    const addon = map.get(PRIVATE_ROOM_SERVICE_ID) || { id: PRIVATE_ROOM_SERVICE_ID, priceVND: null, priceUSD: null, duration: 0, isActive: false };
    const pricing = buildCanonicalPricing(canonical, catalog, addon as CatalogService);
    const items = buildBookingItems(pricing, PREVIEW_BOOKING_ID).map((row) => ({
      serviceId: row.serviceId,
      quantity: row.quantity,
      options: row.options,
    }));

    const { data, error } = await supabase.rpc('promo_web_preview', { p_code: code, p_items: items });
    if (error) throw error;
    const result = data as { success?: boolean; error?: { code?: string } };
    const status = result?.success ? 200 : result?.error?.code === 'VOUCHER_NOT_FOUND' ? 404 : 409;
    return NextResponse.json(result, { status, headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    if (String(error?.message || '').startsWith('SERVICE_')) return fail('SERVICE_NOT_BOOKABLE', 409);
    // v16 not deployed (B20) behaves like the switch being off: the checkout simply has no voucher.
    if (['PGRST202', '42883'].includes(error?.code)) return fail('FEATURE_DISABLED', 409);
    console.error('[voucher-preview] failed:', error?.code || error?.message);
    return fail('INTERNAL_ERROR', 500);
  }
}
