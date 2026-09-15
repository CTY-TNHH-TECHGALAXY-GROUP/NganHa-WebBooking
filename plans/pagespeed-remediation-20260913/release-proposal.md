# Release proposal — PageSpeed candidate

Status: **HOLD FOR USER APPROVAL AND EXTERNAL GATES**

Candidate branch: `codex/ps-integration-20260913`

Candidate tip: `f37a83e`

App source changes are contained in the reviewed PageSpeed candidate history through `6ea8f21`; later commits are evidence/test documentation only. Local TypeScript, build, route replay, menu/contact/AI chat keyboard flow, cart smoke and local Hero rendition decode pass. No production mutation has been made.

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
3. Push/merge the candidate to the verified target branch (`vercel` by project handoff); do not infer deployed SHA from HTTP status.
4. Verify Vercel deployment metadata, alias, route/canonical/cache behavior, RPC/assets read-back and browser smoke.
5. If a verified gate regresses, execute the tested rollback and report the exact resulting SHA/state.

This proposal is not authorization to execute any of the above steps.
