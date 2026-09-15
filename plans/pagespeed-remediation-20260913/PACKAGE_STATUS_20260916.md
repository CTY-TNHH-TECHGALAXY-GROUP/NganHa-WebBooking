# PageSpeed package — current status

This status supersedes outdated environment claims in FINAL_ACCEPTANCE_REPORT_FINAL_20260916.md. That file is currently open in an editor (swap files exist), so it was preserved.

## Completed

- Owner-confirmed default branch `master`; remote symbolic HEAD verified. Both remote master/vercel were e5c9d28b0cc6531ca88144413bf3ae30c6e2162a at packaging.
- Real PostgreSQL CAS suite: 16 checks PASS on dd0fa8eeea4528e7e147f4fd15ba0863d0cab887, with exact hashes and failed attempts retained in agent-b/postgres-real-handoff-20260916.md.
- Fixed actual SQL INSERT ambiguity; application UI source unchanged in this package.
- Uploaded and hash-verified both Hero assets in staging media-uploads/marketing.
- Published mobile_url and desktop_url to matching hero_videos entry with an atomic JSONB snapshot condition. Readback matched. Preserved canonical original video, poster, ID and order.
- Selection checked at 390/767 px (mobile) and 768/1440 px (desktop).

## Hero configuration and rollback

Evidence: remaining/agent-media-runtime/marketing-config-20260916/{before,candidate,assets,result}.json. These contain public media configuration only; credentials are environment-only.

Publisher: scripts/publish-staging-hero-renditions.mjs. It refuses a different project, verifies assets by hash, saves the original snapshot and uses conditional PATCH. Rollback must likewise restore before.json only if current hero_videos equals candidate.json; any intervening edit is a conflict requiring review. This rollback procedure has not been executed on staging.

The updated config depends on the candidate's responsive Hero support. Remote config readback alone does not prove the currently deployed application uses these fields. Server cache refresh may take at least 60 seconds.

## Release status

PACKAGED / STAGING CONFIG UPDATED. Production approval remains pending: matched 12-second transfer, end-to-end recovery/failure injection, runtime/Lighthouse thresholds, manual accessibility/device checks and Vercel mapping/live SHA are still incomplete. Prior local build/browser PASS does not become a new measurement on this package SHA.

No automatic merge, push, deployment or production SQL migration is part of packaging. Package contains committed source and evidence only; local .env, dependencies and editor swap files are excluded.
