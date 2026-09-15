# PageSpeed final acceptance — 2026-09-16

## Decision

**PARTIAL / BLOCKED — not ready for production release approval.**

The final local candidate is clean and the implementation/browser regressions that were reproducible locally are closed. Required external gates remain unverified and were intentionally not simulated.

## Candidate

- Integrator branch: `codex/ps-integration-20260913`
- Current tip: `9dfdde2` (local Hero rendition manifest added after the tested source candidate)
- App source fixes: `7958cf4` (AI chat reachable, Escape/focus trap) and `6ea8f21` (Header overlay Escape)
- Final QA replay source candidate: `435b364b1617b26bf33d0abbd2cd846a84d2f029`
- Worktree: clean; `git diff --check` PASS
- No push, merge to `master`/`vercel`, deployment, production DB write, or Storage write performed.

## Gate table

| Gate | Result | Evidence / residual |
| --- | --- | --- |
| TypeScript | PASS | `npx tsc --noEmit` exit 0 |
| Next production build | PASS | Next.js 15.5.14, 70 static pages |
| Lint | PASS_WITH_WARNINGS | Existing warnings; no lint error |
| Menu, Contact, AI chat keyboard flow | PASS_LOCAL | Exact mobile 390×844 DPR2 and desktop 1440×900 DPR1; Escape/focus return and chat Tab containment pass |
| Route/sitemap/cache replay | PASS_LOCAL | 65 routes, 47 sitemap entries, 63 HTTP 200 + 2 expected negative-control 404s; both browser profiles PASS_REPLAY |
| Our Story media contract/browser | PASS_LOCAL | Contract and local browser decode evidence; Storage readback/published manifest not verified |
| Real PostgreSQL CAS/ACL/concurrency/rollback | NOT_VERIFIED | No disposable PostgreSQL runtime available; loopback probe refused; source contract only |
| Hero 12-second matched transfer reduction | NOT_VERIFIED | Renditions are rendered and browser-decode verified locally, but there is no matched baseline/candidate active transfer and no staging asset readback; filesize is not used as transfer evidence |
| Runtime TBT/attribution and PSI/Lighthouse | NOT_VERIFIED | Existing diagnostic traces do not prove acceptance thresholds on this candidate |
| Manual WCAG/font/physical device | NOT_VERIFIED | Physical iOS/Android, zoom/reflow, contrast adjudication and font delivery/license review remain |
| Production deployment SHA/alias/read-back | NOT_VERIFIED | Vercel project/alias mapping and deployed metadata not available; no deployment attempted |

## Evidence index

Final QA artifacts: `remaining/agent-qa-final-6/evidence-index.json`.

Focused menu/chat artifacts: `remaining/agent-final-menu/final-candidate/evidence-index.json`.

Role-B fail-closed database handoff: `remaining/agent-b/evidence-index-final-20260915.json`.

Media handoff and local replay: `remaining/agent-media-runtime/evidence-index.json`.

Local Hero rendition manifest: `remaining/agent-media-runtime/rendered-hero-renditions-20260916.json` (mobile 640×360/12 s, desktop 1280×720/12 s; browser decode PASS_LOCAL; not uploaded).

The historical `FINAL_ACCEPTANCE_REPORT.md` remains unchanged and must not be interpreted as approval.

## Environment validation performed on 2026-09-16

- The configured `DATABASE_URL` and `DIRECT_URL` resolve to a remote Supabase pooler (`aws-1-ap-southeast-1.pooler.supabase.com`, ports 6543/5432). A read-only `SELECT` probe returned PostgreSQL `28P01` for both URLs. The acceptance runner correctly refuses this non-loopback target; no migration or write was attempted.
- The public Storage bucket `media-uploads` is readable. Listing the `homepage` prefix returned only `0807(1).mp4` (26,974,458 bytes) and `hero_video.mp4` (21,984,571 bytes). No mobile/desktop Hero rendition or candidate transfer manifest is present there.
- Read-only `git ls-remote` shows `origin/vercel` and `origin/master` still at `e5c9d28`; the local candidate has not been pushed.
- `vercel` CLI is not installed and no Vercel browser connector/session is available to this task, so project/alias/deployment metadata cannot be verified.

## Required user dependencies

1. Provide or authorize a disposable PostgreSQL service/URL that supports real migration, ACL, two-connection concurrency, read-back, recovery and rollback testing.
2. Provide approved staging Storage/asset access for matched Hero transfer and published thumbnail read-back.
3. Provide a valid Vercel project/alias read-only session or deployment metadata, then explicitly approve push/merge/deploy.
4. Provide an iOS/Android device/session for physical Hero, pinch/zoom and checkout smoke.

Until these are supplied and the gates pass, the correct release state is **BLOCKED**, not APPROVED.
