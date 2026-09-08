# Atomic Booking Concurrency Fixture

Use this fixture only after the migration compiles and is applied to an isolated local or disposable database. It deliberately creates bookings and must never target production, shared staging, or a database containing customer data.

## Preconditions

1. Confirm the target is local/disposable. `DATABASE_URL` must point to `localhost`, `127.0.0.1`, or an explicitly provisioned throwaway database.
2. Apply the migration to that disposable target only.
3. Run [the read-only verifier](20260907_p0_atomic_booking_idempotency_read_only.sql) once. All structural and ACL rows must be `PASS` before exercising writes.
4. Select one active service ID from the disposable database:

```sql
SELECT id, "priceVND"
FROM public."Services"
WHERE "isActive" = true
ORDER BY id
LIMIT 1;
```

Set the returned ID as `SERVICE_ID`. The function owns the price, so the client fixture does not send one.

## Same-Key Replay

Open two `psql` sessions connected to the same disposable database. Paste the following statement into both sessions, changing only `SERVICE_ID`. Start them as closely together as possible, using the exact same idempotency key and payload in both sessions.

```sql
SELECT public.create_booking_atomic(
  jsonb_build_object(
    'bookingDate', '2099-12-31T10:00:00+07:00',
    'timeBooking', '10:00',
    'customerName', 'Atomic Fixture',
    'customerLang', 'en',
    'requestFingerprint', 'fixture-same-key-v1'
  ),
  jsonb_build_array(jsonb_build_object(
    'id', 'fixture-same-key-item-1',
    'serviceId', 'SERVICE_ID',
    'quantity', 1
  )),
  'fixture-same-key-20260907',
  NULL
);
```

Expected result: both calls succeed and return the same `booking_id`; exactly one returns `idempotent=false` and the other returns `idempotent=true`. There must be one parent row and one child row for the fixture key. Confirm it with this read-only query:

```sql
SELECT
  b.id,
  b."idempotency_key",
  count(bi.id) AS item_count
FROM public."Bookings" b
LEFT JOIN public."BookingItems" bi ON bi."bookingId" = b.id
WHERE b."idempotency_key" = 'fixture-same-key-20260907'
GROUP BY b.id, b."idempotency_key";
```

Repeat one request with the same idempotency key but a different `requestFingerprint`. It must fail with `IDEMPOTENCY_CONFLICT` and must not create a second booking or child item.

## Different-Key Allocation

In two sessions, run the same statement again with distinct idempotency keys, distinct item IDs, and distinct fingerprints. Keep `bookingDate` unchanged so both calls allocate from `31122099`.

```sql
SELECT public.create_booking_atomic(
  jsonb_build_object(
    'bookingDate', '2099-12-31T10:15:00+07:00',
    'timeBooking', '10:15',
    'customerName', 'Atomic Fixture',
    'customerLang', 'en',
    'requestFingerprint', 'fixture-different-key-A-v1'
  ),
  jsonb_build_array(jsonb_build_object(
    'id', 'fixture-different-key-A-item-1',
    'serviceId', 'SERVICE_ID',
    'quantity', 1
  )),
  'fixture-different-key-A-20260907',
  NULL
);
```

For the second session, change `A` to `B` in all three fixture strings. Expected result: two distinct booking IDs matching `WB-31122099-...`, with no unique-violation error. Rerun the read-only verifier and inspect the `counter.coverage.31122099` row; it must pass.

## Scale Test

For a stronger contention test, use a disposable database and execute 20 concurrent calls from a test harness. Each call must use a unique idempotency key, fingerprint, and child item ID, but the same `bookingDate`. Assert all of the following:

- The returned booking IDs are all distinct.
- Every successful parent has exactly the expected child count.
- No request receives an ID already present before the test.
- The counter's `last_seq` is at least the largest numeric suffix created for that date.
- Retrying any one completed request with its original key returns the original booking with `idempotent=true`.

Do not use a production connection string for this test. The fixture rows should be discarded by destroying the disposable database rather than manually cleaning a shared environment.
