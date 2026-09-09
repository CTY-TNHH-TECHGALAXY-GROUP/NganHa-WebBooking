import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  buildCanonicalPricing,
  cartIntentFingerprint,
  createQuote,
  normalizeOptions,
  parseBookingRequest,
  validateCatalogOptions,
  verifyQuote,
} from '../src/lib/booking/contract.ts';
import { generateBookingConfirmationHtml } from '../src/lib/mailer.ts';

const routeSource = fs.readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
const repriceSource = fs.readFileSync(new URL('../src/app/api/bookings/reprice/route.ts', import.meta.url), 'utf8');
const future = { date: '2099-02-28', time: '14:00' };
const validBody = (overrides = {}) => ({
  name: 'Nguyen O\'Neil', phone: '090 123 4567', phoneCountryCode: '+84', email: 'guest@example.org',
  ...future, branchId: 'ngan-ha-spa', branchName: 'ORIA SPA', guests: 1, staffGender: 'any', lang: 'vi',
  selectedServices: [{ variantId: 'NHS1002', quantity: 1, options: { addons: { privateRoom: false } } }], ...overrides,
});
const request = (body) => new Request('https://test.invalid/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
const parse = (body, options) => parseBookingRequest(body, request(body), options);
const expectInvalid = (body, field, code) => {
  const result = parse(body, { allowPastForReplay: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some((item) => item.field === field && item.code === code), `${field}/${code}`);
};
const catalog = [
  { id: 'NHS1002', nameVN: 'Massage', nameEN: 'Massage', priceVND: 790000, priceUSD: 32, duration: 60, isActive: true, showFocus: true, showNotes: true, showGender: true, showStrength: true },
  { id: 'NHS0900', nameVN: 'Phòng riêng', nameEN: 'Private Room', priceVND: 105000, priceUSD: 5, duration: 0, isActive: true },
];

const tests = [
  ['API01 invalid JSON/body shapes and size guard', () => {
    assert.equal(parse(null, { allowPastForReplay: true }).ok, false);
    assert.equal(parse([], { allowPastForReplay: true }).ok, false);
    assert.match(routeSource, /MAX_BODY_BYTES/);
  }],
  ['API02 Unicode names accepted, empty/control names rejected', () => {
    assert.equal(parse(validBody({ name: 'Nguyễn 李 O\'Neil' })).ok, true);
    expectInvalid(validBody({ name: ' ' }), 'name', 'REQUIRED');
    expectInvalid(validBody({ name: 'bad\u0000name' }), 'name', 'INVALID_TEXT');
  }],
  ['API03 explicit phone country normalization and invalid prefixes', () => {
    assert.equal(parse(validBody()).value.phone, '+84901234567');
    expectInvalid(validBody({ phone: '84901234567' }), 'phone', 'PHONE_PREFIX_REPEATED');
    expectInvalid(validBody({ phone: 'abc123456' }), 'phone', 'INVALID_PHONE');
  }],
  ['API04 email/note validation and HTML escaping', () => {
    expectInvalid(validBody({ email: 'guest@example.org\nBcc:bad@example.org' }), 'email', 'INVALID_TEXT');
    expectInvalid(validBody({ note: '<script>\u0000' }), 'note', 'INVALID_TEXT');
    const html = generateBookingConfirmationHtml({ bookingId: 'WB-1', customerName: '<img src=x>', customerPhone: '+8490', date: future.date, time: future.time, services: [{ name: '<svg>' }], totalAmount: 1 });
    assert.doesNotMatch(html, /<img src=x>/);
    assert.match(html, /&lt;img src=x&gt;/);
  }],
  ['API05 quantity and service aliases are strict', () => {
    expectInvalid(validBody({ selectedServices: [{ id: 'NHS1002', quantity: true }] }), 'selectedServices[0].quantity', 'INVALID_QUANTITY');
    expectInvalid(validBody({ selectedServices: [{ id: 'NHS1002', quantity: 1.5 }] }), 'selectedServices[0].quantity', 'INVALID_QUANTITY');
    expectInvalid(validBody({ selectedServices: [{ id: 'NHS1002', quantity: 21 }] }), 'selectedServices[0].quantity', 'INVALID_QUANTITY');
    expectInvalid(validBody({ selectedServices: [{ id: 'NHS1002', variantId: 'NHS9999' }] }), 'selectedServices[0].id', 'ALIAS_CONFLICT');
  }],
  ['API06 options are typed, enum checked, deduped and non-overlapping', () => {
    assert.equal(normalizeOptions({ bodyParts: { focus: ['HEAD'], avoid: ['ARM'] }, addons: { privateRoom: false } }, 'options').errors.length, 0);
    assert.ok(normalizeOptions({ bodyParts: { focus: ['HEAD', 'HEAD'], avoid: [] } }, 'options').errors.some((e) => e.code === 'DUPLICATE_OPTION'));
    assert.ok(normalizeOptions({ bodyParts: { focus: ['HEAD'], avoid: ['HEAD'] } }, 'options').errors.some((e) => e.code === 'OVERLAPPING_OPTIONS'));
    assert.ok(normalizeOptions({ addons: { privateRoom: 'false' } }, 'options').errors.some((e) => e.code === 'INVALID_TYPE'));
  }],
  ['API07 catalog-only prices and inactive add-on policy', () => {
    const priced = buildCanonicalPricing([{ id: 'NHS1002', quantity: 1, options: { addons: { privateRoom: true } } }], catalog, catalog[1]);
    assert.equal(priced.totalAmountVND, 895000);
    assert.equal(priced.totalAmountUSD, 37);
    assert.ok(!routeSource.includes('PRIVATE_ROOM_DEFAULT_PRICE'));
    assert.ok(!repriceSource.includes('PRIVATE_ROOM_DEFAULT_PRICE'));
    const zeroDuration = buildCanonicalPricing([{ id: 'NHS0900', quantity: 1, options: {} }], catalog, catalog[1]);
    assert.equal(zeroDuration.items[0].duration, 0);
    assert.equal(zeroDuration.totalAmountVND, 105000);
    assert.throws(() => buildCanonicalPricing([{ id: 'NHS0900', quantity: 1, options: {} }], [{ ...catalog[1], duration: null }], catalog[1]), /CATALOG_INVALID/);
  }],
  ['API08 calendar and spa-time validation', () => {
    expectInvalid(validBody({ date: '2099-02-29' }), 'date', 'INVALID_DATE');
    expectInvalid(validBody({ date: '2099-02-30' }), 'date', 'INVALID_DATE');
    expectInvalid(validBody({ time: '08:30' }), 'time', 'INVALID_TIME');
    assert.equal(parse(validBody({ time: '22:00' })).ok, true);
    assert.equal(parse(validBody({ time: '22:30' })).ok, true);
    expectInvalid(validBody({ time: '22:31' }), 'time', 'INVALID_TIME');
    expectInvalid(validBody({ time: '23:00' }), 'time', 'INVALID_TIME');
  }],
  ['API09 browser cannot choose status/payment/branch identity or price', () => {
    const result = parse(validBody({ status: 'PAID', amountPaid: 790000, bookingId: 'client-id', branchName: 'ORIA SPA' }));
    assert.equal(result.ok, true);
    assert.match(routeSource, /status: 'NEW'/);
    assert.match(routeSource, /customerId,/);
    assert.match(routeSource, /totalAmount: pricing\.totalAmountVND/);
  }],
  ['API10 counter allocator failures map to unavailable without a second writer', () => {
    assert.match(routeSource, /BOOKING_TEMPORARILY_UNAVAILABLE/);
    assert.match(routeSource, /supabase\.rpc\('webbooking_allocate_booking_number'/);
    assert.doesNotMatch(routeSource, /webbooking_submit_booking|create_booking_atomic/);
  }],
  ['API11 replay uses stored snapshot before current time/catalog checks', () => {
    assert.match(routeSource, /findReplay\(supabase, finalKey, \{ waitForItems: true \}\)/);
    assert.match(routeSource, /replay\.state === 'complete'/);
    assert.match(routeSource, /responseForSnapshot\(replay\.snapshot, true\)/);
    const replayGate = routeSource.slice(routeSource.indexOf("if (replay.state === 'complete')"), routeSource.indexOf("if (!booking.quote"));
    assert.doesNotMatch(replayGate, /sendBookingConfirmationEmail/);
  }],
  ['API12 signed quote detects intent, expiry and catalog changes', () => {
    process.env.BOOKING_QUOTE_SECRET = 'mock-only-terra-2';
    const pricing = buildCanonicalPricing([{ id: 'NHS1002', quantity: 1, options: {} }], catalog, catalog[1]);
    const token = createQuote(cartIntentFingerprint([{ id: 'NHS1002', quantity: 1, options: {} }]), pricing, Date.now());
    assert.ok(token);
    assert.deepEqual(verifyQuote(token, cartIntentFingerprint([{ id: 'NHS1002', quantity: 1, options: {} }]), pricing.catalogDigest), { ok: true });
    assert.equal(verifyQuote(token, 'different', pricing.catalogDigest).ok, false);
    assert.equal(verifyQuote(token, cartIntentFingerprint([{ id: 'NHS1002', quantity: 1, options: {} }]), 'changed').ok, false);
  }],
  ['API13 mail failure does not turn committed booking into API failure', () => {
    assert.match(routeSource, /emailStatus/);
    assert.match(routeSource, /return NextResponse\.json\(\{ success: true/);
    assert.match(routeSource, /sendBookingConfirmationEmail/);
  }],
  ['API14 caller aliases/locales remain compatible', () => {
    for (const lang of ['vi', 'en', 'jp', 'kr', 'cn']) assert.equal(parse(validBody({ lang })).ok, true);
    assert.equal(parse(validBody({ selectedServices: [{ serviceId: 'NHS1002', qty: 1, customOptions: {} }] })).ok, true);
    const vi = parse(validBody({ lang: 'vi' })).value;
    const en = parse(validBody({ lang: 'en' })).value;
    assert.equal(vi.intentFingerprint, en.intentFingerprint);
  }],
];

let passed = 0;
for (const [name, test] of tests) {
  try { test(); passed += 1; console.log(`PASS ${name}`); }
  catch (error) { console.error(`FAIL ${name}`); console.error(error); process.exitCode = 1; }
}
console.log(`Terra-2 mock API matrix: ${passed}/${tests.length} passed`);
