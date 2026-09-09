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
  stableStringify,
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

const EMAIL_OUTCOMES = ['accepted', 'failed', 'unknown', 'skipped'] as const;
type EmailOutcome = typeof EMAIL_OUTCOMES[number];
const EMAIL_STAGES = ['preparation', 'configuration', 'smtp', 'unknown'] as const;
type EmailStage = typeof EMAIL_STAGES[number];
const EMAIL_CODES = [
  'SMTP_ACCEPTED',
  'EMAIL_PREPARATION_FAILED',
  'EMAIL_CONFIGURATION_UNAVAILABLE',
  'EMAIL_RECIPIENT_INVALID',
  'EMAIL_TEST_SKIPPED',
  'SMTP_AUTH_FAILED',
  'SMTP_CONNECTION_FAILED',
  'SMTP_TLS_FAILED',
  'SMTP_TIMEOUT',
  'SMTP_RECIPIENT_REJECTED',
  'SMTP_DELIVERY_UNKNOWN',
  'EMAIL_SEND_FAILED',
  'EMAIL_RESULT_UNKNOWN',
  'EMAIL_REPLAY_NOT_ATTEMPTED',
] as const;
type EmailCode = typeof EMAIL_CODES[number];

type EmailAttempt = { attempt: number; stage: EmailStage; code: EmailCode };
type EmailDiagnostics = {
  diagnosticsVersion: 1;
  outcome: EmailOutcome;
  stage: EmailStage;
  code: EmailCode;
  attempts: EmailAttempt[];
};
type EmailStatus = EmailDiagnostics & {
  sent: boolean;
  messageId?: string;
  pending?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function emailOutcome(value: unknown): EmailOutcome | undefined {
  return typeof value === 'string' && (EMAIL_OUTCOMES as readonly string[]).includes(value)
    ? value as EmailOutcome
    : undefined;
}

function emailStage(value: unknown): EmailStage | undefined {
  return typeof value === 'string' && (EMAIL_STAGES as readonly string[]).includes(value)
    ? value as EmailStage
    : undefined;
}

function emailCode(value: unknown): EmailCode | undefined {
  if (typeof value !== 'string' || value.length > 128) return undefined;
  if ((EMAIL_CODES as readonly string[]).includes(value)) return value as EmailCode;
  const legacyReasons: Record<string, EmailCode> = {
    'no recipient email': 'EMAIL_RECIPIENT_INVALID',
    'transporter not configured': 'EMAIL_CONFIGURATION_UNAVAILABLE',
    'notification delivery failed.': 'EMAIL_SEND_FAILED',
  };
  return legacyReasons[value.trim().toLowerCase()];
}

function stageForEmailCode(code: EmailCode): EmailStage {
  if (code === 'EMAIL_PREPARATION_FAILED' || code === 'EMAIL_RECIPIENT_INVALID' || code === 'EMAIL_TEST_SKIPPED') return 'preparation';
  if (code === 'EMAIL_CONFIGURATION_UNAVAILABLE') return 'configuration';
  if (code === 'SMTP_ACCEPTED' || code.startsWith('SMTP_')) return 'smtp';
  return 'unknown';
}

function outcomeForEmailCode(code: EmailCode): EmailOutcome {
  if (code === 'SMTP_ACCEPTED') return 'accepted';
  if (code === 'EMAIL_TEST_SKIPPED') return 'skipped';
  if (code === 'SMTP_DELIVERY_UNKNOWN' || code === 'EMAIL_SEND_FAILED' || code === 'EMAIL_RESULT_UNKNOWN' || code === 'EMAIL_REPLAY_NOT_ATTEMPTED') return 'unknown';
  return 'failed';
}

function safeMessageId(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed && trimmed.length <= 512 && !/[\r\n]/.test(trimmed) ? trimmed : undefined;
}

function emailAttempts(result: Record<string, unknown>): EmailAttempt[] | undefined {
  const smtp = isRecord(result.smtp) ? result.smtp : undefined;
  const candidate = Array.isArray(result.attempts)
    ? result.attempts
    : Array.isArray(smtp?.attempts)
      ? smtp.attempts
      : smtp && Object.prototype.hasOwnProperty.call(smtp, 'attempt')
        ? [smtp]
        : [];
  if (candidate.length > 2) return undefined;

  const parsed = candidate.flatMap((value): EmailAttempt[] => {
    if (!isRecord(value) || typeof value.attempt !== 'number' || !Number.isInteger(value.attempt) || value.attempt < 1 || value.attempt > 2) return [];
    const stage = emailStage(value.stage);
    const code = emailCode(value.code ?? value.reasonCode);
    return stage && code ? [{ attempt: value.attempt, stage, code }] : [];
  });
  if (parsed.length !== candidate.length || new Set(parsed.map((attempt) => attempt.attempt)).size !== parsed.length) return undefined;
  return parsed;
}

function emailStatusFromMailerResult(result: unknown): EmailStatus {
  if (!isRecord(result)) {
    return { sent: false, pending: true, diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] };
  }

  const success = result.success === true;
  const customer = isRecord(result.customer) ? result.customer : undefined;
  const smtp = isRecord(result.smtp) ? result.smtp : undefined;
  const reportedOutcome = emailOutcome(result.outcome) || emailOutcome(customer?.outcome);
  const reportedCode = emailCode(result.reasonCode ?? result.code ?? result.reason) || emailCode(smtp?.code);

  // The mailer is trusted only through a consistent, allowlisted result. A
  // contradictory success/code pair must never become a public sent=true.
  const contradictory =
    (reportedOutcome === 'accepted' && reportedCode !== 'SMTP_ACCEPTED') ||
    (reportedCode === 'SMTP_ACCEPTED' && reportedOutcome !== undefined && reportedOutcome !== 'accepted') ||
    (!success && (reportedOutcome === 'accepted' || reportedCode === 'SMTP_ACCEPTED'));
  if (contradictory) {
    return { sent: false, pending: true, diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] };
  }

  let code = reportedCode;
  if (!code) code = reportedOutcome === 'skipped' ? 'EMAIL_TEST_SKIPPED' : 'EMAIL_RESULT_UNKNOWN';
  const attempts = emailAttempts(result);
  if (!attempts) {
    return { sent: false, pending: true, diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] };
  }

  let outcome = reportedOutcome || outcomeForEmailCode(code);
  if (!success && outcome === 'accepted') outcome = 'unknown';
  const sent = success && outcome === 'accepted';
  const status: EmailStatus = {
    sent,
    ...(sent ? { messageId: safeMessageId(result.messageId) } : {}),
    ...(sent ? {} : { pending: true }),
    diagnosticsVersion: 1,
    outcome,
    stage: emailStage(result.stage) || emailStage(smtp?.stage) || stageForEmailCode(code),
    code,
    attempts,
  };
  if (!status.messageId) delete status.messageId;
  return status;
}

function emailStatusForMailerThrow(): EmailStatus {
  return { sent: false, pending: true, diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_SEND_FAILED', attempts: [] };
}

function emailDiagnosticsForReplay(): EmailDiagnostics {
  return { diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_REPLAY_NOT_ATTEMPTED', attempts: [] };
}

function schemaUnavailable(error: any): boolean {
  const message = String(error?.message || '');
  return ['42P01', '42703', '42501', '42883', 'PGRST202', 'PGRST204'].includes(error?.code) ||
    /schema cache|could not find the function|function webbooking_(allocate_booking_number|commit_booking)/i.test(message);
}

function mapAllocatorError(error: any): NextResponse {
  const message = String(error?.message || '');
  if (/BOOKING_DATE_REQUIRED/i.test(message)) return jsonError('VALIDATION_ERROR', 'Please choose a booking date and time.', 400);
  if (schemaUnavailable(error) || /timeout|temporarily|connection/i.test(message)) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  return jsonError('BOOKING_NUMBER_UNAVAILABLE', 'A booking number could not be reserved. Please try again.', 503);
}

function responseForSnapshot(snapshot: BookingSnapshot, idempotent: boolean): NextResponse {
  console.info('[API Bookings] Stored booking returned without email dispatch', {
    bookingId: snapshot.bookingId,
    idempotent,
  });
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
      // This request deliberately does not resend. The stored snapshot has no
      // historical delivery receipt, so the diagnostics remain unknown.
      ...(idempotent ? { emailStatus: emailDiagnosticsForReplay() } : {}),
    },
  });
}

function responseForIncompleteBooking(bookingId: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      code: 'BOOKING_IN_PROGRESS',
      error: 'Your booking is still being completed. Please retry shortly.',
      bookingId,
    },
    { status: 409, headers: { 'Retry-After': '1' } },
  );
}

function responseForUnverifiedBooking(): NextResponse {
  return jsonError(
    'BOOKING_TEMPORARILY_UNAVAILABLE',
    'We could not verify your booking. Please retry with the same idempotency key; your cart was kept.',
    503,
  );
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
    // Prefer the canonical catalog snapshot assembled before insert. Existing
    // BookingItems do not carry localized name/duration fields in this schema.
    services: services.length ? services : items.length ? servicesFromItems(items) : [],
    notes: row?.notes ?? null,
    focusAreaNote: row?.focusAreaNote ?? null,
  };
}

type CommittedSnapshotLookup =
  | { state: 'complete'; snapshot: BookingSnapshot }
  | { state: 'incomplete'; bookingId: string; itemCount: number }
  | { state: 'unavailable' };

async function loadCommittedSnapshot(supabase: any, bookingId: string, services: unknown[] = []): Promise<CommittedSnapshotLookup> {
  if (!bookingId) return { state: 'unavailable' };
  try {
    const [{ data: booking, error: bookingError }, { data: items, error: itemsError }] = await Promise.all([
      supabase.from('Bookings').select('id, billCode, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, guestCount, totalAmount, customerLang, status, notes, focusAreaNote').eq('id', bookingId).maybeSingle(),
      supabase.from('BookingItems').select('id, bookingId, serviceId, quantity, price, status, options, tip').eq('bookingId', bookingId),
    ]);
    if (bookingError || itemsError || !booking?.id || String(booking.id) !== bookingId || !Array.isArray(items)) {
      return { state: 'unavailable' };
    }
    if (items.some((item: any) => !item || String(item.bookingId || '') !== bookingId)) {
      return { state: 'unavailable' };
    }
    if (items.length === 0) return { state: 'incomplete', bookingId, itemCount: 0 };
    return { state: 'complete', snapshot: snapshotFromRow(booking, items, services) };
  } catch {
    // A committed booking must be verified from the database before it can be
    // acknowledged or emailed. Never substitute the request payload here.
    return { state: 'unavailable' };
  }
}

type ReplayLookup =
  | { state: 'missing' }
  | { state: 'complete'; snapshot: BookingSnapshot }
  | { state: 'incomplete'; bookingId: string; itemCount: number }
  | { state: 'unavailable' };

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function findReplay(supabase: any, key: string, options: { waitForItems?: boolean } = {}): Promise<ReplayLookup> {
  const attempts = options.waitForItems ? 4 : 1;
  try {
    const columns = 'id, billCode, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, guestCount, totalAmount, customerLang, status, notes, focusAreaNote';
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      // Keep the established operations-admin marker. No new idempotency column
      // or namespace is introduced by the counter-only release.
      const { data: exact, error: bookingError } = await supabase.from('Bookings').select(columns).eq('idLegacy', `idemp:${key}`).maybeSingle();
      if (bookingError) return { state: 'unavailable' };
      if (!exact?.id) return { state: 'missing' };
      const { data: items, error: itemsError } = await supabase.from('BookingItems').select('id, bookingId, serviceId, quantity, price, status, options, tip').eq('bookingId', exact.id);
      if (itemsError) return { state: 'unavailable' };
      if ((items || []).length > 0) return { state: 'complete', snapshot: snapshotFromRow(exact, items || []) };
      if (attempt < attempts - 1) await wait(40 * (attempt + 1));
      else return { state: 'incomplete', bookingId: String(exact.id), itemCount: 0 };
    }
  } catch {
    // An unavailable replay lookup must not change the existing insert path.
    return { state: 'unavailable' };
  }
  return { state: 'unavailable' };
}

function uniqueErrorText(error: any): string {
  return [error?.constraint, error?.details, error?.message].filter(Boolean).join(' ').toLowerCase();
}

function isBookingIdentifierConflict(error: any): boolean {
  if (error?.code !== '23505') return false;
  const text = uniqueErrorText(error);
  return /bookings_pkey|bookings_billcode_key|billcode|duplicate key value violates unique constraint "bookings_pkey"/.test(text);
}

function isRetryableWriterError(error: any): boolean {
  const text = uniqueErrorText(error);
  return schemaUnavailable(error) || /timeout|temporarily|connection|deadlock|serialization/i.test(text);
}

function isWriterIdempotencyConflict(error: any): boolean {
  const text = uniqueErrorText(error);
  return error?.code === '23505' && /idlegacy|idempotency/.test(text);
}

function mapWriterError(error: any): NextResponse | null {
  const text = uniqueErrorText(error);
  if (/IDEMPOTENCY_KEY_REUSED/i.test(text)) return null;
  if (/SERVICE_NOT_BOOKABLE|ITEM_INVALID|BOOKING_PAYLOAD_INVALID|BOOKING_FIELD_NOT_ALLOWED|BOOKING_SERVER_FIELDS_INVALID|BOOKING_ITEMS_INVALID/i.test(text)) {
    return jsonError('CART_REQUIRES_REVIEW', 'Please review the selected services and options.', 409);
  }
  if (/SERVICE_PRICE_CONFLICT|BOOKING_TOTAL_CONFLICT/i.test(text)) {
    return jsonError('PRICE_CHANGED', 'The service catalog changed. Please review your booking again.', 409);
  }
  return null;
}

type BookingWriterResult =
  | { state: 'committed'; bookingId: string; billCode: string; replay: boolean }
  | { state: 'incomplete'; bookingId: string }
  | { state: 'unavailable' };

// Adapter boundary for the website-only atomic writer. The SQL contract is
// intentionally kept outside this route: public.webbooking_commit_booking(
// jsonb, jsonb) owns the parent plus all child inserts in one transaction.
async function commitBookingAtomically(supabase: any, bookingPayload: Record<string, unknown>, items: Record<string, unknown>[]): Promise<BookingWriterResult> {
  const { data, error } = await supabase.rpc('webbooking_commit_booking', {
    p_booking: bookingPayload,
    p_items: items,
  });
  if (error) throw error;
  const result = Array.isArray(data) ? data.length === 1 ? data[0] : null : data;
  if (!result || typeof result !== 'object' || Array.isArray(result)) return { state: 'unavailable' };
  if (result.success === false && result.code === 'BOOKING_IN_PROGRESS' && typeof result.bookingId === 'string' && result.bookingId.trim()) {
    return { state: 'incomplete', bookingId: result.bookingId.trim() };
  }
  if (result.success !== true) return { state: 'unavailable' };

  const bookingId = result.bookingId ?? result.booking_id;
  const billCode = result.billCode ?? result.bill_code;
  const replay = result.idempotent ?? result.replay;
  if (typeof bookingId !== 'string' || !bookingId.trim() || typeof billCode !== 'string' || !billCode.trim() || typeof replay !== 'boolean') {
    return { state: 'unavailable' };
  }
  return { state: 'committed', bookingId: bookingId.trim(), billCode: billCode.trim(), replay };
}

function replayIdentityMatches(snapshot: BookingSnapshot, booking: NormalizedBooking): boolean {
  const knownValues = [
    [snapshot.customerName, booking.name],
    [snapshot.customerPhone, booking.phone],
    [snapshot.customerEmail, booking.email],
    [snapshot.date, booking.date],
    [snapshot.time, booking.time],
    [snapshot.branchName, booking.branchName],
    [snapshot.guests, booking.guests],
    [snapshot.lang, booking.lang],
  ] as const;
  return knownValues.every(([saved, current]) => saved === null || saved === undefined || saved === '' || String(saved).toLowerCase() === String(current).toLowerCase());
}

function replayLineKeysFromRequest(booking: NormalizedBooking): string[] {
  return booking.selectedServices.flatMap((item) => {
    const options = item.options;
    const strength = options.strength === 'light' ? 'LIGHT' : options.strength === 'strong' ? 'HARD' : options.strength ? 'NORMAL' : undefined;
    const noteParts = [
      options.notes?.tag0 ? 'Phụ nữ có thai' : '',
      options.notes?.tag1 ? 'Có dị ứng' : '',
      options.notes?.content || '',
    ].filter(Boolean);
    const base = { serviceId: item.id, quantity: item.quantity, options: {
      ...(strength ? { strength } : {}),
      focus: options.bodyParts?.focus || [],
      avoid: options.bodyParts?.avoid || [],
      therapist: options.therapist === 'male' ? 'Nam' : options.therapist === 'female' ? 'Nữ' : 'Ngẫu nhiên',
      note: noteParts.join(' - '),
    } };
    return [
      stableStringify(base),
      ...(options.addons?.privateRoom ? [stableStringify({ serviceId: PRIVATE_ROOM_SERVICE_ID, quantity: item.quantity, options: { parentServiceId: item.id, isAddon: true } })] : []),
    ];
  }).sort();
}

function replayLineKeysFromSnapshot(snapshot: BookingSnapshot): string[] {
  return (snapshot.items || []).map((item: any) => {
    const options = item?.options && typeof item.options === 'object' ? item.options : {};
    if (options.isAddon === true) {
      return stableStringify({ serviceId: String(item?.serviceId || ''), quantity: Number(item?.quantity || 0), options: {
        parentServiceId: options.parentServiceId || null,
        isAddon: true,
      } });
    }
    const hasCanonicalOptions = ['strength', 'focus', 'avoid', 'therapist', 'note'].some((key) => Object.prototype.hasOwnProperty.call(options, key));
    return stableStringify({
      serviceId: String(item?.serviceId || ''),
      quantity: Number(item?.quantity || 0),
      options: hasCanonicalOptions ? {
        ...(options.strength ? { strength: options.strength } : {}),
        focus: Array.isArray(options.focus) ? options.focus : [],
        avoid: Array.isArray(options.avoid) ? options.avoid : [],
        therapist: options.therapist || 'Ngẫu nhiên',
        note: options.note || '',
      } : null,
    });
  }).sort();
}

function replayLinesMatch(snapshot: BookingSnapshot, booking: NormalizedBooking): boolean {
  const saved = replayLineKeysFromSnapshot(snapshot);
  const current = replayLineKeysFromRequest(booking);
  return saved.length > 0 && stableStringify(saved) === stableStringify(current);
}

async function resolveReplayConflict(supabase: any, key: string, booking: NormalizedBooking): Promise<NextResponse> {
  const replay = await findReplay(supabase, key, { waitForItems: true });
  if (replay.state === 'complete') {
    if (!replayIdentityMatches(replay.snapshot, booking) || !replayLinesMatch(replay.snapshot, booking)) {
      return jsonError('IDEMPOTENCY_KEY_REUSED', 'This booking request key is already linked to a different booking.', 409);
    }
    return responseForSnapshot(replay.snapshot, true);
  }
  if (replay.state === 'incomplete') return responseForIncompleteBooking(replay.bookingId);
  return responseForUnverifiedBooking();
}

async function reconcileAfterUncertainCommit(supabase: any, key: string, booking: NormalizedBooking): Promise<NextResponse> {
  const replay = await findReplay(supabase, key, { waitForItems: true });
  if (replay.state === 'complete') {
    if (!replayIdentityMatches(replay.snapshot, booking) || !replayLinesMatch(replay.snapshot, booking)) {
      return jsonError('IDEMPOTENCY_KEY_REUSED', 'This booking request key is already linked to a different booking.', 409);
    }
    return responseForSnapshot(replay.snapshot, true);
  }
  if (replay.state === 'incomplete') return responseForIncompleteBooking(replay.bookingId);
  return responseForUnverifiedBooking();
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

function buildBookingPayload(booking: NormalizedBooking, pricing: CanonicalPricing, bookingId: string, customerId: string | null, idempotencyKey: string): Record<string, unknown> {
  const preferenceNotes = buildNotes(booking, pricing);
  return {
    id: bookingId, billCode: bookingId, source: 'WEB_BOOKING', guestCount: booking.guests, branchName: booking.branchName,
    // The writer maps bookingDate to a timestamp without time zone. Send the
    // appointment wall time, not a UTC ISO value that would shift the slot.
    bookingDate: `${booking.date}T${booking.time}:00`, timeBooking: booking.time,
    customerName: booking.name, customerPhone: booking.phone, customerEmail: booking.email,
    customerGender: booking.customerGender, customerLang: booking.lang, customerId,
    roomName: pricing.items.some((item) => item.hasPrivateRoom) ? 'Private Room' : null,
    notes: preferenceNotes.notes, focusAreaNote: preferenceNotes.focusAreaNote,
    totalAmount: pricing.totalAmountVND, status: 'NEW', tip: 0,
    idLegacy: `idemp:${idempotencyKey}`,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  };
}

function buildBookingItems(booking: NormalizedBooking, pricing: CanonicalPricing, bookingId: string): Record<string, unknown>[] {
  return pricing.items.flatMap((item, index) => {
    const options = item.options;
    const strength = options.strength === 'light' ? 'LIGHT' : options.strength === 'strong' ? 'HARD' : options.strength ? 'NORMAL' : undefined;
    const noteParts = [
      options.notes?.tag0 ? 'Phụ nữ có thai' : '',
      options.notes?.tag1 ? 'Có dị ứng' : '',
      options.notes?.content || '',
    ].filter(Boolean);
    const rows: Record<string, unknown>[] = [{
      id: `${bookingId}-${item.id}-${index}`,
      bookingId, serviceId: item.id, quantity: item.quantity, price: item.basePriceVND,
      status: 'WAITING',
      options: {
        strength,
        focus: options.bodyParts?.focus || [],
        avoid: options.bodyParts?.avoid || [],
        therapist: options.therapist === 'male' ? 'Nam' : options.therapist === 'female' ? 'Nữ' : 'Ngẫu nhiên',
        note: noteParts.join(' - '),
      },
      tip: 0,
    }];
    if (item.hasPrivateRoom) rows.push({
      id: `${bookingId}-${PRIVATE_ROOM_SERVICE_ID}-${index}`,
      bookingId, serviceId: PRIVATE_ROOM_SERVICE_ID, quantity: item.quantity, price: item.addonPriceVND,
      status: 'WAITING',
      options: { displayName: 'Phòng riêng', parentServiceId: item.id, isAddon: true },
      tip: 0,
    });
    return rows;
  });
}

async function resolveCustomerId(supabase: any, booking: NormalizedBooking): Promise<string | null> {
  const phone = booking.phone.trim();
  const email = booking.email.trim().toLowerCase();
  const query = phone
    ? supabase.from('Customers').select('id, fullName, phone, email, gender').eq('phone', phone).maybeSingle()
    : supabase.from('Customers').select('id, fullName, phone, email, gender').eq('email', email).maybeSingle();
  const { data: existingCustomer } = await query;
  if (existingCustomer?.id) {
    const updatePayload: Record<string, unknown> = { fullName: booking.name, updatedAt: new Date().toISOString() };
    if (email && !existingCustomer.email) updatePayload.email = email;
    if (phone && !existingCustomer.phone) updatePayload.phone = phone;
    if (booking.customerGender && !existingCustomer.gender) updatePayload.gender = booking.customerGender;
    await supabase.from('Customers').update(updatePayload).eq('id', existingCustomer.id);
    return String(existingCustomer.id);
  }
  const customerId = `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const { data: created, error } = await supabase.from('Customers').insert({
    id: customerId, fullName: booking.name, phone, email, gender: booking.customerGender,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }).select('id').single();
  if (error) {
    console.warn('[API Bookings] Customer persistence failed; preserving booking flow:', error.message);
    return null;
  }
  return created?.id || customerId;
}

async function allocateBookingId(supabase: any, bookingDate: string): Promise<string> {
  const { data, error } = await supabase.rpc('webbooking_allocate_booking_number', { p_booking_at: bookingDate });
  if (error) throw error;
  const value = typeof data === 'string' ? data : data?.bookingId || data?.booking_id || data?.billCode;
  if (!value || typeof value !== 'string') throw new Error('BOOKING_NUMBER_EMPTY');
  return value;
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
  // Preserve compatibility with older clients while keeping retries stable for
  // the current checkout, which supplies an explicit request key.
  const finalKey = booking.idempotencyKey || `hash_${booking.intentFingerprint.slice(0, 48)}`;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  const supabase = getSupabaseAdmin();

  const replay = await findReplay(supabase, finalKey, { waitForItems: true });
  if (replay.state === 'unavailable') return responseForUnverifiedBooking();
  if (replay.state === 'complete') {
    if (!replayIdentityMatches(replay.snapshot, booking) || !replayLinesMatch(replay.snapshot, booking)) {
      return jsonError('IDEMPOTENCY_KEY_REUSED', 'This booking request key is already linked to a different booking.', 409);
    }
    return responseForSnapshot(replay.snapshot, true);
  }
  if (replay.state === 'incomplete') return responseForIncompleteBooking(replay.bookingId);

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

  // Close the catalog read window before the atomic writer call.
  const { data: latestCatalogRows, error: latestCatalogError } = await supabase.from('Services').select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive, showPreferences, showNotes, showGender, showStrength, showFocus, focusConfig').in('id', ids);
  if (latestCatalogError) return jsonError('BOOKING_TEMPORARILY_UNAVAILABLE', 'Booking is temporarily unavailable. Please try again later.', 503);
  if (catalogDigest((latestCatalogRows || []) as CatalogService[]) !== catalogDigest(catalog)) return jsonError('PRICE_CHANGED', 'The service catalog changed. Please review your booking again.', 409, [{ field: 'quote', code: 'PRICE_CHANGED', message: 'The catalog changed before commit.' }]);

  // The allocator supplies only the identifier. The website writer owns the
  // atomic parent/items commit; there is deliberately no insert fallback.
  // Allocate first so a missing counter cannot leave a customer-only side effect.
  let customerId: string | null = null;
  let customerResolved = false;
  const bookingDate = new Date(`${booking.date}T${booking.time}:00+07:00`).toISOString();
  let committedId = '';
  let bookingPayload: Record<string, unknown> | null = null;
  let items: Record<string, unknown>[] = [];
  let writerReplay = false;
  for (let attempt = 0; attempt < 5 && !committedId; attempt += 1) {
    try {
      committedId = await allocateBookingId(supabase, bookingDate);
    } catch (error: any) {
      return mapAllocatorError(error);
    }
    if (!customerResolved) {
      try {
        customerId = await resolveCustomerId(supabase, booking);
      } catch (error: any) {
        // Preserve the established booking flow if customer master lookup is
        // temporarily unavailable. The operations system can reconcile the row.
        console.warn('[API Bookings] Customer lookup unavailable:', error?.message || 'unknown error');
      }
      customerResolved = true;
    }
    bookingPayload = buildBookingPayload(booking, pricing, committedId, customerId, finalKey);
    items = buildBookingItems(booking, pricing, committedId);
    try {
      const result = await commitBookingAtomically(supabase, bookingPayload, items);
      if (result.state === 'incomplete') return responseForIncompleteBooking(result.bookingId);
      if (result.state === 'unavailable') return reconcileAfterUncertainCommit(supabase, finalKey, booking);
      committedId = result.bookingId;
      writerReplay = result.replay;
    } catch (writerError: any) {
      if (isWriterIdempotencyConflict(writerError)) return resolveReplayConflict(supabase, finalKey, booking);
      if (isBookingIdentifierConflict(writerError)) {
        committedId = '';
        continue;
      }
      if (isRetryableWriterError(writerError)) {
        return reconcileAfterUncertainCommit(supabase, finalKey, booking);
      }
      const mapped = mapWriterError(writerError);
      if (mapped) return mapped;
      console.error('[API Bookings] Atomic booking writer failed:', writerError?.code || writerError?.message);
      return jsonError('BOOKING_FAILED', 'The booking could not be completed. Please try again.', 500);
    }
  }
  if (!committedId || !bookingPayload) return jsonError('BOOKING_NUMBER_UNAVAILABLE', 'A booking number could not be reserved. Please try again.', 503);

  const committedLookup = await loadCommittedSnapshot(supabase, committedId, localizedServices(pricing, booking));
  if (committedLookup.state === 'unavailable') return responseForUnverifiedBooking();
  if (committedLookup.state === 'incomplete') return responseForIncompleteBooking(committedLookup.bookingId);
  const committedSnapshot = committedLookup.snapshot;

  if (writerReplay) {
    if (!replayIdentityMatches(committedSnapshot, booking) || !replayLinesMatch(committedSnapshot, booking) || committedSnapshot.totalAmount !== pricing.totalAmountVND) {
      return jsonError('IDEMPOTENCY_KEY_REUSED', 'This booking request key is already linked to a different booking.', 409);
    }
    return responseForSnapshot(committedSnapshot, true);
  }
  // Never acknowledge or email from a read that proves only a partial item
  // set. The writer should make this impossible, but this guard protects the
  // response boundary if a stale/legacy read observes incomplete state.
  if (!replayIdentityMatches(committedSnapshot, booking) || !replayLinesMatch(committedSnapshot, booking) || committedSnapshot.totalAmount !== pricing.totalAmountVND) {
    return responseForIncompleteBooking(committedId);
  }
  const receptionEmail = await resolveReceptionEmail(supabase);
  let emailStatus: EmailStatus = emailStatusForMailerThrow();
  console.info('[API Bookings] Email dispatch started', {
    bookingId: committedSnapshot.bookingId,
    customerEmailPresent: Boolean(committedSnapshot.customerEmail),
    receptionEmailPresent: Boolean(receptionEmail),
  });
  try {
    const mail = await sendBookingConfirmationEmail({
      bookingId: committedSnapshot.bookingId, customerName: committedSnapshot.customerName, customerEmail: committedSnapshot.customerEmail,
      customerPhone: committedSnapshot.customerPhone || '', date: committedSnapshot.date, time: committedSnapshot.time || '', guests: committedSnapshot.guests,
      branchName: committedSnapshot.branchName,
      services: pricing.items.map((item) => ({ name: serviceName(item.catalog, booking.lang), duration: item.duration * item.quantity, priceVND: item.priceVND * item.quantity, quantity: item.quantity, options: item.options })) as any,
      totalAmount: committedSnapshot.totalAmount, therapist: pricing.items.find((item) => item.options.therapist)?.options.therapist || 'any',
      lang: committedSnapshot.lang, notes: committedSnapshot.notes || undefined, focusAreaNote: committedSnapshot.focusAreaNote || undefined, receptionEmail,
    });
    emailStatus = emailStatusFromMailerResult(mail);
    console.info('[API Bookings] Email dispatch result', {
      bookingId: committedSnapshot.bookingId,
      sent: emailStatus.sent,
      outcome: emailStatus.outcome,
      stage: emailStatus.stage,
      code: emailStatus.code,
      attempts: emailStatus.attempts.length,
      messageIdPresent: Boolean(emailStatus.messageId),
    });
  } catch {
    emailStatus = emailStatusForMailerThrow();
    console.error('[API Bookings] Email dispatch threw', {
      bookingId: committedSnapshot.bookingId,
      outcome: emailStatus.outcome,
      stage: emailStatus.stage,
      code: emailStatus.code,
    });
  }

  return NextResponse.json({ success: true, idempotent: false, data: { ...committedSnapshot, emailStatus } });
}
