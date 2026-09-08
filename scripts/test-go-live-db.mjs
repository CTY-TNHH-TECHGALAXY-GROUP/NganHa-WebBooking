// Disposable PostgreSQL only. Never reads .env or accepts a remote DB URL.
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { randomBytes } from 'node:crypto';
import pg from 'pg';

const { default: EmbeddedPostgres } = await import(pathToFileURL(process.env.TEST_PG_MODULE || '/private/tmp/oria-go-live-pg/node_modules/embedded-postgres/dist/index.js'));
const directory = await mkdtemp(join(tmpdir(), 'oria-release-db-'));
const password = randomBytes(20).toString('hex');
const port = 55489;
const server = new EmbeddedPostgres({ databaseDir: join(directory, 'data'), user: 'postgres', password, port,
  persistent: true, initdbFlags: ['--locale=C', '--encoding=UTF8'], postgresFlags: ['-h', '127.0.0.1', '-k', directory], onLog: () => {}, onError: () => {} });
let pool;
let started = false;
let passed = 0;
const test = async (label, fn) => { await fn(); passed++; console.log(`PASS ${label}`); };
const migration = await readFile(new URL('../supabase/migrations/20260907_p0_atomic_booking_idempotency.sql', import.meta.url), 'utf8');
const parent = (overrides = {}) => ({ customerName: 'Isolated QA', customerEmail: 'qa@example.invalid',
  bookingDate: '2099-09-08T07:00:00Z', timeBooking: '14:00', requestFingerprint: 'a'.repeat(64), ...overrides });
const items = [{ serviceId: 'TEST_SERVICE', quantity: 2, price: 1, options: { note: 'one' } }];
const expectedCatalog = [{ id: 'TEST_SERVICE', priceVND: 790000, priceUSD: 32, duration: 60, isActive: true }];
const rpc = async (key, data = parent(), children = items, role = 'service_role') => {
  const client = await pool.connect();
  try {
    await client.query(`SET ROLE ${role}`);
    await client.query("SET TIME ZONE 'UTC'");
    return (await client.query('SELECT public.create_booking_atomic($1::jsonb,$2::jsonb,$3::text) result', [JSON.stringify(data), JSON.stringify(children), key])).rows[0].result;
  } finally { await client.query('RESET ROLE'); client.release(); }
};
try {
  await server.initialise();
  await server.start(); started = true;
  pool = new pg.Pool({ host: '127.0.0.1', port, user: 'postgres', password, database: 'postgres', max: 16 });
  await pool.query(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE public."Customers" (id text PRIMARY KEY, "fullName" text, phone text, email text, gender text, "createdAt" timestamptz, "updatedAt" timestamptz);
    CREATE TYPE public."BookingStatus" AS ENUM ('NEW','CONFIRMED','CANCELLED');
    CREATE TABLE public."Services" (id text PRIMARY KEY, "priceVND" numeric, "priceUSD" numeric, duration integer, "isActive" boolean);
    CREATE TABLE public."Bookings" (id text PRIMARY KEY, "billCode" text, source text, "guestCount" integer, "branchName" text,
      "bookingDate" timestamptz, "timeBooking" text, "customerName" text, "customerPhone" text, "customerEmail" text,
      "customerGender" text, "customerLang" text, "customerId" text, "roomName" text, notes text, "focusAreaNote" text,
      "totalAmount" numeric, status public."BookingStatus", tip numeric, "idLegacy" text, "createdAt" timestamptz, "updatedAt" timestamptz);
    CREATE TABLE public."BookingItems" (id text PRIMARY KEY, "bookingId" text REFERENCES public."Bookings"(id),
      "serviceId" text REFERENCES public."Services"(id), quantity integer, price numeric, status text, options jsonb, tip numeric);
    INSERT INTO public."Services" VALUES ('TEST_SERVICE',790000,32,60,true), ('TEST_ADDON',105000,4,0,true);
  `);
  await test('DB01 migration applies and reruns on isolated schema', async () => { await pool.query(migration); await pool.query(migration); });
  await test('release SQL verifier has no FAIL rows', async () => {
    const sql = await readFile(new URL('../supabase/verification/20260907_p0_atomic_booking_idempotency_read_only.sql', import.meta.url), 'utf8');
    const result = await pool.query(sql);
    const rows = result.flatMap(statement => statement.rows || []);
    assert.deepEqual(rows.filter(row => row.status === 'FAIL'), []);
    assert.ok(rows.some(row => row.check_name === 'function.supported_signature'));
  });
  await test('DB02 anon and authenticated cannot execute RPC', async () => {
    for (const role of ['anon', 'authenticated']) await assert.rejects(rpc(`denied-${role}`, parent(), items, role), /permission denied/);
  });
  await test('DB03 browser roles cannot write counter', async () => {
    for (const role of ['anon', 'authenticated']) {
      const result = await pool.query("SELECT has_table_privilege($1,'public.\"WebbookingBookingDailyCounters\"','INSERT') allowed", [role]);
      assert.equal(result.rows[0].allowed, false);
    }
  });
  let first;
  await test('DB04 canonical price/status and atomic customer link', async () => {
    first = await rpc('first', parent({ totalAmount: 1, status: 'CONFIRMED', customerId: 'forged' }));
    assert.equal(first.data.totalAmount, 1580000); assert.equal(first.data.status, 'NEW');
    assert.equal(first.data.items[0].price, 790000); assert.equal(first.data.items[0].status, 'WAITING');
    assert.ok(first.data.customerId.startsWith('CUS-'));
  });
  await test('DB05 20 concurrent identical keys create one booking', async () => {
    const results = await Promise.all(Array.from({ length: 20 }, () => rpc('same-key')));
    assert.equal(new Set(results.map(x => x.booking_id)).size, 1);
    assert.equal(results.filter(x => !x.idempotent).length, 1);
  });
  await test('DB06 30 different concurrent keys have unique IDs', async () => {
    const results = await Promise.all(Array.from({ length: 30 }, (_, i) => rpc(`different-${i}`)));
    assert.equal(new Set(results.map(x => x.booking_id)).size, 30);
  });
  await test('DB07 same key changed intent conflicts', async () => {
    await assert.rejects(rpc('first', parent({ requestFingerprint: 'b'.repeat(64) })), /IDEMPOTENCY_CONFLICT/);
  });
  await test('DB08 failing child rolls back parent/customer/counter', async () => {
    const before = (await pool.query('SELECT (SELECT count(*) FROM public."Bookings") b,(SELECT count(*) FROM public."Customers") c,(SELECT sum(last_seq) FROM public."WebbookingBookingDailyCounters") s')).rows[0];
    await assert.rejects(rpc('rollback', parent({ customerEmail: 'rollback@example.invalid' }), [...items, { serviceId: 'MISSING', quantity: 1 }]), /not active|does not exist/);
    assert.deepEqual((await pool.query('SELECT (SELECT count(*) FROM public."Bookings") b,(SELECT count(*) FROM public."Customers") c,(SELECT sum(last_seq) FROM public."WebbookingBookingDailyCounters") s')).rows[0], before);
  });
  await test('DB09 customer master is not overwritten', async () => {
    await rpc('renamed', parent({ customerName: 'Unverified new name' }));
    assert.equal((await pool.query('SELECT "fullName" FROM public."Customers" WHERE email=$1', ['qa@example.invalid'])).rows[0].fullName, 'Isolated QA');
  });
  await test('DB10 counter does not truncate at 1000', async () => {
    await pool.query('UPDATE public."WebbookingBookingDailyCounters" SET last_seq=999');
    assert.match((await rpc('over-999')).booking_id, /-1000$/);
  });
  await test('DB11 VN day is independent of UTC date', async () => {
    const result = await rpc('midnight', parent({ bookingDate: '2099-09-08T17:30:00Z', timeBooking: '00:30' }));
    assert.match(result.booking_id, /WB-09092099-/); assert.equal(result.data.date, '2099-09-09');
    const replay = await rpc('midnight', parent({ bookingDate: '2099-09-08T17:30:00Z', timeBooking: '00:30' }));
    assert.equal(replay.data.date, result.data.date);
  });
  await test('DB12 quote catalog mismatch fails before any commit', async () => {
    await assert.rejects(rpc('stale-quote', parent({ expectedCatalog: [{ ...expectedCatalog[0], priceUSD: 31 }] })), /PRICE_CHANGED/);
    assert.equal((await pool.query('SELECT count(*) n FROM public."Bookings" WHERE idempotency_key=$1', ['stale-quote'])).rows[0].n, '0');
    await rpc('fresh-quote', parent({ expectedCatalog }));
  });
  await test('DB13 concurrent price update cannot silently change accepted quote', async () => {
    const writer = await pool.connect();
    await writer.query('BEGIN');
    await writer.query('UPDATE public."Services" SET "priceVND"=800000 WHERE id=$1', ['TEST_SERVICE']);
    const waiting = assert.rejects(rpc('race-quote', parent({ expectedCatalog })), /PRICE_CHANGED/);
    await new Promise(resolve => setTimeout(resolve, 100));
    await writer.query('COMMIT'); writer.release(); await waiting;
    const replay = await rpc('first'); assert.equal(replay.data.totalAmount, first.data.totalAmount);
    await pool.query('UPDATE public."Services" SET "priceVND"=790000 WHERE id=$1', ['TEST_SERVICE']);
  });
  await test('DB14 legacy key without fingerprint requires review', async () => {
    await pool.query('UPDATE public."Bookings" SET idempotency_fingerprint=NULL WHERE id=$1', [first.booking_id]);
    await assert.rejects(rpc('first'), /IDEMPOTENCY_LEGACY_REVIEW/);
  });
  await test('CMS seed fills missing locales only, preserves prices and reruns', async () => {
    await pool.query('ALTER TABLE public."Services" ADD COLUMN description jsonb');
    const source = { vi: 'Dịch vụ VIP cao cấp với 1 KTV trong 60 phút.', en: 'Premium VIP service with 1 therapist for 60 minutes.', jp: '' };
    await pool.query('INSERT INTO public."Services" (id,"priceVND","priceUSD",duration,"isActive",description) VALUES ($1,720000,29,60,true,$2)', ['NHP0001', JSON.stringify(source)]);
    const seed = await readFile(new URL('../supabase/seeds/go_live_vip_descriptions_20260908.sql', import.meta.url), 'utf8');
    await pool.query(seed);
    const firstSeed = (await pool.query('SELECT * FROM public."Services" WHERE id=$1', ['NHP0001'])).rows[0];
    assert.equal(firstSeed.description.jp, ''); assert.ok(firstSeed.description.kr); assert.ok(firstSeed.description.cn);
    assert.equal(firstSeed.priceVND, '720000'); assert.equal(firstSeed.priceUSD, '29'); assert.equal(firstSeed.duration, 60);
    await pool.query(seed);
    assert.deepEqual((await pool.query('SELECT * FROM public."Services" WHERE id=$1', ['NHP0001'])).rows[0], firstSeed);
  });
  console.log(`Disposable PostgreSQL: ${passed}/16 passed. No production connection or SMTP used.`);
} finally {
  if (pool) await pool.end();
  if (started) await server.stop();
}
