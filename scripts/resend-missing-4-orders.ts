import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmail } from '../src/lib/mailer';

// Automatically load .env.local in standalone CLI environment if not already in process.env
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [k, ...v] = trimmed.split('=');
    if (k && v.length) {
      const key = k.trim();
      if (!process.env[key]) {
        process.env[key] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Parse order IDs from CLI arguments or environment variable; never hardcode customer PII or production IDs
const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const envIds = process.env.RESEND_ORDER_IDS
  ? process.env.RESEND_ORDER_IDS.split(',').map((id) => id.trim()).filter(Boolean)
  : [];

// Default clean placeholder IDs if none supplied
const defaultPlaceholderIds: string[] = [];

const orderIds = cliArgs.length > 0
  ? cliArgs
  : envIds.length > 0
    ? envIds
    : defaultPlaceholderIds;

async function resendAll() {
  if (orderIds.length === 0) {
    console.log('ℹ️ Không có mã đơn hàng nào được cung cấp.');
    console.log('   Cách dùng: npx tsx scripts/resend-missing-4-orders.ts <orderId1> <orderId2> ...');
    console.log('   Hoặc qua biến môi trường: RESEND_ORDER_IDS=WB-01,WB-02 npx tsx scripts/resend-missing-4-orders.ts');
    return;
  }

  console.log(`🚀 Bắt đầu gửi bù email cho ${orderIds.length} đơn hàng...\n`);

  for (const id of orderIds) {
    console.log(`📦 Đang xử lý đơn: ${id}...`);
    const { data: booking, error: bErr } = await supabase.from('Bookings').select('*').eq('id', id).single();
    if (bErr || !booking) {
      console.error(`❌ Không tìm thấy đơn ${id}:`, bErr?.message);
      continue;
    }

    const { data: items } = await supabase.from('BookingItems').select('*').eq('bookingId', id);
    const { data: services } = await supabase.from('Services').select('id, nameVN, nameEN, duration');
    const svcMap = new Map((services || []).map(s => [s.id, s]));

    const mappedServices = (items || []).map(item => {
      const dbSvc = svcMap.get(item.serviceId);
      return {
        name: item.options?.displayName || dbSvc?.nameVN || dbSvc?.nameEN || item.serviceId,
        duration: dbSvc?.duration || 0,
        priceVND: item.price,
        quantity: item.quantity,
        options: item.options,
      };
    });

    const res = await sendBookingConfirmationEmail({
      bookingId: booking.id,
      customerName: booking.customerName || 'Quý khách',
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone || '',
      date: booking.bookingDate ? booking.bookingDate.split('T')[0] : '',
      time: booking.timeBooking || '',
      guests: booking.guestCount || 1,
      branchName: booking.branchName || 'ORIA SPA',
      services: mappedServices,
      totalAmount: booking.totalAmount,
      therapist: booking.customerGender || 'any',
      lang: booking.customerLang || 'vi',
      notes: booking.notes || undefined,
      focusAreaNote: booking.focusAreaNote || undefined,
    });

    if (res.success) {
      console.log(`✅ [${id}] Đã gửi thành công tới ${booking.customerEmail}! (MessageId: ${res.messageId})`);
      await supabase
        .from('Bookings')
        .update({ reception_feedback: `Email sent: ${res.messageId} (Resent via hardened mailer)` })
        .eq('id', id);
    } else {
      console.error(`❌ [${id}] Gửi thất bại:`, res.error || res.reason);
    }
  }

  console.log('\n🎉 Hoàn tất toàn bộ tiến trình gửi bù email!');
}

resendAll().catch(console.error);
