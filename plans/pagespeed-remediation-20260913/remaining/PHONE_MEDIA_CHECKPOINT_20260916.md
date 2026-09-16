# Phone media checkpoint — not final production acceptance

User requested commit/push of the current work and deferred further upgrades.

Changes: replace invalid minimal GIF placeholders in Our Story/History with a complete transparent PNG; hoist Space MediaRenderer to module scope to preserve component identity; hide Farm Retreat story-image watermarks until the corresponding image loads and isolate their blend context. No production database changes in this patch.

Verification before commit (parent 89cb74a plus this source patch): TypeScript and production build PASS; Our Story browser regression 4 runs PASS on local port 3463; Farm Retreat blocked-image and successful-load watermark tests PASS. Apple native image decoder accepted the new PNG at 1x1; the previous GIF was rejected. These are not physical Safari/Android retest results.

Residuals: History scroll performance is not yet proven fixed; Android symptom needs physical retest; mobile LCP acceptance remains open. Space diagnostic did not exercise its conditional image-identity assertion, so it is not a runtime PASS for that fix. Existing deployment and DB gates remain open. Supabase project adzfohfdindovfcpaizb is production, as confirmed by the owner; prior staging-only permission does not authorize further writes.

The owner subsequently explicitly authorized merging into master, accepting that further upgrades will follow. This is release authorization, not proof that the outstanding acceptance gates passed. A master push may trigger Vercel; deployed SHA must still be verified separately. Build outputs, editor swap files, private backups and unreviewed diagnostic artifacts are excluded.
