# Canonical domain execution report — 2026-09-13

Official website origin: `https://oria-spa.vercel.app`.

This report records the before/after evidence for the scoped canonical-domain fix. The main worktree was left untouched; implementation ran in `/private/tmp/nganha-domain-deploy` from source SHA `a827bfce79cd9da9df1f0580412b9facc7782224`.

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

After deployment, record the commit/deployment SHA, route pass counts, robots/sitemap checks, and redirect table in [`after.json`](./after.json). `web_booking_url` remains pending until its shared consumer/project ownership is identified. Legacy Vercel aliases are reported separately when their ownership cannot be verified with the available account.

Rollback: revert the scoped code commit through the normal branch flow; for the database, read the current row and conditionally restore only the recorded pointer if no newer SEO edit has changed it.
