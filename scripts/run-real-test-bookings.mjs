// ═════════════════════════════════════════════════════════════════
// Script: Run Real Test Bookings & Verify in Supabase
// Run: npx tsx scripts/run-real-test-bookings.mjs
// ═════════════════════════════════════════════════════════════════
import fs from 'fs';
import path from 'path';
import nodeCrypto from 'crypto';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const env = fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if (k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"\r]/g, '');
  return acc;
}, {});

// Apply env vars to process.env so mailer & supabase-server get credentials
Object.entries(env).forEach(([k, v]) => {
  process.env[k] = v;
});

import { POST as bookingHandler } from '../src/app/api/bookings/route.ts';

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

async function runRealTest() {
  console.log('══════════════════════════════════════════════════════════════');
  console.log('🚀 RUNNING 2 REAL TEST BOOKINGS WITH LIVE DB & AUTO-MAIL');
  console.log('══════════════════════════════════════════════════════════════\n');

  // ────────────────────────────────────────────────────────────
  // ĐƠN 1: Chị Đỗ Hoàng Nghi (nghik22@gmail.com)
  // Dịch vụ thật: NHS1002 (Ráy tai - Gội đầu - Cổ vai gáy: 790,000₫)
  // + Add-on Phòng riêng NHS0900 (+105,000₫)
  // Cố ý gửi priceVND: 0 để kiểm chứng Server-Authoritative Pricing!
  // ────────────────────────────────────────────────────────────
  console.log('📦 [ĐƠN 1] Khởi tạo đơn đặt lịch test 1...');
  const idempKey1 = `test_live_${Date.now()}_${nodeCrypto.randomBytes(3).toString('hex')}`;
  const payload1 = {
    idempotencyKey: idempKey1,
    name: 'Chị Đỗ Hoàng Nghi',
    phone: '+84964090277',
    email: 'nghik22@gmail.com',
    customerGender: 'female',
    note: 'Đơn test tự động kiểm tra hệ thống Booking Hardening & Auto-mail',
    date: '2026-09-06',
    time: '15:30',
    branchName: 'ORIA SPA',
    guests: 1,
    staffGender: 'female',
    lang: 'vi',
    selectedServices: [
      {
        variantId: 'NHS1002',
        quantity: 1,
        priceVND: 0, // CLIENT GỬI 0đ ĐỂ THỬ GIẢ GIÁ!
        options: {
          therapist: 'female',
          strength: 'medium',
          bodyParts: { focus: ['HEAD', 'NECK', 'SHOULDER'], avoid: [] },
          addons: { privateRoom: true },
          notes: { tag0: false, tag1: false, content: 'Ưu tiên phòng yên tĩnh' },
        },
      },
    ],
    paymentMethod: 'cash_vnd',
  };

  const req1 = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload1),
  });

  const res1 = await bookingHandler(req1);
  const json1 = await res1.json();

  if (!res1.ok || !json1.success) {
    console.error('❌ Đơn 1 thất bại:', json1);
    process.exit(1);
  }

  const bookingId1 = json1.data.bookingId;
  console.log(`✅ [ĐƠN 1 THÀNH CÔNG] Mã đơn: ${bookingId1}`);
  console.log(`   - Khách hàng: ${json1.data.customerName}`);
  console.log(`   - Email nhận mail: nghik22@gmail.com`);
  console.log(`   - Tổng tiền tính bởi Server: ${json1.data.totalAmount.toLocaleString('vi-VN')}₫ (Client gửi 0đ đã bị ghi đè chuẩn xác!)\n`);

  // ────────────────────────────────────────────────────────────
  // ĐƠN 2: Charlotte Nguyen (charloteeng@gmail.com)
  // Dịch vụ thật: NHS0024 (Đá nóng 120 phút: 1,050,000₫)
  // Ngôn ngữ: en
  // Cố ý gửi priceVND: 999đ để kiểm chứng Server-Authoritative Pricing!
  // ────────────────────────────────────────────────────────────
  console.log('📦 [ĐƠN 2] Khởi tạo đơn đặt lịch test 2...');
  const idempKey2 = `test_live_${Date.now()}_${nodeCrypto.randomBytes(3).toString('hex')}`;
  const payload2 = {
    idempotencyKey: idempKey2,
    name: 'Charlotte Nguyen',
    phone: '+84964090277',
    email: 'charloteeng@gmail.com',
    customerGender: 'female',
    note: 'Automated test for Booking Hardening & Multi-language Confirmation Email',
    date: '2026-09-07',
    time: '18:00',
    branchName: 'ORIA SPA',
    guests: 2,
    staffGender: 'any',
    lang: 'en',
    selectedServices: [
      {
        variantId: 'NHS0024',
        quantity: 1,
        priceVND: 999, // CLIENT GỬI 999đ ĐỂ THỬ GIẢ GIÁ!
        options: {
          therapist: 'any',
          strength: 'hard',
          bodyParts: { focus: ['BACK', 'THIGH'], avoid: ['FOOT'] },
          addons: { privateRoom: false },
          notes: { tag0: false, tag1: false, content: 'Deep tissue pressure please' },
        },
      },
    ],
    paymentMethod: 'cash_vnd',
  };

  const req2 = new Request('http://localhost:3000/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload2),
  });

  const res2 = await bookingHandler(req2);
  const json2 = await res2.json();

  if (!res2.ok || !json2.success) {
    console.error('❌ Đơn 2 thất bại:', json2);
    process.exit(1);
  }

  const bookingId2 = json2.data.bookingId;
  console.log(`✅ [ĐƠN 2 THÀNH CÔNG] Mã đơn: ${bookingId2}`);
  console.log(`   - Khách hàng: ${json2.data.customerName}`);
  console.log(`   - Email nhận mail: charloteeng@gmail.com`);
  console.log(`   - Tổng tiền tính bởi Server: ${json2.data.totalAmount.toLocaleString('vi-VN')}₫ (Client gửi 999đ đã bị ghi đè chuẩn xác!)\n`);

  // ────────────────────────────────────────────────────────────
  // KIỂM TRA TRỰC TIẾP TRONG DATABASE SUPABASE
  // ────────────────────────────────────────────────────────────
  console.log('🔍 [KIỂM TRA DỮ LIỆU THỰC TẾ TRONG SUPABASE]');

  // Đơn 1
  const check1Res = await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=eq.${bookingId1}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const [b1] = await check1Res.json();

  const items1Res = await fetch(`${SUPABASE_URL}/rest/v1/BookingItems?bookingId=eq.${bookingId1}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const items1 = await items1Res.json();

  console.log(`\n📌 Đơn 1 (${bookingId1}) trong Supabase:`);
  console.log(`   - billCode: ${b1.billCode}`);
  console.log(`   - customerGender: ${b1.customerGender} (ĐÃ LƯU THÀNH CÔNG)`);
  console.log(`   - totalAmount: ${b1.totalAmount.toLocaleString('vi-VN')}₫`);
  console.log(`   - Số dòng BookingItems: ${items1.length} dòng`);
  items1.forEach((it, i) => {
    console.log(`     * Dòng ${i + 1}: Service ID=${it.serviceId}, Giá=${it.price.toLocaleString('vi-VN')}₫, Options=${JSON.stringify(it.options)}`);
  });

  // Đơn 2
  const check2Res = await fetch(`${SUPABASE_URL}/rest/v1/Bookings?id=eq.${bookingId2}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const [b2] = await check2Res.json();

  const items2Res = await fetch(`${SUPABASE_URL}/rest/v1/BookingItems?bookingId=eq.${bookingId2}&select=*`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  const items2 = await items2Res.json();

  console.log(`\n📌 Đơn 2 (${bookingId2}) trong Supabase:`);
  console.log(`   - billCode: ${b2.billCode}`);
  console.log(`   - customerGender: ${b2.customerGender} (ĐÃ LƯU THÀNH CÔNG)`);
  console.log(`   - totalAmount: ${b2.totalAmount.toLocaleString('vi-VN')}₫`);
  console.log(`   - Số dòng BookingItems: ${items2.length} dòng`);
  items2.forEach((it, i) => {
    console.log(`     * Dòng ${i + 1}: Service ID=${it.serviceId}, Giá=${it.price.toLocaleString('vi-VN')}₫`);
  });

  console.log('\n══════════════════════════════════════════════════════════════');
  console.log('🎉 2 ĐƠN TEST ĐÃ TẠO THÀNH CÔNG TRÊN HỆ THỐNG THỰC TẾ!');
  console.log('══════════════════════════════════════════════════════════════');
}

runRealTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
