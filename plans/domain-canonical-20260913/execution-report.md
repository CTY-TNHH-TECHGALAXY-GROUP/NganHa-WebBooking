# Canonical domain execution report — 2026-09-13

Official website origin: `https://oria-spa.vercel.app`.

This report records the before/after evidence for the scoped canonical-domain fix. The main worktree was left untouched; implementation ran in `/private/tmp/nganha-domain-deploy` from source SHA `a827bfce79cd9da9df1f0580412b9facc7782224`. GitHub Vercel checks identify `vercel` as Preview and `master` as Production for project `tech-galaxy/ngan-ha-web-booking`; both refs were rechecked before their pushes.

## Before

See [`before.json`](./before.json). The live HTML, robots, and sitemap all exposed the legacy host. The malformed value came from `global.vi.published.canonicalPath = /oria-spa.vercel.app` being inherited by every route, combined with the old origin fallback.

## Scope implemented

- Normalize the site origin to protocol + host and use `https://oria-spa.vercel.app` as the fallback.
- Exclude `global.*.published.canonicalPath` from public page-field inheritance; page-level overrides remain supported.
- Reject hostname-shaped canonical paths at validation, normalization, and metadata assembly boundaries.
- Force the admin global SEO canonical field to remain empty; route-level overrides remain editable.
- Update chatbot prompt, branch website constant, and README links to the official origin.
- Apply the Supabase `seo_config` change with a raw-value conditional update; no other SEO field was rewritten.

## Verification

After deployment, [`after.json`](./after.json) records production SHA `3ab779819a8424acdda301c460c87a4e1c6cb74c`, successful Vercel Preview/Production checks, and the live route audit. Fifty-seven public/locale URLs returned HTTP 200 with exactly one official canonical and matching `og:url`; no legacy hostname appeared in their HTML. The sitemap has 47 unique official locs and robots points to the official sitemap. Redirects from `/local-tour`, `/spa-celestial-menu`, and `/academy` were followed and verified.

The Vercel Preview URL is SSO-protected, so it was not counted as public HTML evidence; production was audited directly at the official origin. `web_booking_url` remains pending until its shared consumer/project is identified. The legacy aliases remain outside the verified project ownership: `ngan-ha-web-booking.vercel.app` is 404, while `nganha.vercel.app` and `oriaspa.vercel.app` redirect to the legacy menu. `NEXT_PUBLIC_SITE_URL` environment scope also could not be inspected with the available Vercel account; the code fallback and live production output are correct.

Rollback: revert the scoped code commit through the normal branch flow; for the database, read the current row and conditionally restore only the recorded pointer if no newer SEO edit has changed it.
