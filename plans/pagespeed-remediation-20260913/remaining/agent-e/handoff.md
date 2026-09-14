# Agent E — loopback runtime trace harness

## Scope

This handoff adds a diagnostic harness only. It does not change History, Hero,
admin code, migration/CAS code, media assets, or any runtime source. The
harness rejects non-loopback targets and never submits forms or calls an API,
Supabase, Storage, Vercel, or an external URL.

## Provenance

- Base SHA: `65fb5afdd08a4c740a6e8adfdb1c17fff2a159d8`
- Branch: `codex/ps-runtime-trace-20260914`
- Worktree: `/private/tmp/nganha-pagespeed-agent-e-final-20260914`
- Runtime target: an operator-started local server, default `http://127.0.0.1:3002`
- Profile: Chromium headless, 390×844, DPR2, touch, CPU4×

## Harness

Run:

```bash
node scripts/trace-runtime-loopback.mjs \
  plans/pagespeed-remediation-20260913/remaining/agent-e \
  http://127.0.0.1:3002
```

The flow visits `/`, scrolls to `#history` through five positions, attempts
allowlisted visible menu and chat triggers, then visits
`/en/new-user/standard/checkout` without submitting. It records CDP
`Layout`, `UpdateLayoutTree`, and `ForcedLayout` events; Long Task and Layout
Shift PerformanceObserver entries; geometry/computed-style call stacks by
phase; animation name/play-state; console/page errors; and image/script
request bytes. Trace output is JSON and contains no credentials.

The harness writes `PASS` only when every step completes. Missing controls are
reported as `NO_DATA`; server/browser failures are `BLOCKED`; a mixed run is
`PARTIAL`. It does not infer forced reflow from a geometry read alone.

## Validation

- `node --check scripts/trace-runtime-loopback.mjs` — PASS.
- Loopback run with no permitted local browser/server — BLOCKED, with a raw
  report written under the agent-evidence directory; no trace or request data
  was claimed.
- Non-loopback guard with `https://oria-spa.vercel.app/history` — BLOCKED before
  browser launch; no external request made.

## Current conclusion

This worktree has no before/after runtime numbers because the local server and
Chromium launch permission were unavailable in the bounded run. Existing
production observations must not be relabeled as this candidate's trace. Run
the harness against a production build of the integration SHA, then review
each attribution before changing rAF reads/writes, animation behavior, or
chunk boundaries. Preserve the existing History gating, Hero behavior, and
reduced-motion behavior until that evidence exists.

## Rollback and scope audit

There is no runtime patch to roll back. The only new source file is the
loopback-only trace script; the other changes are evidence documentation.
`git diff --check` and a line-by-line diff review are required before cherry-pick.
