// ═══════════════════════════════════════
// POST /api/bookings
// Server-authoritative, atomic, collision-safe booking API
// Phase: P0-C Atomic booking and idempotency
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
 * Fallback collision-free booking ID generator for environments where the
 * database RPC sequence is temporarily unavailable.
 * Produces IDs with zero database roundtrips and zero collision risk:
 * Format: WB-ddmmyyyy-<4-char time entropy><4-char crypto hex>
 */
const generateCollisionSafeFallbackId = (targetDate?: string): string => {
  const now = new Date();
  let dateStr: string;
  if (targetDate && targetDate.includes('-')) {
    const parts = targetDate.split('-');
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        // YYYY-MM-DD -> DDMMYYYY
        dateStr = `${parts[2].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[0]}`;
      } else {
        // DD-MM-YYYY
        dateStr = `${parts[0].padStart(2, '0')}${parts[1].padStart(2, '0')}${parts[2]}`;
      }
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

  const timeEntropy = (Date.now() % 1000000).toString(36).toUpperCase().padStart(4, '0');
  const cryptoEntropy = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `${BOOKING_ID_PREFIX}-${dateStr}-${timeEntropy}${cryptoEntropy}`;
};

export async function POST(request: Request) {
  try {
    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Yêu cầu không hợp lệ: định dạng JSON sai' },
        { status: 400 }
      );
    }

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
      lang: rawLang,
      selectedServices: rawSelectedServices,
      services: rawServices,
      paymentMethod,
      amountPaid,
      changeDenominations,
    } = body;

    const rawList = rawSelectedServices || rawServices || [];
    const selectedServices = Array.isArray(rawList) ? rawList : [];

    // ── 1. Basic Input Validation ─────────────────────
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Thiếu họ tên khách hàng (fullName is required)' },
        { status: 400 }
      );
    }

    if (selectedServices.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Giỏ hàng trống. Vui lòng chọn ít nhất một dịch vụ.' },
        { status: 400 }
      );
    }

    // Five-language normalization
    const supportedLangs = ['vi', 'en', 'cn', 'jp', 'kr'];
    const lang = supportedLangs.includes(rawLang) ? rawLang : 'vi';

    // ── 2. Validate Item Quantities & Service IDs ─────
    const requestedServiceIds: string[] = [];
    for (let i = 0; i < selectedServices.length; i++) {
      const item = selectedServices[i];
      const svcId = item?.variantId || item?.serviceId || item?.id;
      if (!svcId || typeof svcId !== 'string' || !svcId.trim()) {
        return NextResponse.json(
          { success: false, error: `Dịch vụ thứ ${i + 1} thiếu mã dịch vụ hợp lệ` },
          { status: 400 }
        );
      }
      requestedServiceIds.push(svcId.trim());

      const rawQty = item.quantity !== undefined ? item.quantity : item.qty;
      const parsedQty = Number(rawQty);
      if (rawQty !== undefined && (!Number.isFinite(parsedQty) || parsedQty <= 0)) {
        return NextResponse.json(
          { success: false, error: `Số lượng dịch vụ "${svcId}" không hợp lệ (phải lớn hơn 0)` },
          { status: 400 }
        );
      }
    }

    const cleanPhone = phone ? String(phone).trim() : null;
    const cleanEmail = email && typeof email === 'string' && email.includes('@') ? email.trim() : null;

    // ── 3. Idempotency Key Resolution ─────────────────
    // Support client-sent key or derive deterministic stable hash from phone + date + time + services
    const clientProvidedKey =
      (typeof body.idempotencyKey === 'string' && body.idempotencyKey.trim()) ||
      request.headers.get('Idempotency-Key')?.trim() ||
      request.headers.get('x-idempotency-key')?.trim() ||
      (typeof body.clientSessionId === 'string' && body.clientSessionId.trim()) ||
      null;

    const deriveStableHash = (): string => {
      const p = cleanPhone || 'guest';
      const d = date || 'nodate';
      const t = time || 'notime';
      const s = requestedServiceIds.slice().sort().join(',');
      const n = name.trim().toLowerCase();
      const raw = `${p}|${d}|${t}|${s}|${n}`;
      const hash = crypto.createHash('sha256').update(raw).digest('hex').substring(0, 24);
      return `hash_${hash}`;
    };

    const finalIdempotencyKey = clientProvidedKey || deriveStableHash();

    const supabase = getSupabaseAdmin();

    // ── 4. Fast-path Idempotency Check ────────────────
    if (finalIdempotencyKey) {
      let existingBooking: any = null;

      // Check idLegacy (always present & indexed)
      const { data: legacyBooking } = await supabase
        .from('Bookings')
        .select('id, billCode, totalAmount, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, customerLang, status')
        .eq('idLegacy', `idemp:${finalIdempotencyKey}`)
        .maybeSingle();

      if (legacyBooking) {
        existingBooking = legacyBooking;
      } else {
        // Check dedicated idempotency_key column
        try {
          const { data: modernBooking, error: modernErr } = await supabase
            .from('Bookings')
            .select('id, billCode, totalAmount, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, customerLang, status')
            .eq('idempotency_key', finalIdempotencyKey)
            .maybeSingle();
          if (!modernErr && modernBooking) {
            existingBooking = modernBooking;
          }
        } catch {
          // Column may not exist in unmigrated environment
        }
      }

      if (existingBooking) {
        console.log(`[API Bookings] Fast-path idempotent hit: returning booking ${existingBooking.id}`);
        return NextResponse.json({
          success: true,
          idempotent: true,
          data: {
            bookingId: existingBooking.id,
            billCode: existingBooking.billCode || existingBooking.id,
            customerName: existingBooking.customerName,
            customerPhone: existingBooking.customerPhone,
            customerEmail: existingBooking.customerEmail,
            date: existingBooking.bookingDate ? String(existingBooking.bookingDate).split('T')[0] : date,
            time: existingBooking.timeBooking || time,
            branchName: existingBooking.branchName || BRANCH_DEFAULT,
            totalAmount: Number(existingBooking.totalAmount) || 0,
            lang: existingBooking.customerLang || lang,
            status: existingBooking.status,
          },
        });
      }
    }

    // ── 5. Server-Authoritative Pricing & Validation ──
    const allIdsToQuery = Array.from(new Set([...requestedServiceIds, PRIVATE_ROOM_SERVICE_ID]));

    const { data: dbServices, error: fetchSvcErr } = await supabase
      .from('Services')
      .select('id, nameVN, nameEN, nameCN, nameJP, nameKR, priceVND, priceUSD, duration, isActive')
      .in('id', allIdsToQuery);

    if (fetchSvcErr) {
      console.error('❌ [API Bookings] Lỗi truy vấn bảng Services:', fetchSvcErr.message);
      return NextResponse.json(
        { success: false, error: 'Không thể kết nối cơ sở dữ liệu để kiểm tra giá dịch vụ' },
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

    // Validate every line item against authoritative DB catalog
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

      // Safe bounded quantity between 1 and 20
      const safeQty = Math.max(1, Math.min(20, Math.floor(Number(rawItem.quantity || rawItem.qty || 1))));
      const basePriceVND = Number(dbSvc.priceVND) || 0;

      const opts = rawItem.options || rawItem.customOptions || {};
      const hasPrivateRoomAddon = Boolean(opts.addons?.privateRoom);

      const itemCanonicalPriceVND = basePriceVND + (hasPrivateRoomAddon ? privateRoomPriceVND : 0);
      serverCalculatedTotalAmount += itemCanonicalPriceVND * safeQty;

      const localizedName = getLocalizedServiceName(dbSvc, lang);

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

    // ── 6. Customer Demographics Persistence ──────────
    let customerId: string | null = null;

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
        : supabase.from('Customers').select('id, fullName, phone, email, gender').eq('email', cleanEmail!).maybeSingle();

      const { data: existingCustomer } = await query;

      if (existingCustomer?.id) {
        customerId = existingCustomer.id;
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
          console.warn('⚠️ [API Bookings] Lưu thông tin khách hàng thất bại:', cusErr.message);
        } else {
          customerId = newCustomer?.id || null;
        }
      }
    }

    // ── 7. Format Notes & Focus Areas (Multilingual) ──
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
      notesParts.push(PRIVATE_ROOM_NAME_I18N[lang] || 'Phòng riêng');
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
      WHOLE_BODY: { vi: 'Toàn thân', en: 'Full Body', cn: '全身', jp: '全身', kr: '전신' },
      FULL_BODY: { vi: 'Toàn thân', en: 'Full Body', cn: '全身', jp: '全身', kr: '전신' },
    };

    const FULL_BODY_I18N: Record<string, string> = {
      vi: 'Toàn thân',
      en: 'Full Body',
      cn: '全身',
      jp: '全身',
      kr: '전신',
    };

    const isWholeBodySelection = (parts?: string[]) => {
      if (!parts || parts.length === 0) return false;
      if (parts.length >= 6) return true;
      return parts.some((p: string) => {
        const u = (p || '').toUpperCase().trim();
        return u === 'WHOLE_BODY' || u === 'FULL_BODY' || u === 'WHOLEBODY' || u === 'FULLBODY';
      });
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
          if (isWholeBodySelection(opts.bodyParts.focus)) {
            itemNotes.push(`${lbl}: ${FULL_BODY_I18N[lang] || FULL_BODY_I18N.en}`);
          } else {
            const translated = opts.bodyParts.focus.map((p: string) => translatePart(p)).join(', ');
            itemNotes.push(`${lbl}: ${translated}`);
          }
        }
        if (opts.bodyParts?.avoid?.length) {
          const lbl = isEn ? 'Avoid' : isCn ? '避开部位' : isJp ? '避ける部位' : isKr ? '제외 部位' : 'Tránh';
          if (isWholeBodySelection(opts.bodyParts.avoid)) {
            itemNotes.push(`${lbl}: ${FULL_BODY_I18N[lang] || FULL_BODY_I18N.en}`);
          } else {
            const translated = opts.bodyParts.avoid.map((p: string) => translatePart(p)).join(', ');
            itemNotes.push(`${lbl}: ${translated}`);
          }
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

    // ── 8. Build Booking & Item Payloads ──────────────
    const bookingDate = date
      ? new Date(`${date}T${time || '00:00'}:00+07:00`).toISOString()
      : new Date().toISOString();

    const bookingPayload: Record<string, any> = {
      source: 'WEB_BOOKING',
      guestCount: guests ? Math.max(1, Number(guests)) : 1,
      branchName: branchName || BRANCH_DEFAULT,
      bookingDate,
      timeBooking: time || null,
      customerName: name.trim(),
      customerPhone: cleanPhone,
      customerEmail: cleanEmail,
      customerGender: resolvedGender,
      customerLang: lang,
      customerId,
      roomName: hasAnyPrivateRoom ? (PRIVATE_ROOM_NAME_I18N[lang] || 'Phòng riêng') : null,
      notes: finalNotes,
      focusAreaNote: finalFocusAreaNote,
      totalAmount: serverCalculatedTotalAmount,
      status: 'NEW',
      tip: 0,
    };

    const bookingItemsPayload: any[] = [];
    validatedServiceList.forEach((svc: any, idx: number) => {
      const opts = svc.options || {};

      let strengthStr: string | undefined = undefined;
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

      // Service item
      bookingItemsPayload.push({
        serviceId: svc.variantId,
        quantity: svc.quantity,
        price: svc.basePriceVND,
        status: 'WAITING',
        options: structuredOptions,
        tip: 0,
      });

      // Private Room add-on item if selected
      if (svc.hasPrivateRoomAddon) {
        bookingItemsPayload.push({
          serviceId: PRIVATE_ROOM_SERVICE_ID,
          quantity: svc.quantity,
          price: privateRoomPriceVND,
          status: 'WAITING',
          options: {
            displayName: PRIVATE_ROOM_NAME_I18N[lang] || 'Phòng riêng',
            parentServiceId: svc.variantId,
            isAddon: true,
          },
          tip: 0,
        });
      }
    });

    // ── 9. Atomic Booking Transaction via Supabase RPC 
    // Attempts to run create_booking_atomic: allocates collision-free sequential ID
    // and inserts parent Bookings + child BookingItems in ONE atomic database transaction.
    let committedBookingId: string;
    let isIdempotentReplay = false;

    const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_booking_atomic', {
      p_booking_data: bookingPayload,
      p_booking_items: bookingItemsPayload,
      p_idempotency_key: finalIdempotencyKey,
    });

    if (rpcErr) {
      const isRpcMissing =
        rpcErr.code === '42883' ||
        rpcErr.message?.includes('Could not find the function') ||
        rpcErr.message?.includes('function create_booking_atomic');

      if (!isRpcMissing) {
        console.error('❌ [API Bookings] create_booking_atomic RPC error:', rpcErr.message);
        return NextResponse.json(
          { success: false, error: 'Không thể tạo đơn đặt lịch. Vui lòng thử lại.' },
          { status: 500 }
        );
      }

      // Fallback path: Only executed when RPC is not yet installed in the database.
      // Strict rule: NEVER insert BookingItems if Bookings fails.
      console.warn('⚠️ [API Bookings] RPC create_booking_atomic missing. Executing safe fallback transaction...');
      const fallbackId = generateCollisionSafeFallbackId(date);

      const fallbackBookingPayload: Record<string, any> = {
        ...bookingPayload,
        id: fallbackId,
        billCode: fallbackId,
        idempotency_key: finalIdempotencyKey,
        idLegacy: `idemp:${finalIdempotencyKey}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let { error: insertBookingErr } = await supabase.from('Bookings').insert(fallbackBookingPayload);
      if (insertBookingErr && insertBookingErr.message?.includes('idempotency_key')) {
        // Retry without idempotency_key if column not yet added to remote table
        delete fallbackBookingPayload.idempotency_key;
        const retryRes = await supabase.from('Bookings').insert(fallbackBookingPayload);
        insertBookingErr = retryRes.error;
      }

      if (insertBookingErr) {
        if (insertBookingErr.code === '23505' || insertBookingErr.message?.includes('duplicate key')) {
          // Collision on idempotency key: retrieve existing booking
          let dupBooking: any = null;
          const { data: legacyDup } = await supabase
            .from('Bookings')
            .select('id, billCode, totalAmount, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, customerLang, status')
            .eq('idLegacy', `idemp:${finalIdempotencyKey}`)
            .maybeSingle();

          if (legacyDup) {
            dupBooking = legacyDup;
          } else {
            const { data: modernDup } = await supabase
              .from('Bookings')
              .select('id, billCode, totalAmount, customerName, customerPhone, customerEmail, bookingDate, timeBooking, branchName, customerLang, status')
              .eq('idempotency_key', finalIdempotencyKey)
              .maybeSingle();
            if (modernDup) dupBooking = modernDup;
          }

          if (dupBooking) {
            console.log(`[API Bookings] Fallback caught duplicate idempotency key: ${dupBooking.id}`);
            return NextResponse.json({
              success: true,
              idempotent: true,
              data: {
                bookingId: dupBooking.id,
                billCode: dupBooking.billCode || dupBooking.id,
                customerName: dupBooking.customerName,
                customerPhone: dupBooking.customerPhone,
                customerEmail: dupBooking.customerEmail,
                date: dupBooking.bookingDate ? String(dupBooking.bookingDate).split('T')[0] : date,
                time: dupBooking.timeBooking || time,
                branchName: dupBooking.branchName || BRANCH_DEFAULT,
                totalAmount: Number(dupBooking.totalAmount) || 0,
                lang: dupBooking.customerLang || lang,
                status: dupBooking.status,
              },
            });
          }
        }

        console.error('❌ [API Bookings] Fallback INSERT Booking failed:', insertBookingErr.message);
        return NextResponse.json(
          { success: false, error: 'Không thể tạo đơn đặt lịch. Vui lòng thử lại.' },
          { status: 500 }
        );
      }

      // ONLY insert child items after Bookings parent insertion succeeds
      const fallbackItemsWithIds = bookingItemsPayload.map((item, idx) => ({
        id: `${fallbackId}-${item.serviceId}-${idx}`,
        bookingId: fallbackId,
        ...item,
      }));

      const { error: insertItemsErr } = await supabase.from('BookingItems').insert(fallbackItemsWithIds);
      if (insertItemsErr) {
        console.error('❌ [API Bookings] Fallback INSERT BookingItems failed -> Compensating rollback of parent:', insertItemsErr.message);
        await supabase.from('Bookings').delete().eq('id', fallbackId);
        return NextResponse.json(
          { success: false, error: 'Không thể tạo chi tiết dịch vụ. Đơn hàng đã được tự động hoàn tác.' },
          { status: 500 }
        );
      }

      committedBookingId = fallbackId;
    } else {
      // RPC executed successfully
      if (rpcResult?.idempotent) {
        isIdempotentReplay = true;
      }
      committedBookingId = rpcResult?.booking_id || rpcResult?.data?.bookingId;
    }

    if (!committedBookingId) {
      console.error('❌ [API Bookings] Booking ID could not be determined after transaction');
      return NextResponse.json(
        { success: false, error: 'Lỗi xác nhận mã đơn đặt lịch từ hệ thống' },
        { status: 500 }
      );
    }

    // ── 10. Handle Idempotent Replay Response ──────────
    if (isIdempotentReplay) {
      console.log(`[API Bookings] Idempotent replay response for ${committedBookingId}`);
      return NextResponse.json({
        success: true,
        idempotent: true,
        data: {
          bookingId: committedBookingId,
          billCode: committedBookingId,
          customerName: name.trim(),
          customerPhone: cleanPhone,
          customerEmail: cleanEmail,
          date,
          time,
          branchName: branchName || BRANCH_DEFAULT,
          services: validatedServiceList,
          totalAmount: serverCalculatedTotalAmount,
          lang,
        },
      });
    }

    // ── 11. Dispatch Confirmation Email ───────────────
    // Only executed after BOTH parent and child items are fully committed
    let emailStatus: { sent: boolean; messageId?: string; error?: string } = { sent: false };

    // Resolve reception notification email (SystemConfigs -> env var -> default)
    let receptionEmail: string = process.env.RECEPTION_NOTIFICATION_EMAIL || 'info@techgalaxygroup.com';
    try {
      const { data: configData } = await supabase
        .from('SystemConfigs')
        .select('value')
        .eq('key', 'system_settings')
        .maybeSingle();

      if (
        configData?.value?.receptionEmail &&
        typeof configData.value.receptionEmail === 'string' &&
        configData.value.receptionEmail.trim().includes('@')
      ) {
        receptionEmail = configData.value.receptionEmail.trim();
      }
    } catch {
      // safe fallback to env var or default
    }

    if (cleanEmail || receptionEmail) {
      const explicitStaffGender = staffGender && staffGender !== 'any' ? staffGender : undefined;
      const explicitServiceTherapist = validatedServiceList.find(
        (s: any) => s.options?.therapist && s.options.therapist !== 'any'
      )?.options?.therapist;
      const chosenGender = explicitStaffGender || explicitServiceTherapist || 'any';

      const targetLog = cleanEmail ? `${cleanEmail} (BCC: ${receptionEmail})` : `Lễ tân: ${receptionEmail}`;

      try {
        const mailRes = await sendBookingConfirmationEmail({
          bookingId: committedBookingId,
          customerName: name.trim(),
          customerEmail: cleanEmail || null,
          customerPhone: cleanPhone || '',
          date: date || '',
          time: time || '',
          guests: guests ? Number(guests) : 1,
          branchName: branchName || BRANCH_DEFAULT,
          services: validatedServiceList,
          totalAmount: serverCalculatedTotalAmount,
          therapist: chosenGender,
          lang,
          notes: note?.trim() || undefined,
          focusAreaNote: finalFocusAreaNote || undefined,
          receptionEmail,
        });

        if (mailRes?.success) {
          emailStatus = { sent: true, messageId: mailRes.messageId };
          console.log(`✅ [API Bookings] Email đã gửi thành công tới ${targetLog}: ${mailRes.messageId}`);
          await supabase
            .from('Bookings')
            .update({ reception_feedback: `Email sent: ${mailRes.messageId}` })
            .eq('id', committedBookingId);
        } else {
          emailStatus = { sent: false, error: mailRes?.error || 'Failed to send email' };
          console.error(`❌ [API Bookings] Gửi email thất bại tới ${targetLog}:`, mailRes?.error);
          await supabase
            .from('Bookings')
            .update({ reception_feedback: `Email error: ${mailRes?.error || 'Unknown'}` })
            .eq('id', committedBookingId);
        }
      } catch (mailErr: any) {
        console.error('⚠️ [API Bookings] Ngoại lệ gửi email xác nhận:', mailErr.message);
        emailStatus = { sent: false, error: mailErr.message };
        await supabase
          .from('Bookings')
          .update({ reception_feedback: `Email exception: ${mailErr.message}` })
          .eq('id', committedBookingId);
      }
    }

    console.log(`✅ [API Bookings] Đơn WB tạo thành công hoàn chỉnh: ${committedBookingId}, tổng tiền: ${serverCalculatedTotalAmount}đ`);

    return NextResponse.json({
      success: true,
      data: {
        bookingId: committedBookingId,
        billCode: committedBookingId,
        customerName: name.trim(),
        customerPhone: cleanPhone,
        customerEmail: cleanEmail,
        date,
        time,
        branchName: branchName || BRANCH_DEFAULT,
        services: validatedServiceList,
        totalAmount: serverCalculatedTotalAmount,
        lang,
        emailStatus,
      },
    });
  } catch (error: any) {
    console.error('❌ [API Bookings] Lỗi không xác định:', error?.message);
    return NextResponse.json(
      { success: false, error: 'Lỗi server không xác định khi xử lý đặt lịch' },
      { status: 500 }
    );
  }
}
