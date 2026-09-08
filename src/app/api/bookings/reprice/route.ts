import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import {
  MAX_BODY_BYTES,
  MAX_ITEMS,
  PRIVATE_ROOM_SERVICE_ID,
  buildCanonicalPricing,
  cartIntentFingerprint,
  catalogDigest,
  createQuote,
  normalizeOptions,
  validateCatalogOptions,
  type CatalogService,
  type NormalizedService,
} from '@/lib/booking/contract';

export const dynamic = 'force-dynamic';

const errorResponse = (code: string, message: string, status: number, fieldErrors?: unknown[]) =>
  NextResponse.json({ valid: false, success: false, code, error: message, ...(fieldErrors?.length ? { fieldErrors } : {}) }, { status });

function schemaUnavailable(error: any): boolean {
  return ['42P01', '42703', '42501', '42883', 'PGRST202', 'PGRST204'].includes(error?.code) || /does not exist|schema cache/i.test(String(error?.message || ''));
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return errorResponse('PAYLOAD_TOO_LARGE', 'Request body is too large.', 413);
  } catch {
    return errorResponse('INVALID_JSON', 'Request body could not be read.', 400);
  }
  let body: any;
  try { body = JSON.parse(rawBody); } catch { return errorResponse('INVALID_JSON', 'Request body must be valid JSON.', 400); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return errorResponse('INVALID_BODY', 'Request body must be a JSON object.', 400);
  if (body.items === undefined) return errorResponse('VALIDATION_ERROR', 'Please provide cart items.', 400, [{ field: 'items', code: 'REQUIRED', message: 'Cart items are required.' }]);
  if (!Array.isArray(body.items)) return errorResponse('VALIDATION_ERROR', 'Please provide cart items as an array.', 400, [{ field: 'items', code: 'INVALID_TYPE', message: 'Cart items must be an array.' }]);
  if (body.items.length > MAX_ITEMS) return errorResponse('CART_TOO_LARGE', 'Too many cart items.', 400);
  if (body.items.length === 0) return NextResponse.json({ valid: true, items: [], totalAmountVND: 0, totalAmountUSD: 0, hasPriceChanged: false, unavailableItems: [], quote: null });
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return errorResponse('BOOKING_TEMPORARILY_UNAVAILABLE', 'Pricing is temporarily unavailable. Please try again later.', 503);

  const fieldErrors: { field: string; code: string; message: string }[] = [];
  const normalized: NormalizedService[] = [];
  for (let index = 0; index < body.items.length; index += 1) {
    const item = body.items[index];
    const field = `items[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) { fieldErrors.push({ field, code: 'INVALID_TYPE', message: 'Cart item must be an object.' }); continue; }
    if (typeof item.id !== 'string' || !item.id.trim()) { fieldErrors.push({ field: `${field}.id`, code: 'REQUIRED', message: 'Service id is required.' }); continue; }
    const rawQty = item.quantity ?? item.qty;
    if (rawQty !== undefined && (typeof rawQty === 'boolean' || (typeof rawQty !== 'number' && typeof rawQty !== 'string') || typeof rawQty === 'string' && !/^\d+$/.test(rawQty.trim()))) { fieldErrors.push({ field: `${field}.quantity`, code: 'INVALID_QUANTITY', message: 'Quantity must be a whole number.' }); continue; }
    const quantity = rawQty === undefined ? 1 : Number(rawQty);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) { fieldErrors.push({ field: `${field}.quantity`, code: 'INVALID_QUANTITY', message: 'Quantity must be between 1 and 20.' }); continue; }
    const optionResult = normalizeOptions(item.options, `${field}.options`);
    fieldErrors.push(...optionResult.errors);
    if (optionResult.errors.length || !optionResult.value) continue;
    normalized.push({ id: item.id.trim(), quantity, options: optionResult.value });
  }
  if (fieldErrors.length) return errorResponse('VALIDATION_ERROR', 'Please correct the cart fields.', 400, fieldErrors);

  const ids = Array.from(new Set([...normalized.map((item) => item.id), PRIVATE_ROOM_SERVICE_ID]));
  const supabase = getSupabaseAdmin();
  const { data: rows, error: catalogError } = await supabase.from('Services').select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive, showPreferences, showNotes, showGender, showStrength, showFocus, focusConfig').in('id', ids);
  if (catalogError) {
    console.error('[API Reprice] Catalog read failed:', catalogError.code || 'unknown');
    return errorResponse('BOOKING_TEMPORARILY_UNAVAILABLE', 'Pricing is temporarily unavailable. Please try again later.', schemaUnavailable(catalogError) ? 503 : 503);
  }
  const catalog = (rows || []) as CatalogService[];
  const map = new Map(catalog.map((service) => [service.id, service]));
  const unavailableItems: { id: string; cartId?: string; reason: string }[] = [];
  const validItems = normalized.filter((item, index) => {
    const service = map.get(item.id);
    if (!service) { unavailableItems.push({ id: item.id, cartId: body.items[index]?.cartId, reason: 'SERVICE_NOT_FOUND' }); return false; }
    if (service.isActive !== true) { unavailableItems.push({ id: item.id, cartId: body.items[index]?.cartId, reason: 'SERVICE_INACTIVE' }); return false; }
    const errors = validateCatalogOptionsForReprice(item, service, index);
    if (errors.length) { unavailableItems.push({ id: item.id, cartId: body.items[index]?.cartId, reason: errors[0].code }); return false; }
    if (item.options.addons?.privateRoom === true && (!map.get(PRIVATE_ROOM_SERVICE_ID) || map.get(PRIVATE_ROOM_SERVICE_ID)?.isActive !== true)) { unavailableItems.push({ id: item.id, cartId: body.items[index]?.cartId, reason: 'ADDON_UNAVAILABLE' }); return false; }
    return true;
  });
  if (unavailableItems.length) return NextResponse.json({ valid: false, success: false, code: 'CART_REQUIRES_REVIEW', error: 'Please review the selected services and options.', hasPriceChanged: true, unavailableItems, items: [], totalAmountVND: 0, totalAmountUSD: 0 }, { status: 409 });

  let pricing;
  try { pricing = buildCanonicalPricing(validItems, catalog, map.get(PRIVATE_ROOM_SERVICE_ID) || { id: PRIVATE_ROOM_SERVICE_ID, priceVND: null, priceUSD: null, duration: 0, isActive: false }); }
  catch { return errorResponse('BOOKING_TEMPORARILY_UNAVAILABLE', 'Pricing is temporarily unavailable. Please try again later.', 503); }
  let hasPriceChanged = false;
  const repricedItems = pricing.items.map((item, index) => {
    const original = body.items[index];
    if (original.priceVND !== undefined && (typeof original.priceVND !== 'number' || original.priceVND !== item.priceVND)) hasPriceChanged = true;
    if (original.priceUSD !== undefined && (typeof original.priceUSD !== 'number' || original.priceUSD !== item.priceUSD)) hasPriceChanged = true;
    if (original.duration !== undefined && (typeof original.duration !== 'number' || original.duration !== item.duration)) hasPriceChanged = true;
    return { id: item.id, cartId: original.cartId, quantity: item.quantity, basePriceVND: item.basePriceVND, basePriceUSD: item.basePriceUSD, priceVND: item.priceVND, priceUSD: item.priceUSD, duration: item.duration, names: { vi: item.catalog.nameVN || '', en: item.catalog.nameEN || '', cn: item.catalog.nameCN || '', jp: item.catalog.nameJP || '', kr: item.catalog.nameKR || '' }, hasPrivateRoom: item.hasPrivateRoom, options: item.options };
  });
  const cartFingerprint = cartIntentFingerprint(normalized);
  return NextResponse.json({ valid: true, success: true, hasPriceChanged, unavailableItems: [], totalAmountVND: pricing.totalAmountVND, totalAmountUSD: pricing.totalAmountUSD, items: repricedItems, quote: createQuote(cartFingerprint, pricing) });
}

function validateCatalogOptionsForReprice(item: NormalizedService, service: CatalogService, index: number) {
  return validateCatalogOptions(item.options, service, `items[${index}].options`);
}
