// ═══════════════════════════════════════
// POST /api/bookings
// Nhận đơn đặt lịch từ Web Booking → INSERT vào Supabase
// ═══════════════════════════════════════
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendBookingConfirmationEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const BRANCH_DEFAULT = 'ORIA SPA';
const BOOKING_ID_PREFIX = 'WB';

/** Sinh mã đơn theo format: WB-001-27032026 */
const generateBookingId = async (supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> => {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  const dateStr = `${dd}${mm}${yyyy}`; // 27032026

  // Đếm số đơn WB đã tạo trong ngày hôm nay
  const { count } = await supabase
    .from('Bookings')
    .select('id', { count: 'exact', head: true })
    .like('id', `${BOOKING_ID_PREFIX}-%-${dateStr}`);

  const seq = String((count || 0) + 1).padStart(3, '0');
  return `${BOOKING_ID_PREFIX}-${seq}-${dateStr}`; // VD: WB-001-27032026
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      email,
      note,
      date,
      time,
      branchId,
      branchName,
      guests,
      staffGender,
      lang,
      selectedServices, // SelectedServiceItem[]
    } = body;

    // ── Validate ──────────────────────────────────────
    if (!name || !selectedServices || selectedServices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (tên, dịch vụ)' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // ── 1. UPSERT Customer theo SĐT ──────────────────
    let customerId: string | null = null;

    const contactKey = phone || email || null;
    if (contactKey) {
      // Tìm theo SĐT trước, nếu không có thì theo email
      const query = phone
        ? supabase.from('Customers').select('id').eq('phone', phone).maybeSingle()
        : supabase.from('Customers').select('id').eq('email', email).maybeSingle();

      const { data: existingCustomer } = await query;

      if (existingCustomer?.id) {
        // Cập nhật thông tin nếu đã có
        customerId = existingCustomer.id;
        await supabase
          .from('Customers')
          .update({
            fullName: name,
            ...(email && { email }),
            updatedAt: new Date().toISOString(),
          })
          .eq('id', existingCustomer.id);
      } else {
        // Tạo mới
        const newCusId = `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { data: newCustomer, error: cusErr } = await supabase
          .from('Customers')
          .insert({
            id: newCusId,
            fullName: name,
            phone: phone || null,
            email: email || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (cusErr) {
          console.error('❌ [API Bookings] Tạo Customer lỗi:', cusErr.message);
          // Không fail toàn bộ request, tiếp tục mà không có customerId
        } else {
          customerId = newCustomer?.id || null;
        }
      }
    }

    // ── 2. Sinh mã đơn ────────────────────────────────
    const bookingId = await generateBookingId(supabase);

    // ── 3. Tổng hợp notes & focus area ────────────────
    const notesParts: string[] = [];
    if (guests && guests > 1) notesParts.push(`Số khách: ${guests}`);
    if (staffGender && staffGender !== 'any') {
      const genderLabel = staffGender === 'female' ? 'Nữ' : 'Nam';
      notesParts.push(`Yêu cầu KTV: ${genderLabel}`);
    }
    if (note?.trim()) notesParts.push(`Ghi chú chung: ${note.trim()}`);
    const finalNotes = notesParts.join(' | ') || null;

    const focusParts: string[] = [];
    selectedServices.forEach((svc: any) => {
      const opts = svc.options;
      if (opts) {
        const itemNotes = [];
        if (opts.notes?.tag0) itemNotes.push('Phụ nữ có thai');
        if (opts.notes?.tag1) itemNotes.push('Có dị ứng');
        if (opts.bodyParts?.focus?.length) itemNotes.push(`Tập trung: ${opts.bodyParts.focus.join(', ')}`);
        if (opts.bodyParts?.avoid?.length) itemNotes.push(`Tránh: ${opts.bodyParts.avoid.join(', ')}`);
        if (opts.strength) {
          const sMap: Record<string, string> = { soft: 'Nhẹ', medium: 'Vừa', strong: 'Mạnh' };
          itemNotes.push(`Lực: ${sMap[opts.strength] || opts.strength}`);
        }
        if (opts.notes?.content) itemNotes.push(`Chú ý: ${opts.notes.content}`);
        
        if (itemNotes.length > 0) {
          focusParts.push(`- ${svc.name}: ${itemNotes.join(' | ')}`);
        }
      }
    });
    const finalFocusAreaNote = focusParts.length > 0 ? focusParts.join('\n') : null;

    // ── 4. INSERT Bookings ────────────────────────────
    const totalAmount = selectedServices.reduce(
      (sum: number, s: { priceVND: number; quantity?: number }) =>
        sum + (s.priceVND || 0) * (s.quantity || 1),
      0
    );

    const bookingDate = date
      ? new Date(`${date}T${time || '00:00'}:00+07:00`).toISOString()
      : new Date().toISOString();

    const { error: bookingErr } = await supabase.from('Bookings').insert({
      id: bookingId,
      billCode: bookingId,
      source: 'WEB_BOOKING',
      guestCount: guests ? Number(guests) : 1,
      branchName: branchName || BRANCH_DEFAULT,
      bookingDate,
      timeBooking: time || null,
      customerName: name,
      customerPhone: phone || null,
      customerEmail: email || null,
      customerLang: lang || 'vi',
      customerId,
      notes: finalNotes,
      focusAreaNote: finalFocusAreaNote,
      totalAmount,
      status: 'NEW',
      tip: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (bookingErr) {
      console.error('❌ [API Bookings] INSERT Booking lỗi:', bookingErr.message);
      return NextResponse.json(
        { success: false, error: `Lỗi tạo đơn: ${bookingErr.message}` },
        { status: 500 }
      );
    }

    // ── 5. INSERT BookingItems ────────────────────────
        const bookingItems = selectedServices.map((svc: any) => {
      const opts = svc.options || {};
      
      // Map strength
      let strengthStr = undefined;
      if (opts.strength) {
         const s = opts.strength.toLowerCase();
         if (s === 'light' || s === 'nhẹ') strengthStr = 'LIGHT';
         else if (s === 'hard' || s === 'strong' || s === 'mạnh') strengthStr = 'HARD';
         else strengthStr = 'NORMAL';
      }

      // Map therapist
      let therapistStr = "Ngẫu nhiên";
      if (opts.therapist === 'male') therapistStr = 'Nam';
      else if (opts.therapist === 'female') therapistStr = 'Nữ';

      // Map notes
      const extraNotes = [];
      if (opts.notes?.tag0) extraNotes.push('Phụ nữ có thai');
      if (opts.notes?.tag1) extraNotes.push('Có dị ứng');
      let finalNote = opts.notes?.content || "";
      if (extraNotes.length > 0) {
        finalNote = extraNotes.join(', ') + (finalNote ? " - " + finalNote : "");
      }

      const structuredOptions = {
        strength: strengthStr,
        focus: opts.bodyParts?.focus || [],
        avoid: opts.bodyParts?.avoid || [],
        therapist: therapistStr,
        note: finalNote
      };

      return {
        id: `${bookingId}-${svc.variantId}`,
        bookingId,
        serviceId: svc.variantId,
        quantity: svc.quantity || 1,
        price: svc.priceVND,
        status: 'WAITING',
        options: structuredOptions
      };
    });

    const { error: itemsErr } = await supabase.from('BookingItems').insert(bookingItems);

    if (itemsErr) {
      console.error('⚠️ [API Bookings] INSERT BookingItems lỗi:', itemsErr.message);
      // Không fail (đơn đã tạo), chỉ log
    }

    // ── 6. Gửi email xác nhận tự động cho khách ───────
    if (email && typeof email === 'string' && email.includes('@')) {
      let therapistName: string | undefined = undefined;
      const explicitStaffGender = staffGender && staffGender !== 'any' ? staffGender : undefined;
      const explicitServiceTherapist = selectedServices.find(
        (s: any) => s.options?.therapist && s.options.therapist !== 'any'
      )?.options?.therapist;
      const chosenGender = explicitStaffGender || explicitServiceTherapist;

      if (chosenGender === 'female') {
        therapistName = lang === 'vi' ? 'Nữ (Female Therapist)' : 'Female Therapist';
      } else if (chosenGender === 'male') {
        therapistName = lang === 'vi' ? 'Nam (Male Therapist)' : 'Male Therapist';
      }

      sendBookingConfirmationEmail({
        bookingId,
        customerName: name,
        customerEmail: email.trim(),
        customerPhone: phone || '',
        date: date || '',
        time: time || '',
        branchName: branchName || BRANCH_DEFAULT,
        services: selectedServices,
        totalAmount,
        therapist: therapistName,
        lang: lang || 'vi',
        notes: finalNotes || undefined,
      }).catch((mailErr) => {
        console.error('⚠️ [API Bookings] Lỗi gửi email xác nhận:', mailErr);
      });
    }

    // ── 7. Trả về success ─────────────────────────────
    console.log(`✅ [API Bookings] Đơn WB tạo thành công: ${bookingId}`);

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        billCode: bookingId,
        customerName: name,
        customerPhone: phone || null,
        date,
        time,
        branchName: branchName || BRANCH_DEFAULT,
        services: selectedServices,
        totalAmount,
        lang: lang || 'vi',
      },
    });
  } catch (error: any) {
    console.error('❌ [API Bookings] Lỗi không xác định:', error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
