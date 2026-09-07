// ═════════════════════════════════════════════════════════════════
// Test Suite: Phase P0-C Atomic Booking & Idempotency Hardening
// Run: node scripts/test-p0c-atomic-booking.mjs
// ═════════════════════════════════════════════════════════════════
import assert from 'assert';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.existsSync(envPath)
  ? fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
      const [k, ...v] = line.split('=');
      if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"\r]/g, '');
      return acc;
    }, {})
  : {};

Object.entries(env).forEach(([k, v]) => {
  if (!process.env[k]) process.env[k] = v;
});

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Import route handlers directly
import { POST as repriceHandler } from '../src/app/api/bookings/reprice/route.ts';
import { POST as bookingHandler } from '../src/app/api/bookings/route.ts';

console.log('══════════════════════════════════════════════════════════════');
console.log('🧪 RUNNING PHASE P0-C ATOMIC BOOKING & IDEMPOTENCY TEST SUITE');
console.log('══════════════════════════════════════════════════════════════\n');

const createdTestBookingIds = new Set();

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
      throw err;
    }
  };

  try {
    // ────────────────────────────────────────────────────────────
    // TEST 1: Rejection of Invalid / Zero / Negative Quantities
    // ────────────────────────────────────────────────────────────
    await test('Input Validation: Reject zero or negative quantities with 400', async () => {
      // Zero quantity
      const reqZero = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Zero Qty',
          phone: '0901234567',
          selectedServices: [{ variantId: 'NHS1002', quantity: 0 }],
        }),
      });
      const resZero = await bookingHandler(reqZero);
      assert.strictEqual(resZero.status, 400, 'Zero quantity must return HTTP 400');
      const jsonZero = await resZero.json();
      assert.strictEqual(jsonZero.success, false);

      // Negative quantity
      const reqNeg = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Negative Qty',
          phone: '0901234567',
          selectedServices: [{ variantId: 'NHS1002', quantity: -3 }],
        }),
      });
      const resNeg = await bookingHandler(reqNeg);
      assert.strictEqual(resNeg.status, 400, 'Negative quantity must return HTTP 400');
      const jsonNeg = await resNeg.json();
      assert.strictEqual(jsonNeg.success, false);
    });

    // ────────────────────────────────────────────────────────────
    // TEST 2: Rejection of Non-existent Services (409 CART_REQUIRES_REVIEW)
    // ────────────────────────────────────────────────────────────
    await test('Catalog Validation: Unknown services trigger 409 CART_REQUIRES_REVIEW', async () => {
      const fakeReq = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test Unknown Svc',
          phone: '0901234567',
          selectedServices: [{ variantId: 'NON_EXISTENT_SVC_XYZ_9999', quantity: 1 }],
        }),
      });
      const fakeRes = await bookingHandler(fakeReq);
      assert.strictEqual(fakeRes.status, 409, 'Unknown service must return HTTP 409');
      const fakeJson = await fakeRes.json();
      assert.strictEqual(fakeJson.code, 'CART_REQUIRES_REVIEW');
      assert.strictEqual(fakeJson.invalidServices[0].reason, 'SERVICE_NOT_FOUND');
    });

    // ────────────────────────────────────────────────────────────
    // TEST 3: Server-Authoritative Pricing (Reprice & Bookings)
    // ────────────────────────────────────────────────────────────
    await test('Authoritative Pricing: Server overrides client price tampering', async () => {
      const repriceReq = new Request('http://localhost:3000/api/bookings/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            {
              id: 'NHS1002',
              quantity: 1,
              priceVND: 0, // Client attempted 0 VND
              options: { addons: { privateRoom: true } },
            },
          ],
        }),
      });
      const repriceRes = await repriceHandler(repriceReq);
      assert.strictEqual(repriceRes.status, 200);
      const repriceJson = await repriceRes.json();
      assert.strictEqual(repriceJson.valid, true);
      assert.strictEqual(repriceJson.hasPriceChanged, true);
      assert.strictEqual(repriceJson.items[0].basePriceVND, 790000);
      assert.strictEqual(repriceJson.items[0].priceVND, 790000 + 105000);
      assert.strictEqual(repriceJson.totalAmountVND, 895000);
    });

    // ────────────────────────────────────────────────────────────
    // TEST 4: 20 Concurrent Bookings — Collision-Free Unique IDs
    // ────────────────────────────────────────────────────────────
    await test('Concurrency: 20 parallel submissions generate 20 unique booking numbers', async () => {
      const CONCURRENCY_COUNT = 20;
      const requests = [];

      for (let i = 0; i < CONCURRENCY_COUNT; i++) {
        const idempKey = `p0c_concurrent_${Date.now()}_${i}_${crypto.randomBytes(4).toString('hex')}`;
        const req = new Request('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            idempotencyKey: idempKey,
            name: `Concurrent User ${i + 1}`,
            phone: `+84988000${String(i).padStart(3, '0')}`,
            date: '2026-09-12',
            time: '14:00',
            branchName: 'ORIA SPA',
            guests: 1,
            selectedServices: [
              {
                variantId: 'NHS1002',
                quantity: 1,
                priceVND: 0, // Should be ignored
              },
            ],
          }),
        });
        requests.push(bookingHandler(req));
      }

      const responses = await Promise.all(requests);
      const results = await Promise.all(responses.map((r) => r.json()));

      const bookingIds = new Set();
      for (let i = 0; i < CONCURRENCY_COUNT; i++) {
        const json = results[i];
        assert.strictEqual(responses[i].status, 200, `Request ${i} failed: ${JSON.stringify(json)}`);
        assert.strictEqual(json.success, true);
        const bId = json.data?.bookingId;
        assert(bId, `Booking ${i} must have a valid bookingId`);
        assert(!bookingIds.has(bId), `COLLISION DETECTED: Booking ID "${bId}" was duplicated!`);
        bookingIds.add(bId);
        createdTestBookingIds.add(bId);
      }

      assert.strictEqual(bookingIds.size, CONCURRENCY_COUNT, 'All 20 concurrent booking IDs must be unique');
    });

    // ────────────────────────────────────────────────────────────
    // TEST 5: Concurrent Idempotency Replay
    // ────────────────────────────────────────────────────────────
    await test('Idempotency: 5 concurrent requests with the SAME key return identical booking', async () => {
      const sharedKey = `p0c_shared_idemp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
      const NUM_CLONES = 5;
      const cloneRequests = [];

      for (let i = 0; i < NUM_CLONES; i++) {
        const req = new Request('http://localhost:3000/api/bookings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': sharedKey,
          },
          body: JSON.stringify({
            idempotencyKey: sharedKey,
            name: 'Idempotent Customer',
            phone: '+84977112233',
            date: '2026-09-15',
            time: '11:00',
            selectedServices: [{ variantId: 'NHS1002', quantity: 1 }],
          }),
        });
        cloneRequests.push(bookingHandler(req));
      }

      const cloneResponses = await Promise.all(cloneRequests);
      const cloneResults = await Promise.all(cloneResponses.map((r) => r.json()));

      const firstId = cloneResults[0]?.data?.bookingId;
      assert(firstId, 'First request must have bookingId');
      createdTestBookingIds.add(firstId);

      for (let i = 1; i < NUM_CLONES; i++) {
        assert.strictEqual(cloneResponses[i].status, 200);
        assert.strictEqual(cloneResults[i].success, true);
        assert.strictEqual(
          cloneResults[i].data?.bookingId,
          firstId,
          `Clone ${i} returned different bookingId than clone 0`
        );
      }

      // Verify in DB that only 1 record exists with this idempotency key
      if (SUPABASE_URL && SUPABASE_KEY) {
        let dbRows = [];
        const checkLegacy = await fetch(
          `${SUPABASE_URL}/rest/v1/Bookings?idLegacy=eq.idemp:${sharedKey}&select=id`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        if (checkLegacy.ok) {
          dbRows = await checkLegacy.json();
        }
        if (!dbRows.length) {
          const checkKey = await fetch(
            `${SUPABASE_URL}/rest/v1/Bookings?idempotency_key=eq.${sharedKey}&select=id`,
            { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
          );
          if (checkKey.ok) {
            dbRows = await checkKey.json();
          }
        }
        assert.strictEqual(dbRows.length, 1, 'Database must have exactly 1 record for this idempotency key');
      }
    });

    // ────────────────────────────────────────────────────────────
    // TEST 6: Multi-Service & Line-Item Integrity
    // ────────────────────────────────────────────────────────────
    await test('Integrity: Multi-service checkout preserves all child items & addons', async () => {
      const multiKey = `p0c_multi_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const multiReq = new Request('http://localhost:3000/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey: multiKey,
          name: 'Multi-Service VIP',
          phone: '+84933221100',
          email: 'multi_vip@oria.test',
          customerGender: 'male',
          date: '2026-09-18',
          time: '16:00',
          branchName: 'ORIA SPA',
          guests: 2,
          lang: 'vi',
          selectedServices: [
            {
              variantId: 'NHS1002', // 790,000₫
              quantity: 2,
              options: { addons: { privateRoom: true } }, // +105,000₫ each
            },
            {
              variantId: 'NHS0046', // 630,000₫
              quantity: 1,
            },
          ],
        }),
      });

      const multiRes = await bookingHandler(multiReq);
      assert.strictEqual(multiRes.status, 200);
      const multiJson = await multiRes.json();
      assert.strictEqual(multiJson.success, true);
      const bookingId = multiJson.data.bookingId;
      createdTestBookingIds.add(bookingId);

      // Expected total: (790000 + 105000) * 2 + 630000 = 1790000 + 630000 = 2,420,000₫
      const expectedTotal = (790000 + 105000) * 2 + 630000;
      assert.strictEqual(multiJson.data.totalAmount, expectedTotal);

      // Verify in DB that BookingItems exist and match
      if (SUPABASE_URL && SUPABASE_KEY) {
        const itemsRes = await fetch(
          `${SUPABASE_URL}/rest/v1/BookingItems?bookingId=eq.${bookingId}&select=serviceId,quantity,price`,
          { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
        );
        if (itemsRes.ok) {
          const items = await itemsRes.json();
          assert(items.length >= 2, 'Must have at least 2 booking items');
          const hasMain1 = items.some((i) => i.serviceId === 'NHS1002' && i.quantity === 2);
          const hasPrivateRoom = items.some((i) => i.serviceId === 'NHS0900');
          const hasMain2 = items.some((i) => i.serviceId === 'NHS0046' && i.quantity === 1);
          assert(hasMain1, 'NHS1002 item with qty 2 must exist');
          assert(hasPrivateRoom, 'NHS0900 private room add-on item must exist');
          assert(hasMain2, 'NHS0046 item with qty 1 must exist');
        }
      }
    });

    console.log('\n────────────────────────────────────────────────────────');
    console.log(`🏁 ALL TESTS PASSED: ${passedCount}/${totalCount}`);
    console.log('────────────────────────────────────────────────────────\n');
  } finally {
    // Clean up created test bookings
    if (SUPABASE_URL && SUPABASE_KEY && createdTestBookingIds.size > 0) {
      console.log(`🧹 Cleaning up ${createdTestBookingIds.size} test booking(s) from Supabase...`);
      const idList = Array.from(createdTestBookingIds).join(',');
      try {
        await fetch(`${SUPABASE_URL}/rest/v1/BookingItems?bookingId=in.(${idList})`, {
          method: 'DELETE',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=in.(${idList})`, {
          method: 'DELETE',
          headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
        });
        console.log('✅ Test bookings cleanup complete.');
      } catch (cleanErr) {
        console.warn('⚠️ Cleanup warning:', cleanErr.message);
      }
    }
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
