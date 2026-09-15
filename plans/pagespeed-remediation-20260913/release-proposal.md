# Release proposal — PageSpeed candidate

Status: **HOLD FOR USER APPROVAL AND EXTERNAL GATES**

Candidate branch: `codex/ps-integration-20260913`

Candidate source tip before packaging: `e9df394`; package HEAD includes staging publisher and evidence.

Default branch: `master`, confirmed by owner and `git ls-remote --symref origin HEAD`. Remote master/vercel both observed at `e5c9d28b0cc6531ca88144413bf3ae30c6e2162a`. Vercel production-branch mapping remains unverified.

UI source changes are contained through `6ea8f21`; SQL CAS insert ambiguity was fixed at `dd0fa8e` and real PostgreSQL suite passed 16 checks. Hero assets are uploaded to authorized staging `media-uploads/marketing`, and `hero_videos` now uses mobile_url/desktop_url. Original URL, poster and playlist order are preserved. Local TypeScript and source contracts pass; prior build/browser evidence retains its original tested SHA. No production deployment has been made.

## Preconditions before rollout

- Real PostgreSQL CAS migration, permission, concurrent-write, read-back, rollback and recovery evidence is PASS.
- Matched active Hero baseline/candidate transfer evidence meets the plan threshold; Storage read-back and thumbnail manifest are verified.
- Runtime TBT/attribution and production Lighthouse/PSI evidence meet the acceptance profile.
- Manual accessibility/font and physical-device checks are complete.
- Vercel project, alias, target branch and deployed SHA metadata are verified.
- User explicitly approves push/merge/deploy and any production DB/Storage changes.

## Proposed order after approval

1. Apply and verify the reviewed SQL/RPC migration on the approved disposable/staging database; capture backup, journal and rollback evidence.
2. Upload/version required media to approved staging, verify read-back and transfer measurements.
3. Prepare integration with `master` as the owner-confirmed default branch; verify Vercel production mapping before authorized push/merge/deploy. Do not infer deployed SHA from HTTP status.
4. Verify Vercel deployment metadata, alias, route/canonical/cache behavior, RPC/assets read-back and browser smoke.
5. If a verified gate regresses, execute the tested rollback and report the exact resulting SHA/state.

This proposal is not authorization to execute any of the above steps.
