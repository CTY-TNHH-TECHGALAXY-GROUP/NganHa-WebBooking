import { createClient } from '@supabase/supabase-js';
import { sendBookingConfirmationEmail } from '../src/lib/mailer';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const orderIds = [
  'WB-04092026-6C4Y82580E', // Watashidmm - minhthu14122811@gmail.com
  'WB-04092026-ISTO40193D', // nghi - nghik22@gmail.com
  'WB-04092026-D386366DF8', // test - nghik22@gmail.com
  'WB-04092026-66OZFE604A', // Philip Shepard - philipwshepard@gmail.com
];

async function resendAll() {
  console.log('🚀 Bắt đầu gửi bù email cho 4 đơn hàng gần nhất...\n');

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
