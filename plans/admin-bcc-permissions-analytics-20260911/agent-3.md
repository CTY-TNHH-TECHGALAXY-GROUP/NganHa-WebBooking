# Agent 3 Report: First-Party Customer Journey Analytics

Status: implemented in the Agent 3 scope. No commit, push, deploy, production SQL, or direct conversion wiring in `/api/bookings` was performed.

## Files Changed

Analytics contract, client collector, runtime, server contract, storage adapter, and access guard:

- `src/lib/analytics/contract.ts`
- `src/lib/analytics/client.ts`
- `src/lib/analytics/AnalyticsRuntime.tsx`
- `src/lib/analytics/server.ts`
- `src/lib/analytics/adminAccess.ts`
- `src/lib/analytics/dashboard.ts`

Routes and dashboard:

- `src/app/api/analytics/route.ts`
- `src/app/api/admin/analytics/route.ts`
- `src/app/admin/analytics/page.tsx`
- `src/components/Admin/AnalyticsDashboard.tsx`
- `src/app/layout.tsx` (analytics runtime import/render only; existing unrelated worktree changes were preserved)

First-party event instrumentation:

- `src/components/Hero/Hero.tsx`
- `src/components/ServiceBook/ServiceBook.tsx`
- `src/components/Menu/Standard/index.tsx`
- `src/components/Header/Header.tsx`
- `src/components/FloatingWidgets/FloatingWidgets.tsx`
- `src/components/BookingCheckout/BookingCheckout.tsx`
- `src/app/[lang]/new-user/[menuType]/checkout/page.tsx`

Tests and database draft:

- `src/lib/analytics/__tests__/analytics.test.ts`
- `plans/admin-bcc-permissions-analytics-20260911/agent-3-migration.sql`

`src/lib/flipbook/useFlipbookBridge.ts` and `/api/bookings` were not changed by Agent 3.

## Event and Schema Contract

The public client payload is `{ events: [...] }`. Each event has:

- `event_id`: UUID, used for dedupe.
- `schema_version`: currently `1.0`.
- `event_name`: allowlisted below.
- `session_id`: anonymous UUID only.
- `page_path`: normalized same-site path; query/hash and raw URLs are rejected.
- `timestamp`: ISO timestamp, accepted only within the bounded clock window.
- `language`: `vi`, `en`, `cn`, `jp`, `kr`, or `unknown`.
- `device_category`: `mobile`, `tablet`, `desktop`, or `unknown`.
- Optional bounded `identifier`, `duration_ms`, campaign dimensions, and categorized `traffic_source`.

The allowlist is exactly:

`page_view`, `service_view`, `service_option_select`, `cart_add`, `cart_remove`, `cart_open`, `checkout_view`, `booking_submit`, `booking_received`, `booking_failed`, `contact_click`, `language_change`, `hero_video_started`, `hero_video_failed`, `engagement_delta`.

`booking_received` is excluded from the client TypeScript API and is rejected by public ingest. It can only be created through `createVerifiedBookingConversionEvent` and persisted by `recordVerifiedBookingConversion` with `source: 'server'` and a unique opaque `conversion_key`.

Privacy and collection behavior:

- No email, phone, form text, access token, raw referrer, fingerprint, replay, or arbitrary event fields are accepted.
- Unknown fields are rejected. Email-like and phone-like values in path, campaign, and identifier fields are rejected.
- Referrer is reduced to `direct`, `organic_search`, `ai_referral`, `social`, `referral`, or `unknown`; raw referrer is never stored.
- UTM values are allowlisted and bounded; only approved campaign dimensions are retained.
- Consent is explicit opt-in through `setAnalyticsConsent('granted')`; default `unknown` and `denied` both collect nothing and clear the in-memory queue.
- Consent is stored under `nganha.analytics.consent`. No consent UI was invented because the product policy/UI owner is outside this Agent 3 scope; production must connect the approved consent control before granting consent.
- The anonymous session is held in `sessionStorage`, expires after 30 minutes of inactivity, and has a memory fallback when browser storage is unavailable.
- Body size is capped at 16 KiB and batches at 20 events. `event_id` is deduped in-batch and again by the database unique key.
- Engagement samples only visible, recently active time, at most 15 seconds per sample. Sampling runs every 15 seconds and flushes on `visibilitychange` and `pagehide`.
- Normal sends use `fetch`; pagehide uses `sendBeacon` when available. All collector and ingest failures are best effort and must not block checkout, SMTP, or video playback.

## Server Ingest and Storage

`POST /api/analytics` performs same-origin checking, content-length and actual UTF-8 body caps, JSON parsing, event contract validation, client conversion rejection, network/session rate limiting, bot/test/admin classification, and durable insertion. Storage failure returns a successful best-effort telemetry response with `durable: false`, so core customer flows continue.

The migration draft defines:

- Raw events in `WebbookingAnalyticsEvents`, unique `event_id`, unique `conversion_key`, server-only conversion constraint, RLS enabled, and no anon/authenticated table grants.
- Daily aggregate rows in `WebbookingAnalyticsDaily` for funnel, trend, page, action, session, and engagement totals.
- A `webbooking_analytics_maintain()` security-definer function for aggregation plus raw 30-day and aggregate 12-month retention.
- A guarded pg_cron schedule draft. The integrator must review ownership, grants, project policy, and schedule idempotency before applying it.

No migration was applied and no production SQL was run.

## Admin Analytics

`/admin/analytics` renders the analytics dashboard. `GET /api/admin/analytics` authorizes only `analytics.read` through the existing admin capability helper. Owner/admin baseline access and editor explicit-grant/revocation behavior remain owned by Agent 2; the existing `src/lib/auth/__tests__/adminCapabilities.test.ts` covers that contract.

The dashboard supports bounded date, language, device, entry-page, and campaign filters; overview cards; funnel; daily trend data; top pages/actions; and a bounded recent-activity table. Recent activity exposes only an eight-character session prefix and allowlisted event data. Test, admin, and bot traffic are excluded by default.

## Integration Instructions

The booking integrator must call the server helper only after the verified booking write/transaction has committed successfully:

```ts
import { recordVerifiedBookingConversion } from '@/lib/analytics/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';

// After verified booking commit; keep this side effect best effort.
void recordVerifiedBookingConversion(getSupabaseAdmin(), {
  conversionKey: `booking:${verifiedBookingId}`,
  sessionId: validatedAnonymousSessionId,
  pagePath: validatedCheckoutPath,
  language: validatedLanguage,
  deviceCategory: validatedDeviceCategory,
}).catch((error) => {
  console.error('[analytics] verified conversion unavailable:', error);
});
```

`conversionKey` must be server-owned and opaque; do not use an email, phone, form value, token, or client-provided success flag. Do not call this helper from a client success screen, before commit, or by editing the current `/api/bookings` implementation. If the booking flow cannot safely carry a validated anonymous session, omit `sessionId`; the conversion remains recorded but is unattributed to a client session.

Before production enablement, the approved consent/opt-out UI or policy must call `setAnalyticsConsent`. Without that explicit grant, the collector remains disabled.

## Tests and Results

Focused analytics tests were compiled to CommonJS and run with Node:

```text
7 tests passed, 0 failed
```

Coverage includes PII and raw URL rejection, phone-like value rejection, duplicate `event_id`, client conversion rejection, TEST/bot classification, consent default/no-op, hidden and idle engagement, malformed bounded fields, storage conflict keys, deterministic server conversion, and rejection of raw conversion keys.

The existing Agent 2 capability test covers `analytics.read` authorization, editor denial without a grant, active grant, revocation, duplicate capability normalization, and malformed capability input. It was not modified by Agent 3.

`npx tsc --noEmit --incremental false` completed with no output/errors in the final run. `npm run lint` completed with existing warnings, including the repository's current unused-value, explicit-`any`, image, and hook-dependency warnings; it also reports the existing `next lint` deprecation notice.

Local smoke test on port 3001 also passed the auth boundary: `/admin/analytics` returned `307` to `/admin/login`, and unauthenticated `/api/admin/analytics` returned JSON `401 UNAUTHORIZED`. The temporary dev server was stopped after the check.

## Risks and Follow-up

- The dashboard stays `not_configured` until the reviewed migration and maintenance job exist in the target environment.
- The pg_cron block in the draft needs an idempotency review before repeated migration runs.
- In-memory rate limiting is instance-local; production scale should add an edge/WAF or shared limiter if required.
- Telemetry remains intentionally lossy under denied consent, offline delivery, blocked beacons, or storage outages.
- The PII checks are conservative bounded heuristics layered on an allowlist, not a substitute for a formal privacy review.
- Verified conversion attribution depends on the integrator passing a validated anonymous session ID after commit. Without it, the helper uses an unattributed sentinel session value; dashboard session counts are still based on `page_view` rows.
