# P0 History rendition migration — CAS and rollback handoff

## Status

Prepared locally only. The SQL migration in
`supabase/migrations/20260914_system_configs_jsonb_cas.sql` has **not** been
applied to Supabase. No storage object, `SystemConfigs` value, or deployment
was changed by this work.

## What is now enforced in code

- `scripts/migrate-pagespeed-renditions.mjs` creates a UUID run directory and
  refuses to reuse an existing manifest or journal.
- `--mode=rollback` requires an immutable `--release-manifest`; it creates a
  separate output manifest and never writes the release input.
- `--mode=apply` requires an operator-provided durable private `--backup-dir`.
  Raw JSON backups are never written under the repository or `/private/tmp` by
  default.
- Config writes for `brand_history` and `about_story_content` use only
  `webbooking_compare_and_swap_system_config`. A zero-row response is a
  conflict and stops the run; there is no fallback timestamp update.
- The two existing admin writers (`/api/admin/history` and
  `/api/admin/system-settings` for `brand_history`) use the same RPC. The
  generic settings endpoint refuses a mixed History-plus-other-config request
  so it cannot return a partial multi-key save when History CAS conflicts.
- Signed source URLs stop the run instead of stripping their query string and
  downloading a different object. Chatbot local asset generation is excluded
  from this database migration because it is already owned by the local asset
  pipeline.

## Required operator sequence

1. Run the migration preflight transaction against the exact target project.
   It must find the quoted `SystemConfigs` table, JSONB `value`, timestamptz
   `updated_at`, a unique `key`, and the expected Supabase `service_role`.
   Any preflight failure is a stop condition, not an instruction to edit the
   migration live.
2. In a disposable/non-production database, prove the RPC rejects a stale
   expected JSON document and permits exactly one of two concurrent writers.
   Confirm `anon` and `authenticated` cannot execute it.
3. Apply the reviewed SQL migration, then deploy the application code that
   calls the RPC. Do not deploy the app code first: the editor will otherwise
   receive an RPC-not-found error instead of taking the unsafe legacy path.
4. Take a read-only config snapshot and preserve it in the organization’s
   approved private backup store. Run `--mode=inventory` and review the
   JSON-pointer scope diff. Do not treat a previous report as current state.
5. Only after review, run `--mode=apply` with a new `--run-id` and a durable
   private `--backup-dir`. Verify each versioned Storage object by HEAD/GET,
   MIME, hash and dimensions, then verify the returned CAS value and public
   consumer requests.
6. If rollback is necessary, pass the original applied manifest with
   `--release-manifest`. The command removes only pointers that still equal
   the run’s output URL; any unrelated edit produces `ROLLBACK_CONFLICT` and
   must be resolved manually. Do not restore an entire JSON row or delete
   assets automatically.

## Local verification

```text
node scripts/test-pagespeed-rendition-safety.mjs
npx tsc --noEmit
```

The safety runner uses an invalid loopback endpoint. It proves the release
manifest remains byte-identical before a database call, re-used run artifacts
are rejected, and source routes/scripts have no direct `SystemConfigs` update
path. It does not prove the target Supabase schema, ACLs, concurrent RPC
behavior, Storage behavior, browser media transfer, or production deployment.
