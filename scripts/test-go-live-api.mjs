// Execute the actual route with injected DB/mail dependencies. No network/env files.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import { createHash } from 'node:crypto';
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
  bookingDate: '2099-09-08', timeBooking: '14:00', branchName: body.branchName, guestCount: body.guests, customerLang: body.lang,
  totalAmount: 1580000, status: 'NEW', idempotency_fingerprint: parsed.value.intentFingerprint };
function harness(scenario = {}) {
  const savedRow = { ...row, ...(scenario.savedRow || {}) };
  const calls = { rpc: 0, allocator: 0, writer: 0, mail: 0, tables: [], inserts: [], deletes: 0, directBookingWrites: 0, writerPayloads: [], replayLookups: 0, verificationReads: 0, trace: [] };
  const supabase = {
    from(table) {
      const query = { table, filters: [], action: 'select', payload: null };
      calls.tables.push(query);
      const result = () => {
        if (query.action === 'insert') {
          calls.inserts.push(query);
          if (table === 'Customers') return scenario.customerError ? { error: scenario.customerError } : { data: { id: 'CUS-QA-001' } };
          if (table === 'Bookings' || table === 'BookingItems') {
            calls.directBookingWrites++;
            throw new Error(`DIRECT_${table}_INSERT_FORBIDDEN`);
          }
        }
        if (query.action === 'delete') { calls.deletes++; throw new Error('DIRECT_DELETE_FORBIDDEN'); }
        if (table === 'Services') return scenario.catalogError ? { error: scenario.catalogError } : { data: catalog };
        if (table === 'Customers') return { data: scenario.customer ? { id: 'CUS-QA-001', ...scenario.customer } : null };
        if (table === 'Bookings') {
          const isReplayLookup = query.filters.some(([key]) => key === 'idLegacy');
          if (isReplayLookup) calls.replayLookups++;
          if (query.filters.some(([key]) => key === 'id')) {
            calls.verificationReads++;
            calls.trace.push({ stage: 'verification', table: 'Bookings' });
            if (scenario.verificationError) return { data: null, error: scenario.verificationError };
            return { data: scenario.verificationMissing ? null : calls.writer > 0 ? savedRow : null };
          }
          const replayVisible = scenario.replay && (scenario.replayVisibleInitially !== false || calls.writer > 0);
          if (isReplayLookup) return { data: replayVisible ? { ...savedRow, ...scenario.replay } : null };
          return { data: null };
        }
        if (table === 'BookingItems') {
          if (query.filters.some(([key]) => key === 'bookingId')) {
            calls.verificationReads++;
            calls.trace.push({ stage: 'verification', table: 'BookingItems' });
            if (scenario.verificationItemsError) return { data: null, error: scenario.verificationItemsError };
            if (scenario.verificationItemsMissing) return { data: null };
          }
          return { data: scenario.replayItems || [{ bookingId: savedRow.id, serviceId: 'QA', quantity: 2, price: 790000, options: { focus: [], avoid: [], therapist: 'Ngẫu nhiên', note: '' } }] };
        }
        return { data: null };
      };
      const builder = {
        select() { return this; }, insert(payload) { query.action = 'insert'; query.payload = payload; return this; }, delete() { query.action = 'delete'; return this; },
        eq(key, value) { query.filters.push([key, value]); return this; },
        like(key, value) { query.filters.push([key, value]); return this; },
        in() { return this; }, order() { return this; }, limit() { return this; },
        maybeSingle() { return Promise.resolve().then(result); },
        single() { return Promise.resolve().then(result); },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      return builder;
    },
    async rpc(name, payload) {
      calls.rpc++; calls.payload = payload; calls.trace.push({ stage: 'rpc', name });
      if (name === 'webbooking_allocate_booking_number') {
        calls.allocator++;
        if (scenario.rpcError) return { error: scenario.rpcError };
        if (Object.prototype.hasOwnProperty.call(scenario, 'allocatorData')) return { data: scenario.allocatorData };
        return { data: savedRow.id };
      }
      assert.equal(name, 'webbooking_commit_booking'); calls.writer++; calls.writerPayloads.push(payload);
      const error = scenario.writerErrors?.[calls.writer - 1] || scenario.writerError;
      if (error) return { error };
      const hasWriterResult = Object.prototype.hasOwnProperty.call(scenario, 'writerResult');
      const hasWriterResultAtIndex = Array.isArray(scenario.writerResults) && Object.prototype.hasOwnProperty.call(scenario.writerResults, calls.writer - 1);
      const writerResult = hasWriterResultAtIndex ? scenario.writerResults[calls.writer - 1] : hasWriterResult ? scenario.writerResult : { success: true, idempotent: false, bookingId: savedRow.id, billCode: savedRow.billCode };
      return { data: writerResult };
    },
  };
  const exports = {};
  const sandbox = { exports, Buffer, Request, Response, setTimeout, console: { error() {}, warn() {}, info() {} },
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock' } },
    require(name) {
      if (name === 'node:crypto') return { createHash };
      if (name === 'next/server') return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === '@/lib/supabase-server') return { getSupabaseAdmin: () => supabase };
      if (name === '@/lib/booking/contract') return contract;
      if (name === '@/lib/notificationSettings') return {
        readNotificationSettings: async () => ({ state: 'absent', bccEnabled: false, bccRecipients: [], revision: 0 }),
      };
      if (name === '@/lib/mailer') return { sendBookingConfirmationEmail: async () => {
        calls.mail++;
        calls.trace.push({ stage: 'mailer' });
        if (scenario.mailThrows) throw Error('mail offline password=MAIL_SECRET recipient=guest@example.invalid');
        if (Object.prototype.hasOwnProperty.call(scenario, 'mailResult')) return scenario.mailResult;
        if (scenario.mailFails) return {
          success: false,
          outcome: 'failed',
          stage: 'smtp',
          reasonCode: 'SMTP_AUTH_FAILED',
          attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_AUTH_FAILED' }],
        };
        return {
          success: true,
          messageId: '<qa-message-id@mock.invalid>',
          outcome: 'accepted',
          stage: 'smtp',
          reasonCode: 'SMTP_ACCEPTED',
          attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }],
        };
      } };
      throw Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(compile('../src/app/api/bookings/route.ts'), sandbox);
  return { calls, scenario, post: (input = body, raw) => exports.POST(new Request('http://test.invalid/api/bookings', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'integration-qa-key' }, body: raw ?? JSON.stringify(input),
  })) };
}
let passed = 0;
let failed = 0;
const test = async (name, fn) => {
  try { await fn(); passed++; console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}`); console.error(error); }
};
await test('actual route rejects malformed/null/array/oversize before DB', async () => {
  for (const [value, raw, status] of [[null, undefined, 400], [[], undefined, 400], [body, '{', 400], [body, ' '.repeat(contract.MAX_BODY_BYTES + 1), 413]]) {
    const h = harness(); assert.equal((await h.post(value, raw)).status, status); assert.equal(h.calls.rpc, 0);
  }
});
await test('schema/ACL/counter failures are 503, no mail or direct insert/delete fallback', async () => {
  for (const code of ['42P01', '42703', '42501', '42883', 'PGRST202', 'PGRST204']) {
    const h = harness({ rpcError: { code, message: 'service database object does not exist' } });
    const response = await h.post(); assert.equal(response.status, 503);
    assert.equal((await response.json()).code, 'BOOKING_TEMPORARILY_UNAVAILABLE'); assert.equal(h.calls.mail, 0); assert.equal(h.calls.inserts.length, 0); assert.equal(h.calls.deletes, 0);
  }
});
await test('malformed and false RPC results fail closed without mail or direct booking writes', async () => {
  for (const allocatorData of [null, false, {}, { success: false }]) {
    const h = harness({ allocatorData });
    const response = await h.post();
    assert.equal(response.status, 503);
    assert.equal(h.calls.writer, 0);
    assert.equal(h.calls.mail, 0);
    assert.equal(h.calls.directBookingWrites, 0);
  }
  for (const writerResult of [null, false, {}, [], { success: false, bookingId: row.id }, { success: true, bookingId: 123 }]) {
    const h = harness({ writerResult });
    const response = await h.post();
    assert.notEqual(response.status, 200);
    assert.equal(h.calls.writer, 1);
    assert.equal(h.calls.mail, 0);
    assert.equal(h.calls.directBookingWrites, 0);
  }
});
await test('quote mismatch returns 409 before allocator and insert', async () => {
  const h = harness();
  assert.equal((await h.post({ ...body, quote: 'invalid-quote' })).status, 409); assert.equal(h.calls.mail, 0); assert.equal(h.calls.rpc, 0); assert.equal(h.calls.inserts.length, 0);
});
await test('atomic writer boundary is exercised without direct insert/delete fallback', async () => {
  const h = harness(); const r = await h.post({ ...body, quote: 'invalid-quote' }); assert.equal(r.status, 409);
  assert.equal(h.calls.writer, 0); assert.equal(h.calls.deletes, 0); assert.match(readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8'), /webbooking_commit_booking/);
});
await test('commit remains successful when SMTP throws', async () => {
  const h = harness({ mailThrows: true }); const response = await h.post();
  assert.equal(response.status, 200); const result = await response.json();
  assert.equal(result.data.totalAmount, 1580000);
  assert.deepEqual(result.data.emailStatus, {
    sent: false, pending: true, diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_SEND_FAILED', attempts: [],
  });
  assert.equal(h.calls.writer, 1); assert.equal(h.calls.deletes, 0);
});
await test('SMTP failure after commit is replay-safe and retry sends no duplicate email', async () => {
  const h = harness({ mailThrows: true });
  const first = await h.post();
  const firstResult = await first.json();
  assert.equal(first.status, 200);
  assert.equal(firstResult.idempotent, false);
  assert.equal(firstResult.data.emailStatus.pending, true);
  assert.equal(firstResult.data.emailStatus.code, 'EMAIL_SEND_FAILED');
  h.scenario.replay = {};
  const retry = await h.post();
  const retryResult = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryResult.idempotent, true);
  assert.equal(retryResult.data.bookingId, firstResult.data.bookingId);
  assert.deepEqual(retryResult.data.emailStatus, {
    diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_REPLAY_NOT_ATTEMPTED', attempts: [],
  });
  assert.equal(Object.prototype.hasOwnProperty.call(retryResult.data.emailStatus, 'sent'), false);
  assert.equal(h.calls.allocator, 1);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.mail, 1);
  assert.equal(h.calls.deletes, 0);
});
await test('successful email keeps the direct booking commit', async () => {
  const h = harness(); const r = await h.post();
  const result = await r.json();
  assert.equal(r.status, 200);
  assert.deepEqual(result.data.emailStatus, {
    sent: true, messageId: '<qa-message-id@mock.invalid>', diagnosticsVersion: 1, outcome: 'accepted', stage: 'smtp', code: 'SMTP_ACCEPTED',
    attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }],
  });
  assert.deepEqual(h.calls.trace, [
    { stage: 'rpc', name: 'webbooking_allocate_booking_number' },
    { stage: 'rpc', name: 'webbooking_commit_booking' },
    { stage: 'verification', table: 'Bookings' },
    { stage: 'verification', table: 'BookingItems' },
    { stage: 'mailer' },
  ]);
});
await test('writerReplay returns the verified snapshot and never dispatches mail', async () => {
  const h = harness({ writerResult: { success: true, idempotent: true, bookingId: row.id, billCode: row.billCode } });
  const response = await h.post();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.idempotent, true);
  assert.equal(result.data.bookingId, row.id);
  assert.deepEqual(result.data.emailStatus, {
    diagnosticsVersion: 1, outcome: 'unknown', stage: 'unknown', code: 'EMAIL_REPLAY_NOT_ATTEMPTED', attempts: [],
  });
  assert.equal(h.calls.allocator, 1);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.verificationReads, 2);
  assert.equal(h.calls.mail, 0);
  assert.doesNotMatch(JSON.stringify(h.calls.trace), /mailer/);
});
await test('writer timeout after commit reconciles to success without dispatching mail', async () => {
  const h = harness({ writerError: { code: '57014', message: 'statement timeout after commit' }, replay: {}, replayVisibleInitially: false });
  const response = await h.post();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.idempotent, true);
  assert.equal(result.data.bookingId, row.id);
  assert.equal(h.calls.allocator, 1);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.replayLookups, 2);
  assert.equal(h.calls.mail, 0);
  assert.doesNotMatch(JSON.stringify(h.calls.trace), /mailer/);
});
await test('missing writer response after commit reconciles to success without dispatching mail', async () => {
  const h = harness({ writerResult: null, replay: {}, replayVisibleInitially: false });
  const response = await h.post();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.idempotent, true);
  assert.equal(result.data.bookingId, row.id);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.mail, 0);
});
await test('replay bypasses catalog outage and never sends mail', async () => {
  const h = harness({ replay: {}, catalogError: { code: 'offline' } }); const r = await h.post();
  assert.equal(r.status, 200); const result = await r.json(); assert.equal(result.idempotent, true);
  assert.equal(result.data.services.length, 1); assert.equal(result.data.services[0].quantity, 2);
  assert.equal(h.calls.allocator, 0); assert.equal(h.calls.writer, 0); assert.equal(h.calls.mail, 0);
});
await test('established idLegacy key replays the existing booking', async () => {
  const h = harness({ replay: {} }); const r = await h.post({ ...body });
  assert.equal(r.status, 200); assert.equal((await r.json()).idempotent, true); assert.equal(h.calls.allocator, 0); assert.equal(h.calls.writer, 0); assert.equal(h.calls.inserts.length, 0);
});
await test('missing quote cannot create a new booking', async () => {
  const h = harness(); const r = await h.post({ ...body, quote: undefined });
  assert.equal(r.status, 409); assert.equal(h.calls.rpc, 0); assert.equal(h.calls.mail, 0); assert.equal(h.calls.inserts.length, 0);
});
await test('idLegacy conflict replays the existing booking without allocating a replacement', async () => {
  const h = harness({
    writerErrors: [{ code: '23505', constraint: 'Bookings_idLegacy_key', message: 'duplicate key value violates unique constraint "Bookings_idLegacy_key"' }],
    replay: {}, replayVisibleInitially: false,
  });
  const r = await h.post(); const result = await r.json();
  assert.equal(r.status, 200); assert.equal(result.idempotent, true); assert.equal(result.data.bookingId, row.id);
  assert.equal(h.calls.writer, 1); assert.equal(h.calls.deletes, 0); assert.equal(h.calls.mail, 0);
});
await test('idLegacy conflict with an incomplete parent is retryable and never reports success', async () => {
  const h = harness({
    writerErrors: [{ code: '23505', constraint: 'Bookings_idLegacy_key', message: 'duplicate key value violates unique constraint "Bookings_idLegacy_key"' }],
    replay: {}, replayVisibleInitially: false, replayItems: [],
  });
  const r = await h.post(); const result = await r.json();
  assert.equal(r.status, 409); assert.equal(result.code, 'BOOKING_IN_PROGRESS'); assert.equal(h.calls.mail, 0);
  assert.equal(h.calls.writer, 1); assert.equal(h.calls.deletes, 0);
});
await test('DB verification missing or failing after writer commit returns retryable result and no mail', async () => {
  for (const scenario of [
    { verificationMissing: true },
    { verificationError: { code: 'PGRST000', message: 'verification unavailable' } },
    { verificationItemsMissing: true },
    { verificationItemsError: { code: 'PGRST000', message: 'item verification unavailable' } },
  ]) {
    const h = harness(scenario);
    const response = await h.post();
    assert.equal(response.status, 503);
    const result = await response.json();
    assert.equal(result.code, 'BOOKING_TEMPORARILY_UNAVAILABLE');
    assert.match(result.error, /same idempotency key/i);
    assert.equal(h.calls.writer, 1);
    assert.equal(h.calls.mail, 0);
    assert.equal(h.calls.deletes, 0);
  }
});
await test('verification failure followed by same-key retry replays success without dispatching mail', async () => {
  const h = harness({ verificationMissing: true });
  const first = await h.post();
  const firstResult = await first.json();
  assert.equal(first.status, 503);
  assert.equal(firstResult.code, 'BOOKING_TEMPORARILY_UNAVAILABLE');
  assert.equal(h.calls.mail, 0);

  h.scenario.verificationMissing = false;
  h.scenario.replay = {};
  const retry = await h.post();
  const retryResult = await retry.json();
  assert.equal(retry.status, 200);
  assert.equal(retryResult.idempotent, true);
  assert.equal(retryResult.data.bookingId, firstResult.bookingId || row.id);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.mail, 0);
});
await test('SMTP false result keeps the committed booking successful and marks email pending', async () => {
  const h = harness({ mailFails: true });
  const response = await h.post();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.data.emailStatus.sent, false);
  assert.equal(result.data.emailStatus.pending, true);
  assert.equal(result.data.emailStatus.outcome, 'failed');
  assert.equal(result.data.emailStatus.stage, 'smtp');
  assert.equal(result.data.emailStatus.code, 'SMTP_AUTH_FAILED');
  assert.deepEqual(result.data.emailStatus.attempts, [{ attempt: 1, stage: 'smtp', code: 'SMTP_AUTH_FAILED' }]);
  assert.equal(h.calls.writer, 1);
  assert.equal(h.calls.mail, 1);
});
await test('mailer result allowlist preserves accepted fields and excludes raw extras', async () => {
  const secret = 'password=MAIL_SECRET recipient=secret@example.com';
  const h = harness({ mailResult: {
    success: true,
    messageId: '<safe-message-id@mock.invalid>',
    outcome: 'accepted',
    stage: 'smtp',
    reasonCode: 'SMTP_ACCEPTED',
    attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }],
    error: secret,
    response: secret,
    accepted: [secret],
  } });
  const response = await h.post();
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.data.emailStatus.sent, true);
  assert.equal(result.data.emailStatus.messageId, '<safe-message-id@mock.invalid>');
  assert.doesNotMatch(JSON.stringify(result), /MAIL_SECRET|secret@example\.com/);
  assert.doesNotMatch(JSON.stringify(result.data.emailStatus), /"(?:error|response|accepted)"\s*:/);
});
await test('mailer failure/unknown/malformed results stay safe after commit', async () => {
  const cases = [
    {
      mailResult: {
        success: false,
        outcome: 'failed',
        stage: 'smtp',
        reasonCode: 'SMTP_AUTH_FAILED',
        attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_AUTH_FAILED' }],
        error: 'password=MAIL_SECRET',
      },
      expected: { outcome: 'failed', stage: 'smtp', code: 'SMTP_AUTH_FAILED', attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_AUTH_FAILED' }] },
    },
    {
      mailResult: { success: false, stage: 'smtp', reasonCode: 'SMTP_DELIVERY_UNKNOWN', attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN' }], stack: 'token=MAIL_SECRET' },
      expected: { outcome: 'unknown', stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN', attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN' }] },
    },
    { mailResult: null, expected: { outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] } },
    { mailResult: {}, expected: { outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] } },
    { mailResult: [], expected: { outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attempts: [] } },
  ];
  for (const testCase of cases) {
    const h = harness(testCase);
    const response = await h.post();
    const result = await response.json();
    assert.equal(response.status, 200);
    assert.equal(result.data.emailStatus.sent, false);
    assert.equal(result.data.emailStatus.pending, true);
    assert.equal(result.data.emailStatus.diagnosticsVersion, 1);
    assert.deepEqual({ outcome: result.data.emailStatus.outcome, stage: result.data.emailStatus.stage, code: result.data.emailStatus.code, attempts: result.data.emailStatus.attempts }, testCase.expected);
    assert.doesNotMatch(JSON.stringify(result), /MAIL_SECRET/);
    assert.equal(h.calls.writer, 1);
    assert.equal(h.calls.mail, 1);
  }
});
await test('booking id/billCode conflict retries the allocator, while other unique errors fail closed', async () => {
  const retryable = harness({ writerErrors: [{ code: '23505', constraint: 'Bookings_billCode_key', message: 'duplicate key value violates unique constraint "Bookings_billCode_key"' }, null] });
  const retryResponse = await retryable.post();
  assert.equal(retryResponse.status, 200); assert.equal(retryable.calls.allocator, 2); assert.equal(retryable.calls.writer, 2); assert.equal(retryable.calls.deletes, 0);

  const unknown = harness({ writerErrors: [{ code: '23505', constraint: 'Bookings_accessToken_key', message: 'duplicate key value violates unique constraint "Bookings_accessToken_key"' }] });
  const unknownResponse = await unknown.post();
  assert.equal(unknownResponse.status, 500); assert.equal(unknown.calls.writer, 1); assert.equal(unknown.calls.deletes, 0);
});
await test('same idLegacy with different request identity returns 409', async () => {
  const h = harness({ replay: {} });
  const r = await h.post({ ...body, name: 'Different Guest' }); const result = await r.json();
  assert.equal(r.status, 409); assert.equal(result.code, 'IDEMPOTENCY_KEY_REUSED'); assert.equal(h.calls.rpc, 0); assert.equal(h.calls.mail, 0);
});
await test('same key concurrent new and writerReplay requests converge to one mail dispatch', async () => {
  const h = harness({ writerResults: [
    { success: true, idempotent: false, bookingId: row.id, billCode: row.billCode },
    { success: true, idempotent: true, bookingId: row.id, billCode: row.billCode },
  ] });
  const [first, second] = await Promise.all([h.post(), h.post()]);
  const firstResult = await first.json();
  const secondResult = await second.json();
  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(firstResult.data.bookingId, row.id);
  assert.equal(secondResult.data.bookingId, row.id);
  assert.equal(h.calls.writer, 2);
  assert.equal(h.calls.mail, 1);
});
await test('checkout guest count is stored in notes, while the DB guestCount stays at its default', async () => {
  const h = harness({ savedRow: { guestCount: 1, notes: 'Guests: 3 | Window seat' } });
  const response = await h.post({ ...body, guests: 3, note: 'Window seat' });
  const result = await response.json();
  const bookingPayload = h.calls.writerPayloads[0].p_booking;

  assert.equal(response.status, 200);
  assert.equal(result.data.guests, 3);
  assert.equal(Object.prototype.hasOwnProperty.call(bookingPayload, 'guestCount'), false);
  assert.equal(bookingPayload.notes, 'Guests: 3 | Window seat');
});
console.log(`Actual-route mocked integration: ${passed}/${passed + failed} passed; ${failed} failed; no network/SMTP/production data.`);
if (failed) process.exitCode = 1;
