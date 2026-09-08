# Terra-2 Booking API Handoff

## Scope

- Worker: Terra-2
- Baseline HEAD: `05fce624831c47efa057c9349a026d05ea0b50ac`
- Final Terra-2 commit: `06d58ea` plus the handoff-only follow-up below
- Owned areas: API validation, read-only catalog pricing, quote/replay/conflict handling, customer privacy, post-commit mail hardening.
- No production RPC, real database write, price update, seed, migration apply, or email dispatch was performed.

## Files Changed

- `src/app/api/bookings/route.ts`
- `src/app/api/bookings/reprice/route.ts`
- `src/lib/booking/contract.ts`
- `src/lib/mailer.ts`
- `scripts/test-booking-route-control-flow.mjs`
- `scripts/test-terra-2-booking-api.mjs`
- `scripts/test-mailer-hardening.ts`
- `plans/handoffs/terra-2.md`

No frontend, checkout, CMS, cart storage, `.env.local`, or Supabase SQL file was changed by Terra-2.

## Contract Changes

- Both booking callers remain supported: `selectedServices`/`services`, `variantId`/`serviceId`/`id`, `quantity`/`qty`, and `options`/`customOptions`.
- Invalid input returns `400 VALIDATION_ERROR` with stable `fieldErrors`; oversized bodies return `413 PAYLOAD_TOO_LARGE`.
- Phone formatting is normalized once. An explicit `phoneCountryCode`/`countryCode` is honored; a missing country is never inferred from locale.
- Spa time is `Asia/Ho_Chi_Minh`, with half-hour slots from `09:00` through `23:00`; a new booking in the past is rejected.
- Prices, USD catalog values, duration, active state, and the `NHS0900` add-on are read from `Services`; no hardcoded price fallback remains in either API route.
- Reprice returns a signed five-minute `quote` when a server secret is available. Booking accepts a matching cart/full-intent quote and performs a final read-only catalog digest check before RPC.
- A replay returns the stored booking/item snapshot and exits before mail dispatch. A mismatched key returns `409 IDEMPOTENCY_CONFLICT` without returning the prior booking.
- The route no longer reads, creates, updates, or links `Customers`; Terra-1 owns atomic customer linkage.
- Mail is attempted only after commit, uses the committed snapshot, validates reception/customer recipients, escapes HTML, and records `EMAIL_SENT` or `EMAIL_PENDING`. Delivery failure leaves the booking success response intact.

## Test Evidence

| Test | Environment / command | Result |
| --- | --- | --- |
| API01-API14 mock matrix | Isolated fixtures; `node --experimental-strip-types scripts/test-terra-2-booking-api.mjs` | PASS 14/14 |
| Replay/privacy control flow | Mock/static route contract; `node scripts/test-booking-route-control-flow.mjs` | PASS |
| Mailer hardening | Mock transport only; `node --experimental-strip-types scripts/test-mailer-hardening.ts` | PASS |
| Terra-2 source typecheck | `npx tsc --noEmit` before generated `.next` refresh; current filtered scan has no Terra-2 errors | PASS |
| Lint | `npm run lint` | PASS with existing repository warnings |
| Production build | `npm run build` serial rerun | BLOCKED: sandbox DNS cannot resolve existing `next/font` requests to `fonts.googleapis.com`; source compiled before this failure |
| API-DB staging / RPC / concurrency | No isolated staging environment was confirmed | NOT RUN |
| Real SMTP notification | Coordinator/environment-test approval not provided | NOT RUN |

The mock matrix covers malformed JSON/body, multilingual names, phone variants, email/note injection, strict quantities and aliases, nested options, inactive add-ons, calendar/time, client price/status tampering, RPC failure mapping, replay/no-mail, signed quote changes, mail failure semantics, and all active caller locales.

## Blockers / Next Owner

- API-DB staging tests DB01-DB14 and E2E01-E2E04 remain NOT VERIFIED until Terra-1 provides an isolated staging database with the reviewed migration and ACLs. The route intentionally refuses to run without server Supabase credentials.
- Concurrent same-key replay, timeout-after-commit, customer atomic linkage, and RPC ACL behavior cannot be proven by mocks. Coordinator/Terra-1 owns staging execution.
- The current Terra-1 RPC signature has no explicit quote/version argument. Terra-2 narrows the race with a final catalog digest read and relies on the RPC's in-transaction canonical price check; complete price-change conflict proof requires staging confirmation or an approved Terra-1 contract extension.
- No notification was sent to `nghik22@gmail.com`; coordinator approval and an isolated test environment are still required for the single permitted notification test.
- Lint emits broad pre-existing warnings across the repository; no unrelated warning cleanup was attempted.
- A generated `.next/types` refresh can make a full standalone `npx tsc --noEmit` report stale references to the already-removed `src/app/demo-3d/page`; no generated output or unrelated source was changed.
