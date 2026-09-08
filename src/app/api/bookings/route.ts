import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendBookingConfirmationEmail } from '@/lib/mailer';
import {
  BRANCH_DEFAULT,
  MAX_BODY_BYTES,
  PRIVATE_ROOM_SERVICE_ID,
  buildCanonicalPricing,
  cartIntentFingerprint,
  catalogDigest,
  isBookingTimeInPast,
  parseBookingRequest,
  serviceName,
  validateCatalogOptions,
  verifyQuote,
  type CatalogService,
  type CanonicalPricing,
  type NormalizedBooking,
} from '@/lib/booking/contract';

export const dynamic = 'force-dynamic';

type BookingSnapshot = {
  bookingId: string;
  billCode: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  date: string;
  time: string | null;
  branchName: string;
  guests: number;
  totalAmount: number;
  lang: string;
  status?: string;
  items?: unknown[];
  services?: unknown[];
  notes?: string | null;
  focusAreaNote?: string | null;
};

const jsonError = (code: string, message: string, status: number, fieldErrors?: unknown[]) =>
  NextResponse.json({ success: false, code, error: message, ...(fieldErrors?.length ? { fieldErrors } : {}) }, { status });

function schemaUnavailable(error: any): boolean {
  const message = String(error?.message || '');
  return ['42P01', '42703', '42501', '42883', 'PGRST202', 'PGRST204'].includes(error?.code) ||
    /schema cache|could not find the function|function create_booking_atomic/i.test(message);
}

function mapRpcError(error: any): NextResponse {
  const message = String(error?.message || '');
  if (/IDEMPOTENCY_CONFLICT/i.test(message)) return jsonError('IDEMPOTENCY_CONFLICT', 'This idempotency key was already used for a different booking intent.', 409);
  if (/IDEMPOTENCY_LEGACY_REVIEW/i.test(message)) return jsonError('IDEMPOTENCY_REVIEW_REQUIRED', 'This older booking needs review before it can be replayed.', 409);
  if (/PRICE_CHANGED|QUOTE/i.test(message)) return jsonError('PRICE_CHANGED', 'The service catalog changed. Please review your booking again.', 409);
  if (/CUSTOMER_IDENTITY_CONFLICT/i.test(message)) return jsonError('CONTACT_REQUIRES_REVIEW', 'Please review your contact details or contact the spa.', 409);
  if (schemaUnavailable(error) || /timeout|temporarily|connection/i.test(message)) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  if (/inactive|does not exist|service/i.test(message)) return jsonError('CART_REQUIRES_REVIEW', 'A selected service is no longer available.', 409);
  return jsonError('BOOKING_FAILED', 'The booking could not be created.', 500);
}

function responseForSnapshot(snapshot: BookingSnapshot, idempotent: boolean): NextResponse {
  return NextResponse.json({
    success: true,
    idempotent,
    data: {
      bookingId: snapshot.bookingId,
      billCode: snapshot.billCode || snapshot.bookingId,
      customerName: snapshot.customerName,
      customerPhone: snapshot.customerPhone,
      customerEmail: snapshot.customerEmail,
      date: snapshot.date,
      time: snapshot.time,
      branchName: snapshot.branchName,
      guests: snapshot.guests,
      services: snapshot.services || [],
      items: snapshot.items || [],
      totalAmount: snapshot.totalAmount,
      lang: snapshot.lang,
      status: snapshot.status || 'NEW',
    },
  });
}

function dateOnly(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.slice(0, 10);
}

function servicesFromItems(items: any[]): unknown[] {
  return items.filter(item => !item.options?.isAddon).map(item => {
    const saved = item.options?._booking;
    const addon = saved ? items.find(candidate => candidate.options?.isAddon && candidate.options?.parentLine === saved.line) : undefined;
    return {
      id: item.serviceId, name: saved?.name || item.options?.displayName || item.serviceId,
      duration: saved?.duration || 0, quantity: Number(item.quantity),
      priceVND: Number(item.price) + Number(addon?.price || 0),
      priceUSD: saved ? Number(saved.priceUSD) + Number(addon?.options?._booking?.priceUSD || 0) : undefined,
      options: saved?.options || item.options || {},
    };
  });
}

function snapshotFromRow(row: any, items: unknown[] = [], services: unknown[] = []): BookingSnapshot {
  return {
    bookingId: String(row?.id || row?.bookingId || ''),
    billCode: String(row?.billCode || row?.bill_code || row?.id || ''),
    customerName: String(row?.customerName || ''),
    customerPhone: row?.customerPhone ?? null,
    customerEmail: row?.customerEmail ?? null,
    date: dateOnly(row?.bookingDate || row?.date),
    time: row?.timeBooking ?? row?.time ?? null,
    branchName: String(row?.branchName || BRANCH_DEFAULT),
    guests: Number(row?.guestCount || row?.guests || 1),
    totalAmount: Number(row?.totalAmount || 0),
    lang: String(row?.customerLang || row?.lang || 'vi'),
    status: row?.status || 'NEW',
    items,
    services: items.length ? servicesFromItems(items) : services,
    notes: row?.notes ?? null,
    focusAreaNote: row?.focusAreaNote ?? null,
  };
}

async function loadCommittedSnapshot(supabase: any, bookingId: string, fallback: BookingSnapshot): Promise<BookingSnapshot> {
  try {
    const [{ data: booking }, { data: items }] = await Promise.all([
      supabase.from('Bookings').select('id, billCode, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, guestCount, totalAmount, customerLang, status, notes, focusAreaNote').eq('id', bookingId).maybeSingle(),
      supabase.from('BookingItems').select('id, bookingId, serviceId, quantity, price, status, options, tip').eq('bookingId', bookingId),
    ]);
    if (booking) return snapshotFromRow(booking, items || [], fallback.services || []);
  } catch {
    // Use the RPC snapshot when a legacy staging schema lacks read columns.
  }
  return fallback;
}

async function findReplay(supabase: any, key: string, intentFingerprint: string): Promise<{ snapshot?: BookingSnapshot; conflict?: string } | null> {
  try {
    let row: any = null;
    for (const lookup of [
      (query: any) => query.eq('idempotency_key', key),
      (query: any) => query.eq('idLegacy', `idemp:${key}`),
    ]) {
      const result = await lookup(supabase.from('Bookings').select('id, billCode, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, guestCount, totalAmount, customerLang, status, notes, focusAreaNote, idempotency_fingerprint').limit(1));
      if (result.data?.[0]) { row = result.data[0]; break; }
      if (result.data && !Array.isArray(result.data) && result.data.id) { row = result.data; break; }
    }
    if (!row) return null;
    if (row.idempotency_fingerprint && row.idempotency_fingerprint !== intentFingerprint) return { conflict: 'IDEMPOTENCY_CONFLICT' };
    if (!row.idempotency_fingerprint) return { conflict: 'IDEMPOTENCY_REVIEW_REQUIRED' };
    const { data: items } = await supabase.from('BookingItems').select('id, bookingId, serviceId, quantity, price, status, options, tip').eq('bookingId', row.id);
    return { snapshot: snapshotFromRow(row, items || []) };
  } catch {
    return null;
  }
}

function localizedServices(pricing: CanonicalPricing, booking: NormalizedBooking): unknown[] {
  return pricing.items.map((item) => ({
    variantId: item.id,
    serviceId: item.id,
    name: serviceName(item.catalog, booking.lang),
    duration: item.duration,
    basePriceVND: item.basePriceVND,
    basePriceUSD: item.basePriceUSD,
    priceVND: item.priceVND,
    priceUSD: item.priceUSD,
    quantity: item.quantity,
    options: item.options,
    hasPrivateRoomAddon: item.hasPrivateRoom,
  }));
}

function buildNotes(booking: NormalizedBooking, pricing: CanonicalPricing): { notes: string | null; focusAreaNote: string | null } {
  const notes: string[] = [];
  if (booking.guests > 1) notes.push(`Guests: ${booking.guests}`);
  if (booking.staffGender !== 'any') notes.push(`Therapist: ${booking.staffGender}`);
  if (booking.note) notes.push(booking.note);
  const preferences = pricing.items.flatMap((item) => {
    const output: string[] = [];
    if (item.options.addons?.privateRoom) output.push('Private Room');
    if (item.options.bodyParts?.focus.length) output.push(`Focus: ${item.options.bodyParts.focus.join(', ')}`);
    if (item.options.bodyParts?.avoid.length) output.push(`Avoid: ${item.options.bodyParts.avoid.join(', ')}`);
    if (item.options.strength) output.push(`Pressure: ${item.options.strength}`);
    if (item.options.notes?.tag0) output.push('Pregnancy note');
    if (item.options.notes?.tag1) output.push('Allergy or sensitive skin note');
    if (item.options.notes?.content) output.push(item.options.notes.content);
    return output.length ? [`[${serviceName(item.catalog, booking.lang)}]`, ...output] : [];
  });
  return { notes: notes.length ? notes.join(' | ') : null, focusAreaNote: preferences.length ? preferences.join('\n') : null };
}

function buildRpcPayload(booking: NormalizedBooking, pricing: CanonicalPricing): { booking: Record<string, unknown>; items: Record<string, unknown>[] } {
  const preferenceNotes = buildNotes(booking, pricing);
  const bookingPayload: Record<string, unknown> = {
    source: 'WEB_BOOKING', guestCount: booking.guests, branchName: booking.branchName,
    bookingDate: new Date(`${booking.date}T${booking.time}:00+07:00`).toISOString(), timeBooking: booking.time,
    customerName: booking.name, customerPhone: booking.phone, customerEmail: booking.email,
    customerGender: booking.customerGender, customerLang: booking.lang, customerId: null,
    roomName: pricing.items.some((item) => item.hasPrivateRoom) ? 'Private Room' : null,
    notes: preferenceNotes.notes, focusAreaNote: preferenceNotes.focusAreaNote,
    totalAmount: pricing.totalAmountVND, status: 'NEW', tip: 0, requestFingerprint: booking.intentFingerprint,
  };
  const items = pricing.items.flatMap((item, line) => {
    const options = { strength: item.options.strength, focus: item.options.bodyParts?.focus || [], avoid: item.options.bodyParts?.avoid || [], therapist: item.options.therapist || 'random', note: item.options.notes?.content || '',
      _booking: { line, name: serviceName(item.catalog, booking.lang), duration: item.duration, priceUSD: item.basePriceUSD, options: item.options } };
    const rows: Record<string, unknown>[] = [{ serviceId: item.id, quantity: item.quantity, price: item.basePriceVND, status: 'WAITING', options, tip: 0 }];
    if (item.hasPrivateRoom) rows.push({ serviceId: PRIVATE_ROOM_SERVICE_ID, quantity: item.quantity, price: item.addonPriceVND, status: 'WAITING', options: { displayName: 'Private Room', parentServiceId: item.id, parentLine: line, isAddon: true, _booking: { priceUSD: item.addonPriceUSD } }, tip: 0 });
    return rows;
  });
  return { booking: bookingPayload, items };
}

function snapshotFromRpc(result: any, booking: NormalizedBooking, pricing: CanonicalPricing): BookingSnapshot {
  const data = result?.data && typeof result.data === 'object' ? result.data : result;
  return {
    bookingId: String(result?.booking_id || data?.bookingId || ''), billCode: String(result?.bill_code || data?.billCode || result?.booking_id || data?.bookingId || ''),
    customerName: String(data?.customerName || booking.name), customerPhone: data?.customerPhone ?? booking.phone, customerEmail: data?.customerEmail ?? booking.email,
    date: String(data?.date || booking.date), time: data?.time ?? booking.time, branchName: String(data?.branchName || booking.branchName),
    guests: Number(data?.guests || booking.guests), totalAmount: Number(data?.totalAmount ?? pricing.totalAmountVND), lang: String(data?.lang || booking.lang),
    status: String(data?.status || 'NEW'), items: data?.items || [], services: localizedServices(pricing, booking), notes: data?.notes || null, focusAreaNote: data?.focusAreaNote || null,
  };
}

async function resolveReceptionEmail(supabase: any): Promise<string> {
  const valid = (value: unknown) => typeof value === 'string' && /^[^\s@<>,;:]+@[^\s@<>,;:]+\.[^\s@<>,;:]+$/.test(value.trim()) ? value.trim() : null;
  try {
    const { data } = await supabase.from('SystemConfigs').select('value').eq('key', 'system_settings').maybeSingle();
    const configured = valid(data?.value?.receptionEmail);
    if (configured) return configured;
  } catch {
    // A missing reception setting must not change a committed booking outcome.
  }
  return valid(process.env.RECEPTION_NOTIFICATION_EMAIL) || valid(process.env.RECEPTION_EMAIL) || 'info@techgalaxygroup.com';
}

export async function POST(request: Request) {
  let rawBody: string;
  try {
    rawBody = await request.text();
    if (Buffer.byteLength(rawBody, 'utf8') > MAX_BODY_BYTES) return jsonError('PAYLOAD_TOO_LARGE', 'Request body is too large.', 413);
  } catch {
    return jsonError('INVALID_JSON', 'Request body could not be read.', 400);
  }
  let body: unknown;
  try { body = JSON.parse(rawBody); } catch { return jsonError('INVALID_JSON', 'Request body must be valid JSON.', 400); }
  if (body === null || Array.isArray(body) || typeof body !== 'object') return jsonError('INVALID_BODY', 'Request body must be a JSON object.', 400);

  // A replay remains available when its original slot or catalog entry changed.
  const parsed = parseBookingRequest(body, request, { allowPastForReplay: true });
  if (!parsed.ok) return jsonError('VALIDATION_ERROR', 'Please correct the highlighted fields.', 400, parsed.errors);
  const booking = parsed.value;
  const finalKey = booking.idempotencyKey || `hash_${booking.intentFingerprint.slice(0, 48)}`;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  const supabase = getSupabaseAdmin();

  const replay = await findReplay(supabase, finalKey, booking.intentFingerprint);
  if (replay?.conflict === 'IDEMPOTENCY_CONFLICT') return jsonError('IDEMPOTENCY_CONFLICT', 'This idempotency key was already used for a different booking intent.', 409);
  if (replay?.conflict === 'IDEMPOTENCY_REVIEW_REQUIRED') return jsonError('IDEMPOTENCY_REVIEW_REQUIRED', 'This older booking needs review before it can be replayed.', 409);
  if (replay?.snapshot) return responseForSnapshot(replay.snapshot, true);
  if (!booking.quote) return jsonError('PRICE_CHANGED', 'Please review current pricing before confirming.', 409, [{ field: 'quote', code: 'QUOTE_REQUIRED', message: 'A current quote is required.' }]);
  if (isBookingTimeInPast(booking.date, booking.time)) return jsonError('VALIDATION_ERROR', 'Please choose a future booking time.', 400, [{ field: 'time', code: 'BOOKING_TIME_IN_PAST', message: 'Booking time must be in the future.' }]);

  const ids = Array.from(new Set([...booking.selectedServices.map((item) => item.id), PRIVATE_ROOM_SERVICE_ID]));
  const { data: catalogRows, error: catalogError } = await supabase.from('Services').select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive, showPreferences, showNotes, showGender, showStrength, showFocus, focusConfig').in('id', ids);
  if (catalogError) {
    console.error('[API Bookings] Catalog read failed:', catalogError.code || 'unknown');
    return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  }
  const catalog = (catalogRows || []) as CatalogService[];
  const addon = catalog.find((service) => service.id === PRIVATE_ROOM_SERVICE_ID);
  const serviceMap = new Map(catalog.map((service) => [service.id, service]));
  const catalogFieldErrors = booking.selectedServices.flatMap((item, index) => {
    const service = serviceMap.get(item.id);
    if (!service) return [{ field: `selectedServices[${index}].id`, code: 'SERVICE_NOT_FOUND', message: 'Selected service was not found.' }];
    if (service.isActive === false) return [{ field: `selectedServices[${index}].id`, code: 'SERVICE_INACTIVE', message: 'Selected service is inactive.' }];
    return validateCatalogOptions(item.options, service, `selectedServices[${index}].options`);
  });
  if (catalogFieldErrors.length) return jsonError('CART_REQUIRES_REVIEW', 'Please review the selected services and options.', 409, catalogFieldErrors);
  if (booking.selectedServices.some((item) => item.options.addons?.privateRoom === true) && (!addon || addon.isActive !== true)) return jsonError('CART_REQUIRES_REVIEW', 'The selected private-room add-on is unavailable.', 409);

  let pricing: CanonicalPricing;
  try {
    pricing = buildCanonicalPricing(booking.selectedServices, catalog, addon || { id: PRIVATE_ROOM_SERVICE_ID, priceVND: null, priceUSD: null, duration: 0, isActive: false });
  } catch (error: any) {
    const review = String(error?.message || '').startsWith('SERVICE_');
    return jsonError(review ? 'CART_REQUIRES_REVIEW' : 'BOOKING_TEMPORARILY_UNAVAILABLE', review ? 'Please review the selected services and options.' : 'Booking is temporarily unavailable. Please try again later.', review ? 409 : 503);
  }
  const quoteCheck = verifyQuote(booking.quote, [booking.intentFingerprint, cartIntentFingerprint(booking.selectedServices)], catalogDigest(catalog));
  if (!quoteCheck.ok) return jsonError('PRICE_CHANGED', 'The service catalog changed. Please review your booking again.', 409, [{ field: 'quote', code: quoteCheck.reason, message: 'The quote is no longer current.' }]);

  // Detect changes early; the RPC also locks and checks this snapshot at commit.
  const { data: latestCatalogRows, error: latestCatalogError } = await supabase.from('Services').select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive, showPreferences, showNotes, showGender, showStrength, showFocus, focusConfig').in('id', ids);
  if (latestCatalogError) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  if (catalogDigest((latestCatalogRows || []) as CatalogService[]) !== catalogDigest(catalog)) return jsonError('PRICE_CHANGED', 'The service catalog changed. Please review your booking again.', 409, [{ field: 'quote', code: 'PRICE_CHANGED', message: 'The catalog changed before commit.' }]);

  const { booking: bookingPayload, items } = buildRpcPayload(booking, pricing);
  const expectedCatalog = catalog.filter((service) => items.some((item) => item.serviceId === service.id)).map((service) => ({
    id: service.id, priceVND: Number(service.priceVND), priceUSD: Number(service.priceUSD), duration: Number(service.duration), isActive: service.isActive,
  }));
  const { data: rpcResult, error: rpcError } = await supabase.rpc('create_booking_atomic', { p_booking_data: { ...bookingPayload, expectedCatalog }, p_booking_items: items, p_idempotency_key: finalKey });
  if (rpcError) return mapRpcError(rpcError);
  const committedId = String(rpcResult?.booking_id || rpcResult?.data?.bookingId || '');
  if (!committedId) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking was not acknowledged by the booking service.', 503);
  const committedSnapshot = await loadCommittedSnapshot(supabase, committedId, snapshotFromRpc(rpcResult, booking, pricing));
  if (rpcResult?.idempotent) return responseForSnapshot(committedSnapshot, true);

  // Customer master data is intentionally untouched here. Terra-1 owns any
  // atomic resolve/link behavior; this route keeps the booking snapshot only.
  const receptionEmail = await resolveReceptionEmail(supabase);
  let emailStatus: { sent: boolean; messageId?: string; pending?: boolean } = { sent: false, pending: true };
  const markEmail = async (status: string) => {
    try {
      const { error } = await supabase.from('Bookings').update({ reception_feedback: status }).eq('id', committedSnapshot.bookingId);
      if (error) console.error('[API Bookings] Email status update failed:', error.code || 'unknown');
    } catch {
      console.error('[API Bookings] Email status update unavailable');
    }
  };
  try {
    const mail = await sendBookingConfirmationEmail({
      bookingId: committedSnapshot.bookingId, customerName: committedSnapshot.customerName, customerEmail: committedSnapshot.customerEmail,
      customerPhone: committedSnapshot.customerPhone || '', date: committedSnapshot.date, time: committedSnapshot.time || '', guests: committedSnapshot.guests,
      branchName: committedSnapshot.branchName,
      services: (committedSnapshot.services || pricing.items.map((item) => ({ name: serviceName(item.catalog, booking.lang), duration: item.duration * item.quantity, priceVND: item.priceVND, quantity: item.quantity, options: item.options }))) as any,
      totalAmount: committedSnapshot.totalAmount, therapist: pricing.items.find((item) => item.options.therapist)?.options.therapist || 'any',
      lang: committedSnapshot.lang, notes: committedSnapshot.notes || undefined, focusAreaNote: committedSnapshot.focusAreaNote || undefined, receptionEmail,
    });
    if (mail.success) {
      emailStatus = { sent: true, messageId: mail.messageId };
      await markEmail('EMAIL_SENT');
    } else {
      await markEmail('EMAIL_PENDING');
    }
  } catch {
    await markEmail('EMAIL_PENDING');
  }

  return NextResponse.json({ success: true, idempotent: false, data: { ...committedSnapshot, emailStatus } });
}
