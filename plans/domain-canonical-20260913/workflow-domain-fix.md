# Domain follow-up: menu and checkout canonical inheritance

Date: 2026-09-13. Official origin: `https://oria-spa.vercel.app`.

## Live defect and fix

The expanded audit requested 89 public/sitemap/locale URLs. Ten workflow URLs (`/{vi,en,cn,jp,kr}/new-user/standard/{menu,checkout}`) returned HTTP 200 but inherited the homepage canonical and homepage hreflang destinations. None of the 89 responses contained a legacy hostname. The initial audit also flagged the homepage OG URL because JSDOM normalized its canonical with a trailing slash; this is URL-equivalent, not a homepage defect. The audit script now normalizes both sides of that comparison.

Two metadata-only server layouts supply each workflow route's own canonical, localized alternates and OG URL. They return children unchanged and preserve inherited OG fields, title, robots policy and all client-page behavior. There is no invented x-default workflow URL. No sitemap/disallow rule was changed.

The origin resolver now rejects any non-official production origin, including stale environment values and preview deployment hosts. HTTP/HTTPS localhost and 127.0.0.1 remain available outside production. Existing page-level canonical overrides remain supported; global canonical is still excluded from inheritance.

## Validation completed

- TypeScript `npx tsc --noEmit`: pass.
- Existing `node scripts/test-admin-seo-contract.mjs`: pass.
- `node scripts/test-seo-domain.cjs`: pass. Runs the existing SEO behavior suite, origin regression cases, and both actual layout metadata functions across five locales. Verifies preservation of parent OG title and inherited robots behavior.
- Targeted Next lint for the three changed production files: pass, no warnings.
- `npm run build`: pass (Next 15.5.14).
- HTTP requests to the built production server on localhost:3127: all ten workflow URLs return 200, exactly the expected canonical/OG URL and five language alternates.
- Headless Chromium on English menu and Vietnamese checkout: canonical/OG remain correct after DOM load and hydration wait. No booking or email was submitted.

The full before-live audit, ten-route local after results and hydrated samples are stored alongside this report locally as `final-live-audit.json`, `workflow-local-after.json`, and `workflow-hydrated-after.json`. The first filename refers to the expanded audit before this new code fix, not successful post-deploy acceptance.

## Database and local duplicate

Read-back at 2026-09-13T10:11:19Z covered all 120 SystemConfigs and 9 WebBookingContent rows, with count checks to detect pagination. No legacy hostname remained. `web_booking_url` is `https://oria-spa.vercel.app/`; global Vietnamese SEO draft/published canonicalPath are both empty. No DB mutation was needed in this follow-up.

The main checkout's untracked `src/lib/seo/metadata 2.ts` had one stale fallback string. No imports were found, but tsconfig includes all TS files. Only that string was changed to the official origin; the file remains untracked and is excluded from this production change. Existing main-checkout conflicts in BodyMap.tsx and dictionaries.ts were untouched.

## Deployment gate and external hosts

User explicitly confirmed Production Branch is `master`. Its remote SHA before this patch is `6ce113eb1ac420f565399a21164dc8abd7502444`. GitHub ruleset `PROTECT` (20502965) is active on the default branch and includes an `update` restriction. This patch must be delivered via a branch/PR and a repository-authorized release process; do not bypass protection or claim the local build is live.

Direct host checks during this run:

| Host | Result |
| --- | --- |
| nganha.vercel.app | 307 to https://oriaspa.vercel.app/ |
| oriaspa.vercel.app | 307 to /en/new-user/standard/menu |
| ngan-ha-web-booking.vercel.app | 404 |
| nganhaspa.vn | DNS ENOTFOUND |

The first result persists despite the user reporting deletion; ownership/project mapping of those hosts remains unverified. Do not add ineffective middleware to the new project to compensate. Chrome is signed into Vercel, but the available browser connector cannot attach to Chrome and its Apple Events JavaScript access is disabled. No browser security setting was changed. Dashboard alias ownership and Supabase Auth Site URL/allowlist remain unverified. Source authentication uses password sign-in; no OAuth/magic-link/reset callback consumer was found.

After the PR is released through the allowed process, run `node scripts/audit-domain-live.mjs` again and verify all ten workflow routes on the official live domain. Keep release acceptance pending until those results pass. Revert only this scoped commit through the same branch process if needed; do not restore stale DB/domain values.
