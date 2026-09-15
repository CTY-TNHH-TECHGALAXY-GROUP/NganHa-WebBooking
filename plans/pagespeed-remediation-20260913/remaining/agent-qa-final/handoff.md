# QA final-candidate replay handoff

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Scope and provenance

- Role: QA / independent local release-readiness replay.
- Candidate SHA tested by the route/cache/browser harness: `d129b6f0c184d937db8cc9f88342ca3c5e9ca20e`.
- Worktree: `/private/tmp/nganha-pagespeed-integrator`, branch `codex/ps-integration-20260913`.
- Local server: `http://127.0.0.1:3422`, started with `npm run start -- -p 3422` from the candidate worktree.
- No application, database, Storage, Vercel, push, merge, or deploy mutation was performed by this replay.

## Exact QA command and raw outcome

```text
QA_BASE_URL=http://127.0.0.1:3422 \
QA_OUTPUT_DIR=plans/pagespeed-remediation-20260913/remaining/agent-qa-final \
node scripts/test-pagespeed-qa-closeout.mjs
```

The command exited `0` and produced `qa-closeout-20260915.json` plus `route-matrix-20260915.csv`. The raw report must be treated as authoritative and is not promoted to an overall PASS:

- 65 route probes were captured from the App Router, SEO route source, and local sitemap; the sitemap contained 47 entries.
- 63 routes returned HTTP 200. The two HTTP 404s are the explicitly probed `/public/flipmenu/index.html` demo path and `/nonexistent` negative control.
- The local candidate returned representative public/localized pages, admin login, API services, robots, and checkout responses as recorded in the CSV.
- Browser smoke reached the homepage with HTTP 200, but the generic harness recorded `BLOCKED` after its menu Escape check did not close the overlay; on desktop, the subsequent cart click was intercepted by the still-open menu. This is retained as a raw harness failure, not hidden or force-clicked.
- A focused no-force-click menu regression had previously passed on the exact candidate in the existing final-menu evidence. That shared report was concurrently overwritten while another worker extended the harness to cover AI chat, so this QA handoff does not promote or re-hash that mutable artifact. The integrator must rerun the final focused menu/chat test after source ownership is settled.

## Gate disposition

| Gate | Disposition |
| --- | --- |
| Candidate SHA / local route inventory | PASS_LOCAL |
| Typecheck/lint/build | PASS recorded by integrator; rerun status is outside this QA-only replay |
| Canonical/cache/MIME | PARTIAL_LOCAL; no live alias or deployment mapping |
| Menu/chat dedicated regression | REPLAY REQUIRED; generic QA smoke retains raw BLOCKED/FAIL |
| Real PostgreSQL CAS/ACL/concurrency/rollback | NOT_VERIFIED; no disposable PostgreSQL server/URL |
| Matched Hero 12-second transfer reduction | NOT_VERIFIED; local file size is not transfer evidence |
| Runtime TBT/attribution and production PSI/Lighthouse | NOT_VERIFIED |
| Manual accessibility / physical device checks | NOT_VERIFIED |
| Production deployment SHA/alias/read-back | NOT_VERIFIED; no push/deploy performed |

## Residuals and dependencies

1. The generic QA script's menu/cart sequence is a reproducible harness-level FAIL on this replay; use the dedicated menu report for the focused regression and preserve both raw results.
2. Real PostgreSQL CAS acceptance still requires an approved disposable PostgreSQL URL/server; source-contract checks or JavaScript simulation do not close this gate.
3. Matched active Hero transfer reduction and Storage readback require an approved staging/live asset environment; local asset sizes do not close the transfer gate.
4. Runtime TBT attribution, production Lighthouse/PSI, manual accessibility, physical pinch/zoom, font delivery, and official Vercel deployment SHA mapping remain open.
5. The worktree had pre-existing uncommitted application edits in `src/components/AIChatBot/AIChatBot.tsx` and `src/components/FloatingWidgets/FloatingWidgets.tsx` when this report was generated. QA did not alter or commit those files; integrator must review ownership and diff before any candidate commit.

Overall disposition: **PARTIAL / BLOCKED for production closeout**. This evidence proves a local route/cache replay and a focused menu regression on the exact candidate; it does not authorize production merge, push, deploy, or production data writes.
