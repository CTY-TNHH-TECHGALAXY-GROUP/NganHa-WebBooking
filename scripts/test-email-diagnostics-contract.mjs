// Independent diagnostics contract/review test. It uses a mocked route boundary:
// no Vercel credentials, SMTP connection, production booking, or database write.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inspect } from 'node:util';
import vm from 'node:vm';
import ts from 'typescript';
import { createHash } from 'node:crypto';
import * as contract from '../src/lib/booking/contract.ts';

const routeSource = readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
const mailerSource = readFileSync(new URL('../src/lib/mailer.ts', import.meta.url), 'utf8');

const OUTCOMES = new Set(['accepted', 'failed', 'unknown', 'skipped']);
const STAGES = new Set(['preparation', 'configuration', 'smtp', 'unknown']);
const CODES = new Set([
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
]);
const PUBLIC_EMAIL_STATUS_KEYS = new Set([
  'sent',
  'pending',
  'messageId',
  'diagnosticsVersion',
  'outcome',
  'stage',
  'code',
  'attempts',
]);
const ATTEMPT_KEYS = new Set(['attempt', 'stage', 'code']);

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed += 1;
    tests.push(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    tests.push(`FAIL ${name}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function compile(file) {
  return ts.transpileModule(readFileSync(new URL(file, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function assertEmailStatus(status, label, { requireLegacyFields = true } = {}) {
  assert.equal(typeof status, 'object', `${label} must be an object`);
  assert.ok(status && !Array.isArray(status), `${label} must not be an array`);
  for (const key of Object.keys(status)) assert.ok(PUBLIC_EMAIL_STATUS_KEYS.has(key), `${label} leaked public field: ${key}`);

  assert.equal(status.diagnosticsVersion, 1, `${label} must expose diagnosticsVersion=1`);
  assert.ok(OUTCOMES.has(status.outcome), `${label} has invalid outcome: ${status.outcome}`);
  assert.ok(STAGES.has(status.stage), `${label} has invalid stage: ${status.stage}`);
  assert.ok(CODES.has(status.code), `${label} has invalid code: ${status.code}`);
  if (requireLegacyFields) {
    assert.equal(typeof status.sent, 'boolean', `${label}.sent must be boolean`);
    if ('pending' in status) assert.equal(typeof status.pending, 'boolean', `${label}.pending must be boolean`);
  } else {
    assert.equal('sent' in status, false, `${label} diagnostics-only response must not invent sent`);
    assert.equal('pending' in status, false, `${label} diagnostics-only response must not invent pending`);
  }
  assert.ok(Array.isArray(status.attempts), `${label}.attempts must be an array`);
  assert.ok(status.attempts.length <= 2, `${label}.attempts must be bounded at two entries`);

  const seenAttempts = new Set();
  for (const [index, attempt] of status.attempts.entries()) {
    assert.equal(typeof attempt, 'object', `${label}.attempts[${index}] must be an object`);
    for (const key of Object.keys(attempt)) assert.ok(ATTEMPT_KEYS.has(key), `${label}.attempts[${index}] leaked field: ${key}`);
    assert.ok(Number.isInteger(attempt.attempt) && attempt.attempt >= 1 && attempt.attempt <= 2, `${label} has invalid attempt number`);
    assert.ok(!seenAttempts.has(attempt.attempt), `${label} repeats attempt number ${attempt.attempt}`);
    seenAttempts.add(attempt.attempt);
    assert.ok(STAGES.has(attempt.stage), `${label} attempt has invalid stage`);
    assert.ok(CODES.has(attempt.code), `${label} attempt has invalid code`);
  }

  if (status.outcome === 'accepted') {
    assert.equal(status.sent, true, `${label} accepted outcome must set sent=true`);
    assert.equal(status.code, 'SMTP_ACCEPTED', `${label} accepted outcome must use SMTP_ACCEPTED`);
  } else if (requireLegacyFields) {
    assert.equal(status.sent, false, `${label} non-accepted outcome must set sent=false`);
    assert.ok(!('messageId' in status), `${label} must not claim messageId without customer acceptance`);
  }
  if (requireLegacyFields && status.sent) {
    assert.equal(status.outcome, 'accepted', `${label} sent=true must be accepted`);
    if ('messageId' in status) assert.equal(typeof status.messageId, 'string', `${label}.messageId must be a string`);
  }
  if (status.outcome === 'skipped') {
    assert.equal(status.code, 'EMAIL_TEST_SKIPPED', `${label} skipped outcome must use EMAIL_TEST_SKIPPED`);
    assert.deepEqual(status.attempts, [], `${label} skipped outcome must have no SMTP attempts`);
  }
  if (new Set(['preparation', 'configuration']).has(status.stage)) {
    assert.deepEqual(status.attempts, [], `${label} pre-SMTP outcome must have no attempts`);
  }
}

function assertSourceContract() {
  const allSource = `${routeSource}\n${mailerSource}`;
  const missingCodes = [...CODES].filter((code) => !allSource.includes(code));
  assert.deepEqual(missingCodes, [], 'diagnostics enum literals missing from route/mailer source');
  assert.match(routeSource, /diagnosticsVersion\s*[:=]\s*1/, 'route must create version 1 diagnostics');
  assert.match(routeSource, /\battempts\b/, 'route must expose attempts');
  assert.match(mailerSource, /\battempts\b/, 'mailer must track attempts');

  const emailSectionStart = routeSource.indexOf('const receptionEmail');
  assert.ok(emailSectionStart >= 0, 'route email dispatch section is missing');
  const emailSection = routeSource.slice(emailSectionStart);
  assert.doesNotMatch(emailSection, /\.\.\.\s*(?:mail|err|error|primaryErr|fallbackErr)\b/, 'email response must not spread mailer/error objects');
  assert.doesNotMatch(emailSection, /\b(?:err|error|primaryErr|fallbackErr)\??\.(?:message|stack|response)\b/, 'email diagnostics must not expose raw error fields');
  assert.doesNotMatch(emailSection, /\bmail\??\.(?:response|stack|error)\b/, 'email diagnostics must not expose raw mailer fields');

  assert.doesNotMatch(mailerSource, /\.\.\.\s*(?:err|error|primaryErr|fallbackErr)\b/, 'mailer logs must not spread raw errors');
  assert.doesNotMatch(mailerSource, /\b(?:err|error|primaryErr|fallbackErr)\??\.(?:message|stack|response)\b/, 'mailer must not log raw error message/stack/response');
  const sendMailCallCount = (mailerSource.match(/\.sendMail\s*\(/g) || []).length;
  assert.ok(sendMailCallCount <= 2, `mailer has ${sendMailCallCount} sendMail calls; the contract allows at most two attempts`);
}

const catalog = [
  { id: 'QA', nameVN: 'QA', nameEN: 'QA', priceVND: 790000, priceUSD: 32, duration: 60, isActive: true },
  { id: 'NHS0900', nameVN: 'Phòng riêng', nameEN: 'Private Room', priceVND: 105000, priceUSD: 4, duration: 0, isActive: true },
];

process.env.BOOKING_QUOTE_SECRET = 'isolated-diagnostics-contract-only';
const body = {
  name: 'Diagnostics QA Guest',
  phone: '+84901234567',
  email: 'qa@example.invalid',
  date: '2099-09-08',
  time: '14:00',
  branchId: 'ngan-ha-spa',
  branchName: 'ORIA SPA',
  guests: 1,
  lang: 'en',
  selectedServices: [{ id: 'QA', quantity: 1, options: {} }],
};
body.quote = contract.createQuote(
  contract.cartIntentFingerprint(body.selectedServices),
  contract.buildCanonicalPricing(body.selectedServices, catalog, catalog[1]),
);
const parsed = contract.parseBookingRequest(body, new Request('http://test.invalid'));
assert.equal(parsed.ok, true, 'diagnostics harness fixture must be valid');
const row = {
  id: 'WB-DIAGNOSTICS-001',
  billCode: 'WB-DIAGNOSTICS-001',
  customerName: body.name,
  customerEmail: body.email,
  customerPhone: body.phone,
  bookingDate: '2099-09-08',
  timeBooking: '14:00',
  branchName: body.branchName,
  guestCount: body.guests,
  customerLang: body.lang,
  totalAmount: 790000,
  status: 'NEW',
  idempotency_fingerprint: parsed.value.intentFingerprint,
};

function diagnosticsResult(outcome, stage, code, attempts = [], messageId) {
  return {
    success: outcome === 'accepted',
    ...(messageId ? { messageId } : {}),
    outcome,
    stage,
    code,
    attempts,
  };
}

function harness(scenario = {}) {
  const calls = {
    rpc: 0,
    allocator: 0,
    writer: 0,
    mail: 0,
    inserts: [],
    deletes: 0,
    directBookingWrites: 0,
    replayLookups: 0,
    trace: [],
    logs: [],
  };
  const supabase = {
    from(table) {
      const query = { table, filters: [], action: 'select', payload: null };
      const result = () => {
        if (query.action === 'insert') {
          calls.inserts.push(query);
          if (table === 'Customers') return { data: { id: 'CUS-DIAGNOSTICS-001' } };
          if (table === 'Bookings' || table === 'BookingItems') {
            calls.directBookingWrites += 1;
            throw new Error(`DIRECT_${table}_INSERT_FORBIDDEN`);
          }
        }
        if (query.action === 'delete') {
          calls.deletes += 1;
          throw new Error('DIRECT_DELETE_FORBIDDEN');
        }
        if (table === 'SystemConfigs') return { data: null };
        if (table === 'Services') return scenario.catalogError ? { error: scenario.catalogError } : { data: catalog };
        if (table === 'Customers') return { data: null };
        if (table === 'Bookings') {
          const isReplayLookup = query.filters.some(([key]) => key === 'idLegacy');
          if (isReplayLookup) calls.replayLookups += 1;
          if (query.filters.some(([key]) => key === 'id')) {
            calls.trace.push({ stage: 'verification', table: 'Bookings' });
            return { data: scenario.verificationMissing ? null : calls.writer > 0 ? row : null };
          }
          const replayVisible = scenario.replay && (scenario.replayVisibleInitially !== false || calls.writer > 0);
          if (isReplayLookup) return { data: replayVisible ? { ...row, ...scenario.replay } : null };
          return { data: null };
        }
        if (table === 'BookingItems') {
          if (query.filters.some(([key]) => key === 'bookingId')) {
            calls.trace.push({ stage: 'verification', table: 'BookingItems' });
            if (scenario.verificationItemsMissing) return { data: null };
          }
          return { data: scenario.replayItems || [{ bookingId: row.id, serviceId: 'QA', quantity: 1, price: 790000, options: { focus: [], avoid: [], therapist: 'Ngẫu nhiên', note: '' } }] };
        }
        return { data: null };
      };
      const builder = {
        select() { return this; },
        insert(payload) { query.action = 'insert'; query.payload = payload; return this; },
        update(payload) { query.action = 'update'; query.payload = payload; return this; },
        delete() { query.action = 'delete'; return this; },
        eq(key, value) { query.filters.push([key, value]); return this; },
        like(key, value) { query.filters.push([key, value]); return this; },
        in() { return this; },
        order() { return this; },
        limit() { return this; },
        maybeSingle() { return Promise.resolve().then(result); },
        single() { return Promise.resolve().then(result); },
        then(resolve, reject) { return Promise.resolve().then(result).then(resolve, reject); },
      };
      return builder;
    },
    async rpc(name) {
      calls.rpc += 1;
      calls.trace.push({ stage: 'rpc', name });
      if (name === 'webbooking_allocate_booking_number') {
        calls.allocator += 1;
        return scenario.allocatorError ? { error: scenario.allocatorError } : { data: row.id };
      }
      assert.equal(name, 'webbooking_commit_booking');
      calls.writer += 1;
      if (scenario.writerError) return { error: scenario.writerError };
      return { data: scenario.writerResult || { success: true, idempotent: false, bookingId: row.id, billCode: row.billCode } };
    },
  };

  const exports = {};
  const capturedConsole = {
    error(...args) { calls.logs.push(['error', ...args]); },
    warn(...args) { calls.logs.push(['warn', ...args]); },
    info(...args) { calls.logs.push(['info', ...args]); },
    log(...args) { calls.logs.push(['log', ...args]); },
  };
  const sandbox = {
    exports,
    Buffer,
    Request,
    Response,
    setTimeout,
    console: capturedConsole,
    process: { env: { NEXT_PUBLIC_SUPABASE_URL: 'https://test.invalid', SUPABASE_SERVICE_ROLE_KEY: 'mock' } },
    require(name) {
      if (name === 'node:crypto') return { createHash };
      if (name === 'next/server') return { NextResponse: { json: (value, options) => Response.json(value, options) } };
      if (name === '@/lib/supabase-server') return { getSupabaseAdmin: () => supabase };
      if (name === '@/lib/booking/contract') return contract;
      if (name === '@/lib/mailer') return {
        sendBookingConfirmationEmail: async () => {
          calls.mail += 1;
          calls.trace.push({ stage: 'mailer' });
          if (scenario.mailThrows) throw scenario.mailThrows;
          return scenario.mailResult;
        },
      };
      throw new Error(`Unexpected dependency: ${name}`);
    },
  };
  vm.runInNewContext(compile('../src/app/api/bookings/route.ts'), sandbox);

  return {
    calls,
    async post(input = body) {
      const response = await exports.POST(new Request('http://test.invalid/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': 'diagnostics-contract-key' },
        body: JSON.stringify(input),
      }));
      return { response, result: await response.json() };
    },
  };
}

function assertNoSentinels(result, logs) {
  const serialized = `${inspect(result, { depth: 12 })}\n${inspect(logs, { depth: 12 })}`;
  for (const sentinel of [
    'DIAGNOSTICS_PASSWORD_SENTINEL',
    'DIAGNOSTICS_TOKEN_SENTINEL',
    'diagnostics-recipient-sentinel@example.invalid',
    'smtp-host-diagnostics-sentinel.invalid',
    'DIAGNOSTICS_STACK_SENTINEL',
  ]) assert.equal(serialized.includes(sentinel), false, `raw diagnostic sentinel leaked: ${sentinel}`);
}

async function assertNewBookingResult(name, mailResult, expected) {
  const h = harness({ mailResult });
  const { response, result } = await h.post();
  assert.equal(response.status, 200, `${name} must keep committed booking success`);
  assert.equal(result.success, true, `${name} booking response must remain successful`);
  assert.equal(result.idempotent, false, `${name} must be a new booking`);
  assertEmailStatus(result.data?.emailStatus, name);
  assert.equal(result.data.emailStatus.outcome, expected.outcome);
  assert.equal(result.data.emailStatus.stage, expected.stage);
  assert.equal(result.data.emailStatus.code, expected.code);
  if (expected.attemptCount !== undefined) assert.equal(result.data.emailStatus.attempts.length, expected.attemptCount);
  assert.equal(h.calls.mail, 1, `${name} must dispatch exactly once at the route boundary`);
  assert.equal(h.calls.directBookingWrites, 0, `${name} must not directly write bookings`);
  assert.equal(h.calls.deletes, 0, `${name} must not delete bookings`);
  return { h, result };
}

await test('source exposes the closed diagnostics enum and response allowlist', () => {
  assertSourceContract();
});

await test('accepted customer delivery is the only sent=true path', async () => {
  const { result } = await assertNewBookingResult(
    'accepted',
    diagnosticsResult('accepted', 'smtp', 'SMTP_ACCEPTED', [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }], '<accepted@mock.invalid>'),
    { outcome: 'accepted', stage: 'smtp', code: 'SMTP_ACCEPTED', attemptCount: 1 },
  );
  assert.equal(result.data.emailStatus.sent, true);
  assert.equal(result.data.emailStatus.messageId, '<accepted@mock.invalid>');
});

await test('classified SMTP failures remain booking-success responses', async () => {
  for (const [name, code] of [
    ['auth rejection', 'SMTP_AUTH_FAILED'],
    ['DNS/connect failure', 'SMTP_CONNECTION_FAILED'],
    ['TLS failure', 'SMTP_TLS_FAILED'],
    ['recipient rejection', 'SMTP_RECIPIENT_REJECTED'],
  ]) {
    await assertNewBookingResult(name, diagnosticsResult('failed', 'smtp', code, [{ attempt: 1, stage: 'smtp', code }]), {
      outcome: 'failed', stage: 'smtp', code, attemptCount: 1,
    });
  }
});

await test('timeout or post-DATA uncertainty is unknown, never a false failed claim', async () => {
  await assertNewBookingResult(
    'SMTP timeout',
    diagnosticsResult('unknown', 'smtp', 'SMTP_TIMEOUT', [{ attempt: 1, stage: 'smtp', code: 'SMTP_TIMEOUT' }]),
    { outcome: 'unknown', stage: 'smtp', code: 'SMTP_TIMEOUT', attemptCount: 1 },
  );
  await assertNewBookingResult(
    'SMTP delivery unknown',
    diagnosticsResult('unknown', 'smtp', 'SMTP_DELIVERY_UNKNOWN', [{ attempt: 1, stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN' }]),
    { outcome: 'unknown', stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN', attemptCount: 1 },
  );
});

await test('preparation/configuration failures have zero SMTP attempts', async () => {
  await assertNewBookingResult(
    'template preparation failure',
    diagnosticsResult('failed', 'preparation', 'EMAIL_PREPARATION_FAILED'),
    { outcome: 'failed', stage: 'preparation', code: 'EMAIL_PREPARATION_FAILED', attemptCount: 0 },
  );
  await assertNewBookingResult(
    'missing transporter',
    diagnosticsResult('failed', 'configuration', 'EMAIL_CONFIGURATION_UNAVAILABLE'),
    { outcome: 'failed', stage: 'configuration', code: 'EMAIL_CONFIGURATION_UNAVAILABLE', attemptCount: 0 },
  );
});

await test('primary failure followed by fallback acceptance preserves two bounded attempts', async () => {
  const { result } = await assertNewBookingResult(
    'fallback accepted',
    diagnosticsResult('accepted', 'smtp', 'SMTP_ACCEPTED', [
      { attempt: 1, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
      { attempt: 2, stage: 'smtp', code: 'SMTP_ACCEPTED' },
    ], '<fallback@mock.invalid>'),
    { outcome: 'accepted', stage: 'smtp', code: 'SMTP_ACCEPTED', attemptCount: 2 },
  );
  assert.equal(result.data.emailStatus.sent, true);
  assert.deepEqual(result.data.emailStatus.attempts.map((item) => item.code), ['SMTP_CONNECTION_FAILED', 'SMTP_ACCEPTED']);
});

await test('synthetic/test skip cannot manufacture sent or SMTP evidence', async () => {
  const { result } = await assertNewBookingResult(
    'synthetic recipient',
    diagnosticsResult('skipped', 'preparation', 'EMAIL_TEST_SKIPPED'),
    { outcome: 'skipped', stage: 'preparation', code: 'EMAIL_TEST_SKIPPED', attemptCount: 0 },
  );
  assert.equal(result.data.emailStatus.sent, false);
  assert.equal('messageId' in result.data.emailStatus, false);
});

await test('mailer throw maps to safe unknown diagnostics without raw exception data', async () => {
  const error = new Error('DIAGNOSTICS_PASSWORD_SENTINEL smtp-host-diagnostics-sentinel.invalid');
  error.stack = 'DIAGNOSTICS_STACK_SENTINEL';
  error.response = 'diagnostics-recipient-sentinel@example.invalid';
  error.token = 'DIAGNOSTICS_TOKEN_SENTINEL';
  const h = harness({ mailThrows: error });
  const { response, result } = await h.post();
  assert.equal(response.status, 200);
  assertEmailStatus(result.data?.emailStatus, 'mailer throw');
  assert.equal(result.data.emailStatus.outcome, 'unknown');
  assert.equal(result.data.emailStatus.code, 'EMAIL_SEND_FAILED');
  assert.deepEqual(result.data.emailStatus.attempts, []);
  assertNoSentinels(result, h.calls.logs);
});

await test('malformed/messageId-only result fails closed as unknown', async () => {
  const { h, result } = await assertNewBookingResult(
    'messageId-only result',
    { messageId: '<message-only@mock.invalid>' },
    { outcome: 'unknown', stage: 'unknown', code: 'EMAIL_RESULT_UNKNOWN', attemptCount: 0 },
  );
  assert.equal(result.data.emailStatus.sent, false);
  assert.equal('messageId' in result.data.emailStatus, false);
  assertNoSentinels(result, h.calls.logs);
});

await test('inconsistent success/outcome/code claims cannot become sent=true', async () => {
  const h = harness({
    mailResult: {
      success: true,
      messageId: '<inconsistent@mock.invalid>',
      outcome: 'accepted',
      stage: 'smtp',
      code: 'SMTP_CONNECTION_FAILED',
      attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' }],
    },
  });
  const { response, result } = await h.post();
  assert.equal(response.status, 200);
  assertEmailStatus(result.data?.emailStatus, 'inconsistent result');
  assert.equal(result.data.emailStatus.sent, false);
  assert.equal(result.data.emailStatus.outcome, 'unknown');
  assert.equal(result.data.emailStatus.code, 'EMAIL_RESULT_UNKNOWN');
  assertNoSentinels(result, h.calls.logs);
});

await test('raw provider/PII fields in a mailer result never cross the response boundary', async () => {
  const rawResult = {
    success: true,
    messageId: '<provider-only@mock.invalid>',
    outcome: 'unknown',
    stage: 'smtp',
    code: 'SMTP_DELIVERY_UNKNOWN',
    attempts: [{ attempt: 1, stage: 'smtp', code: 'SMTP_DELIVERY_UNKNOWN' }],
    error: {
      message: 'DIAGNOSTICS_PASSWORD_SENTINEL',
      stack: 'DIAGNOSTICS_STACK_SENTINEL',
      response: 'smtp-host-diagnostics-sentinel.invalid',
      accepted: ['diagnostics-recipient-sentinel@example.invalid'],
      rejected: ['diagnostics-recipient-sentinel@example.invalid'],
    },
    token: 'DIAGNOSTICS_TOKEN_SENTINEL',
  };
  const h = harness({ mailResult: rawResult });
  const { response, result } = await h.post();
  assert.equal(response.status, 200);
  assertEmailStatus(result.data?.emailStatus, 'raw result');
  assert.equal(result.data.emailStatus.outcome, 'unknown');
  assert.equal(result.data.emailStatus.code, 'SMTP_DELIVERY_UNKNOWN');
  assert.equal('messageId' in result.data.emailStatus, false);
  assertNoSentinels(result, h.calls.logs);
});

await test('attempts greater than two are rejected or reduced to a safe unknown result', async () => {
  const h = harness({
    mailResult: diagnosticsResult('failed', 'smtp', 'SMTP_CONNECTION_FAILED', [
      { attempt: 1, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
      { attempt: 2, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
      { attempt: 3, stage: 'smtp', code: 'SMTP_CONNECTION_FAILED' },
    ]),
  });
  const { response, result } = await h.post();
  assert.equal(response.status, 200);
  assertEmailStatus(result.data?.emailStatus, 'unbounded attempts');
  assert.ok(result.data.emailStatus.attempts.length <= 2);
});

await test('replay never sends again and reports that email was not re-attempted', async () => {
  const h = harness({
    replay: {},
    mailResult: diagnosticsResult('accepted', 'smtp', 'SMTP_ACCEPTED', [{ attempt: 1, stage: 'smtp', code: 'SMTP_ACCEPTED' }], '<must-not-send@mock.invalid>'),
  });
  const { response, result } = await h.post();
  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.equal(result.idempotent, true);
  assertEmailStatus(result.data?.emailStatus, 'replay', { requireLegacyFields: false });
  assert.equal(result.data.emailStatus.outcome, 'unknown');
  assert.equal(result.data.emailStatus.code, 'EMAIL_REPLAY_NOT_ATTEMPTED');
  assert.equal(h.calls.mail, 0);
  assert.deepEqual(result.data.emailStatus.attempts, []);
  assert.equal(h.calls.directBookingWrites, 0);
});

for (const line of tests) console.log(line);
console.log(`Email diagnostics contract: ${passed}/${passed + failed} passed; ${failed} failed; no network/SMTP/production data.`);
if (failed) process.exitCode = 1;
