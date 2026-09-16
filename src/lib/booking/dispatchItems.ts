/**
 * Converts the checkout's logical cart lines into the physical BookingItems
 * rows consumed by the operations/dispatch screens.
 *
 * The customer-facing cart intentionally keeps `quantity` on one logical
 * line. Operations, however, assigns a therapist per service instance, so a
 * quantity of N is persisted as N rows with quantity=1. Private-room add-ons
 * follow the same expansion and remain linked to their parent service.
 */

export const MAX_DISPATCH_ITEMS = 100;
export const PRIVATE_ROOM_SERVICE_ID = 'NHS0900';

export type DispatchBookingLine = {
  serviceId: string;
  lineIndex: number;
  quantity: number;
  priceVND: number;
  addonPriceVND: number;
  hasPrivateRoom: boolean;
  options: Record<string, unknown>;
};

/**
 * The operations app consumes a flat, Vietnamese-only option snapshot. Keep
 * this translation at the server boundary so a customer's checkout language
 * can never leak into staff-facing notes/focus/avoid values.
 */
export type DispatchOptionInput = {
  strength?: unknown;
  therapist?: unknown;
  focus?: unknown;
  avoid?: unknown;
  notes?: { tag0?: unknown; tag1?: unknown; content?: unknown };
  tags?: unknown;
};

const OPTION_VI: Record<string, string> = {
  light: 'Nhẹ', soft: 'Nhẹ', 'nhẹ': 'Nhẹ',
  medium: 'Vừa', normal: 'Vừa', 'vừa': 'Vừa',
  strong: 'Mạnh', hard: 'Mạnh', 'mạnh': 'Mạnh',
  male: 'Nam', nam: 'Nam',
  female: 'Nữ', 'nữ': 'Nữ', nu: 'Nữ',
  random: 'Ngẫu nhiên', any: 'Ngẫu nhiên', 'ngẫu nhiên': 'Ngẫu nhiên',
  head: 'Đầu', 'đầu': 'Đầu',
  neck: 'Cổ', 'cổ': 'Cổ',
  shoulder: 'Vai', 'vai': 'Vai',
  back: 'Lưng', 'lưng': 'Lưng',
  waist: 'Thắt lưng', 'thắt lưng': 'Thắt lưng',
  arm: 'Tay', 'tay': 'Tay',
  thigh: 'Đùi', 'đùi': 'Đùi',
  knee: 'Đầu gối', 'đầu gối': 'Đầu gối',
  calf: 'Bắp chân', 'bắp chân': 'Bắp chân',
  foot: 'Bàn chân', 'bàn chân': 'Bàn chân',
  whole_body: 'Toàn thân', full_body: 'Toàn thân', 'toàn thân': 'Toàn thân',
  pregnant: 'Mang thai', pregnancy: 'Mang thai', 'mang thai': 'Mang thai', 'phụ nữ có thai': 'Mang thai',
  allergy: 'Dị ứng', 'dị ứng': 'Dị ứng', 'có dị ứng': 'Dị ứng',
};

function optionVietnamese(value: unknown): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return OPTION_VI[trimmed.toLowerCase()] || trimmed;
}

function tagVietnamese(value: unknown, fallback: string): string {
  if (typeof value === 'string') return optionVietnamese(value) || value.trim() || fallback;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    for (const key of ['vi', 'vn', 'VI', 'VN', 'en', 'EN']) {
      if (typeof record[key] === 'string' && record[key].trim()) {
        return optionVietnamese(record[key]) || record[key].trim();
      }
    }
  }
  return fallback;
}

/** Convert checkout options to the flat Vietnamese shape used by operations. */
export function canonicalizeDispatchOptions(input: DispatchOptionInput): Record<string, unknown> {
  const focus = Array.isArray(input.focus) ? input.focus.map(optionVietnamese).filter(Boolean) : [];
  const avoid = Array.isArray(input.avoid) ? input.avoid.map(optionVietnamese).filter(Boolean) : [];
  const tags: string[] = [];
  if (input.notes?.tag0 === true) tags.push(tagVietnamese(Array.isArray(input.tags) ? input.tags[0] : undefined, 'Mang thai'));
  if (input.notes?.tag1 === true) tags.push(tagVietnamese(Array.isArray(input.tags) ? input.tags[1] : undefined, 'Dị ứng'));
  const note = typeof input.notes?.content === 'string' ? input.notes.content.trim() : '';
  return {
    ...(optionVietnamese(input.strength) ? { strength: optionVietnamese(input.strength) } : {}),
    ...(optionVietnamese(input.therapist) ? { therapist: optionVietnamese(input.therapist) } : {}),
    ...(focus.length ? { focus } : {}),
    ...(avoid.length ? { avoid } : {}),
    ...(tags.length ? { tags } : {}),
    ...(note ? { note } : {}),
  };
}

/**
 * Canonicalize the flat shape already stored in BookingItems. Older
 * WebBooking rows packed the two system tags into `note`; unpack those
 * prefixes so idempotent retries compare equal to the new shape.
 */
export function canonicalizeStoredDispatchOptions(input: Record<string, unknown>): Record<string, unknown> {
  const rawNote = typeof input.note === 'string' ? input.note.trim() : '';
  const noteParts = rawNote ? rawNote.split(/\s+-\s+/) : [];
  const legacyTags: string[] = [];
  while (noteParts.length) {
    const candidate = optionVietnamese(noteParts[0]);
    if (candidate !== 'Mang thai' && candidate !== 'Dị ứng') break;
    legacyTags.push(candidate);
    noteParts.shift();
  }
  // Replay identity is semantic (tag0/tag1), not dependent on a mutable
  // localized label in the Services catalog. Use the stable Vietnamese
  // fallback values for comparison while the write path may still preserve
  // the catalog's Vietnamese display labels.
  const hasSuppliedTags = Array.isArray(input.tags);
  const suppliedTagCount = hasSuppliedTags ? (input.tags as unknown[]).length : 0;
  const hasTag0 = legacyTags.includes('Mang thai') || suppliedTagCount > 0;
  const hasTag1 = legacyTags.includes('Dị ứng') || suppliedTagCount > 1;
  const suppliedTags = [hasTag0 ? 'Mang thai' : '', hasTag1 ? 'Dị ứng' : ''].filter(Boolean);
  return canonicalizeDispatchOptions({
    strength: input.strength,
    therapist: input.therapist,
    focus: input.focus,
    avoid: input.avoid,
    tags: suppliedTags,
    notes: {
      tag0: hasTag0,
      tag1: hasTag1,
      content: noteParts.join(' - '),
    },
  });
}

function assertQuantity(quantity: number, lineIndex: number): void {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error(`BOOKING_ITEM_QUANTITY_INVALID:${lineIndex}`);
  }
}

/** Number of physical rows written for the supplied logical cart lines. */
export function expandedDispatchItemCount(lines: DispatchBookingLine[]): number {
  return lines.reduce((total, line) => {
    assertQuantity(line.quantity, line.lineIndex);
    return total + line.quantity * (line.hasPrivateRoom ? 2 : 1);
  }, 0);
}

/**
 * Expand logical quantities into one BookingItems row per service instance.
 * The function is deliberately pure so the API can validate the 100-row
 * writer limit before allocating a booking number or resolving a customer.
 */
export function expandDispatchItems(
  lines: DispatchBookingLine[],
  bookingId: string,
): Record<string, unknown>[] {
  const count = expandedDispatchItemCount(lines);
  if (count > MAX_DISPATCH_ITEMS) {
    throw new Error(`BOOKING_ITEMS_LIMIT:${count}`);
  }

  const rows: Record<string, unknown>[] = [];
  for (const line of lines) {
    for (let unitIndex = 0; unitIndex < line.quantity; unitIndex += 1) {
      const unit = unitIndex + 1;
      rows.push({
        id: `${bookingId}-${line.serviceId}-${line.lineIndex}-unit${unit}`,
        bookingId,
        serviceId: line.serviceId,
        quantity: 1,
        price: line.priceVND,
        status: 'WAITING',
        options: { ...line.options },
        tip: 0,
      });

      if (line.hasPrivateRoom) {
        rows.push({
          id: `${bookingId}-${PRIVATE_ROOM_SERVICE_ID}-${line.lineIndex}-unit${unit}`,
          bookingId,
          serviceId: PRIVATE_ROOM_SERVICE_ID,
          quantity: 1,
          price: line.addonPriceVND,
          status: 'WAITING',
          options: {
            displayName: 'Phòng riêng',
            parentServiceId: line.serviceId,
            isAddon: true,
          },
          tip: 0,
        });
      }
    }
  }
  return rows;
}
