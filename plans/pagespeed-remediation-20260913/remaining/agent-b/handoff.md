# Agent B handoff — versioned media/cache migration

Status: implementation ready for integrator review; no Supabase Storage or `SystemConfigs` write was performed by this handoff.

Branch/worktree: `codex/ps-media-cache-20260913` / `/private/tmp/nganha-pagespeed-agent-b`.

The migration script is dry-run by default and now restricts source collection to the verified pointers only: `brand_history./chapters/*/scenes/*/image` and `about_story_content./locationSection/{cityImage,streetSignImage}`. It creates output names containing the output-byte SHA-256 prefix and width, uses `image/webp`, `upsert:false`, verifies public HEAD/GET/hash/dimensions, keeps originals, and records private raw-row backups plus a JSONL journal before each side effect. Config writes aggregate all pointers per row, preflight the canonical value hash, then use the exact `updated_at` snapshot as the database conditional; read-back verifies the new value. Apply/rollback abort on conflict.

Required next step: run `--mode=inventory` and `--mode=dry-run` with production credentials in the approved environment, inspect manifest pointers and backup permissions, then review before any `--mode=apply`. The integrator must wire hashed local chatbot URLs into the consumer and cherry-pick only this scoped commit.

Validation performed: script syntax parse (`node --check`) and static diff review. No credentials, customer data, or raw backup contents belong in git.
