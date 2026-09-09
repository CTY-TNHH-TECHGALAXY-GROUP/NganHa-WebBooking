# Atomic Customer Flow Acceptance

Date: 2026-09-09 21:31 +07:00  
Recipient: `nghik22@gmail.com`  
Vietnam phone: `+84 389898593`

Status: **LOCAL CONTRACT PASS; LIVE CANARY PENDING OPERATOR**

## Evidence boundary

No test in this report called a production writer, loaded production credentials,
created a live booking, changed catalog/customer data, or sent a real booking
email. The route suite injects Supabase and mail mocks. The PostgreSQL suite
uses a disposable loopback database and fixture schema. The ten-case browser
artifact is a manifest only; it is not browser, DB, admin, or inbox evidence.

## Commands and current results

| Command | Result | Evidence level |
|---|---|---|
| `node scripts/test-atomic-website-contract.mjs` | PASS `7/7` | Static route contract; no direct booking/item insert or delete fallback |
| `node scripts/test-atomic-website-mock.mjs` | PASS `9/9` | Dependency-free model only; not DB/SMTP proof |
| `node scripts/test-go-live-api.mjs` | PASS `16/16` | Actual route with injected DB/mail dependencies; no network |
| `node scripts/test-booking-route-control-flow.mjs` | PASS | Replay/mail ordering and frozen fixture contract |
| `node scripts/test-counter-only-booking-db.mjs` | PASS `10/10` | Static SQL/route scope; no DB connection |
| `node scripts/test-atomic-website-postgres.mjs` | PASS `17/17` | Disposable PostgreSQL on `127.0.0.1:55439`; fixture schema only |
| `node scripts/test-atomic-website-browser-cases.mjs` | PASS | Exactly `CF01`-`CF10` manifest; live evidence not executed |
| `npx tsc --noEmit --incremental false` | PASS | Typecheck only |
| `npm run build` | PASS; 61/61 pages generated | Production Next.js build |

The first PostgreSQL attempt was blocked by sandbox `EPERM` on loopback. The
same command was rerun with approval against the disposable loopback cluster
and passed `16/16`. No production connection was used.

## Contract coverage

| Boundary | Current result |
|---|---|
| Malformed body and malformed/false/empty RPC results | PASS in mocked actual-route suite; fail closed, no mail/direct booking write |
| DB verification missing/error after writer | PASS in mocked actual-route suite; returns retryable `503`, no mail |
| SMTP failure after commit | PASS; booking success remains honest with email pending |
| Replay and no duplicate email | PASS; same key returns original ID, bypasses writer/mail |
| Rollback and pre-commit visibility | PASS in disposable PostgreSQL; child failure leaves no parent/items, independent connection cannot see uncommitted parent |
| Concurrency | PASS in disposable PostgreSQL; 20 same-key calls converge, 50 allocator calls are unique |
| ACL | PASS in disposable PostgreSQL; `anon`/`authenticated` denied for writer and allocator, `service_role` succeeds |
| Catalog/status/source/intent boundaries | PASS in disposable PostgreSQL and route mocks; replay preserves operations status/source and changed intent conflicts |
| Allocator identifier shape and timestamp mapping | PASS in disposable PostgreSQL; malformed/date-mismatched `WB-DDMMYYYY-NNN` rejected and audit timestamps map explicitly to UTC wall-clock |

## Ten-case evidence boundary

The case files `CF01.md` through `CF10.md` record the required interaction
matrix and the current evidence state. Each case is **BLOCKED** for live
acceptance because browser selection, quote inspection, committed DB parent and
full items, operations admin display, and real inbox receipt were not observed.
`CF01` therefore has not unlocked `CF02`-`CF10`.

| Case | Locale / viewport | Local manifest | Browser / DB / admin / inbox |
|---|---|---|---|
| CF01 canary | EN / desktop | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF02 | VI / mobile 390 | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF03 | JA / desktop | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF04 | KO / tablet 768 | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF05 | ZH / mobile 390 | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF06 | VI / desktop | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF07 | EN / mobile 390 | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF08 | JA / tablet 768 | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF09 | KO / desktop | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |
| CF10 | ZH / desktop | READY | BLOCKED / BLOCKED / BLOCKED / BLOCKED |

## Live acceptance gate

- No operator-approved live read-only preflight/postflight evidence is attached.
- No deployed revision, live DB identity, operations-admin observation, or real
  inbox receipt is available in this isolated run.
- Operator-provided production evidence shows both RPCs exist with
  `SECURITY DEFINER`, fixed `search_path`, and `public`/`anon`/`authenticated`
  execute denied while `service_role` execute is allowed. The exact deployed
  function body has not yet been compared to the final SQL artifact.
- The counter-only SQL and the atomic-writer SQL remain separate artifacts.
  Applying either must be an explicitly authorized production action; this
  local run did not apply SQL or create a booking.
- Static, mocked, and disposable results do not authorize SQL apply or GO.

## Source fingerprints

Route under test: `src/app/api/bookings/route.ts`  
Current route SHA-256: `83b189e69a7fbdba8c4d0aa9b3e00814c4b09691692f8085c76e788ee8b82f11`.

Final SQL artifact SHA-256: writer `66ff2f162d7e316e9b686761b8a192472df0e0042ac2eb74a33cd05897745400`; counter `3660eacc1d8d1d40e04fedc61e1d510e9bf7a309c06c75302e8689e0de1fc77f`.

The test-only changes in this audit are limited to the scoped test scripts and
this evidence directory. The route was inspected and tested but not edited by
this audit.
