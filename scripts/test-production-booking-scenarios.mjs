import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

const baseUrl = process.env.TEST_PRODUCTION_URL || 'https://oria-spa.vercel.app';
const recipient = process.env.TEST_CUSTOMER_EMAIL || 'nghik22@gmail.com';
const testPrefix = 'TEST';
const date = process.env.TEST_BOOKING_DATE || '2026-09-30';
const startIndex = Number(process.env.TEST_START_INDEX || 0);
const testCount = Number(process.env.TEST_COUNT || 999);

const scenarios = [
  {
    name: '01 NHS0008 full options and free note', lang: 'vi', time: '09:00',
    selectedServices: [{ id: 'NHS0008', quantity: 1, options: {
      strength: 'medium', therapist: 'female', bodyParts: { focus: ['FOOT'], avoid: ['THIGH'] },
      notes: { tag0: false, tag1: true, content: 'TEST dị ứng tinh dầu, ưu tiên chân' }, addons: { privateRoom: false },
    } }],
    verify(data) {
      assert.equal(data.items[0].quantity, 1); assert.equal(data.items[0].options.therapist, 'Nữ');
      assert.equal(data.items[0].options.strength, 'NORMAL'); assert.match(data.focusAreaNote || '', /FOOT/);
    },
  },
  {
    name: '02 NHS1000 quantity 2 plus private room', lang: 'en', time: '10:30',
    selectedServices: [{ id: 'NHS1000', quantity: 2, options: {
      strength: 'medium', notes: { tag0: false, tag1: false, content: 'TEST quantity two with private room' }, addons: { privateRoom: true },
    } }],
    verify(data) {
      assert.equal(data.items[0].quantity, 2); assert.equal(data.items.length, 2); assert.equal(data.items[1].options.isAddon, true);
      assert.equal(data.items[1].options.therapist, undefined); assert.equal(data.items[1].options.strength, undefined); assert.equal(data.totalAmount, 1790000);
    },
  },
  {
    name: '03 NHS1016 gender/focus disabled with pregnancy note', lang: 'cn', time: '13:00',
    selectedServices: [{ id: 'NHS1016', quantity: 1, options: {
      strength: 'strong', notes: { tag0: true, tag1: false, content: 'TEST pregnancy note' },
    } }],
    verify(data) {
      assert.equal(data.items[0].quantity, 1); assert.equal(data.items[0].options.therapist, undefined); assert.equal(data.items[0].options.focus, undefined);
    },
  },
  {
    name: '04 multi-service notes and independent options', lang: 'jp', time: '15:30',
    selectedServices: [
      { id: 'NHS1013', quantity: 1, options: { strength: 'light', therapist: 'male', bodyParts: { focus: ['HEAD'], avoid: ['BACK'] }, notes: { tag0: false, tag1: false, content: 'TEST head focus' } } },
      { id: 'NHS1009', quantity: 1, options: { strength: 'medium', therapist: 'random', notes: { tag0: false, tag1: true, content: 'TEST second service allergy' } } },
    ],
    verify(data) {
      assert.equal(data.items.length, 2); assert.equal(data.items[0].quantity, 1); assert.equal(data.items[1].quantity, 1); assert.match(data.focusAreaNote || '', /HEAD/);
    },
  },
];

const noteTextFromData = (data) => [
  data.notes,
  data.focusAreaNote,
  ...(data.items || []).map((item) => item?.options?.note),
].filter((value) => typeof value === 'string').join(' | ');

async function jsonRequest(path, init) {
  const response = await fetch(`${baseUrl}${path}`, { ...init, signal: AbortSignal.timeout(60000) });
  const body = await response.json();
  return { response, body };
}

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const selectedScenarios = scenarios.slice(startIndex, startIndex + testCount);
let passed = 0;
for (const [offset, scenario] of selectedScenarios.entries()) {
  const index = startIndex + offset;
  const items = scenario.selectedServices.map((item, itemIndex) => ({ ...item, cartId: `TEST-${index + 1}-${itemIndex + 1}` }));
  const repriced = await jsonRequest('/api/bookings/reprice', {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-codex-test': 'TEST-CUSTOM-RULES' }, body: JSON.stringify({ items }),
  });
  assert.equal(repriced.response.status, 200, `${scenario.name}: reprice failed ${JSON.stringify(repriced.body)}`);
  assert.equal(repriced.body.valid, true);
  const idempotencyKey = `${testPrefix}-CUSTOM-${Date.now()}-${index + 1}-${randomUUID()}`;
  const booking = {
    name: `${testPrefix} Custom Rules ${index + 1}`,
    phone: '+84901234567', email: recipient, date, time: scenario.time, branchId: 'ngan-ha-spa', branchName: 'ORIA SPA', guests: 1,
    lang: scenario.lang, staffGender: 'any', selectedServices: items, quote: repriced.body.quote, idempotencyKey,
  };
  let committed;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    committed = await jsonRequest('/api/bookings', {
      method: 'POST', headers: { 'content-type': 'application/json', 'idempotency-key': idempotencyKey, 'x-codex-test': 'TEST-CUSTOM-RULES' }, body: JSON.stringify(booking),
    });
    if (committed.response.status !== 409 || committed.body.code !== 'BOOKING_IN_PROGRESS') break;
    await sleep(250 * (attempt + 1));
  }
  assert.equal(committed.response.status, 200, `${scenario.name}: booking failed ${JSON.stringify(committed.body)}`);
  assert.equal(committed.body.success, true); assert.equal(committed.body.data.status, 'NEW'); assert.match(committed.body.data.bookingId, /^WB-/);
  scenario.verify(committed.body.data);
  assert.match(noteTextFromData(committed.body.data), /TEST/);
  const email = committed.body.data.emailStatus || {};
  console.log(JSON.stringify({
    pass: true, scenario: scenario.name, bookingId: committed.body.data.bookingId, totalAmount: committed.body.data.totalAmount,
    status: committed.body.data.status, email: { sent: email.sent, outcome: email.outcome, stage: email.stage, code: email.code, attempts: email.attempts?.length, messageIdPresent: Boolean(email.messageId) },
  }));
  passed += 1;
}
console.log(`Production booking scenarios: ${passed}/${selectedScenarios.length} passed; TEST prefix; customer mailbox ${recipient}; real booking commits performed.`);
