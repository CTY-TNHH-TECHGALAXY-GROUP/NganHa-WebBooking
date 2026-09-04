// ═════════════════════════════════════════════════════════════════
// Script: Test Concurrent Booking Requests (Promise.all)
// Run: npx tsx scripts/test-concurrent-bookings.mjs
// ═════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import nodeCrypto from 'crypto';
import assert from 'assert';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"\r]/g, '');
  return acc;
}, {});

Object.entries(env).forEach(([k, v]) => {
  process.env[k] = v;
});

import { POST as bookingHandler } from '../src/app/api/bookings/route.ts';

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function runConcurrentTest() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('⚡ SIMULATING 2 CONCURRENT BOOKING CHECKOUTS AT THE EXACT SAME TIME');
  console.log('══════════════════════════════════════════════════════════════\n');

  // Đơn A: nghik2244@gmail.com
  const payloadA = {
    idempotencyKey: `concurrent_A_${Date.now()}_${nodeCrypto.randomBytes(3).toString('hex')}`,
    name: 'Anh Lê Hoàng Minh',
    phone: '+84964090277',
    email: 'nghik2244@gmail.com',
    customerGender: 'male',
    note: 'Concurrent order A - Test Race Condition',
    date: '2026-09-08',
    time: '10:00',
    branchName: 'ORIA SPA',
    guests: 1,
    staffGender: 'male',
    lang: 'vi',
    selectedServices: [
      {
        variantId: 'NHS0046', // Không dầu (630,000₫)
        quantity: 1,
        options: {
          therapist: 'male',
          strength: 'strong',
          bodyParts: { focus: ['BACK', 'SHOULDER'], avoid: [] },
          addons: { privateRoom: true }, // +105,000₫ = 735,000₫
        },
      },
    ],
    paymentMethod: 'cash_vnd',
  };

  // Đơn B: concarne1996@gmail.com
  const payloadB = {
    idempotencyKey: `concurrent_B_${Date.now()}_${nodeCrypto.randomBytes(3).toString('hex')}`,
    name: 'Chị Mai Lan Phương',
    phone: '+84964090277',
    email: 'concarne1996@gmail.com',
    customerGender: 'female',
    note: 'Concurrent order B - Test Race Condition',
    date: '2026-09-08',
    time: '10:30',
    branchName: 'ORIA SPA',
    guests: 1,
    staffGender: 'female',
    lang: 'vi',
    selectedServices: [
      {
        variantId: 'NHS1002', // Ráy tai - Gội đầu - Cổ vai gáy (790,000₫)
        quantity: 1,
        options: {
          therapist: 'female',
          strength: 'soft',
          bodyParts: { focus: ['HEAD', 'NECK'], avoid: [] },
          addons: { privateRoom: false },
        },
      },
    ],
    paymentMethod: 'cash_vnd',
  };

  const reqA = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadA),
  });

  const reqB = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payloadB),
  });

  console.log(`⏱️ Bắt đầu gửi 2 request song song lúc: ${new Date().toISOString()}`);

  // Gửi song song 2 request cùng 1 micro-giây
  const [resA, resB] = await Promise.all([
    bookingHandler(reqA),
    bookingHandler(reqB),
  ]);

  const [jsonA, jsonB] = await Promise.all([
    resA.json(),
    resB.json(),
  ]);

  console.log(`⏱️ Cả 2 request đã hoàn tất lúc: ${new Date().toISOString()}\n`);

  assert.strictEqual(resA.status, 200, `Đơn A thất bại: ${JSON.stringify(jsonA)}`);
  assert.strictEqual(resB.status, 200, `Đơn B thất bại: ${JSON.stringify(jsonB)}`);
  assert.strictEqual(jsonA.success, true);
  assert.strictEqual(jsonB.success, true);

  const bookingIdA = jsonA.data.bookingId;
  const bookingIdB = jsonB.data.bookingId;

  console.log('📊 KẾT QUẢ CHECKOUT ĐỒNG THỜI:');
  console.log(`   - Đơn A: Mã=${bookingIdA} | Khách=${jsonA.data.customerName} | Email=nghik2244@gmail.com | Tổng=${jsonA.data.totalAmount.toLocaleString('vi-VN')}₫`);
  console.log(`   - Đơn B: Mã=${bookingIdB} | Khách=${jsonB.data.customerName} | Email=concarne1996@gmail.com | Tổng=${jsonB.data.totalAmount.toLocaleString('vi-VN')}₫\n`);

  // KIỂM TRA MÃ ĐƠN CÓ BỊ TRÙNG LẶP HAY KHÔNG
  assert.notStrictEqual(bookingIdA, bookingIdB, 'LỖI NGHIÊM TRỌNG: Hai đơn đồng thời bị trùng mã đơn!');
  console.log('✅ XÁC NHẬN: Hai mã đơn hoàn toàn khác biệt, không xảy ra xung đột (No Collision / No Race Condition)!');

  // Kiểm tra trong Supabase
  const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=in.(${bookingIdA},${bookingIdB})&select=id,billCode,customerName,customerGender,totalAmount`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const dbRecords = await checkRes.json();
  assert.strictEqual(dbRecords.length, 2, 'Cả hai đơn phải tồn tại độc lập trong bảng Bookings của Supabase');

  console.log('✅ XÁC NHẬN: Cả 2 đơn đều tồn tại toàn vẹn trong Supabase DB.');
  dbRecords.forEach((rec, idx) => {
    console.log(`   ${idx + 1}. [DB Verified] ${rec.id} -> Khách: ${rec.customerName} | Giới tính: ${rec.customerGender} | Tổng: ${rec.totalAmount.toLocaleString('vi-VN')}₫`);
  });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🎉 TEST CONCURRENT 2 ĐƠN CÙNG LÚC THÀNH CÔNG RỰC RỠ 100%!');
  console.log('══════════════════════════════════════════════════════════════');
}

runConcurrentTest().catch((err) => {
  console.error('Fatal concurrent test error:', err);
  process.exit(1);
});
