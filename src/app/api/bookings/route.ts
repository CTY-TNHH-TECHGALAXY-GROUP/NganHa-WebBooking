// ═══════════════════════════════════════
// POST /api/bookings
// Server-authoritative, atomic, collision-safe booking API
// ═══════════════════════════════════════
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { sendBookingConfirmationEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

// 🔧 CONFIGURATION
const BRANCH_DEFAULT = 'ORIA SPA';
const BOOKING_ID_PREFIX = 'WB';
const PRIVATE_ROOM_SERVICE_ID = 'NHS0900';
const PRIVATE_ROOM_DEFAULT_PRICE_VND = 105000;

/**
 * Sinh mã đơn tuần tự dạng: WB-ddmmyyyy-001, WB-ddmmyyyy-002,...
 * Đơn giản hoá đuôi ID = số thứ tự đơn trong ngày (3 chữ số zero-padded).
 */
const generateSequentialBookingId = async (supabase: any, targetDate?: string): Promise<string> => {
  const now = new Date();
  let dateStr: string;
  if (targetDate && targetDate.includes('-')) {
    const parts = targetDate.split('-');
    if (parts.length === 3) {
      dateStr = `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[0]}`;
    } else {
      const dd = String(now.getDate()).padStart(2, '0');
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const yyyy = String(now.getFullYear());
      dateStr = `${dd}${mm}${yyyy}`;
    }
  } else {
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = String(now.getFullYear());
    dateStr = `${dd}${mm}${yyyy}`;
  }

  const prefix = `${BOOKING_ID_PREFIX}-${dateStr}-`;
  const { data: existingBookings } = await supabase
    .from('Bookings')
    .select('id')
    .like('id', `${prefix}%`);

  let maxSeq = 0;
  if (existingBookings && existingBookings.length > 0) {
    for (const b of existingBookings) {
      const suffix = b.id.replace(prefix, '');
      const parsed = parseInt(suffix, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
    if (maxSeq === 0) {
      maxSeq = existingBookings.length;
    }
  }

  const nextSeq = maxSeq + 1;
  const seqStr = String(nextSeq).padStart(3, '0');
  return `${prefix}${seqStr}`;
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
      customerGender,
      lang,
      selectedServices: rawSelectedServices,
      services: rawServices,
      paymentMethod,
      amountPaid,
      changeDenominations,
    } = body;
    const selectedServices = rawSelectedServices || rawServices || [];

    const idempotencyKey =
      body.idempotencyKey ||
      request.headers.get('Idempotency-Key') ||
      body.clientSessionId ||
      null;

    // ── 1. Validate Input cơ bản ──────────────────────
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Thiếu họ tên khách hàng (fullName is required)' },
        { status: 400 }
      );
    }

    if (!Array.isArray(selectedServices) || selectedServices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Giỏ hàng trống. Vui lòng chọn ít nhất một dịch vụ.' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // ── 2. Kiểm tra Idempotency ───────────────────────
    if (idempotencyKey && typeof idempotencyKey === 'string') {
      const { data: existingBooking } = await supabase
        .from('Bookings')
        .select('id, billCode, totalAmount, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, customerLang')
        .eq('idLegacy', `idemp:${idempotencyKey.trim()}`)
        .maybeSingle();

      if (existingBooking) {
        console.log(`[API Bookings] Idempotent hit: return existing booking ${existingBooking.id}`);
        return NextResponse.json({
          success: true,
          idempotent: true,
          data: {
            bookingId: existingBooking.id,
            billCode: existingBooking.billCode,
            customerName: existingBooking.customerName,
            customerPhone: existingBooking.customerPhone,
            date,
            time,
            branchName: existingBooking.branchName || BRANCH_DEFAULT,
            totalAmount: existingBooking.totalAmount,
            lang: existingBooking.customerLang || lang || 'vi',
          },
        });
      }
    }

    // ── 3. PHASE 1: Server-Authoritative Pricing ──────
    // Lấy danh sách ID dịch vụ cần xác thực
    const requestedServiceIds: string[] = selectedServices
      .map((s: any) => s.variantId || s.serviceId || s.id)
      .filter(Boolean);

    if (requestedServiceIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy mã dịch vụ hợp lệ trong yêu cầu' },
        { status: 400 }
      );
    }

    const allIdsToQuery = Array.from(new Set([...requestedServiceIds, PRIVATE_ROOM_SERVICE_ID]));

    const { data: dbServices, error: fetchSvcErr } = await supabase
      .from('Services')
      .select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive')
      .in('id', allIdsToQuery);

    if (fetchSvcErr) {
      console.error('❌ [API Bookings] Lỗi truy vấn bảng Services:', fetchSvcErr.message);
      return NextResponse.json(
        { success: false, error: 'Lỗi kiểm tra giá dịch vụ từ hệ thống' },
        { status: 500 }
      );
    }

    const dbMap = new Map<string, any>();
    (dbServices || []).forEach((s) => dbMap.set(s.id, s));

    const getLocalizedServiceName = (dbSvc: any, targetLang: string): string => {
      if (!dbSvc) return 'Dịch vụ Spa';
      if (targetLang === 'en') return dbSvc.nameEN || dbSvc.nameVN || 'Spa Treatment';
      if (targetLang === 'cn') return dbSvc.nameCN || dbSvc.nameEN || dbSvc.nameVN || '水疗服务';
      if (targetLang === 'jp') return dbSvc.nameJP || dbSvc.nameEN || dbSvc.nameVN || 'トリートメントコース';
      if (targetLang === 'kr') return dbSvc.nameKR || dbSvc.nameEN || dbSvc.nameVN || '스파 트리트먼트';
      return dbSvc.nameVN || dbSvc.nameEN || 'Dịch vụ Spa';
    };

    const PRIVATE_ROOM_NAME_I18N: Record<string, string> = {
      vi: 'Phòng riêng',
      en: 'Private Room',
      cn: '包间',
      jp: '個室',
      kr: '프라이빗 룸',
    };

    const privateRoomSvc = dbMap.get(PRIVATE_ROOM_SERVICE_ID);
    const privateRoomPriceVND =
      privateRoomSvc?.priceVND && Number(privateRoomSvc.priceVND) > 0
        ? Number(privateRoomSvc.priceVND)
        : PRIVATE_ROOM_DEFAULT_PRICE_VND;

    // Kiểm tra tính hợp lệ của từng dịch vụ
    const invalidServices: { id: string; reason: string }[] = [];
    const validatedServiceList: any[] = [];
    let serverCalculatedTotalAmount = 0;

    for (let idx = 0; idx < selectedServices.length; idx++) {
      const rawItem = selectedServices[idx];
      const svcId = rawItem.variantId || rawItem.serviceId || rawItem.id;
      const dbSvc = dbMap.get(svcId);

      if (!dbSvc) {
        invalidServices.push({ id: svcId, reason: 'SERVICE_NOT_FOUND' });
        continue;
      }

      if (dbSvc.isActive === false) {
        invalidServices.push({ id: svcId, reason: 'SERVICE_INACTIVE' });
        continue;
      }

      // Giới hạn số lượng hợp lý từ 1 đến 20
      const safeQty = Math.max(1, Math.min(20, Math.floor(Number(rawItem.quantity || rawItem.qty || 1))));
      const basePriceVND = Number(dbSvc.priceVND) || 0;

      const opts = rawItem.options || rawItem.customOptions || {};
      const hasPrivateRoomAddon = Boolean(opts.addons?.privateRoom);

      const itemCanonicalPriceVND = basePriceVND + (hasPrivateRoomAddon ? privateRoomPriceVND : 0);
      serverCalculatedTotalAmount += itemCanonicalPriceVND * safeQty;

      const localizedName = getLocalizedServiceName(dbSvc, lang || 'vi');

      validatedServiceList.push({
        variantId: dbSvc.id,
        serviceId: dbSvc.id,
        name: localizedName,
        dbNameVN: dbSvc.nameVN,
        dbNameEN: dbSvc.nameEN,
        dbNameCN: dbSvc.nameCN,
        dbNameJP: dbSvc.nameJP,
        dbNameKR: dbSvc.nameKR,
        duration: Number(dbSvc.duration) || 0,
        basePriceVND,
        priceVND: itemCanonicalPriceVND,
        quantity: safeQty,
        hasPrivateRoomAddon,
        options: opts,
      });
    }

    // Nếu giỏ hàng có dịch vụ không hợp lệ hoặc đã tắt: trả về 409 CART_REQUIRES_REVIEW
    if (invalidServices.length > 0) {
      return NextResponse.json(
        {
          success: false,
          code: 'CART_REQUIRES_REVIEW',
          error: 'Một số dịch vụ trong giỏ hàng đã thay đổi hoặc ngừng phục vụ. Vui lòng kiểm tra lại.',
          invalidServices,
        },
        { status: 409 }
      );
    }

    // ── 4. PHASE 5: Customer Demographic Persistence ──
    let customerId: string | null = null;
    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email && typeof email === 'string' && email.includes('@') ? email.trim() : null;

    // Chuẩn hóa customerGender: 'male' | 'female' | 'other'
    let resolvedGender: string | null = null;
    const rawGender = customerGender || staffGender;
    if (rawGender) {
      const gLower = String(rawGender).toLowerCase().trim();
      if (gLower === 'male' || gLower === 'nam' || gLower === 'anh') resolvedGender = 'male';
      else if (gLower === 'female' || gLower === 'nữ' || gLower === 'chị') resolvedGender = 'female';
      else if (gLower === 'other' || gLower === 'khác') resolvedGender = 'other';
    }

    if (cleanPhone || cleanEmail) {
      const query = cleanPhone
        ? supabase.from('Customers').select('id, fullName, phone, email, gender').eq('phone', cleanPhone).maybeSingle()
        : supabase.from('Customers').select('id, fullName, phone, email, gender').eq('email', cleanEmail).maybeSingle();

      const { data: existingCustomer } = await query;

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
        // Cập nhật thông tin mà KHÔNG ghi đè giá trị rỗng lên dữ liệu cũ
        const updatePayload: Record<string, any> = {
          fullName: name.trim(),
          updatedAt: new Date().toISOString(),
        };
        if (cleanEmail && !existingCustomer.email) updatePayload.email = cleanEmail;
        if (cleanPhone && !existingCustomer.phone) updatePayload.phone = cleanPhone;
        if (resolvedGender && !existingCustomer.gender) updatePayload.gender = resolvedGender;

        await supabase.from('Customers').update(updatePayload).eq('id', existingCustomer.id);
      } else {
        const newCusId = `CUS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const { data: newCustomer, error: cusErr } = await supabase
          .from('Customers')
          .insert({
            id: newCusId,
            fullName: name.trim(),
            phone: cleanPhone,
            email: cleanEmail,
            gender: resolvedGender,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (cusErr) {
          console.warn('⚠️ [API Bookings] Tạo Customer thất bại (tiếp tục tạo booking):', cusErr.message);
        } else {
          customerId = newCustomer?.id || null;
        }
      }
    }

    // ── 5. PHASE 3: Sequential & Collision-Safe Booking ID ──────
    let bookingId = await generateSequentialBookingId(supabase, date);

    // ── 6. Tổng hợp notes & focus area ────────────────
    const notesParts: string[] = [];
    if (guests && Number(guests) > 1) notesParts.push(`Số khách: ${guests}`);
    if (staffGender && staffGender !== 'any') {
      const genderLabel = staffGender === 'female' ? 'Nữ' : staffGender === 'male' ? 'Nam' : staffGender;
      notesParts.push(`Yêu cầu KTV: ${genderLabel}`);
    }
    const hasAnyPrivateRoom = validatedServiceList.some(
      (s) => s.hasPrivateRoomAddon || s.variantId === PRIVATE_ROOM_SERVICE_ID
    );
    if (hasAnyPrivateRoom) {
      notesParts.push(PRIVATE_ROOM_NAME_I18N[lang || 'vi'] || 'Phòng riêng');
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
    validatedServiceList.forEach((svc: any) => {
      const opts = svc.options;
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
          const lbl = isEn ? 'Avoid' : isCn ? '避开部位' : isJp ? '避ける部位' : isKr ? '제외 部位' : 'Tránh';
          const translated = opts.bodyParts.avoid.map((p: string) => translatePart(p)).join(', ');
          itemNotes.push(`${lbl}: ${translated}`);
        }
        if (opts.strength) {
          const strengthMap = STRENGTH_I18N[String(opts.strength).toLowerCase()] || {
            vi: opts.strength, en: opts.strength, cn: opts.strength, jp: opts.strength, kr: opts.strength,
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
          const servicePrefix = validatedServiceList.length > 1 ? `[${svc.name}]\n` : '';
          focusParts.push(`${servicePrefix}${itemNotes.map((n) => `• ${n}`).join('\n')}`);
        }
      }
    });
    const finalFocusAreaNote = focusParts.length > 0 ? focusParts.join('\n\n') : null;

    // ── 7. PHASE 2: Atomic Creation & Rollback Safety ─
    const bookingDate = date
      ? new Date(`${date}T${time || '00:00'}:00+07:00`).toISOString()
      : new Date().toISOString();

    let insertSuccess = false;
    let attempts = 0;
    while (!insertSuccess && attempts < 5) {
      attempts++;
      const bookingPayload: Record<string, any> = {
        id: bookingId,
        billCode: bookingId,
        source: 'WEB_BOOKING',
        guestCount: guests ? Math.max(1, Number(guests)) : 1,
        branchName: branchName || BRANCH_DEFAULT,
        bookingDate,
        timeBooking: time || null,
        customerName: name.trim(),
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        customerGender: resolvedGender,
        customerLang: lang || 'vi',
        customerId,
        roomName: hasAnyPrivateRoom ? (PRIVATE_ROOM_NAME_I18N[lang || 'vi'] || 'Phòng riêng') : null,
        notes: finalNotes,
        focusAreaNote: finalFocusAreaNote,
        totalAmount: serverCalculatedTotalAmount,
        status: 'NEW',
        tip: 0,
        idLegacy: idempotencyKey ? `idemp:${idempotencyKey.trim()}` : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const { error: bookingErr } = await supabase.from('Bookings').insert(bookingPayload);
      if (!bookingErr) {
        insertSuccess = true;
      } else if (bookingErr.code === '23505' || bookingErr.message?.includes('duplicate key') || bookingErr.message?.includes('unique constraint')) {
        console.warn(`⚠️ [API Bookings] Trùng ID ${bookingId}, tự động tăng số thứ tự tiếp theo...`);
        bookingId = await generateSequentialBookingId(supabase, date);
      } else {
        console.error('❌ [API Bookings] INSERT Booking lỗi:', bookingErr.message);
        return NextResponse.json(
          { success: false, error: `Lỗi tạo đơn đặt lịch: ${bookingErr.message}` },
          { status: 500 }
        );
      }
    }

    // ── 8. Tạo BookingItems ────────────────────────────
    const bookingItems: any[] = [];
    validatedServiceList.forEach((svc: any, idx: number) => {
      const opts = svc.options || {};

      let strengthStr = undefined;
      if (opts.strength) {
        const s = String(opts.strength).toLowerCase();
        if (s === 'light' || s === 'nhẹ') strengthStr = 'LIGHT';
        else if (s === 'hard' || s === 'strong' || s === 'mạnh') strengthStr = 'HARD';
        else strengthStr = 'NORMAL';
      }

      let therapistStr = 'Ngẫu nhiên';
      if (opts.therapist === 'male') therapistStr = 'Nam';
      else if (opts.therapist === 'female') therapistStr = 'Nữ';

      const extraNotes = [];
      if (opts.notes?.tag0) extraNotes.push('Phụ nữ có thai');
      if (opts.notes?.tag1) extraNotes.push('Có dị ứng');
      let finalNote = opts.notes?.content || '';
      if (extraNotes.length > 0) {
        finalNote = extraNotes.join(', ') + (finalNote ? ' - ' + finalNote : '');
      }

      const structuredOptions = {
        strength: strengthStr,
        focus: opts.bodyParts?.focus || [],
        avoid: opts.bodyParts?.avoid || [],
        therapist: therapistStr,
        note: finalNote,
      };

      // 1. Thêm dịch vụ chính với giá server-authoritative
      bookingItems.push({
        id: `${bookingId}-${svc.variantId}-${idx}`,
        bookingId,
        serviceId: svc.variantId,
        quantity: svc.quantity,
        price: svc.basePriceVND,
        status: 'WAITING',
        options: structuredOptions,
        tip: 0,
      });

      // 2. Thêm add-on Private Room nếu có
      if (svc.hasPrivateRoomAddon) {
        bookingItems.push({
          id: `${bookingId}-${PRIVATE_ROOM_SERVICE_ID}-${idx}`,
          bookingId,
          serviceId: PRIVATE_ROOM_SERVICE_ID,
          quantity: svc.quantity,
          price: privateRoomPriceVND,
          status: 'WAITING',
          options: {
            displayName: PRIVATE_ROOM_NAME_I18N[lang || 'vi'] || 'Phòng riêng',
            parentServiceId: svc.variantId,
            isAddon: true,
          },
          tip: 0,
        });
      }
    });

    const { error: itemsErr } = await supabase.from('BookingItems').insert(bookingItems);

    // ── NẾU INSERT ITEMS LỖI: COMPENSATION ROLLBACK ───
    if (itemsErr) {
      console.error('❌ [API Bookings] INSERT BookingItems lỗi -> Kích hoạt rollback xóa Booking:', itemsErr.message);
      
      // Rollback: Xóa bản ghi Booking vừa tạo để tránh đơn hàng ma
      const { error: rollbackErr } = await supabase.from('Bookings').delete().eq('id', bookingId);
      if (rollbackErr) {
        console.error('🚨 [API Bookings] Rollback xóa Booking thất bại:', rollbackErr.message);
      } else {
        console.log(`🧹 [API Bookings] Đã rollback xóa thành công Booking mồ côi: ${bookingId}`);
      }

      return NextResponse.json(
        {
          success: false,
          error: `Không thể tạo danh sách dịch vụ chi tiết (${itemsErr.message}). Đơn hàng đã được tự động hoàn tác.`,
        },
        { status: 500 }
      );
    }

    // ── 9. Gửi email xác nhận (Chỉ chạy khi CẢ HAI INSERT đều thành công) ─
    let emailStatus: { sent: boolean; messageId?: string; error?: string } = { sent: false };
    if (cleanEmail) {
      const explicitStaffGender = staffGender && staffGender !== 'any' ? staffGender : undefined;
      const explicitServiceTherapist = validatedServiceList.find(
        (s: any) => s.options?.therapist && s.options.therapist !== 'any'
      )?.options?.therapist;
      const chosenGender = explicitStaffGender || explicitServiceTherapist || 'any';

      try {
        const mailRes = await sendBookingConfirmationEmail({
          bookingId,
          customerName: name.trim(),
          customerEmail: cleanEmail,
          customerPhone: cleanPhone || '',
          date: date || '',
          time: time || '',
          guests: guests ? Number(guests) : 1,
          branchName: branchName || BRANCH_DEFAULT,
          services: validatedServiceList,
          totalAmount: serverCalculatedTotalAmount,
          therapist: chosenGender,
          lang: lang || 'vi',
          notes: note?.trim() || undefined,
          focusAreaNote: finalFocusAreaNote || undefined,
        });

        if (mailRes?.success) {
          emailStatus = { sent: true, messageId: mailRes.messageId };
          console.log(`✅ [API Bookings] Email đã gửi thành công cho ${cleanEmail}: ${mailRes.messageId}`);
          await supabase
            .from('Bookings')
            .update({ reception_feedback: `Email sent: ${mailRes.messageId}` })
            .eq('id', bookingId);
        } else {
          emailStatus = { sent: false, error: mailRes?.error || 'Failed to send email' };
          console.error(`❌ [API Bookings] Gửi email thất bại cho ${cleanEmail}:`, mailRes?.error);
          await supabase
            .from('Bookings')
            .update({ reception_feedback: `Email error: ${mailRes?.error || 'Unknown'}` })
            .eq('id', bookingId);
        }
      } catch (mailErr: any) {
        console.error('⚠️ [API Bookings] Ngoại lệ gửi email xác nhận:', mailErr.message);
        emailStatus = { sent: false, error: mailErr.message };
        await supabase
          .from('Bookings')
          .update({ reception_feedback: `Email exception: ${mailErr.message}` })
          .eq('id', bookingId);
      }
    }

    console.log(`✅ [API Bookings] Đơn WB tạo thành công hoàn chỉnh: ${bookingId}, tổng tiền: ${serverCalculatedTotalAmount}đ`);

    return NextResponse.json({
      success: true,
      data: {
        bookingId,
        billCode: bookingId,
        customerName: name.trim(),
        customerPhone: cleanPhone,
        date,
        time,
        branchName: branchName || BRANCH_DEFAULT,
        services: validatedServiceList,
        totalAmount: serverCalculatedTotalAmount,
        lang: lang || 'vi',
        emailStatus,
      },
    });
  } catch (error: any) {
    console.error('❌ [API Bookings] Lỗi không xác định:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi server không xác định' },
      { status: 500 }
    );
  }
}
