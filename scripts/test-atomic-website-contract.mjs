import assert from 'node:assert/strict';
import fs from 'node:fs';

const route = fs.readFileSync(new URL('../src/app/api/bookings/route.ts', import.meta.url), 'utf8');
const writer = fs.readFileSync(new URL('../supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql', import.meta.url), 'utf8');
const required = [
  ['idempotency namespace', /idemp:/], ['appointment-time validation boundary', /isBookingTimeInPast|22:30|22\s*:\s*30/],
  ['timeout reconciliation hook', /reconcile|findReplay/], ['mail failure isolation', /email|SMTP|sendMail/],
  ['allocator RPC boundary', /supabase\.rpc\('webbooking_allocate_booking_number'/],
  ['atomic writer RPC boundary', /supabase\.rpc\('webbooking_commit_booking'/],
  ['retryable incomplete outcome', /responseForIncompleteBooking/],
];
for (const [label, pattern] of required) assert.match(route, pattern, label);
assert.doesNotMatch(route, /from\(['"]Bookings['"]\)\.insert|from\(['"]BookingItems['"]\)\.insert/);
assert.doesNotMatch(route, /from\(['"]Bookings['"]\)\.delete/);
for (const [label, marker] of [
  ['writer ID format gate', "v_id !~ '^WB-[0-9]{8}-[0-9]+$'"],
  ['writer date segment gate', 'substring(v_id FROM 4 FOR 8)'],
  ['UTC wall-clock audit timestamps', "AT TIME ZONE 'UTC'"],
]) assert.ok(writer.includes(marker), label);
console.log(`PASS route contract markers ${required.length}/${required.length}`);
console.log('PASS writer contract markers 3/3');
console.log('BLOCKED live writer/ACL/schema verification: requires reviewed deployed RPC and disposable PostgreSQL.');
