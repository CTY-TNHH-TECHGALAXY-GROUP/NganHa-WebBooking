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
    if (guests && Number(guests) > 1) notesParts.push(`Số khách: ${guests}`);
    if (staffGender && staffGender !== 'any') {
      const genderLabel = staffGender === 'female' ? 'Nữ' : 'Nam';
      notesParts.push(`Yêu cầu KTV: ${genderLabel}`);
    }
    const hasAnyPrivateRoom = selectedServices.some(
      (s: any) => s.options?.addons?.privateRoom || s.customOptions?.addons?.privateRoom || s.variantId === 'NHS0900'
    );
    if (hasAnyPrivateRoom) {
      notesParts.push('Yêu cầu phòng riêng (Private Room)');
    }
    if (note?.trim()) notesParts.push(`Ghi chú chung: ${note.trim()}`);
    const finalNotes = notesParts.join(' | ') || null;

    const isEn = lang === 'en';
    const isCn = lang === 'cn';
    const isJp = lang === 'jp';
    const isKr = lang === 'kr';

    const BODY_PART_I18N: Record<string, Record<string, string>> = {
      HEAD: { vi: 'Đầu', en: 'Head', cn: '头部', jp: '頭部', kr: '머리' },
      NECK: { vi: 'Cổ', en: 'Neck', cn: '颈部', jp: '首', kr: '목' },
      SHOULDER: { vi: 'Vai', en: 'Shoulder', cn: '肩部', jp: '肩', kr: '어깨' },
      BACK: { vi: 'Lưng', en: 'Back', cn: '背部', jp: '背中', kr: '등' },
      ARM: { vi: 'Tay', en: 'Arms', cn: '手臂', jp: '腕', kr: '팔' },
      THIGH: { vi: 'Đùi', en: 'Thighs', cn: '大腿', jp: '太もも', kr: '허벅지' },
      KNEE: { vi: 'Đầu gối', en: 'Knees', cn: '膝盖', jp: '膝', kr: '무릎' },
      CALF: { vi: 'Bắp chân', en: 'Calves', cn: '小腿', jp: 'ふくらはぎ', kr: '종아리' },
      FOOT: { vi: 'Bàn chân', en: 'Feet', cn: '足部', jp: '足・足裏', kr: '발' },
    };

    const translatePart = (p: string) => {
      const upper = (p || '').toUpperCase().trim();
      if (BODY_PART_I18N[upper]) {
        return BODY_PART_I18N[upper][lang] || BODY_PART_I18N[upper].en || p;
      }
      for (const entry of Object.values(BODY_PART_I18N)) {
        if (entry.vi.toLowerCase() === (p || '').toLowerCase().trim()) {
          return entry[lang] || entry.en || p;
        }
      }
      return p;
    };

    const STRENGTH_I18N: Record<string, Record<string, string>> = {
      soft: { vi: 'Nhẹ', en: 'Light', cn: '轻柔', jp: '弱め（ソフト）', kr: '부드럽게 (약)' },
      light: { vi: 'Nhẹ', en: 'Light', cn: '轻柔', jp: '弱め（ソフト）', kr: '부드럽게 (약)' },
      medium: { vi: 'Vừa', en: 'Medium', cn: '适中', jp: '普通（ミディアム）', kr: '보통 (중)' },
      normal: { vi: 'Vừa', en: 'Medium', cn: '适中', jp: '普通（ミディアム）', kr: '보통 (중)' },
      hard: { vi: 'Mạnh', en: 'Firm', cn: '强劲', jp: '強め（ハード）', kr: '강하게 (강)' },
      strong: { vi: 'Mạnh', en: 'Firm', cn: '强劲', jp: '強め（ハード）', kr: '강하게 (강)' },
    };

    const focusParts: string[] = [];
    selectedServices.forEach((svc: any) => {
      const opts = svc.options || svc.customOptions;
      if (opts) {
        const itemNotes = [];
        if (opts.notes?.tag0) {
          itemNotes.push(isEn ? 'Pregnant Guest' : isCn ? '孕期护理' : isJp ? '妊娠中' : isKr ? '임산부' : 'Phụ nữ có thai');
        }
        if (opts.notes?.tag1) {
          itemNotes.push(isEn ? 'Allergies / Sensitive skin' : isCn ? '有过敏史 / 敏感体质' : isJp ? 'アレルギーあり / 敏感肌' : isKr ? '알레르기 있음 / 민감성' : 'Có dị ứng');
        }
        if (opts.addons?.privateRoom) {
          const prLbl = isEn ? 'Private Room (+105K)' : isCn ? '包间 (+105K)' : isJp ? '個室 (+105K)' : isKr ? '프라이빗 룸 (+105K)' : 'Phòng riêng (+105K)';
          itemNotes.push(prLbl);
        }
        if (opts.bodyParts?.focus?.length) {
          const lbl = isEn ? 'Focus' : isCn ? '重点部位' : isJp ? '重点部位' : isKr ? '집중 관리' : 'Tập trung';
          const translated = opts.bodyParts.focus.map((p: string) => translatePart(p)).join(', ');
          itemNotes.push(`${lbl}: ${translated}`);
        }
        if (opts.bodyParts?.avoid?.length) {
          const lbl = isEn ? 'Avoid' : isCn ? '避开部位' : isJp ? '避ける部位' : isKr ? '제외 부위' : 'Tránh';
          const translated = opts.bodyParts.avoid.map((p: string) => translatePart(p)).join(', ');
          itemNotes.push(`${lbl}: ${translated}`);
        }
        if (opts.strength) {
          const strengthMap = STRENGTH_I18N[String(opts.strength).toLowerCase()] || {
            vi: opts.strength, en: opts.strength, cn: opts.strength, jp: opts.strength, kr: opts.strength
          };
          const strengthLabel = isEn ? 'Pressure' : isCn ? '力度' : isJp ? '強さ' : isKr ? '강도' : 'Lực';
          const strengthVal = strengthMap[lang] || strengthMap.en || opts.strength;
          itemNotes.push(`${strengthLabel}: ${strengthVal}`);
        }
        if (opts.notes?.content) {
          const lbl = isEn ? 'Note' : isCn ? '特别说明' : isJp ? '特記事項' : isKr ? '참고 메모' : 'Chú ý';
          itemNotes.push(`${lbl}: ${opts.notes.content}`);
        }
        
        if (itemNotes.length > 0) {
          focusParts.push(`• ${svc.name || 'Dịch vụ'}: ${itemNotes.join(' | ')}`);
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
      roomName: hasAnyPrivateRoom ? 'Phòng riêng' : null,
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
    // Hỗ trợ nhận Private Room về DB với cùng id NHS0900 như add-on
    const PRIVATE_ROOM_SERVICE_ID = 'NHS0900';
    const PRIVATE_ROOM_PRICE = 105000;

    const bookingItems: any[] = [];
    selectedServices.forEach((svc: any, idx: number) => {
      const opts = svc.options || svc.customOptions || {};
      
      // Map strength
      let strengthStr = undefined;
      if (opts.strength) {
         const s = String(opts.strength).toLowerCase();
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

      const hasPrivateRoomAddon = Boolean(opts.addons?.privateRoom);
      const qty = svc.quantity || 1;

      // Giá gốc của dịch vụ (trừ phụ phí private room nếu đã bị cộng gộp)
      let serviceItemPrice = svc.priceVND;
      if (hasPrivateRoomAddon) {
        if (svc.basePriceVND && svc.basePriceVND > 0) {
          serviceItemPrice = svc.basePriceVND;
        } else if (svc.priceVND >= PRIVATE_ROOM_PRICE) {
          serviceItemPrice = svc.priceVND - PRIVATE_ROOM_PRICE;
        }
      }

      // 1. Thêm dịch vụ chính vào BookingItems
      bookingItems.push({
        id: `${bookingId}-${svc.variantId}-${idx}`,
        bookingId,
        serviceId: svc.variantId,
        quantity: qty,
        price: serviceItemPrice,
        status: 'WAITING',
        options: structuredOptions
      });

      // 2. Nếu có add Private Room trong Custom For You, thêm 1 row riêng trong BookingItems với id NHS0900
      if (hasPrivateRoomAddon) {
        bookingItems.push({
          id: `${bookingId}-${PRIVATE_ROOM_SERVICE_ID}-${idx}`,
          bookingId,
          serviceId: PRIVATE_ROOM_SERVICE_ID,
          quantity: qty,
          price: PRIVATE_ROOM_PRICE,
          status: 'WAITING',
          options: {
            displayName: 'Phòng riêng',
            parentServiceId: svc.variantId,
            isAddon: true
          }
        });
      }
    });

    const { error: itemsErr } = await supabase.from('BookingItems').insert(bookingItems);

    if (itemsErr) {
      console.error('⚠️ [API Bookings] INSERT BookingItems lỗi:', itemsErr.message);
      // Không fail (đơn đã tạo), chỉ log
    }

    // ── 6. Gửi email xác nhận tự động cho khách ───────
    if (email && typeof email === 'string' && email.includes('@')) {
      const explicitStaffGender = staffGender && staffGender !== 'any' ? staffGender : undefined;
      const explicitServiceTherapist = selectedServices.find(
        (s: any) => s.options?.therapist && s.options.therapist !== 'any'
      )?.options?.therapist;
      const chosenGender = explicitStaffGender || explicitServiceTherapist || 'any';

      sendBookingConfirmationEmail({
        bookingId,
        customerName: name,
        customerEmail: email.trim(),
        customerPhone: phone || '',
        date: date || '',
        time: time || '',
        guests: guests ? Number(guests) : 1,
        branchName: branchName || BRANCH_DEFAULT,
        services: selectedServices,
        totalAmount,
        therapist: chosenGender,
        lang: lang || 'vi',
        notes: note?.trim() || undefined,
        focusAreaNote: finalFocusAreaNote || undefined,
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
