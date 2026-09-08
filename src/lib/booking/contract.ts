import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const BOOKING_TIMEZONE = 'Asia/Ho_Chi_Minh';
export const BRANCH_DEFAULT = 'ORIA SPA';
export const PRIVATE_ROOM_SERVICE_ID = 'NHS0900';
export const MAX_BODY_BYTES = 64 * 1024;
export const MAX_ITEMS = 50;
export const MAX_ITEM_QUANTITY = 20;
export const QUOTE_TTL_MS = 5 * 60 * 1000;

const LANGS = ['vi', 'en', 'cn', 'jp', 'kr'] as const;
const BODY_PARTS = new Set([
  'HEAD', 'NECK', 'SHOULDER', 'BACK', 'ARM', 'THIGH', 'KNEE', 'CALF', 'FOOT',
  'WHOLE_BODY', 'FULL_BODY',
]);
const STRENGTHS = new Set(['light', 'medium', 'strong', 'soft', 'normal', 'hard']);
const THERAPISTS = new Set(['male', 'female', 'random', 'any']);
const OPTION_KEYS = new Set(['strength', 'therapist', 'bodyParts', 'notes', 'addons']);

export type SupportedLang = (typeof LANGS)[number];
export type FieldError = { field: string; code: string; message: string };

export type NormalizedOption = {
  strength?: 'light' | 'medium' | 'strong';
  therapist?: 'male' | 'female' | 'random';
  bodyParts?: { focus: string[]; avoid: string[] };
  notes?: { tag0: boolean; tag1: boolean; content: string };
  addons?: { privateRoom: boolean };
};

export type NormalizedService = {
  id: string;
  quantity: number;
  options: NormalizedOption;
};

export type NormalizedBooking = {
  name: string;
  phone: string;
  email: string;
  note: string | null;
  date: string;
  time: string;
  branchId: string;
  branchName: string;
  guests: number;
  staffGender: 'any' | 'male' | 'female';
  customerGender: 'male' | 'female' | 'other' | null;
  lang: SupportedLang;
  selectedServices: NormalizedService[];
  idempotencyKey: string | null;
  intentFingerprint: string;
  quote: string | null;
};

export type CatalogService = {
  id: string;
  nameVN?: string | null;
  nameEN?: string | null;
  nameCN?: string | null;
  nameJP?: string | null;
  nameKR?: string | null;
  priceVND: number | string | null;
  priceUSD: number | string | null;
  duration: number | string | null;
  isActive: boolean | null;
  showPreferences?: boolean | null;
  showNotes?: boolean | null;
  showGender?: boolean | null;
  showStrength?: boolean | null;
  showFocus?: boolean | null;
  focusConfig?: Record<string, boolean> | null;
};

export type CanonicalService = NormalizedService & {
  catalog: CatalogService;
  basePriceVND: number;
  basePriceUSD: number;
  priceVND: number;
  priceUSD: number;
  duration: number;
  hasPrivateRoom: boolean;
  addonPriceVND: number;
  addonPriceUSD: number;
};

export type CanonicalPricing = {
  items: CanonicalService[];
  totalAmountVND: number;
  totalAmountUSD: number;
  catalogDigest: string;
};

export type ValidationResult =
  | { ok: true; value: NormalizedBooking }
  | { ok: false; errors: FieldError[] };

const error = (field: string, code: string, message: string): FieldError => ({ field, code, message });

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, field: string, max: number, required = false): { value?: string; error?: FieldError } {
  if (value === undefined || value === null) {
    return required ? { error: error(field, 'REQUIRED', 'This field is required.') } : { value: undefined };
  }
  if (typeof value !== 'string') return { error: error(field, 'INVALID_TYPE', 'This field must be text.') };
  const trimmed = value.trim();
  if (required && !trimmed) return { error: error(field, 'REQUIRED', 'This field is required.') };
  if (trimmed.length > max || /[\u0000-\u001f\u007f]/.test(value)) {
    return { error: error(field, 'INVALID_TEXT', 'This text is invalid or too long.') };
  }
  return { value: trimmed };
}

function parseQuantity(value: unknown, field: string): { value?: number; error?: FieldError } {
  if (value === undefined) return { value: 1 };
  if (typeof value === 'boolean' || typeof value === 'number' && !Number.isInteger(value)) {
    return { error: error(field, 'INVALID_QUANTITY', 'Quantity must be a whole number.') };
  }
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
    return { error: error(field, 'INVALID_QUANTITY', 'Quantity must be a whole number.') };
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_ITEM_QUANTITY) {
    return { error: error(field, 'INVALID_QUANTITY', 'Quantity must be between 1 and 20.') };
  }
  return { value: parsed };
}

function normalizePhone(raw: unknown, countryCode: unknown): { value?: string; error?: FieldError } {
  if (typeof raw !== 'string' || !raw.trim()) return { error: error('phone', 'PHONE_REQUIRED', 'Phone number is required.') };
  const input = raw.trim();
  if (!/^[+0-9\s().-]+$/.test(input)) return { error: error('phone', 'INVALID_PHONE', 'Phone number is invalid.') };
  const country = countryCode === undefined || countryCode === null || countryCode === ''
    ? null
    : typeof countryCode === 'string' && /^\+\d{1,3}$/.test(countryCode.trim())
      ? countryCode.trim()
      : null;
  if (countryCode !== undefined && !country) return { error: error('phoneCountryCode', 'INVALID_PHONE_COUNTRY', 'Phone country code is invalid.') };

  const compact = input.replace(/[\s().-]/g, '');
  let normalized: string;
  if (compact.startsWith('+')) {
    normalized = `+${compact.slice(1)}`;
    if (country && !normalized.startsWith(country)) {
      return { error: error('phone', 'PHONE_COUNTRY_MISMATCH', 'Phone number does not match its country code.') };
    }
  } else if (country) {
    const countryDigits = country.slice(1);
    const national = compact.replace(/^0+/, '');
    if (compact.startsWith(countryDigits)) {
      return { error: error('phone', 'PHONE_PREFIX_REPEATED', 'Phone country prefix was repeated.') };
    }
    normalized = `${country}${national}`;
  } else {
    // Legacy callers send a national number without a country selector. Keep it
    // as entered; the API must not infer a country from locale.
    normalized = compact;
  }
  const digits = normalized.replace(/^\+/, '');
  if (!/^\d{8,15}$/.test(digits)) return { error: error('phone', 'INVALID_PHONE', 'Phone number is invalid.') };
  return { value: normalized };
}

function normalizeList(value: unknown, field: string): { value?: string[]; error?: FieldError } {
  if (!Array.isArray(value)) return { error: error(field, 'INVALID_TYPE', 'This field must be an array.') };
  const result: string[] = [];
  for (let index = 0; index < value.length; index += 1) {
    if (typeof value[index] !== 'string') return { error: error(`${field}[${index}]`, 'INVALID_TYPE', 'Each value must be text.') };
    const item = value[index].trim().toUpperCase();
    if (!BODY_PARTS.has(item)) return { error: error(`${field}[${index}]`, 'UNKNOWN_OPTION', 'This body area is not supported.') };
    if (result.includes(item)) return { error: error(field, 'DUPLICATE_OPTION', 'Options must not contain duplicates.') };
    result.push(item);
  }
  return { value: result };
}

export function normalizeOptions(raw: unknown, field: string): { value?: NormalizedOption; errors: FieldError[] } {
  if (raw === undefined) return { value: {}, errors: [] };
  if (!isPlainObject(raw)) return { errors: [error(field, 'INVALID_TYPE', 'Options must be an object.')] };
  const errors: FieldError[] = [];
  for (const key of Object.keys(raw)) {
    if (!OPTION_KEYS.has(key)) errors.push(error(`${field}.${key}`, 'UNKNOWN_OPTION', 'This option is not supported.'));
  }
  const result: NormalizedOption = {};

  if (raw.strength !== undefined) {
    if (typeof raw.strength !== 'string' || !STRENGTHS.has(raw.strength.toLowerCase())) {
      errors.push(error(`${field}.strength`, 'INVALID_OPTION', 'Strength is not supported.'));
    } else {
      const value = raw.strength.toLowerCase();
      result.strength = value === 'soft' ? 'light' : value === 'normal' || value === 'hard' ? 'medium' : value as NormalizedOption['strength'];
      if (value === 'hard') result.strength = 'strong';
    }
  }
  if (raw.therapist !== undefined) {
    if (typeof raw.therapist !== 'string' || !THERAPISTS.has(raw.therapist.toLowerCase())) {
      errors.push(error(`${field}.therapist`, 'INVALID_OPTION', 'Therapist preference is not supported.'));
    } else {
      const value = raw.therapist.toLowerCase();
      result.therapist = value === 'any' ? 'random' : value as NormalizedOption['therapist'];
    }
  }
  if (raw.bodyParts !== undefined) {
    if (!isPlainObject(raw.bodyParts)) errors.push(error(`${field}.bodyParts`, 'INVALID_TYPE', 'Body preferences must be an object.'));
    else {
      const focus = normalizeList(raw.bodyParts.focus, `${field}.bodyParts.focus`);
      const avoid = normalizeList(raw.bodyParts.avoid, `${field}.bodyParts.avoid`);
      if (focus.error) errors.push(focus.error);
      if (avoid.error) errors.push(avoid.error);
      if (focus.value && avoid.value) {
        const overlap = focus.value.find((part) => avoid.value!.includes(part));
        if (overlap) errors.push(error(`${field}.bodyParts`, 'OVERLAPPING_OPTIONS', `Body area ${overlap} cannot be both focused and avoided.`));
        result.bodyParts = { focus: focus.value, avoid: avoid.value };
      }
    }
  }
  if (raw.notes !== undefined) {
    if (!isPlainObject(raw.notes)) errors.push(error(`${field}.notes`, 'INVALID_TYPE', 'Notes must be an object.'));
    else {
      const content = text(raw.notes.content, `${field}.notes.content`, 1000);
      if (content.error) errors.push(content.error);
      for (const key of ['tag0', 'tag1']) {
        if (raw.notes[key] !== undefined && typeof raw.notes[key] !== 'boolean') {
          errors.push(error(`${field}.notes.${key}`, 'INVALID_TYPE', 'This flag must be boolean.'));
        }
      }
      if (!content.error) result.notes = { tag0: raw.notes.tag0 === true, tag1: raw.notes.tag1 === true, content: content.value || '' };
    }
  }
  if (raw.addons !== undefined) {
    if (!isPlainObject(raw.addons)) errors.push(error(`${field}.addons`, 'INVALID_TYPE', 'Add-ons must be an object.'));
    else {
      for (const key of Object.keys(raw.addons)) if (key !== 'privateRoom') errors.push(error(`${field}.addons.${key}`, 'UNKNOWN_OPTION', 'This add-on is not supported.'));
      if (raw.addons.privateRoom !== undefined && typeof raw.addons.privateRoom !== 'boolean') {
        errors.push(error(`${field}.addons.privateRoom`, 'INVALID_TYPE', 'Private room must be boolean.'));
      } else if (raw.addons.privateRoom !== undefined) {
        result.addons = { privateRoom: raw.addons.privateRoom };
      }
    }
  }
  return { value: errors.length ? undefined : result, errors };
}

function validDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const parsed = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  return parsed.getUTCFullYear() === Number(match[1]) && parsed.getUTCMonth() === Number(match[2]) - 1 && parsed.getUTCDate() === Number(match[3]);
}

export function isBookingTimeInPast(date: string, time: string, now = new Date()): boolean {
  return new Date(`${date}T${time}:00+07:00`).getTime() <= now.getTime();
}

export function parseBookingRequest(body: unknown, request: Request, options: { allowPastForReplay?: boolean } = {}): ValidationResult {
  if (!isPlainObject(body)) return { ok: false, errors: [error('body', 'INVALID_BODY', 'Request body must be a JSON object.')] };
  const errors: FieldError[] = [];
  const name = text(body.name, 'name', 120, true);
  const email = text(body.email, 'email', 254, true);
  const note = text(body.note, 'note', 2000);
  if (name.error) errors.push(name.error);
  if (email.error) errors.push(email.error);
  if (note.error) errors.push(note.error);
  if (email.value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) errors.push(error('email', 'INVALID_EMAIL', 'Email address is invalid.'));

  const phone = normalizePhone(body.phone, body.phoneCountryCode ?? body.countryCode ?? body.phoneCountry);
  if (phone.error) errors.push(phone.error);
  const date = text(body.date, 'date', 10, true);
  const timeValue = text(body.time, 'time', 5, true);
  if (date.error) errors.push(date.error);
  if (timeValue.error) errors.push(timeValue.error);
  if (date.value && !validDate(date.value)) errors.push(error('date', 'INVALID_DATE', 'Date does not exist.'));
  if (timeValue.value && (!/^\d{2}:\d{2}$/.test(timeValue.value) || !['00', '30'].includes(timeValue.value.slice(3)) || Number(timeValue.value.slice(0, 2)) < 9 || Number(timeValue.value.slice(0, 2)) > 22 || Number(timeValue.value.slice(0, 2)) === 22 && timeValue.value.slice(3) !== '00' && timeValue.value.slice(3) !== '30')) {
    errors.push(error('time', 'INVALID_TIME', 'Time is outside the booking window.'));
  }

  const rawList = body.selectedServices ?? body.services;
  if (!Array.isArray(rawList) || rawList.length === 0) errors.push(error('selectedServices', 'CART_EMPTY', 'At least one service is required.'));
  else if (rawList.length > MAX_ITEMS) errors.push(error('selectedServices', 'CART_TOO_LARGE', 'Too many service lines.'));
  const selectedServices: NormalizedService[] = [];
  if (Array.isArray(rawList)) rawList.forEach((rawItem, index) => {
    const field = `selectedServices[${index}]`;
    if (!isPlainObject(rawItem)) { errors.push(error(field, 'INVALID_TYPE', 'Service item must be an object.')); return; }
    const aliases = ['variantId', 'serviceId', 'id'].map((key) => rawItem[key]).filter((value) => value !== undefined);
    if (!aliases.length || aliases.some((value) => typeof value !== 'string' || !value.trim())) { errors.push(error(`${field}.id`, 'REQUIRED', 'Service id is required.')); return; }
    const ids = aliases.map((value) => String(value).trim());
    if (new Set(ids).size !== 1) { errors.push(error(`${field}.id`, 'ALIAS_CONFLICT', 'Service id aliases must match.')); return; }
    const quantity = parseQuantity(rawItem.quantity ?? rawItem.qty, `${field}.quantity`);
    if (quantity.error) errors.push(quantity.error);
    const optionInputs = [rawItem.options, rawItem.customOptions].filter((value) => value !== undefined);
    const firstOptions = normalizeOptions(optionInputs[0], `${field}.options`);
    const secondOptions = optionInputs.length > 1 ? normalizeOptions(optionInputs[1], `${field}.customOptions`) : null;
    errors.push(...firstOptions.errors, ...(secondOptions?.errors || []));
    if (secondOptions && firstOptions.value && secondOptions.value && stableStringify(firstOptions.value) !== stableStringify(secondOptions.value)) errors.push(error(`${field}.options`, 'ALIAS_CONFLICT', 'options and customOptions must match.'));
    if (!quantity.error && firstOptions.value && !firstOptions.errors.length) selectedServices.push({ id: ids[0], quantity: quantity.value!, options: firstOptions.value });
  });

  const branchIdRaw = body.branchId === undefined ? 'ngan-ha-spa' : body.branchId;
  const branchNameRaw = body.branchName;
  let branchId = 'ngan-ha-spa';
  let branchName = BRANCH_DEFAULT;
  if (branchIdRaw !== undefined && typeof branchIdRaw !== 'string') errors.push(error('branchId', 'INVALID_TYPE', 'Branch id is invalid.'));
  else if (typeof branchIdRaw === 'string' && branchIdRaw.trim()) {
    const candidate = branchIdRaw.trim().toLowerCase();
    if (candidate === 'barbershop') { branchId = 'barbershop'; branchName = 'ORIA SPA Barbershop'; }
    else if (candidate === 'ngan-ha-spa' || candidate === 'oria-spa' || candidate === 'oria spa') { branchId = 'ngan-ha-spa'; branchName = BRANCH_DEFAULT; }
    else errors.push(error('branchId', 'INVALID_BRANCH', 'Branch is not supported.'));
  }
  if (branchNameRaw !== undefined) {
    if (typeof branchNameRaw !== 'string') errors.push(error('branchName', 'INVALID_TYPE', 'Branch name is invalid.'));
    else if (branchNameRaw.trim() !== branchName) errors.push(error('branchName', 'BRANCH_MISMATCH', 'Branch id and branch name do not match.'));
  }

  const guestsRaw = body.guests;
  const guests = guestsRaw === undefined || guestsRaw === null || guestsRaw === '' ? 1 : parseQuantity(guestsRaw, 'guests');
  if (typeof guests === 'object' && guests.error) errors.push(guests.error);
  const rawStaff = body.staffGender === undefined ? 'any' : body.staffGender;
  const staffGender = typeof rawStaff === 'string' && ['any', 'male', 'female'].includes(rawStaff.toLowerCase()) ? rawStaff.toLowerCase() as NormalizedBooking['staffGender'] : null;
  if (!staffGender) errors.push(error('staffGender', 'INVALID_OPTION', 'Therapist preference is invalid.'));
  const rawCustomerGender = body.customerGender;
  const genderMap: Record<string, 'male' | 'female' | 'other'> = { male: 'male', nam: 'male', anh: 'male', female: 'female', 'nữ': 'female', chi: 'female', chị: 'female', other: 'other', khac: 'other', khác: 'other' };
  const customerGender = rawCustomerGender === undefined || rawCustomerGender === null || rawCustomerGender === '' ? null : typeof rawCustomerGender === 'string' ? genderMap[rawCustomerGender.toLowerCase().trim()] || null : null;
  if (rawCustomerGender !== undefined && rawCustomerGender !== null && rawCustomerGender !== '' && !customerGender) errors.push(error('customerGender', 'INVALID_OPTION', 'Customer gender is invalid.'));

  const rawLang = body.lang;
  const lang = typeof rawLang === 'string' && (LANGS as readonly string[]).includes(rawLang) ? rawLang as SupportedLang : 'vi';
  const key = body.idempotencyKey ?? request.headers.get('Idempotency-Key') ?? request.headers.get('x-idempotency-key') ?? body.clientSessionId ?? null;
  const idempotencyKey = key === null || key === undefined || key === '' ? null : typeof key === 'string' && key.trim() ? key.trim() : null;
  if (key !== null && !idempotencyKey) errors.push(error('idempotencyKey', 'INVALID_IDEMPOTENCY_KEY', 'Idempotency key is invalid.'));
  if (idempotencyKey && (idempotencyKey.length > 200 || /[\u0000-\u001f\u007f]/.test(idempotencyKey))) errors.push(error('idempotencyKey', 'INVALID_IDEMPOTENCY_KEY', 'Idempotency key is invalid.'));

  const normalizedBase = { name: name.value || '', phone: phone.value || '', email: (email.value || '').toLowerCase(), note: note.value || null, date: date.value || '', time: timeValue.value || '', branchId, branchName, guests: typeof guests === 'object' ? guests.value || 1 : 1, staffGender: staffGender || 'any', customerGender, selectedServices };
  const intentFingerprint = fingerprint(normalizedBase);
  if (!options.allowPastForReplay && date.value && timeValue.value && validDate(date.value) && /^\d{2}:\d{2}$/.test(timeValue.value) && isBookingTimeInPast(date.value, timeValue.value)) errors.push(error('time', 'BOOKING_TIME_IN_PAST', 'Booking time must be in the future.'));
  if (errors.length) return { ok: false, errors };
  return { ok: true, value: { ...normalizedBase, lang, idempotencyKey, intentFingerprint, quote: typeof body.quote === 'string' ? body.quote : typeof body.quoteToken === 'string' ? body.quoteToken : null } };
}

export function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isPlainObject(value)) return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}

export function fingerprint(value: unknown): string {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

export function cartIntentFingerprint(selectedServices: NormalizedService[]): string {
  return fingerprint({ selectedServices });
}

export function validateCatalogOptions(options: NormalizedOption, service: CatalogService, field: string): FieldError[] {
  const errors: FieldError[] = [];
  const hasNotes = Boolean(options.notes && (options.notes.content || options.notes.tag0 || options.notes.tag1));
  const hasFocus = Boolean(options.bodyParts && (options.bodyParts.focus.length || options.bodyParts.avoid.length));
  if (options.strength && service.showStrength === false) errors.push(error(`${field}.strength`, 'UNSUPPORTED_OPTION', 'This service does not support strength selection.'));
  if (options.therapist && service.showGender === false) errors.push(error(`${field}.therapist`, 'UNSUPPORTED_OPTION', 'This service does not support therapist selection.'));
  if (hasNotes && service.showNotes === false) errors.push(error(`${field}.notes`, 'UNSUPPORTED_OPTION', 'This service does not support notes.'));
  if (hasFocus && service.showFocus === false) errors.push(error(`${field}.bodyParts`, 'UNSUPPORTED_OPTION', 'This service does not support body preferences.'));
  if (hasFocus && service.focusConfig && options.bodyParts) {
    const supported = Object.entries(service.focusConfig).filter(([, enabled]) => enabled).map(([key]) => key.toUpperCase());
    const unsupported = [...options.bodyParts.focus, ...options.bodyParts.avoid].find((part) => supported.length > 0 && !supported.includes(part));
    if (unsupported) errors.push(error(`${field}.bodyParts`, 'UNSUPPORTED_OPTION', `Body area ${unsupported} is not supported for this service.`));
  }
  return errors;
}

function quoteSecret(): string | null {
  return process.env.BOOKING_QUOTE_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function catalogDigest(catalog: CatalogService[]): string {
  return fingerprint(catalog.map((service) => ({ id: service.id, priceVND: service.priceVND, priceUSD: service.priceUSD, duration: service.duration, isActive: service.isActive })).sort((a, b) => a.id.localeCompare(b.id)));
}

export function createQuote(intentFingerprint: string, pricing: Pick<CanonicalPricing, 'catalogDigest' | 'totalAmountVND' | 'totalAmountUSD' | 'items'>, now = Date.now()): string | null {
  const secret = quoteSecret();
  if (!secret) return null;
  const payload = { v: 1, intentFingerprint, catalogDigest: pricing.catalogDigest, totalAmountVND: pricing.totalAmountVND, totalAmountUSD: pricing.totalAmountUSD, expiresAt: now + QUOTE_TTL_MS };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyQuote(token: string | null, intentFingerprints: string | string[], currentCatalogDigest: string, now = Date.now()): { ok: true } | { ok: false; reason: string } {
  if (!token) return { ok: true };
  const secret = quoteSecret();
  if (!secret) return { ok: false, reason: 'QUOTE_UNAVAILABLE' };
  const [encoded, signature] = token.split('.');
  if (!encoded || !signature) return { ok: false, reason: 'QUOTE_INVALID' };
  const expected = createHmac('sha256', secret).update(encoded).digest('base64url');
  if (signature.length !== expected.length || !timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return { ok: false, reason: 'QUOTE_INVALID' };
  let payload: any;
  try { payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')); } catch { return { ok: false, reason: 'QUOTE_INVALID' }; }
  const expectedFingerprints = Array.isArray(intentFingerprints) ? intentFingerprints : [intentFingerprints];
  if (payload.v !== 1 || !expectedFingerprints.includes(payload.intentFingerprint)) return { ok: false, reason: 'QUOTE_INTENT_CHANGED' };
  if (payload.expiresAt <= now) return { ok: false, reason: 'QUOTE_EXPIRED' };
  if (payload.catalogDigest !== currentCatalogDigest) return { ok: false, reason: 'PRICE_CHANGED' };
  return { ok: true };
}

export function serviceName(service: CatalogService, lang: SupportedLang): string {
  const names: Record<SupportedLang, keyof CatalogService> = { vi: 'nameVN', en: 'nameEN', cn: 'nameCN', jp: 'nameJP', kr: 'nameKR' };
  return String(service[names[lang]] || service.nameEN || service.nameVN || 'Oria Spa Treatment');
}

export function buildCanonicalPricing(selected: NormalizedService[], catalog: CatalogService[], catalogItems: CatalogService): CanonicalPricing {
  const map = new Map(catalog.map((service) => [service.id, service]));
  const addon = catalogItems;
  const addonVND = Number(addon.priceVND);
  const addonUSD = Number(addon.priceUSD);
  const items: CanonicalService[] = [];
  let totalAmountVND = 0;
  let totalAmountUSD = 0;
  for (const item of selected) {
    const service = map.get(item.id);
    if (!service) throw new Error(`SERVICE_NOT_FOUND:${item.id}`);
    const basePriceVND = Number(service.priceVND);
    const basePriceUSD = Number(service.priceUSD);
    const duration = Number(service.duration);
    if (service.priceVND === null || service.priceVND === undefined || service.priceVND === '' || service.priceUSD === null || service.priceUSD === undefined || service.priceUSD === '' || service.duration === null || service.duration === undefined || service.duration === '' || !Number.isFinite(basePriceVND) || basePriceVND < 0 || !Number.isFinite(basePriceUSD) || basePriceUSD < 0 || !Number.isInteger(duration) || duration < 0) throw new Error(`CATALOG_INVALID:${item.id}`);
    const hasPrivateRoom = item.options.addons?.privateRoom === true;
    const priceVND = basePriceVND + (hasPrivateRoom ? addonVND : 0);
    const priceUSD = basePriceUSD + (hasPrivateRoom ? addonUSD : 0);
    if (hasPrivateRoom && (addon.priceVND === null || addon.priceVND === undefined || addon.priceVND === '' || addon.priceUSD === null || addon.priceUSD === undefined || addon.priceUSD === '' || !Number.isFinite(addonVND) || addonVND < 0 || !Number.isFinite(addonUSD) || addonUSD < 0)) throw new Error('ADDON_CATALOG_INVALID');
    totalAmountVND += priceVND * item.quantity;
    totalAmountUSD += priceUSD * item.quantity;
    items.push({ ...item, catalog: service, basePriceVND, basePriceUSD, priceVND, priceUSD, duration, hasPrivateRoom, addonPriceVND: addonVND, addonPriceUSD: addonUSD });
  }
  return { items, totalAmountVND, totalAmountUSD, catalogDigest: catalogDigest(catalog) };
}
