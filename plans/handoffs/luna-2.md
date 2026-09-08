# Luna-2 Handoff

## Scope

Checkout timezone and hydration, validation UX, cart quantity/options, catalog-read VND/USD display, responsive Header, CTA configuration wiring, and demo retirement.

## Baseline

- Branch: `master`
- Baseline SHA: `d3c850f7623ccc222d810bc961d8d4877275156c`
- No production deployment or database write was performed.

## Changed Files

- `src/app/[lang]/new-user/[menuType]/checkout/page.tsx`
- `src/app/[lang]/new-user/[menuType]/checkout/checkout-demo.module.css`
- `src/app/demo-3d/page.tsx` (deleted; middleware returns 404)
- `src/components/Checkout/OrderConfirmModal.tsx`
- `src/components/Checkout/PaymentMethods.tsx`
- `src/components/CustomForYou/index.tsx`
- `src/components/Header/Header.tsx`
- `src/components/Menu/MenuContext.tsx`
- `src/components/Space/SpacePage.tsx`
- `src/components/SystemSettingsProvider.tsx`
- `src/lib/bookingCartStorage.ts`
- `src/lib/config/siteContentSanitizer.ts`
- `src/lib/config/urlSettings.ts`
- `src/lib/paymentConstants.ts`
- `src/middleware.ts`
- `src/styles/header.css`
- `src/app/admin/system-settings/page.tsx`
- `src/app/api/admin/system-settings/route.ts`

## Verification

- `git diff --check`: pass.
- `npx tsc --noEmit`: pass after build artifact regeneration.
- Targeted ESLint: 0 errors, existing warnings only.
- `npm run lint`: 0 errors, existing repository warnings only.
- `npm run build`: compilation and type validation pass; static generation stops at unrelated `/admin/content/blogs` missing `.next/server/app/admin/content/blogs.rsc` artifact.
- Local server: `http://localhost:3102`.
- Playwright mobile 390x844 and desktop 1440x1000: checkout HTTP 200, document width equals viewport, no console errors, no failed requests. Screenshots: `/private/tmp/luna-2-checkout-mobile.png`, `/private/tmp/luna-2-checkout-desktop.png`.
- Local checkout flow: catalog picker opened; catalog service rendered VND/USD; quantity control changed 1 to 2; Save persisted `3.150.000 VND / $132.00 USD` to the checkout total; invalid phone validation rendered localized error and made no non-GET request.
- Retired `/demo-3d`: HTTP 404.

## UI Matrix

- UI01: partial pass; current local spa clock, checkout hydration, and 200 response verified. Near-midnight/timezone matrix not run.
- UI02: not run; sleep/focus simulation not available.
- UI03: partial pass; quantity 1 to 2 and Save verified. Remove/reopen/add-another variants not run.
- UI04: not run; multi-duration/different-option comparison not completed.
- UI05: partial pass; catalog-read addon and VND/USD totals verified. Reload/reprice/bulk-edit variants not run.
- UI06: partial pass; loaded catalog and public error-free state verified. Slow/empty/500/inactive/price-change variants not run.
- UI07: not run; no booking submission, retry, timeout, or 503 was triggered.
- UI08: not run; locale-switch persistence not exercised.
- UI09: partial pass at 390 and 1440; widths had no horizontal overflow. Full width matrix not run.
- UI10: not run; keyboard/focus/zoom matrix not exercised.
- UI11: code path wired and sanitizer existing; tablet/device and external CTA cases not run.
- UI12: informational payment UI only; no prepayment was triggered. Full payment-method matrix not run.
- UI13: retired demo 404 verified; production Journey/CTA matrix not run.
- UI14: not run; admin credentials/session were unavailable.

## Boundaries and Blockers

- No real DB prices, `.env.local`, Pure/History CMS, booking API, mailer, or atomic SQL were modified by Luna-2.
- QR TRANSFER and Google Pay badge remain informational; no payment API or prepayment was introduced.
- The canonical server reprice/booking implementation remains outside this scope; staging DB price-change and server failure cases require Terra-2/staging verification.
- Computer-use browser providers were unavailable; Playwright required elevated local execution and was used only against localhost.
