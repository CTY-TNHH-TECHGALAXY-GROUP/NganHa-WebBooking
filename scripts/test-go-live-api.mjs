// Execute the actual route with injected DB/mail dependencies. No network/env files.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as contract from '../src/lib/booking/contract.ts';

const compile = file => ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
const catalog = [
  { id: 'QA', nameVN: 'QA', nameEN: 'QA', priceVND: 790000, priceUSD: 32, duration: 60, isActive: true },
  { id: 'NHS0900', nameVN: 'Phòng riêng', nameEN: 'Private Room', priceVND: 105000, priceUSD: 4, duration: 0, isActive: true },
];
process.env.BOOKING_QUOTE_SECRET = 'isolated-integration-only';
const body = { name: 'QA Guest', phone: '+84901234567', email: 'qa@example.invalid', date: '2099-09-08', time: '14:00',
  branchId: 'ngan-ha-spa', branchName: 'ORIA SPA', guests: 1, lang: 'en', selectedServices: [{ id: 'QA', quantity: 2, options: {} }] };
body.quote = contract.createQuote(contract.cartIntentFingerprint(body.selectedServices), contract.buildCanonicalPricing(body.selectedServices, catalog, catalog[1]));
const parsed = contract.parseBookingRequest(body, new Request('http://test.invalid'));
assert.equal(parsed.ok, true);
const row = { id: 'WB-QA-001', billCode: 'WB-QA-001', customerName: body.name, customerEmail: body.email, customerPhone: body.phone,
  bookingDate: '2099-09-08', timeBooking: '14:00', totalAmount: 1580000, status: 'NEW', idempotency_fingerprint: parsed.value.intentFingerprint };
function harness(scenario = {}) {
  const calls = { rpc: 0, mail: 0, tables: [] };
  const supabase = {
    from(table) {
      const query = { table, filters: [], action: 'select' };
      calls.tables.push(query);
      const result = () => {
        if (query.action === 'update') { if (scenario.markerThrows) throw new Error('offline'); return { error: null }; }
        if (table === 'Services') return scenario.catalogError ? { error: scenario.catalogError } : { data: catalog };
        if (table === 'Bookings') {
          if (query.filters.some(([key]) => key === 'id')) return { data: row };
          return { data: scenario.replay ? { ...row, ...scenario.replay } : null };
        }
        if (table === 'BookingItems') return { data: [{ serviceId: 'QA', quantity: 2, price: 790000, options: {} }] };
        return { data: null };
      };
      const builder = {
        select() { return this; }, update() { query.action = 'update'; return this; },
        eq(key, value) { query.filters.push([key, value]); return this; },
        in() { return this; }, order() { return this; }, limit() { return this; },
        maybeSingle() { return Promise.resolve().then(result); },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      return builder;
    },
    async rpc(name, payload) {
      calls.rpc++; calls.payload = payload;
      if (scenario.rpcError) return { error: scenario.rpcError };
      return { data: { booking_id: row.id, data: { bookingId: row.id, totalAmount: row.totalAmount } } };
    },
  };
  const exports = {};
  const sandbox = { exports, Buffer, Request, Response, console: { error() {}, warn() {} },
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock' } },
    require(name) {
      if (name === 'next/server') return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === '@/lib/supabase-server') return { getSupabaseAdmin: () => supabase };
      if (name === '@/lib/booking/contract') return contract;
      if (name === '@/lib/mailer') return { sendBookingConfirmationEmail: async () => { calls.mail++; if (scenario.mailThrows) throw Error('mail offline'); return { success: !scenario.mailFails }; } };
      throw Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(compile('../src/app/api/bookings/route.ts'), sandbox);
  return { calls, post: (input = body, raw) => exports.POST(new Request('http://test.invalid/api/bookings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'integration-qa-key' }, body: raw ?? JSON.stringify(input),
  })) };
}
let passed = 0;
const test = async (name, fn) => { await fn(); passed++; console.log(`PASS ${name}`); };
await test('actual route rejects malformed/null/array/oversize before DB', async () => {
  for (const [value, raw, status] of [[null, undefined, 400], [[], undefined, 400], [body, '{', 400], [body, ' '.repeat(contract.MAX_BODY_BYTES + 1), 413]]) {
    const h = harness(); assert.equal((await h.post(value, raw)).status, status); assert.equal(h.calls.rpc, 0);
  }
});
await test('schema/ACL/RPC failures are 503, no mail or direct insert', async () => {
  for (const code of ['42P01', '42703', '42501', '42883', 'PGRST202', 'PGRST204']) {
    const h = harness({ rpcError: { code, message: 'service database object does not exist' } });
    const response = await h.post(); assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'BOOKING_TEMPORARILY_UNAVAILABLE'); assert.equal(h.calls.mail, 0);
  }
});
await test('atomic quote mismatch returns 409 with no email', async () => {
  const h = harness({ rpcError: { code: 'P0001', message: 'PRICE_CHANGED' } });
  assert.equal((await h.post()).status, 409); assert.equal(h.calls.mail, 0);
  assert.equal(h.calls.payload.p_booking_data.expectedCatalog[0].priceUSD, 32);
});
await test('contact identity conflict is a review response, no DB details', async () => {
  const h = harness({ rpcError: { code: 'P0001', message: 'CUSTOMER_IDENTITY_CONFLICT' } });
  const r = await h.post(); assert.equal(r.status, 409); assert.equal((await r.json()).code, 'CONTACT_REQUIRES_REVIEW');
});
await test('commit remains successful when SMTP and marker both throw', async () => {
  const h = harness({ mailThrows: true, markerThrows: true }); const response = await h.post();
  assert.equal(response.status, 200); const result = await response.json();
  assert.equal(result.data.totalAmount, 1580000); assert.equal(result.data.emailStatus.pending, true); assert.equal(h.calls.rpc, 1);
});
await test('successful email with unavailable marker keeps success', async () => {
  const h = harness({ markerThrows: true }); const r = await h.post();
  assert.equal(r.status, 200); assert.equal((await r.json()).data.emailStatus.sent, true);
});
await test('replay bypasses catalog outage and never sends mail', async () => {
  const h = harness({ replay: {}, catalogError: { code: 'offline' } }); const r = await h.post();
  assert.equal(r.status, 200); const result = await r.json(); assert.equal(result.idempotent, true);
  assert.equal(result.data.services.length, 1); assert.equal(result.data.services[0].quantity, 2);
  assert.equal(h.calls.rpc, 0); assert.equal(h.calls.mail, 0);
});
await test('changed intent cannot fetch someone else booking by key', async () => {
  const h = harness({ replay: {} }); const r = await h.post({ ...body, name: 'Different Guest' });
  assert.equal(r.status, 409); assert.equal((await r.json()).data, undefined);
});
await test('missing quote cannot create a new booking', async () => {
  const h = harness(); const r = await h.post({ ...body, quote: undefined });
  assert.equal(r.status, 409); assert.equal(h.calls.rpc, 0); assert.equal(h.calls.mail, 0);
});
console.log(`Actual-route mocked integration: ${passed}/9 passed; no network/SMTP/production data.`);
