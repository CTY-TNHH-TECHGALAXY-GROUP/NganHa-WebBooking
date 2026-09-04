// ═════════════════════════════════════════════════════════════════
// Direct Route Handler Integration Test
// Run: node scripts/test-api-endpoint.mjs
// ═════════════════════════════════════════════════════════════════
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import nodeCrypto from 'crypto';

// Import route handlers
import { POST as repriceHandler } from '../src/app/api/bookings/reprice/route.ts';
import { POST as bookingHandler } from '../src/app/api/bookings/route.ts';

// Load env
const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"\r]/g, '');
  return acc;
}, {});

process.env.NEXT_PUBLIC_SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
process.env.SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('────────────────────────────────────────────────────────');
console.log('🧪 RUNNING ROUTE HANDLER INTEGRATION TESTS');
console.log('────────────────────────────────────────────────────────');

async function testRoute() {
  // 1. Test Reprice Route
  console.log('Testing /api/bookings/reprice...');
  const repriceReq = new Request('http://localhost:3000/api/bookings/reprice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [
        {
          id: 'NHS1002', // Ráy tai - Gội đầu - Cổ vai gáy
          qty: 1,
          priceVND: 0, // client tampered
          options: { addons: { privateRoom: true } },
        },
      ],
    }),
  });

  const repriceRes = await repriceHandler(repriceReq);
  assert.strictEqual(repriceRes.status, 200, 'Reprice status should be 200');
  const repriceJson = await repriceRes.json();

  assert.strictEqual(repriceJson.valid, true, 'Reprice valid should be true');
  assert.strictEqual(repriceJson.hasPriceChanged, true, 'hasPriceChanged should be true because client sent 0');
  assert.strictEqual(repriceJson.items[0].basePriceVND, 790000, 'Base price should be 790000');
  assert.strictEqual(repriceJson.items[0].priceVND, 790000 + 105000, 'Canonical price with private room should be 895000');
  assert.strictEqual(repriceJson.totalAmountVND, 895000, 'Total should be 895000');
  console.log('✅ /api/bookings/reprice correctly enforced canonical price: 895,000₫ (ignored 0đ)');

  // 2. Test Invalid / Inactive Service Rejection
  console.log('Testing /api/bookings with non-existent service ID...');
  const fakeSvcReq = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test Attacker',
      phone: '0909999999',
      selectedServices: [
        { variantId: 'NON_EXISTENT_SERVICE_9999', quantity: 1 },
      ],
    }),
  });

  const fakeSvcRes = await bookingHandler(fakeSvcReq);
  assert.strictEqual(fakeSvcRes.status, 409, 'Should return 409 for invalid service');
  const fakeJson = await fakeSvcRes.json();
  assert.strictEqual(fakeJson.code, 'CART_REQUIRES_REVIEW', 'Should return CART_REQUIRES_REVIEW code');
  console.log('✅ /api/bookings correctly rejected non-existent service with 409 CART_REQUIRES_REVIEW');

  // 3. Test Full Booking Submission with Price Manipulation Attempt & Demographics
  console.log('Testing /api/bookings full submission with zero-price attempt...');
  const testIdempKey = `test_idemp_${Date.now()}_${nodeCrypto.randomBytes(4).toString('hex')}`;
  const testBookingReq = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: testIdempKey,
      name: 'Test Verification User',
      phone: '0988776655',
      email: 'test_hardening@oria.test',
      customerGender: 'female',
      date: '2026-09-10',
      time: '14:00',
      branchName: 'ORIA SPA',
      guests: 1,
      selectedServices: [
        {
          variantId: 'NHS1002',
          quantity: 1,
          priceVND: 0, // Malicious 0đ attempt!
          options: {
            strength: 'MEDIUM',
            bodyParts: { focus: ['HEAD', 'NECK'], avoid: ['ARM'] },
            addons: { privateRoom: true },
          },
        },
      ],
    }),
  });

  const bookingRes = await bookingHandler(testBookingReq);
  assert.strictEqual(bookingRes.status, 200, `Booking creation should succeed: ${bookingRes.status}`);
  const bookingJson = await bookingRes.json();
  assert.strictEqual(bookingJson.success, true, 'Booking should be successful');
  const createdBookingId = bookingJson.data.bookingId;
  assert(createdBookingId.startsWith('WB-'), 'Booking ID must start with WB-');
  assert.strictEqual(bookingJson.data.totalAmount, 895000, 'Server must enforce canonical 895,000₫ total!');
  console.log(`✅ /api/bookings successfully created booking ${createdBookingId} with server-enforced total: 895,000₫`);

  // 4. Verify Database Records (Bookings & BookingItems & Demographics)
  console.log('Verifying Supabase record persistence...');
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=eq.${createdBookingId}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const [dbBooking] = await checkRes.json();
  assert(dbBooking, 'Created booking must exist in Supabase');
  assert.strictEqual(dbBooking.totalAmount, 895000, 'DB totalAmount must be 895000');
  assert.strictEqual(dbBooking.customerGender, 'female', 'DB customerGender must be female');
  console.log('✅ Supabase Bookings verification: customerGender="female", totalAmount=895,000₫');

  // Verify BookingItems in DB
  const itemsRes = await fetch(`${SUPABASE_URL}/rest/v1/BookingItems?bookingId=eq.${createdBookingId}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const dbItems = await itemsRes.json();
  assert.strictEqual(dbItems.length, 2, 'Should have 2 items (parent service + private room add-on)');
  const parentItem = dbItems.find((i) => i.serviceId === 'NHS1002');
  const addonItem = dbItems.find((i) => i.serviceId === 'NHS0900');
  assert(parentItem, 'Parent item NHS1002 must exist');
  assert.strictEqual(parentItem.price, 790000, 'Parent item price must be 790,000₫');
  assert(addonItem, 'Add-on item NHS0900 must exist');
  assert.strictEqual(addonItem.price, 105000, 'Private room add-on price must be 105,000₫');
  console.log('✅ Supabase BookingItems verification: 2 records atomically created without ghost records');

  // 5. Verify Idempotency on Duplicate Request
  console.log('Testing Idempotency replay with same key...');
  const dupReq = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      idempotencyKey: testIdempKey,
      name: 'Test Verification User',
      phone: '0988776655',
      selectedServices: [{ variantId: 'NHS1002', quantity: 1 }],
    }),
  });
  const dupRes = await bookingHandler(dupReq);
  const dupJson = await dupRes.json();
  assert.strictEqual(dupJson.success, true, 'Duplicate request should succeed');
  assert.strictEqual(dupJson.idempotent, true, 'Response must indicate idempotent hit');
  assert.strictEqual(dupJson.data.bookingId, createdBookingId, 'Must return the original booking ID');
  console.log(`✅ Idempotency verified: duplicate submission safely returned original ID ${createdBookingId}`);

  // 6. Cleanup Test Booking
  await fetch(`${SUPABASE_URL}/rest/v1/BookingItems?bookingId=eq.${createdBookingId}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=eq.${createdBookingId}`, {
    method: 'DELETE',
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  console.log('🧹 Cleaned up test booking records from Supabase.');

  console.log('────────────────────────────────────────────────────────');
  console.log('🏁 ALL ROUTE HANDLER TESTS COMPLETED SUCCESSFULLY!');
  console.log('────────────────────────────────────────────────────────');
}

testRoute().catch((err) => {
  console.error('Route test error:', err);
  process.exit(1);
});
