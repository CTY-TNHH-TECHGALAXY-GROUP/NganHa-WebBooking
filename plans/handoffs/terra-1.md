# Terra-1 Database Handoff

## Scope

- Worker: Terra-1, database ownership requested for this run
- Baseline SHA: `05fce624831c47efa057c9349a026d05ea0b50ac`
- Final commit SHA: reported in the completion summary after commit
- Environment: local repository only; no database connection was opened
- Production DB, real catalog prices, `.env.local`, email, frontend, CMS, and booking API were not touched

## Files Changed

- `supabase/migrations/20260907_p0_atomic_booking_idempotency.sql`
  - Adds forward-only idempotency fields and duplicate preflight.
  - Removes unsupported `create_booking_atomic` overloads before recreating the canonical signature.
  - Pins the `SECURITY DEFINER` search path and grants execution only to `service_role`.
  - Allocates `WB-DDMMYYYY-XXX` using a row lock and spa-local `Asia/Ho_Chi_Minh` date; sequence values `>= 1000` are never truncated.
  - Resolves/creates/links customers in the same transaction as `Bookings` and `BookingItems`.
  - Existing customer rows are not updated from submitted booking data.
  - Uses server-owned item IDs, active `Services.priceVND`, canonical `NEW`/`WAITING` values, and returns persisted item snapshots.
  - Treats legacy idempotency rows without a stored fingerprint as review-required.
- `supabase/verification/20260907_p0_atomic_booking_idempotency_preflight_read_only.sql`
  - Catalog, relation, FK, privilege, and duplicate-count inventory; no PII columns are selected.
- `supabase/verification/20260907_p0_atomic_booking_idempotency_read_only.sql`
  - Post-apply verifier now uses `oidvectortypes(proargtypes)` for type identity and checks `proargnames` independently; includes customer-link integrity checks.
- `supabase/verification/20260907_p0_atomic_booking_idempotency_rollback.sql`
  - Non-destructive emergency rollback that revokes the writer while retaining booking, item, customer, idempotency, and counter data.

## Contract Changes

- `create_booking_atomic(p_booking_data jsonb, p_booking_items jsonb, p_idempotency_key text DEFAULT NULL, p_booking_id text DEFAULT NULL) -> jsonb` remains the only supported signature.
- A non-empty idempotency key requires a 64-hex-character `requestFingerprint` for new/replayed current rows.
- A key matching a legacy `idemp:` row with no fingerprint returns `IDEMPOTENCY_LEGACY_REVIEW`; a current row with another fingerprint returns `IDEMPOTENCY_CONFLICT`.
- Caller-supplied booking IDs and item IDs are not accepted as persisted identifiers.
- The RPC stores and returns the canonical catalog `priceVND`; it never updates catalog prices.
- Customer resolution is by submitted phone/email under transaction advisory locks. Existing matching customers are linked but not mutated; a phone/email match to two different customers returns `CUSTOMER_IDENTITY_CONFLICT`.

## Apply / Verify / Rollback

Run only against an isolated staging or disposable database after the read-only preflight:

```bash
psql "$TERRA1_STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/verification/20260907_p0_atomic_booking_idempotency_preflight_read_only.sql
psql "$TERRA1_STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260907_p0_atomic_booking_idempotency.sql
psql "$TERRA1_STAGING_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f supabase/verification/20260907_p0_atomic_booking_idempotency_read_only.sql
```

If the compatible writer must be disabled, run the rollback SQL above. Do not drop the additive objects or restore a `max+1` writer. Re-grant `service_role` only after the compatible app/RPC pair has been reviewed.

## Tests

| ID | Environment / command | Expected | Actual | Status |
| --- | --- | --- | --- | --- |
| Static SQL contract | Local, Node assertion over migration/verifier | Required RPC, ACL, customer, counter, and verifier tokens present | All assertions passed | PASS |
| `git diff --check` | Local | No whitespace errors | Clean | PASS |
| `npx tsc --noEmit --incremental false` | Local | Typecheck passes | Failed on stale `.next/types` booking-route imports and pre-existing `langData` declaration-order errors in `src/app/admin/services/pure/page.tsx` | FAIL, unrelated |
| `npm run lint` | Local | Lint completes | Exit 0; existing warnings and `next lint` deprecation notice | PASS with baseline warnings |
| DB01 | Isolated staging | Additive apply preserves legacy data | No staging connection or local `psql` available | NOT RUN |
| DB02 | Isolated staging | Rerun has no duplicate objects/overloads | No staging connection or local `psql` available | NOT RUN |
| DB03 | Isolated staging | Duplicate preflight stops without repair | No staging connection or local `psql` available | NOT RUN |
| DB04 | Isolated staging | `anon`/`authenticated` cannot execute/write | No staging connection or local `psql` available | NOT RUN |
| DB05 | Isolated staging | Direct counter/booking writes cannot bypass RPC | No staging connection or local `psql` available | NOT RUN |
| DB06 | Isolated staging | 20 distinct keys produce 20 unique IDs/items | No staging connection or local `psql` available | NOT RUN |
| DB07 | Isolated staging | 20 same-key requests produce one booking and replay snapshot | No staging connection or local `psql` available | NOT RUN |
| DB08 | Isolated staging | Same key with different fingerprint conflicts without mutation | No staging connection or local `psql` available | NOT RUN |
| DB09 | Isolated staging | Child/service failure rolls back customer/parent/items | No staging connection or local `psql` available | NOT RUN |
| DB10 | Isolated staging | 999/1000/1001 and VN date boundaries remain collision-free | No staging connection or local `psql` available | NOT RUN |
| DB11 | Isolated staging | Existing customer profile remains unchanged; booking snapshot keeps guest input | No staging connection or local `psql` available | NOT RUN |
| DB12 | Isolated staging | Quote/catalog change conflicts before an unintended new-price booking | Quote/app integration is outside this DB-only run; no staging connection | NOT RUN |
| DB13 | Isolated staging | Timeout-after-commit retry replays same booking | No staging connection or local `psql` available | NOT RUN |
| DB14 | Isolated staging | Legacy key without fingerprint requires review | No staging connection or local `psql` available | NOT RUN |

## Blockers / Next Owner

- DB integration, ACL execution, concurrency, rollback, and before/after counts are **NOT VERIFIED** until an isolated staging/disposable database is supplied. Do not call this migration production-ready from static checks alone.
- Terra-2/API integration must align its canonical fingerprint and quote contract with the RPC; the migration intentionally does not edit TypeScript.
- The repository’s existing API still contains a post-RPC customer update path; its owner must remove/neutralize that path before go-live so the database guarantee is not undermined after commit.
- A deployment coordinator must apply this reviewed migration on staging first, run DB01–DB14 with fixture-only data, review all verifier rows, and only then coordinate cutover on `vercel`.
