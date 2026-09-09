import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const sql = readFileSync(new URL('supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql', root), 'utf8');
const preflight = readFileSync(new URL('supabase/verification/20260909_counter_only_preflight_read_only.sql', root), 'utf8');
const namespaceAudit = readFileSync(new URL('supabase/verification/20260909_booking_namespace_read_only.sql', root), 'utf8');
const postflight = readFileSync(new URL('supabase/verification/20260909_counter_only_postflight_read_only.sql', root), 'utf8');
const route = readFileSync(new URL('src/app/api/bookings/route.ts', root), 'utf8');

const tests = [
  ['SQL creates only the prefixed counter table', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\."WebbookingBookingDailyCounters"/);
    assert.match(sql, /CREATE OR REPLACE FUNCTION public\.webbooking_allocate_booking_number/);
    assert.doesNotMatch(sql, /CREATE TABLE(?! IF NOT EXISTS public\."WebbookingBookingDailyCounters")/i);
  }],
  ['SQL contains no booking writer or shared-table mutation', () => {
    assert.doesNotMatch(sql, /webbooking_submit_booking|create_booking_atomic/);
    assert.doesNotMatch(sql, /INSERT INTO public\."Bookings"|UPDATE public\."Bookings"|DELETE FROM public\."Bookings"/i);
    assert.doesNotMatch(sql, /ALTER TABLE public\."(Bookings|BookingItems|Customers|Services)"/i);
    assert.doesNotMatch(sql, /CREATE (UNIQUE )?INDEX.*public\."(Bookings|BookingItems|Customers|Services)"/is);
  }],
  ['Allocator is date-aware and serialized', () => {
    assert.match(sql, /Asia\/Ho_Chi_Minh/);
    assert.match(sql, /pg_advisory_xact_lock/);
    assert.match(sql, /FOR UPDATE/);
    assert.match(sql, /v_candidate := 'WB-' \|\| v_date_code/);
  }],
  ['Allocator seeds and skips existing id or billCode collisions', () => {
    assert.match(sql, /regexp_match\(b\.id/);
    assert.match(sql, /regexp_match\(b\."billCode"/);
    assert.match(sql, /WHERE b\.id = v_candidate/);
    assert.match(sql, /b\."billCode"::TEXT = v_candidate/);
  }],
  ['New table is private and function is server-only', () => {
    assert.match(sql, /ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\."WebbookingBookingDailyCounters" FROM PUBLIC, anon, authenticated, service_role/);
    assert.match(sql, /REVOKE ALL ON FUNCTION public\.webbooking_allocate_booking_number\(TIMESTAMPTZ\) FROM PUBLIC, anon, authenticated/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.webbooking_allocate_booking_number\(TIMESTAMPTZ\) TO service_role/);
  }],
  ['Application calls allocator and atomic writer contract', () => {
    assert.match(route, /supabase\.rpc\('webbooking_allocate_booking_number'/);
    assert.match(route, /supabase\.rpc\('webbooking_commit_booking'/);
    assert.match(route, /commitBookingAtomically/);
    assert.doesNotMatch(route, /from\('Bookings'\)\.insert|from\('BookingItems'\)\.insert|from\('Bookings'\)\.delete/);
    assert.doesNotMatch(route, /webbooking_submit_booking|create_booking_atomic/);
  }],
  ['Application preserves operations fields and legacy marker', () => {
    assert.match(route, /source: 'WEB_BOOKING'/);
    assert.match(route, /status: 'NEW'/);
    assert.match(route, /customerId,/);
    assert.match(route, /idLegacy: `idemp:\$\{idempotencyKey\}`/);
    assert.doesNotMatch(route, /idempotency_key|idempotency_fingerprint/);
  }],
  ['Preflight is read-only and records no migration writer', () => {
    assert.match(preflight, /BEGIN TRANSACTION READ ONLY/);
    assert.match(preflight, /COMMIT/);
    assert.doesNotMatch(preflight, /CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM/i);
    assert.match(preflight, /preexisting_booking_writer/);
  }],
  ['Namespace audit is read-only and does not consume a booking number', () => {
    assert.match(namespaceAudit, /BEGIN TRANSACTION READ ONLY/);
    assert.match(namespaceAudit, /pg_trigger/);
    assert.match(namespaceAudit, /pg_publication_tables/);
    assert.doesNotMatch(namespaceAudit, /CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM|pg_advisory_xact_lock/i);
  }],
  ['Postflight checks allocator privileges without writing or calling it', () => {
    assert.match(postflight, /BEGIN TRANSACTION READ ONLY/);
    assert.match(postflight, /webbooking_allocate_booking_number/);
    assert.match(postflight, /function_name/);
    assert.match(postflight, /public_execute/);
    assert.match(postflight, /anon_execute/);
    assert.match(postflight, /authenticated_execute/);
    assert.match(postflight, /service_role_execute/);
    assert.doesNotMatch(postflight, /CREATE TABLE|ALTER TABLE|INSERT INTO|UPDATE .* SET|DELETE FROM|pg_advisory_xact_lock/i);
  }],
];

let passed = 0;
for (const [name, test] of tests) {
  try {
    test();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error);
    process.exitCode = 1;
  }
}
console.log(`Counter-only static contract: ${passed}/${tests.length} passed; no database connection or writes.`);
