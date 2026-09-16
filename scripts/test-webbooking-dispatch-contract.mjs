import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { canonicalizeDispatchOptions, canonicalizeStoredDispatchOptions, expandDispatchItems, expandedDispatchItemCount, MAX_DISPATCH_ITEMS } from '../src/lib/booking/dispatchItems.ts';

const root = new URL('../', import.meta.url);
const route = readFileSync(new URL('src/app/api/bookings/route.ts', root), 'utf8');
const writer = readFileSync(new URL('supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql', root), 'utf8');
const migration = readFileSync(new URL('supabase/migrations/20260916_webbooking_source_case.sql', root), 'utf8');

const lines = [{
  serviceId: 'NHS1001',
  lineIndex: 0,
  quantity: 2,
  priceVND: 685000,
  addonPriceVND: 90000,
  hasPrivateRoom: true,
  options: { therapist: 'Nam', strength: 'MEDIUM' },
}];

const rows = expandDispatchItems(lines, 'WB-16092026-001');
assert.equal(expandedDispatchItemCount(lines), 4, 'quantity=2 with a private room must create four physical rows');
assert.equal(rows.length, 4);
assert.deepEqual(rows.map((row) => row.quantity), [1, 1, 1, 1]);
assert.deepEqual(rows.filter((row) => row.serviceId === 'NHS1001').map((row) => row.price), [685000, 685000]);
assert.deepEqual(rows.filter((row) => row.serviceId === 'NHS0900').map((row) => row.price), [90000, 90000]);
assert.equal(rows.reduce((total, row) => total + Number(row.price) * Number(row.quantity), 0), 2 * (685000 + 90000));
assert.equal(new Set(rows.map((row) => row.id)).size, rows.length, 'expanded row IDs must be unique');
assert.throws(() => expandDispatchItems([{ ...lines[0], quantity: 51 }], 'WB-16092026-001'), /BOOKING_ITEMS_LIMIT/);
assert.equal(MAX_DISPATCH_ITEMS, 100);

assert.deepEqual(canonicalizeDispatchOptions({
  strength: 'medium',
  therapist: 'random',
  focus: ['HEAD', 'neck'],
  avoid: ['FOOT'],
  notes: { tag0: true, tag1: true, content: 'Khách muốn nhẹ tay' },
}), {
  strength: 'Vừa',
  therapist: 'Ngẫu nhiên',
  focus: ['Đầu', 'Cổ'],
  avoid: ['Bàn chân'],
  tags: ['Mang thai', 'Dị ứng'],
  note: 'Khách muốn nhẹ tay',
}, 'staff-facing options must be Vietnamese and independent of customer language');
assert.deepEqual(canonicalizeStoredDispatchOptions({
  strength: 'NORMAL', therapist: 'Ngẫu nhiên', focus: ['HEAD'], avoid: ['FOOT'],
  note: 'Phụ nữ có thai - Có dị ứng - Khách muốn nhẹ tay',
}), {
  strength: 'Vừa', therapist: 'Ngẫu nhiên', focus: ['Đầu'], avoid: ['Bàn chân'],
  tags: ['Mang thai', 'Dị ứng'], note: 'Khách muốn nhẹ tay',
}, 'legacy packed note tags must replay against the new flat shape');
assert.deepEqual(canonicalizeDispatchOptions({
  notes: { tag0: true, tag1: true },
  tags: [{ vi: 'Phụ nữ có thai', en: 'Pregnant' }, { vn: 'Có dị ứng', en: 'Allergy' }],
}), { tags: ['Mang thai', 'Dị ứng'] }, 'localized catalog tags must be canonicalized to Vietnamese');
assert.match(route, /canonicalizeDispatchOptions/);
assert.match(route, /canonicalizeStoredDispatchOptions/);
assert.match(route, /focusAreaNote: preferenceNotes\.focusAreaNote/);
assert.match(route, /tags\.join\(', '\)/);
assert.match(route, /focusConfig, tags/);
assert.match(route, /serviceName\(item\.catalog, booking\.lang\)/, 'service title must remain customer-language aware');
assert.match(route, /serviceName\(item\.catalog, 'vi'\)/, 'admin note heading must be Vietnamese');
assert.match(route, /Kỹ thuật viên: \$\{operationOptions\.therapist\}/, 'admin therapist label must be Vietnamese');
assert.match(route, /Lực: \$\{operationOptions\.strength\}/, 'admin pressure label must be Vietnamese');
assert.match(route, /Tập trung: \$\{operationOptions\.focus\.join\(', '\)\}/, 'admin focus label must be Vietnamese');
assert.match(route, /Né: \$\{operationOptions\.avoid\.join\(', '\)\}/, 'admin avoid label must be Vietnamese');
assert.match(route, /Ghi chú: \$\{operationOptions\.tags\.join\(', '\)\}/, 'admin note label must be Vietnamese');
const adminLabelOrder = ['Kỹ thuật viên:', 'Lực:', 'Tập trung:', 'Né:', 'Ghi chú:'];
assert.ok(adminLabelOrder.every((label, index) => index === 0 || route.indexOf(label) > route.indexOf(adminLabelOrder[index - 1])), 'admin preference labels must follow the agreed order');
assert.doesNotMatch(route, /Therapist: random|Pressure: medium|Focus: \$\{item\.options\.bodyParts/);

assert.match(route, /source: 'WebBooking'/);
assert.match(route, /items = buildBookingItems\(pricing, committedId\)/);
assert.match(route, /quantity: 1/);
assert.match(writer, /p_booking->>'source' IS DISTINCT FROM 'WebBooking'/);
assert.match(writer, /v_id, v_id, 'WebBooking'/);
assert.match(migration, /to_regprocedure\('public\.webbooking_commit_booking\(jsonb,jsonb\)'\)/);
assert.match(migration, /Unexpected WEB_BOOKING literal count/);

console.log('WebBooking dispatch contract: PASS (logical quantity expands to physical quantity=1 rows; source is WebBooking).');
