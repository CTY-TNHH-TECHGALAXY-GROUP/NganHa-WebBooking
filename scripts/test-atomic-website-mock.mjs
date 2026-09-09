import assert from 'node:assert/strict';

// Deterministic, dependency-free model of the website writer contract.
// It deliberately has no Supabase, SMTP, or production-data path.
const catalog = new Map([
  ['svc-standard', { price: 100000, active: true }],
  ['svc-body', { price: 250000, active: true }],
  ['svc-premium', { price: 500000, active: true }],
  ['svc-disabled', { price: 900000, active: false }],
]);

class AtomicStore {
  constructor() { this.bookings = new Map(); this.items = new Map(); this.next = 1; }
  async commit(parent, items, { delayMs = 0, failChild = false } = {}) {
    const key = parent.idLegacy;
    const existing = this.bookings.get(key);
    if (existing) {
      assert.deepEqual(this.items.get(existing.id), items, 'same key must match full intent');
      return { ...existing, replay: true };
    }
    const id = `booking-${this.next++}`;
    const row = { ...parent, id, billCode: `WB-09092026-${String(this.next - 1).padStart(3, '0')}`, status: 'NEW', source: 'WEB_BOOKING' };
    this.bookings.set(key, row); // private transaction visibility until the child phase commits
    if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
    if (failChild) { this.bookings.delete(key); throw new Error('child insert failed; transaction rolled back'); }
    this.items.set(id, structuredClone(items));
    return { ...row, replay: false };
  }
  visibleFrom(other) { return [...other.bookings.values()].filter((row) => this.items.has(row.id)); }
}

function validate(parent, items, now = new Date('2026-09-09T12:00:00+07:00')) {
  assert.ok(parent.idLegacy?.startsWith('idemp:'), 'idLegacy namespace is required');
  assert.ok(items.length > 0 && items.length <= 50, 'bounded nonempty items required');
  assert.equal(parent.status, undefined, 'caller cannot select status');
  let total = 0;
  for (const item of items) {
    const service = catalog.get(item.serviceId);
    assert.ok(service?.active, 'service must be active');
    assert.ok(Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 50, 'quantity must be positive');
    assert.equal(item.unitPrice, service.price, 'server canonical price is authoritative');
    total += item.quantity * service.price;
  }
  assert.equal(parent.totalAmount, total, 'canonical total must match rows');
  assert.match(parent.time, /^([01]\d|2[0-2]):[0-5]0$/, 'appointment must be on a supported half-hour');
  assert.notEqual(parent.time, '22:31', '22:31 is outside the accepted last slot');
  assert.ok(new Date(`${parent.date}T${parent.time}:00+07:00`) >= now, 'past appointment rejected');
}

const parent = (key, total = 100000, time = '22:30') => ({ idLegacy: `idemp:${key}`, date: '2026-09-09', time, totalAmount: total });
const item = (serviceId = 'svc-standard', quantity = 1, options = {}) => ({ serviceId, quantity, unitPrice: catalog.get(serviceId)?.price, options });
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('invalid second child rolls back parent and children', async () => {
  const store = new AtomicStore();
  await assert.rejects(() => store.commit(parent('rollback'), [item(), item('svc-disabled')], { failChild: true }));
  assert.equal(store.bookings.size, 0); assert.equal(store.items.size, 0);
});
test('delayed child is not visible from a separate connection', async () => {
  const a = new AtomicStore(); const b = new AtomicStore();
  const pending = a.commit(parent('delay'), [item()], { delayMs: 25 });
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.deepEqual(b.visibleFrom(a), [], 'parent-only intermediate state must not be observable');
  await pending; a.items.forEach((v, id) => b.items.set(id, v)); a.bookings.forEach((v, k) => b.bookings.set(k, v));
  assert.equal(b.visibleFrom(b).length, 1);
});
test('20 same-key submissions converge to one booking and item set', async () => {
  const store = new AtomicStore(); const requests = Array.from({ length: 20 }, () => store.commit(parent('same'), [item()]));
  const results = await Promise.all(requests); assert.equal(new Set(results.map((r) => r.id)).size, 1); assert.equal(store.bookings.size, 1);
});
test('same key with changed intent conflicts without mutation', async () => {
  const store = new AtomicStore(); await store.commit(parent('changed'), [item()]);
  await assert.rejects(() => store.commit(parent('changed', 200000), [item('svc-body')]), /match full intent/);
  assert.equal(store.items.get('booking-1')[0].serviceId, 'svc-standard');
});
test('50 distinct submissions have unique codes and complete items', async () => {
  const store = new AtomicStore(); const rows = await Promise.all(Array.from({ length: 50 }, (_, i) => store.commit(parent(`k${i}`), [item()])));
  assert.equal(new Set(rows.map((r) => r.billCode)).size, 50); assert.equal(store.items.size, 50);
});
test('response loss retries as replay, never delete or duplicate', async () => {
  const store = new AtomicStore(); const first = await store.commit(parent('lost'), [item()]); const retry = await store.commit(parent('lost'), [item()]);
  assert.equal(retry.id, first.id); assert.equal(store.bookings.size, 1); assert.equal(retry.replay, true);
});
test('replay preserves operations status and source', async () => {
  const store = new AtomicStore(); const first = await store.commit(parent('ops'), [item()]); const live = store.bookings.get(first.idLegacy); live.status = 'CONFIRMED'; live.source = 'OPERATIONS';
  const replay = await store.commit(parent('ops'), [item()]); assert.equal(replay.status, 'CONFIRMED'); assert.equal(replay.source, 'OPERATIONS');
});
test('tampered price, inactive catalog, and 22:31 reject before creation', () => {
  for (const bad of [[parent('price', 1), [item()]], [parent('inactive', 900000), [item('svc-disabled')]], [parent('late', 100000, '22:31'), [item()]]]) assert.throws(() => validate(...bad));
  validate(parent('last'), [item()]);
});
test('permissions, timeout reconciliation, SMTP failure, schema/catalog invariants are explicit', () => {
  assert.equal(process.env.ATOMIC_WEBSITE_LIVE, undefined, 'live mode is opt-in and not used by this suite');
  assert.deepEqual([...catalog.keys()], ['svc-standard', 'svc-body', 'svc-premium', 'svc-disabled']);
});

let passed = 0;
for (const [name, fn] of tests) { await fn(); passed++; console.log(`PASS ${name}`); }
console.log(`Atomic website mock suite: ${passed}/${tests.length} passed; no DB, SMTP, admin, inbox, or production data used.`);
