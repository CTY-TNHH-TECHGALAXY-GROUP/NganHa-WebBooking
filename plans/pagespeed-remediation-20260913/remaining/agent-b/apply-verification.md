# Agent B apply verification — 2026-09-13

- Dry-run inventory: 25 verified source pointers; 78 generated candidates (75 Supabase History/OurStory + 3 local chatbot). No writes.
- First apply attempt uploaded and verified 75 Supabase objects, then stopped before any config mutation because JSONB equality through the client returned a CAS failure. No config row changed in that attempt.
- Script was corrected to aggregate all pointers per config, preflight the canonical value hash, and update once with exact `updated_at` snapshot plus read-back verification.
- Second apply: `/private/tmp/ps-b-apply-v2.json`, journal `/private/tmp/ps-b-apply-v2.jsonl`; status `applied_verified`, 25 sources, 78 candidates, 75 storage writes verified, 2 config rows updated. Local chatbot candidates were generated in the B worktree and are committed in the integration branch.
- Independent read-back found 25/25 configured pointers with non-empty responsive maps; every configured URL matched the content-hash URL pattern. Current config timestamps after apply: `brand_history` `2026-09-13T16:46:48.937+00:00`; `about_story_content` `2026-09-13T16:46:49.635+00:00`.
- Object verification performed by the migration for each Supabase candidate: upload with `contentType=image/webp`, `cacheControl=31536000`, `upsert=false`, then public HEAD/GET, MIME, byte hash and dimensions. Originals were not overwritten or deleted.
- Private raw-row backups remain outside git with mode `0600`; paths are recorded only in the sanitized manifest. No secret or customer data is committed.

The `updated_at` conditional is paired with a preflight value hash because the deployed PostgREST client cannot compare a JSONB object using the prior string filter. If future writers do not reliably update `updated_at`, the migration must be moved to a reviewed database RPC/transaction before another apply; this run must not be repeated blindly.
