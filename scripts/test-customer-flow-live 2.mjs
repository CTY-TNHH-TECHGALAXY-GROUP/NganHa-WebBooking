import nextEnv from '@next/env';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';

nextEnv.loadEnvConfig(process.cwd());
const base = 'https://oria-spa.vercel.app';
const recipient = 'nghik22@gmail.com';
const results = [];
const output = 'plans/customer-flow-test-results';
await mkdir(output, { recursive: true });
async function request(path, body) {
  const response = await fetch(base + path, {
    signal: AbortSignal.timeout(20000),
    ...(body === undefined ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const text = await response.text();
  let data; try { data = JSON.parse(text); } catch { data = null; }
  return { status: response.status, data, text };
}
async function test(id, name, fn) {
  try { const actual = await fn(); results.push({ id, name, status: 'PASS', actual }); }
  catch (e) { results.push({ id, name, status: 'FAIL', actual: String(e.message).slice(0, 600) }); }
  console.log(id, results.at(-1).status, name);
}
let catalog, service, variants;
await test('CF01', 'Catalog: active services and original DB prices', async () => {
  const r = await request('/api/services'); assert.equal(r.status, 200); assert.ok(Array.isArray(r.data) && r.data.length);
  catalog = r.data;
  service = catalog.find(s => s.timeValue > 0 && s.priceVND > 0 && s.id.startsWith('NHS'));
  assert.ok(service);
  assert.ok(catalog.every(s => s.ACTIVE === true));
  variants = catalog.filter(s => s.names.en === service.names.en && s.timeValue > 0);
  return { count: catalog.length, serviceId: service.id, priceVND: service.priceVND, priceUSD: service.priceUSD };
});
const line = (s = service, qty = 1, options = {}) => ({ id: s.id, quantity: qty, options, priceVND: s.priceVND, priceUSD: s.priceUSD });
await test('CF02', 'Single service: signed quote matches catalog VND/USD', async () => {
  const r = await request('/api/bookings/reprice', { items: [line()] });
  assert.equal(r.status, 200); assert.equal(r.data.valid, true); assert.ok(r.data.quote);
  assert.equal(r.data.totalAmountVND, service.priceVND); assert.equal(r.data.totalAmountUSD, service.priceUSD);
  return { status: r.status, totalVND: r.data.totalAmountVND, signedQuote: true };
});
await test('CF03', 'Quantity 1 to 2: total doubles without changing unit price', async () => {
  const r = await request('/api/bookings/reprice', { items: [line(service, 2)] });
  assert.equal(r.status, 200); assert.equal(r.data.totalAmountVND, service.priceVND * 2);
  assert.equal(r.data.items[0].priceVND, service.priceVND);
  return { quantity: r.data.items[0].quantity, totalVND: r.data.totalAmountVND };
});
await test('CF04', 'Multiple durations: selected lines remain separate', async () => {
  if (variants.length < 2) {
    const group = catalog.find(s => catalog.filter(v => v.names.en === s.names.en && v.timeValue > 0).length > 1);
    variants = catalog.filter(s => s.names.en === group?.names.en && s.timeValue > 0);
  }
  assert.ok(variants.length >= 2);
  const chosen = variants.slice(0, 2);
  const r = await request('/api/bookings/reprice', { items: chosen.map(s => line(s)) });
  assert.equal(r.status, 200); assert.equal(r.data.items.length, 2);
  assert.equal(r.data.totalAmountVND, chosen.reduce((sum, s) => sum + s.priceVND, 0));
  return { services: r.data.items.map(s => ({ id: s.id, duration: s.duration })) };
});
await test('CF05', 'Private room add-on: correct DB add-on charge', async () => {
  const addon = catalog.find(s => s.id === 'NHS0900'); assert.ok(addon);
  const r = await request('/api/bookings/reprice', { items: [line(service, 1, { addons: { privateRoom: true } })] });
  assert.equal(r.status, 200); assert.equal(r.data.totalAmountVND, service.priceVND + addon.priceVND);
  return { addonId: addon.id, totalVND: r.data.totalAmountVND };
});
await test('CF06', 'Five language checkout pages load', async () => {
  const pages = [];
  for (const lang of ['vi', 'en', 'jp', 'kr', 'cn']) {
    const r = await request(`/${lang}/new-user/standard/checkout`); assert.equal(r.status, 200);
    assert.ok(r.text.includes('</html>')); pages.push({ lang, status: r.status });
  }
  return { pages, limitation: 'HTTP rendering only; not proof of complete translations or browser interactions.' };
});
await test('CF07', 'Reject missing name, invalid phone and invalid email', async () => {
  const r = await request('/api/bookings', { name: '', phone: 'invalid', email: 'invalid', date: '2099-09-08', time: '14:00', selectedServices: [line()] });
  assert.equal(r.status, 400); assert.notEqual(r.data?.success, true);
  return { status: r.status, code: r.data?.code, fields: r.data?.fieldErrors?.map(e => e.field) };
});
await test('CF08', 'Reject out-of-hours and past booking slots', async () => {
  const checks = [];
  for (const [date, time] of [['2099-09-08', '08:30'], ['2099-09-08', '22:31'], ['2099-09-08', '23:00'], ['2000-01-01', '14:00']]) {
    const r = await request('/api/bookings', { name: 'QA time validation', phone: '+84901234567', email: recipient, date, time, selectedServices: [line()] });
    assert.equal(r.status, 400, `Invalid slot ${date} ${time} returned ${r.status}; response: ${JSON.stringify(r.data)}`); checks.push({ date, time, status: r.status, code: r.data?.code });
  }
  return checks;
});
await test('CF09', 'Reject invalid quantity and recover forged cart prices', async () => {
  for (const quantity of [0, -1, 1.5, 21]) {
    const r = await request('/api/bookings/reprice', { items: [line(service, quantity)] }); assert.equal(r.status, 400, `Quantity ${quantity} returned ${r.status}`);
  }
  const r = await request('/api/bookings/reprice', { items: [{ ...line(), priceVND: 1, priceUSD: 1 }] });
  assert.equal(r.status, 200); assert.equal(r.data.totalAmountVND, service.priceVND); assert.equal(r.data.hasPriceChanged, true);
  return { rejectedQuantities: [0, -1, 1.5, 21], recoveredVND: r.data.totalAmountVND };
});
// Inspect schema metadata before any successful booking write; do not run migrations.
await test('CF10', 'Booking persistence and confirmation email readiness', async () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  assert.ok(url && key, 'Missing local DB configuration for read-only readiness check');
  const r = await fetch(`${url}/rest/v1/`, { headers: { apikey: key, Authorization: `Bearer ${key}`, Accept: 'application/openapi+json' }, signal: AbortSignal.timeout(20000) });
  assert.equal(r.status, 200);
  const schema = await r.json();
  const properties = schema.definitions?.Bookings?.properties || {};
  const atomicRpc = Boolean(schema.paths?.['/rpc/create_booking_atomic']);
  const hasKey = Boolean(properties.idempotency_key);
  const hasFingerprint = Boolean(properties.idempotency_fingerprint);
  const actual = { atomicRpc, hasKey, hasFingerprint, bookingCreated: false, bookingEmailSent: false, limitation: 'Local configured DB metadata; production env identity not independently verified.' };
  results.push({ id: 'CF10', name: 'Booking persistence and confirmation email readiness', status: 'BLOCKED', actual: { ...actual, reason: atomicRpc && hasKey && hasFingerprint ? 'Requires an end-to-end booking with a verified test phone and operations handoff.' : 'Required atomic booking RPC or idempotency columns absent. Successful booking/email cannot be verified.' } });
  return actual;
});
// CF10 records a blocked end-to-end scenario, not a successful metadata-only test.
const duplicate = results.findIndex(r => r.id === 'CF10' && r.status === 'PASS');
if (duplicate >= 0) results.splice(duplicate, 1);
const report = { testedAt: new Date().toISOString(), target: base, recipient, mode: 'Live HTTP checks and read-only DB metadata; not browser E2E', results };
const markdown = '# Customer flow: 10 test scenarios\n\n' + `Target: ${base}\n\nTested: ${report.testedAt}\n\n` + results.map(r => `## ${r.id}: ${r.name}\n\n${r.status}\n\n\`\`\`json\n${JSON.stringify(r.actual, null, 2)}\n\`\`\`\n`).join('\n') + '\nNo catalog prices/schema changed. No successful booking was created. No booking confirmation email was generated. This email is the test report, not a booking confirmation. Browser interactions, inbox receipt and internal operations handoff still need acceptance.\n';
await writeFile(`${output}/results.json`, JSON.stringify(report, null, 2));
await writeFile(`${output}/REPORT.md`, markdown);
if (process.argv.includes('--send-report')) {
  assert.ok(process.env.SMTP_USER && process.env.SMTP_PASS, 'SMTP credentials unavailable');
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST || 'smtp.zoho.com', port, secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }, connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 20000 });
  try {
    const info = await transport.sendMail({ from: { name: process.env.SMTP_FROM_NAME || 'Oria Spa QA', address: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER }, to: recipient,
      subject: '[QA] Oria Spa - 10 customer flow test results', text: markdown,
      attachments: [{ filename: 'CUSTOMER_FLOW_REPORT.md', content: markdown }] });
    const receipt = { accepted: info.accepted, rejected: info.rejected, messageId: info.messageId };
    await writeFile(`${output}/email-receipt.json`, JSON.stringify(receipt, null, 2));
    console.log('REPORT_EMAIL', JSON.stringify(receipt));
  } finally { transport.close(); }
}
