# Go-live audit and independent implementation phases

Date verified: 2026-09-07  
Target deployment branch: `vercel`  
Repository baseline reviewed: `8155a6c` plus the local worktree present during the audit

## 1. Executive conclusion

The supplied `GO LIVE CHECK V2.md` points in the right direction, but it mixes confirmed production risks, stale findings, and severity overstatements.

The website should not be treated as ready for broad public launch until the P0 phases below are completed. The four P0 tracks are intentionally separated by file ownership and can be assigned to independent subagents. Each subagent must work on its own branch/worktree and must not reformat or clean unrelated files.

Current known validation state:

- `npx tsc --noEmit`: passes.
- `npm run build`: passes and generates 62 routes.
- `npm run lint`: currently fails before linting because `@rushstack/eslint-patch` is incompatible with the installed ESLint 9 setup.
- Production route checks found several real 404 responses.
- Direct PostgreSQL policy inspection was not possible because both configured direct database URLs failed password authentication. Repository migrations prove unsafe policies exist in source, but the deployed RLS state must still be verified in Supabase.

## 2. Claims verified against the source

| Finding from report | Verdict | Verified state / current protection |
|---|---|---|
| Public storage writes and permissive media policies | Confirmed in repository; production policy state not yet proven | Existing migrations contain public write access and a permissive `MarketingMedia` policy. Verify deployed policies in Supabase before changing them. |
| Admin APIs are unprotected | Incorrect | All 18 routes under `/api/admin/*` use `withAuth` or `requireAdmin`; these verify the authenticated user against `WebbookingAdminUsers`, `is_active`, and allowed roles. |
| Admin pages are strongly protected | Incorrect | Middleware only checks for an authenticated Supabase user and can fail open. UI authorization is weaker than API authorization. |
| Booking IDs can collide | Confirmed | Application code uses `max + 1` with five retries. After retries fail, child item insertion can still continue. The existing atomic RPC does not solve ID allocation because the application still supplies the ID. |
| Database styling can inject CSS/HTML | Confirmed | Root layout inserts stored styling through `dangerouslySetInnerHTML`. Stored input requires strict allowlisting or removal of raw CSS support. |
| Recruitment upload is sufficiently validated | Incorrect | Server-side MIME, file signature, and size validation are incomplete. Applicant-derived public object paths also create a privacy risk. |
| Blog currently exposes active stored XSS | Mostly incorrect / stale | The live blog modal strips HTML and renders paragraphs. An unused `DiscoveryIntentPage` contains risky rendering, so it should still be hardened or removed as defense in depth. |
| Main route links are all valid | Incorrect | Confirmed 404s include `/new-user/standard/checkout`, `/menu`, `/en/menu`, `/en`, `/vi`, `/academy`, and `/en/journey/test`. Some are not linked, but several live CTA/fallback links are invalid. |
| Five-language coverage is complete | Incorrect | Coverage varies by page. Space, Pure Relaxation, Coming Soon, standalone booking, academy, and fallback behavior remain incomplete. |
| Blog only supports Vietnamese/English | Incorrect / stale | Blog Hub and daily posts currently support five languages with fallback. Older VI/EN-only article components appear unused. |
| Order confirmation is not translated | Mostly incorrect | `OrderConfirmModal` already contains extensive five-language dictionaries. |
| Required Supabase tables are missing | Partly incorrect / stale | `WebbookingBlogPosts`, `flipbook_pages`, `MarketingMedia`, and relevant `SystemConfigs` keys were queryable. Legacy `blog_posts` was absent. |
| Duplicate `* 2.*` files create duplicate Next.js routes | Incorrect | They are dead/duplicate files but Next.js does not recognize them as route entry files because their names are not exactly `page.tsx`. Remove only after usage verification. |
| Mobile widgets always cover 100% width | Overstated | Responsive limits exist, although open panels and greeting bubbles still occupy too much space on some mobile layouts and should be visually tested. |
| Build and lint are healthy | Incorrect | Build and type checking pass, but lint tooling crashes and Next currently reports `Skipping linting`. |

## 3. Shared rules for every subagent

1. Create a dedicated branch/worktree from the same baseline commit.
2. Read `AGENTS.md`, `README.md`, `DEVELOPMENT_NOTES.md`, and relevant Next.js 15.5 documentation in `node_modules/next/dist/docs/` before editing.
3. Do not modify files owned by another phase.
4. Do not modify `.env.local`, rotate keys, or expose secret values in logs/commits.
5. Add a new migration for database changes. Do not rewrite a migration that may already have run.
6. Preserve existing API response envelopes and five-language codes: `vi`, `en`, `jp`, `kr`, `cn` unless a phase explicitly includes a compatibility migration.
7. Run `git diff --check`, `npx tsc --noEmit`, the phase-specific tests, and `npm run build` before handoff.
8. Include a short rollback note and a list of manually verified routes in the PR/commit description.

## 4. Parallel-safe phase map

| Phase | Priority | Suggested branch | Exclusive ownership |
|---|---:|---|---|
| P0-A Media, RLS, recruitment security | Critical | `fix/p0-media-security` | Storage/media/recruitment APIs and a new security migration |
| P0-B Admin authorization gate | Critical | `fix/p0-admin-auth-gate` | Middleware, admin auth helpers, admin shell/login behavior |
| P0-C Atomic booking and idempotency | Critical | `fix/p0-booking-atomicity` | Booking API, booking RPC/migration, booking tests |
| P0-D System configuration hardening | Critical | `fix/p0-config-hardening` | Root stored-style handling, config validation, chatbot/config key consistency |
| P1-A Route integrity and launch UX | High | `fix/p1-route-integrity` | CTA/link destinations, error/loading/not-found pages, widget route visibility |
| P1-B Five-language completion | High | `fix/p1-i18n-coverage` | Translation provider/dictionaries and page copy only |
| P1-C Tooling and dead-code cleanup | High | `fix/p1-tooling-cleanup` | ESLint/package configuration and verified dead files only |

Do not merge multiple phase branches into each other. Merge each completed phase into the integration branch independently. If two phases discover the same file is required, stop and move that small shared change into a separate integration commit instead of editing the same file in both branches.

## 5. P0-A: Media, RLS, and recruitment security

### Goal

Prevent anonymous users from writing, replacing, or enumerating admin media and recruitment documents. Keep public read access only for explicitly published website assets.

### Allowed scope

- Supabase migrations for storage policies, `MarketingMedia`, and recruitment data.
- `src/app/api/recruitment/**`
- `src/app/api/admin/media/**`
- `src/app/api/admin/media-library/**`
- Shared upload validation helper created under `src/lib/uploads/**`

### Implementation

1. Query deployed `pg_policies`, `storage.buckets`, and `storage.objects` policies before applying changes; save sanitized results in the PR notes.
2. Add a forward-only migration that removes anonymous/public `INSERT`, `UPDATE`, and `DELETE` policies.
3. Keep public `SELECT` only for published marketing assets. Private recruitment uploads must use a private bucket and short-lived signed URLs for authorized admins.
4. Generate random object keys; never include applicant name, email, or phone in a public path.
5. Validate upload byte size, allowlisted MIME type, extension, and magic bytes on the server. Reject mismatches and SVG/HTML/script-capable payloads unless there is an explicit safe pipeline.
6. Ensure admin media mutations use the authenticated server client and an active admin role.
7. Add cleanup for a partially uploaded object when the database insert fails.

### Tests

- Anonymous storage upload/update/delete returns `401` or `403`.
- Authenticated non-admin storage mutation returns `403`.
- Active admin can upload allowed image/video types.
- Spoofed MIME, oversized files, executable content, and path traversal are rejected.
- Recruitment objects cannot be opened with a permanent public URL.
- Signed recruitment URL expires and cannot be generated by a non-admin.
- Existing published website media remains readable.

### Acceptance criteria

- No public write policy remains for affected buckets/tables.
- Applicant PII is absent from object names and public responses.
- Existing homepage/service media still renders after the migration.

## 6. P0-B: Admin authorization gate

### Goal

Make unauthorized admin navigation impossible and make logout remove the complete admin shell immediately.

### Allowed scope

- `src/middleware.ts` or the current middleware entrypoint.
- `src/lib/api/withAuth.ts`, `src/lib/api/requireAdmin.ts`, and a shared admin authorization helper.
- `src/app/admin/layout.tsx`
- `src/app/admin/login/**`
- Focused auth tests.

### Implementation

1. Preserve API-side role checks; they are already the strongest current control.
2. Replace middleware fail-open behavior with a deterministic redirect/deny path for `/admin/:path*`, excluding only the login page and required static assets.
3. Verify `WebbookingAdminUsers.user_id`, `is_active`, and role through a server-side helper before rendering the protected admin layout.
4. Never authorize admin access from an email string or the client UI alone. The `admin` login alias may normalize to the configured internal email only before Supabase sign-in.
5. On logout, await Supabase sign-out, clear local admin/session state, use `router.replace('/admin/login')`, and refresh. The protected sidebar must never remain mounted on the login page.
6. Return generic login errors and avoid exposing whether an account exists.

### Tests

- Anonymous `/admin`, nested admin pages, and direct refresh redirect to `/admin/login` without rendering the sidebar.
- Authenticated non-admin user is denied.
- Inactive admin is denied.
- Active allowed role can access admin pages and APIs.
- `admin` alias and full configured email both sign in through the same normalized flow.
- Logout immediately removes the sidebar; browser Back does not reveal cached protected content.
- Simulated Supabase/middleware failure does not grant access.

### Acceptance criteria

- UI and API authorization use the same role semantics.
- No protected admin content flashes before redirect.
- Logout leaves only the standalone login screen.

## 7. P0-C: Atomic booking and idempotency

### Goal

Guarantee one booking per customer submission, allocate collision-free booking identifiers in PostgreSQL, and prevent orphan booking items.

### Allowed scope

- `src/app/api/bookings/**`
- Booking database migration/RPC only.
- Booking-specific server tests.

### Implementation

1. Add a database-owned sequence or locked counter for the human-readable booking number. Do not calculate it with client/application `max + 1`.
2. Replace or version `create_booking_atomic` so the database allocates the identifier and inserts the booking and all child items in one transaction.
3. Add an idempotency key column with a unique constraint. Accept a client-generated request key or derive a stable server key for one checkout attempt.
4. On duplicate idempotency key, return the original booking result instead of inserting again.
5. Validate/reprice service IDs, quantities, durations, totals, and availability server-side before the transaction.
6. Remove the path that continues inserting child rows after booking creation retries fail.
7. Return a stable error envelope and avoid exposing database internals.

### Tests

- Run at least 20 concurrent requests and confirm every successful booking number is unique.
- Send the same idempotency key concurrently and confirm only one booking exists.
- Force a child item failure and confirm both parent and children roll back.
- Reject negative/zero quantities, unknown services, invalid duration options, and client-tampered prices.
- Confirm a valid multi-service/multi-quantity checkout preserves every selected line item.
- Confirm current email/confirmation behavior still receives the committed booking ID.

### Acceptance criteria

- No application-side `max + 1` booking allocation remains.
- Parent booking and items commit or roll back together.
- Repeated submit/retry cannot create duplicate bookings.

## 8. P0-D: System configuration hardening

### Goal

Remove stored injection risk and make runtime configuration read/write through one validated source.

### Allowed scope

- Root layout stored-style injection.
- `src/app/api/admin/system-settings/**`
- `src/app/api/public/site-content/**`
- Chatbot configuration read path.
- A new validation/sanitization helper under `src/lib/config/**`
- A forward-only config migration if required.

### Implementation

1. Remove raw arbitrary CSS injection from `dangerouslySetInnerHTML`, or parse stored settings into a strict allowlist of typed design tokens.
2. Permit only expected colors, numbers, enum values, URLs, and bounded lengths. Reject braces, at-rules, tags, scriptable URL schemes, and unknown keys.
3. Map validated tokens to CSS custom properties created by application code; do not store/render complete style blocks.
4. Unify chatbot/admin content keys. The chatbot currently reads `WebBookingContent` while related admin settings are written to `SystemConfigs`.
5. Add the omitted homepage styling key to both admin read and write paths, or remove the unsupported UI so it cannot falsely report a successful save.
6. Keep public content responses read-only and return only keys required by the website.

### Tests

- Stored values containing `</style>`, `@import`, `url(javascript:...)`, braces, or unknown properties are rejected/ignored.
- Valid color/font-size/spacing tokens still render correctly.
- Admin updates are visible through the public API after save.
- Chatbot uses the same saved content source as admin.
- Public endpoint never returns admin-only metadata or secrets.

### Acceptance criteria

- No database value is inserted as an arbitrary raw style block.
- Config schemas are typed and validated at the server boundary.
- Admin save and public read operate on the same documented keys.

## 9. P1-A: Route integrity and launch UX

### Goal

Remove customer-facing 404 paths, provide recoverable error states, and keep floating widgets from obstructing booking flows.

### Allowed scope

- Link/CTA declarations and route helpers.
- `not-found.tsx`, `error.tsx`, `global-error.tsx`, and `loading.tsx` boundaries.
- Widget visibility rules in layout components.
- Route smoke tests.

### Implementation

1. Centralize route builders for locale-aware booking URLs.
2. Fix known destinations:
   - Our Story booking CTA: `/${lang}/new-user/standard/checkout`.
   - Space CTA: use an existing localized booking/menu route.
   - Design Your Journey CTA: keep hotline and Google Maps destinations.
   - QR journey URL: point to a real route or remove QR generation until that route exists.
   - Empty-cart/home anchor: point to an existing section/route, not missing `#services`.
3. Decide intentionally whether `/en`, `/vi`, and `/academy` need index pages. Create redirects only if these are valid navigation destinations.
4. Add branded but lightweight 404, route error, global error, and loading states with retry where appropriate.
5. Hide or minimize chatbot/review widgets on all checkout routes, including `/:lang/new-user/:menuType/checkout`.
6. Keep existing cart behavior and homepage video-first behavior unchanged.

### Tests

- Crawl internal `href` values and assert no known internal link returns 404.
- Test Vietnamese and English booking links plus one CJK language.
- Test error boundary retry and keyboard focus.
- Test checkout at 390x844, 768x1024, 1024x768, and 1440x900 with no widget obstruction or horizontal overflow.

### Acceptance criteria

- All visible CTA and navigation destinations resolve.
- Customer-facing failures offer a clear retry/back path.
- Checkout controls remain unobstructed on mobile, tablet, and desktop.

## 10. P1-B: Five-language completion

### Goal

Make every launch route complete in Vietnamese, English, Japanese, Korean, and Chinese with deterministic fallback behavior.

### Allowed scope

- `TranslationProvider` and dictionary files.
- Text content in Space, Pure Relaxation, Coming Soon, booking, and academy pages.
- Translation-focused tests only.

### Implementation

1. Change translation fallback from an empty string to: requested language -> English -> Vietnamese -> key/developer-safe fallback.
2. Inventory every visible string in launch routes; remove hardcoded bilingual branches and empty CJK values.
3. Complete Space and Pure Relaxation narrative/service/privilege copy in all five languages.
4. Complete Coming Soon Chinese/Japanese copy and replace the mount-reset 30-day countdown with a fixed configured launch date, or remove the countdown.
5. Either localize the standalone `/booking` route fully or redirect it to the maintained localized checkout flow.
6. Define whether academy pages are launch scope. If yes, translate them fully; if no, remove public navigation links until ready.
7. Keep blog daily posts and Order Confirm behavior intact because they already have substantially better five-language coverage.

### Tests

- Render every launch route in all five languages and assert no empty labels.
- Assert no unintended Vietnamese text appears in EN/JP/KR/CN views and vice versa.
- Verify long Japanese/Korean/Chinese strings do not overflow at mobile/tablet/desktop widths.
- Verify missing CMS translation uses the documented fallback without a blank UI.

### Acceptance criteria

- Five launch languages are complete or the route is explicitly removed from launch navigation.
- No user-facing translation lookup resolves to an empty string.
- Date/countdown behavior is stable across refreshes.

## 11. P1-C: Tooling and dead-code cleanup

### Goal

Restore enforceable lint checks and reduce verified dead code without changing runtime behavior.

### Allowed scope

- `package.json`, lockfile, ESLint configuration.
- Files proven unused by static search and production build.
- CI configuration if present.

### Implementation

1. Align ESLint 9, `eslint-config-next`, and `@rushstack/eslint-patch`, or remove the obsolete patch if the current config no longer needs it.
2. Make `npm run lint` execute successfully and fail on real lint violations.
3. Add typecheck, lint, and production build to CI in that order.
4. Remove duplicate `* 2.*` files only after proving there are no imports or scripts referring to them.
5. Audit candidates such as `BookingForm`, `VoiceSearch`, `VietQRPayment`, old ServiceBook/MenuIntro components, old blog article components, and empty demo directories before deletion.
6. Do not remove current uncommitted feature files merely because they look like demos; confirm ownership and route usage first.

### Tests

- Clean install followed by `npm run lint`, `npx tsc --noEmit`, and `npm run build` passes.
- Route manifest before/after cleanup has no unintended removals.
- `rg` confirms deleted modules have no imports or runtime string references.
- Homepage, service selection, checkout, admin login, blog, Our Story, and Design Your Journey smoke tests pass.

### Acceptance criteria

- Lint is no longer skipped or crashing.
- CI blocks lint/type/build regressions.
- Cleanup commit contains no behavior or visual redesign.

## 12. Merge and release order

Recommended merge order into an integration branch:

1. P0-A Media/RLS/recruitment security.
2. P0-B Admin authorization.
3. P0-C Atomic booking/idempotency.
4. P0-D Config hardening.
5. Run a complete staging smoke test and a Supabase policy audit.
6. Merge P1-A, P1-B, and P1-C independently after rebasing each branch onto the P0-complete integration baseline.
7. Deploy the integration commit to a preview environment.
8. Verify production-like environment variables, email delivery, storage access, booking concurrency, five languages, and responsive layouts.
9. Fast-forward or merge the approved integration commit to `vercel`.

P0-A through P0-D can be developed concurrently because their ownership boundaries do not overlap. They should still be merged one at a time with the complete validation suite after every merge.

## 13. Final go-live gate

Launch only when all items below are evidenced, not assumed:

- Supabase RLS/storage policy export reviewed and public writes removed.
- Admin role enforcement tested for anonymous, non-admin, inactive admin, and active admin users.
- Booking concurrency/idempotency test passes with no duplicate IDs or orphan items.
- Stored configuration injection payloads are rejected.
- Internal route crawl contains no visible broken links.
- Five-language route matrix has no blank content or overflow.
- Mobile/tablet/desktop checkout has no obstructing widget or horizontal overflow.
- `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass in CI.
- Secrets are present only in deployment environment configuration and not in source, logs, or client bundles.
- A rollback deployment and database migration rollback strategy has been documented and rehearsed.
