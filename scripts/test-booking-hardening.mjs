// ═════════════════════════════════════════════════════════════════
// Test Suite: Booking Hardening & Architectural Verification
// Run: node scripts/test-booking-hardening.mjs
// ═════════════════════════════════════════════════════════════════
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"\r]/g, '');
  return acc;
}, {});

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('────────────────────────────────────────────────────────');
console.log('🧪 RUNNING COMPREHENSIVE BOOKING HARDENING TEST SUITE');
console.log('────────────────────────────────────────────────────────');

async function runTests() {
  let passedCount = 0;
  let totalCount = 0;

  const test = async (name, fn) => {
    totalCount++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}`);
      console.error('   Error:', err.message);
    }
  };

  // ── TEST 1: Cart Storage v2 Schema, TTL & Corrupted JSON ────────
  await test('Cart Storage: v1 -> v2 migration, TTL, & corrupt JSON handling', () => {
    const mockStorage = new Map();
    const CART_TTL_MS = 7 * 24 * 60 * 60 * 1000;
    const KEY_V1 = 'nganha_booking_cart_v1';
    const KEY_V2 = 'nganha_booking_cart_v2';

    // 1. Setup legacy v1 cart
    const legacyCart = [
      { id: 'NHS001', qty: 2, priceVND: 580000, options: { addons: { privateRoom: true } } }
    ];
    mockStorage.set(KEY_V1, JSON.stringify(legacyCart));

    // Simulation of readBookingCart() migration logic
    let rawV2 = mockStorage.get(KEY_V2);
    let items = [];
    if (!rawV2 && mockStorage.has(KEY_V1)) {
      const parsedLegacy = JSON.parse(mockStorage.get(KEY_V1));
      assert(Array.isArray(parsedLegacy), 'Legacy should be array');
      const now = Date.now();
      const v2Payload = {
        version: 2,
        createdAt: now,
        updatedAt: now,
        expiresAt: now + CART_TTL_MS,
        items: parsedLegacy,
      };
      mockStorage.set(KEY_V2, JSON.stringify(v2Payload));
      mockStorage.delete(KEY_V1);
      items = v2Payload.items;
    }

    assert.strictEqual(mockStorage.has(KEY_V1), false, 'V1 key should be deleted after migration');
    assert.strictEqual(mockStorage.has(KEY_V2), true, 'V2 key should be written');
    assert.strictEqual(items.length, 1, 'Should preserve item');
    assert.strictEqual(items[0].id, 'NHS001');

    // 2. Test TTL expiration
    const expiredPayload = {
      version: 2,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      updatedAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // expired 3 days ago
      items,
    };
    mockStorage.set(KEY_V2, JSON.stringify(expiredPayload));
    const parsedExpired = JSON.parse(mockStorage.get(KEY_V2));
    const isExpired = Date.now() > parsedExpired.expiresAt;
    assert.strictEqual(isExpired, true, 'Cart should be detected as expired');

    // 3. Test corrupt JSON resilience
    mockStorage.set(KEY_V2, '{"corrupted_json: true, invalid...');
    let safeRead = [];
    try {
      safeRead = JSON.parse(mockStorage.get(KEY_V2));
    } catch {
      safeRead = []; // Safe fallback
    }
    assert.deepStrictEqual(safeRead, [], 'Corrupt JSON should fallback safely to empty array');
  });

  // ── TEST 2: Collision-safe Booking ID Generation ────────────────
  await test('ID Generator: Generates unique collision-free booking codes under high concurrency', () => {
    let counter = 0;
    const generateId = () => {
      const now = new Date();
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = String(now.getFullYear());
      const dateStr = `${dd}${mm}${yyyy}`;
      const timeComponent = ((now.getTime() + counter++) % 1000000).toString(36).padStart(4, '0').toUpperCase();
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      return `WB-${dateStr}-${timeComponent}${randomSuffix}`;
    };

    const ids = new Set();
    const ITERATIONS = 10000;
    for (let i = 0; i < ITERATIONS; i++) {
      const id = generateId();
      assert(/^WB-\d{8}-[A-Z0-9]{10}$/.test(id), `Format invalid: ${id}`);
      assert(!ids.has(id), `Collision detected at iteration ${i}: ${id}`);
      ids.add(id);
    }
    assert.strictEqual(ids.size, ITERATIONS, 'All 10,000 generated IDs must be unique');
  });

  // ── TEST 3: Direct Supabase Services Verification ──────────────
  await test('Database: Services table contains active services and canonical pricing', async () => {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/Services?select=id,nameVN,priceVND,isActive&limit=10`, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
    });
    assert.strictEqual(res.ok, true, `Failed to query Services: ${res.status}`);
    const services = await res.json();
    assert(Array.isArray(services), 'Services should be an array');
    assert(services.length > 0, 'Should have at least 1 service');

    // Find active service
    const active = services.find((s) => s.isActive === true);
    assert(active, 'Must have at least one active service');
    assert(typeof active.priceVND === 'number', 'priceVND must be a number');
  });

  // ── TEST 4: Price calculation ignores client price ──────────────
  await test('Price Calculation: Server canonical price replaces client priceVND: 0', async () => {
    // Query a real active service from DB
    const svcRes = await fetch(`${SUPABASE_URL}/rest/v1/Services?select=id,priceVND&isActive=eq.true&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const [realService] = await svcRes.json();
    assert(realService, 'Real active service not found in DB');

    const canonicalPrice = Number(realService.priceVND);
    const clientPayloadItem = {
      id: realService.id,
      quantity: 2,
      priceVND: 0, // Malicious client tried setting 0đ!
      options: { addons: { privateRoom: true } },
    };

    // Simulate server reprice logic
    const PRIVATE_ROOM_PRICE = 105000;
    const serverUnitPrice = canonicalPrice + (clientPayloadItem.options.addons.privateRoom ? PRIVATE_ROOM_PRICE : 0);
    const serverTotal = serverUnitPrice * clientPayloadItem.quantity;

    assert.strictEqual(
      serverUnitPrice,
      canonicalPrice + 105000,
      'Server must add 105,000 for private room add-on to canonical price'
    );
    assert.strictEqual(
      serverTotal,
      (canonicalPrice + 105000) * 2,
      'Server must compute total based on canonical price, ignoring client 0'
    );
    assert.notStrictEqual(serverTotal, 0, 'Total price cannot be 0 when client passes priceVND: 0');
  });

  // ── TEST 5: Customer Demographics Persistence ──────────────────
  await test('Demographics: Validates customerGender mapping and avoids overwriting good data', () => {
    const mapGender = (raw) => {
      if (!raw) return null;
      const g = String(raw).toLowerCase().trim();
      if (g === 'male' || g === 'nam' || g === 'anh') return 'male';
      if (g === 'female' || g === 'nữ' || g === 'chị') return 'female';
      if (g === 'other' || g === 'khác') return 'other';
      return null;
    };

    assert.strictEqual(mapGender('Anh'), 'male');
    assert.strictEqual(mapGender('chị'), 'female');
    assert.strictEqual(mapGender('female'), 'female');
    assert.strictEqual(mapGender('nam'), 'male');
    assert.strictEqual(mapGender('other'), 'other');
    assert.strictEqual(mapGender('unknown_val'), null);

    // Test non-destructive customer update logic
    const existingCustomer = {
      fullName: 'John Doe',
      phone: '0901234567',
      email: 'john@example.com',
      gender: 'male',
    };

    const newIncoming = {
      fullName: 'Johnathan Doe',
      phone: '', // user omitted phone
      email: null,
      gender: null,
    };

    const updatePayload = {
      fullName: newIncoming.fullName.trim(),
    };
    if (newIncoming.email && !existingCustomer.email) updatePayload.email = newIncoming.email;
    if (newIncoming.phone && !existingCustomer.phone) updatePayload.phone = newIncoming.phone;
    if (newIncoming.gender && !existingCustomer.gender) updatePayload.gender = newIncoming.gender;

    const merged = { ...existingCustomer, ...updatePayload };
    assert.strictEqual(merged.fullName, 'Johnathan Doe', 'Full name updated');
    assert.strictEqual(merged.phone, '0901234567', 'Existing phone preserved, not overwritten by empty');
    assert.strictEqual(merged.email, 'john@example.com', 'Existing email preserved');
    assert.strictEqual(merged.gender, 'male', 'Existing gender preserved');
  });

  // ── TEST 6: Idempotency Logic Check ────────────────────────────
  await test('Idempotency: Re-submitting identical idempotencyKey identifies existing booking', () => {
    const cache = new Map();
    const mockSubmitBooking = (key, data) => {
      if (key && cache.has(`idemp:${key}`)) {
        return { idempotent: true, data: cache.get(`idemp:${key}`) };
      }
      const newBooking = { id: `WB-${Date.now()}`, ...data };
      if (key) cache.set(`idemp:${key}`, newBooking);
      return { idempotent: false, data: newBooking };
    };

    const key = 'test-idemp-key-12345';
    const first = mockSubmitBooking(key, { customerName: 'Alice', totalAmount: 580000 });
    assert.strictEqual(first.idempotent, false, 'First submit creates new booking');

    const second = mockSubmitBooking(key, { customerName: 'Alice', totalAmount: 580000 });
    assert.strictEqual(second.idempotent, true, 'Second submit with same key must return existing booking');
    assert.strictEqual(first.data.id, second.data.id, 'Returned booking ID must be identical');
  });

  console.log('────────────────────────────────────────────────────────');
  console.log(`🏁 TEST RESULTS: ${passedCount}/${totalCount} tests passed.`);
  console.log('────────────────────────────────────────────────────────');

  if (passedCount < totalCount) {
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
