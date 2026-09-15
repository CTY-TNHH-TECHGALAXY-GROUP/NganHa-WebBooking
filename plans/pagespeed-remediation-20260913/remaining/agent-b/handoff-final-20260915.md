# Role B final handoff — PostgreSQL CAS gate

Date: 2026-09-15 (Asia/Ho_Chi_Minh)

## Provenance

- Source candidate: `3d5ed66f2e79d809721539f5f1c191688b3959b5`.
- Worktree: `/private/tmp/nganha-pagespeed-final-b`.
- Scope: PostgreSQL CAS migration preflight and real disposable DB acceptance only.
- No production Supabase URL, database, Storage bucket, push, merge or deploy was contacted.

## Work completed

The candidate contains the reviewed role B implementation: strict `SystemConfigs.key` type and unique-index preflight, service role table privilege and forced-RLS checks, narrow CAS key allowlist, revoked public/anon/authenticated RPC execution, and a fail-closed `scripts/test-cas-postgres.mjs` runner. The contract runner uses source assertions only and contains no JavaScript Map concurrency simulation.

## Verification at this candidate

| Check | Result |
| --- | --- |
| `node --check scripts/test-cas-postgres.mjs` | PASS |
| `node scripts/test-cas-concurrency-contract.mjs` | PASS, source contract only |
| Runner without database URL | `NOT_VERIFIED`, exit 2 |
| Loopback runner with client available | `FAIL`, exit 1, `ECONNREFUSED 127.0.0.1:5432` |
| `git diff --check` | PASS |

The runtime inventory confirms no `postgres`, `pg_ctl`, `initdb`, `psql`, Docker or Podman executable. The loopback probe was run with the real `pg` client and could not connect because no PostgreSQL server was listening. This is an environment blocker, not database evidence.

## Gate status

**NOT VERIFIED.** No claim is made for migration application, ACL/RLS behavior, independent transaction race, rollback read-back, crash/restart/resume or durable backup restore. The required next action is to provide a disposable loopback PostgreSQL server or container runtime, then rerun the runner against the same candidate SHA and archive the resulting raw report.

## Evidence

See `evidence-index-final-20260915.json` and `environment-inventory-final-20260915.json`. The raw reports preserve both missing-URL and real-client/server-unavailable outcomes; no failed assertion was omitted.
