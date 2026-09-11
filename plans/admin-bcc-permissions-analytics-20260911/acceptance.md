# Integration acceptance - 2026-09-11

Status: code checks passed; full production feature acceptance remains incomplete.

Verified against the shared worktree:
- Production Next build: PASS (71 static pages).
- TypeScript: PASS, rerun sequentially after build generated route types.
- Lint: PASS with existing warnings.
- Admin capability tests: PASS.
- BCC contract: PASS.
- Email diagnostics: 13/13 PASS.
- Executed SEO exported tests: PASS.
- Analytics tests: 7/7 PASS.

Release includes the remaining system-settings capability enforcement and reception-email redaction. Existing checkout UI edits are outside this release and remain uncommitted.

Outstanding production acceptance gates:
1. Review live role/storage policies and apply the capability migration draft before enabling editor grant management. Existing editors default to deny until grants exist.
2. Review/apply analytics tables and retention maintenance draft. Dashboard cannot provide durable analytics before this.
3. Connect explicit analytics consent/opt-out UI. Current default collects nothing.
4. Connect verified booking conversion helper after successful commit, including anonymous session attribution. Current booking route does not emit this event.
5. Confirm production canonical domain configuration and perform live SEO metadata checks.
6. Perform authenticated BCC save/send and editor grant/revoke tests with authorized test accounts after database prerequisites.

No production SQL or real email/booking was executed during this acceptance. Passing local tests does not establish production delivery or authenticated DB behavior.
