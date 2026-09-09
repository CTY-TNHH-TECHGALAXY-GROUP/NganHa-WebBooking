import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import pg from 'pg';

// Explicit loopback-only disposable cluster; never load application env files.
const config = { host: '127.0.0.1', port: 55439, user: 'postgres', database: 'postgres' };
const setup = new pg.Client(config);
await setup.connect();
const database = `qa_atomic_${Date.now()}`;
await setup.query(`CREATE DATABASE ${database}`);
await setup.end();
config.database = database;
const db = new pg.Client(config);
await db.connect();
const results = [];
async function test(name, fn) {
  try { await fn(); results.push({ name, status: 'PASS' }); }
  catch (error) { results.push({ name, status: 'FAIL', error: error.message }); }
}
const booking = (key, id = `WB-10092026-${/^[0-9]+$/.test(key) ? key : '900'}`) => ({
  id, billCode: id, idLegacy: `idemp:${key}`, source: 'WEB_BOOKING', status: 'NEW',
  bookingDate: '2026-09-10T22:30:00', timeBooking: '22:30',
  customerName: 'QA fixture', customerPhone: '+84389898593', customerEmail: 'qa@example.invalid',
  customerId: 'fixture-customer', customerLang: 'vi', guestCount: 1, branchName: 'fixture',
  totalAmount: 100000, createdAt: '2026-09-09T10:00:00Z', updatedAt: '2026-09-09T10:00:00Z',
});
const items = b => [{ id: `${b.id}-svc-0`, bookingId: b.id, serviceId: 'svc', quantity: 1,
  price: 100000, status: 'WAITING', options: { strength: 'NORMAL', focus: [], avoid: [], therapist: 'any', note: '' }, tip: 0 }];
const call = (b, i = items(b), client = db) => client.query('SELECT public.webbooking_commit_booking($1::jsonb,$2::jsonb) AS result', [JSON.stringify(b), JSON.stringify(i)]).then(r => r.rows[0].result);
try {
  await db.query(`DO $$ BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated; END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role; END IF;
    END $$;
    CREATE TYPE "BookingStatus" AS ENUM ('NEW','PREPARING','DONE');
    CREATE TABLE "Customers" (id text PRIMARY KEY);
    INSERT INTO "Customers" VALUES ('fixture-customer');
    CREATE TABLE "Services" (id text PRIMARY KEY, "priceVND" numeric NOT NULL, "isActive" boolean NOT NULL);
    INSERT INTO "Services" VALUES ('svc',100000,true),('svc2',100000,true);
    CREATE TABLE "Bookings" (id text PRIMARY KEY, "billCode" text UNIQUE NOT NULL, "idLegacy" text UNIQUE,
      source text, status "BookingStatus" DEFAULT 'NEW', "guestCount" integer, "branchName" text,
      "bookingDate" timestamp NOT NULL, "timeBooking" text, "customerName" text, "customerPhone" text,
      "customerEmail" text, "customerGender" text, "customerLang" text, "customerId" text REFERENCES "Customers",
      "roomName" text, notes text, "focusAreaNote" text, "totalAmount" numeric, tip numeric,
      "createdAt" timestamp NOT NULL, "updatedAt" timestamp NOT NULL, "accessToken" text DEFAULT 'fixture-token');
    CREATE TABLE "BookingItems" (id text PRIMARY KEY, "bookingId" text REFERENCES "Bookings", "serviceId" text REFERENCES "Services",
      quantity integer NOT NULL, price numeric NOT NULL, status text DEFAULT 'WAITING', options jsonb, tip numeric);`);
  const before = (await db.query(`SELECT table_name,column_name,data_type,column_default FROM information_schema.columns WHERE table_schema='public' ORDER BY 1,2`)).rows;
  await db.query(readFileSync(new URL('../supabase/GO_LIVE_COUNTER_ONLY_READY_TO_PASTE.sql', import.meta.url), 'utf8'));
  await db.query(readFileSync(new URL('../supabase/GO_LIVE_WEBSITE_ATOMIC_WRITER_READY_TO_PASTE.sql', import.meta.url), 'utf8'));
  await db.query("SET TIME ZONE 'UTC'");
  await test('new booking preserves time, IDs, customer and required timestamps', async () => {
    const b = booking('001'); await call(b);
    const r = (await db.query(`SELECT "bookingDate"::text AS appointment,"customerId","createdAt" FROM "Bookings" WHERE id=$1`,[b.id])).rows[0];
    assert.equal(r.appointment, '2026-09-10 22:30:00'); assert.equal(r.customerId,'fixture-customer');
    assert.equal((await db.query('SELECT id FROM "BookingItems" WHERE "bookingId"=$1',[b.id])).rows[0].id, items(b)[0].id);
  });
  await test('writer rejects malformed or date-mismatched allocator IDs', async () => {
    await assert.rejects(call(booking('bad-format', 'WB-QA-001')));
    await assert.rejects(call(booking('bad-date', 'WB-11092026-001')));
  });
  await test('same-key retry with newly allocated ID replays original', async () => {
    const b = booking('001','WB-10092026-002'); const r = await call(b);
    assert.equal(r.bookingId,'WB-10092026-001'); assert.equal(r.idempotent,true);
  });
  await test('same count/total but different service is rejected', async () => {
    const b = booking('001'); await assert.rejects(call(b,[{...items(b)[0],serviceId:'svc2'}]));
  });
  await test('same key but changed customer is rejected', async () => {
    const b = {...booking('001'),customerName:'different'}; await assert.rejects(call(b));
  });
  await test('multi-service retry ignores generated ID ordering', async () => {
    const b={...booking('multi', 'WB-10092026-007'),totalAmount:200000};
    const i=[{...items(b)[0],id:b.id+'-z'}, {...items(b)[0],id:b.id+'-a',serviceId:'svc2'}];
    await call(b,i); assert.equal((await call(b,i)).idempotent,true);
  });
  await test('SQL NULL payload is rejected before writing', async () => {
    await assert.rejects(db.query('SELECT webbooking_commit_booking(NULL,NULL)'));
  });
  await test('replay preserves operations status/source', async () => {
    await db.query(`UPDATE "Bookings" SET status='PREPARING',source='STANDARD_WALK_IN' WHERE id='WB-10092026-001'`);
    const r = await call(booking('001')); assert.equal(r.idempotent,true);
    assert.equal((await db.query(`SELECT status FROM "Bookings" WHERE id='WB-10092026-001'`)).rows[0].status,'PREPARING');
  });
  await test('child insertion failure rolls back parent and all children', async () => {
    await db.query(`CREATE FUNCTION qa_fail_child() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.options->>'fail'='true' THEN RAISE EXCEPTION 'fixture child failure'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER qa_fail BEFORE INSERT ON "BookingItems" FOR EACH ROW EXECUTE FUNCTION qa_fail_child();`);
    const b = {...booking('003'),totalAmount:200000}; const i=items(b);
    await assert.rejects(call(b,[i[0],{...i[0],id:b.id+'-second',options:{fail:true}}]));
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "Bookings" WHERE id=$1',[b.id])).rows[0].n,0);
    await db.query('DROP TRIGGER qa_fail ON "BookingItems"; DROP FUNCTION qa_fail_child();');
  });
  await test('uncommitted parent is invisible to independent connection', async () => {
    const other = new pg.Client(config); await other.connect();
    try { await db.query('BEGIN'); const b=booking('004'); await call(b);
      assert.equal((await other.query('SELECT count(*)::int AS n FROM "Bookings" WHERE id=$1',[b.id])).rows[0].n,0);
      await db.query('COMMIT');
      assert.equal((await other.query('SELECT count(*)::int AS n FROM "BookingItems" WHERE "bookingId"=$1',[b.id])).rows[0].n,1);
    } finally { await db.query('ROLLBACK'); await other.end(); }
  });
  await test('20 simultaneous same-key calls converge', async () => {
    const clients=Array.from({length:20},()=>new pg.Client(config));
    try { await Promise.all(clients.map(c=>c.connect()));
      const rs=await Promise.all(clients.map((c,i)=>call(booking('parallel',`WB-10092026-${100+i}`),undefined,c)));
      assert.equal(new Set(rs.map(r=>r.bookingId)).size,1);
      assert.equal(rs.filter(r=>!r.idempotent).length,1);
    } finally { await Promise.all(clients.map(c=>c.end())); }
  });
  await test('50 concurrent allocator calls are unique', async () => {
    const pool=new pg.Pool({...config,max:20});
    try { const rs=await Promise.all(Array.from({length:50},()=>pool.query("SELECT webbooking_allocate_booking_number('2026-09-11T10:00:00+07'::timestamptz) AS id")));
      assert.equal(new Set(rs.map(r=>r.rows[0].id)).size,50);
    } finally { await pool.end(); }
  });
  await test('anon/authenticated denied and service_role allowed for writer and allocator', async () => {
    for(const role of ['anon','authenticated']) {
      await db.query(`SET ROLE ${role}`);
      try {
        await assert.rejects(call(booking('005')),e=>e.code==='42501');
        await assert.rejects(db.query("SELECT public.webbooking_allocate_booking_number('2026-09-12T10:00:00+07'::timestamptz)"),e=>e.code==='42501');
      }
      finally { await db.query('RESET ROLE'); }
    }
    await db.query('SET ROLE service_role');
    try {
      await call(booking('006'));
      const allocated = (await db.query("SELECT public.webbooking_allocate_booking_number('2026-09-12T10:00:00+07'::timestamptz) AS id")).rows[0].id;
      assert.match(allocated, /^WB-12092026-/);
    } finally { await db.query('RESET ROLE'); }
  });
  await test('business schema and catalog prices unchanged by migration', async () => {
    const after=(await db.query(`SELECT table_name,column_name,data_type,column_default FROM information_schema.columns WHERE table_schema='public' AND table_name != 'WebbookingBookingDailyCounters' ORDER BY 1,2`)).rows;
    assert.deepEqual(after,before);
    assert.deepEqual((await db.query('SELECT "priceVND"::int AS price FROM "Services" ORDER BY id')).rows,[{price:100000},{price:100000}]);
  });
  await test('persisted replay survives catalog deactivation/price change',async()=>{
    await db.query('UPDATE "Services" SET "priceVND"=200000,"isActive"=false WHERE id=\'svc\'');
    try {assert.equal((await call(booking('001'))).idempotent,true);}
    finally {await db.query('UPDATE "Services" SET "priceVND"=100000,"isActive"=true WHERE id=\'svc\'');}
  });
  for (const file of ['20260909_website_atomic_writer_preflight_read_only.sql','20260909_website_atomic_writer_postflight_read_only.sql']) {
    await test(file+' executes',async()=>{try {await db.query(readFileSync(new URL('../supabase/verification/'+file,import.meta.url),'utf8'));} finally {await db.query('ROLLBACK');}});
  }
} finally { await db.end(); }
console.log(JSON.stringify({environment:'disposable PostgreSQL loopback:55439; fixture schema, not production metadata',results},null,2));
if(results.some(r=>r.status==='FAIL')) process.exitCode=1;
