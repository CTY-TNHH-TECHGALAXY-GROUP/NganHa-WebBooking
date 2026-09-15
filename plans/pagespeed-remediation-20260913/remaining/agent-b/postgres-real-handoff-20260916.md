# Real PostgreSQL acceptance — 2026-09-16

CAS RPC suite: PASS, 16 checks, exit 0. Full migration recovery gate remains PARTIAL.

Tested SHA: `dd0fa8eeea4528e7e147f4fd15ba0863d0cab887`.

Runtime: embedded-postgres npm package 18.4.0-beta.17; server reports PostgreSQL 18.4, x86_64-apple-darwin24.6.0 on this arm64 Mac. Cluster `/private/tmp/pagespeed-postgres.TExjLR/data`, loopback port 55432, locale C / SQL_ASCII. This is real native PostgreSQL, not a JavaScript database simulation. It does not establish version/encoding parity with production.

Command: `PAGESPEED_TEST_DATABASE_URL=<local-only-url> node scripts/test-cas-postgres.mjs --tested-sha=dd0fa8eeea4528e7e147f4fd15ba0863d0cab887 --evidence=plans/pagespeed-remediation-20260913/remaining/agent-b/cas-postgres-verified.json`.

Changes: corrected service_role fixture BYPASSRLS, independent writer commits, SQL NULL serialization for absent snapshots; corrected the expected JSON-null contract to verify zero updates and unchanged data. SQL migration fixed actual INSERT conflict-column ambiguity using function-local `#variable_conflict use_column`. No application UI/source change.

Verified: migration, function permissions, RLS enabled/table grants, unique key, JSONB equality, stale/null snapshots, invalid payload/key rejection, denied anon/authenticated RPC, two independent concurrent transactions, rollback/readback/repeated rollback, intervening edit preservation, absent insert and duplicate conflict.

Residual: end-to-end API revision behavior, storage failure injection, process crash/restart/resume and durable backup restore remain outside this runner. No production migration applied. Prior FAIL artifacts retained, including `cas-postgres-real-pass.json` whose actual status is FAIL despite its attempted-run filename.

SHA-256 index:

| Artifact | SHA-256 |
| --- | --- |
| scripts/test-cas-postgres.mjs | 156540d1a35e1cba9cbbd046c77b957d3484f715704f0921b0e927f7754a212a |
| supabase/migrations/20260914_system_configs_jsonb_cas.sql | e6b133cb28c9091b8de12621969408a9017571d281910be933f4134d5a619f2e |
| cas-postgres-verified.json | 3a0bc8df7305aa6ccbfffcdefe7d15608527b44422c9bec1665062cb47dd71c2 |
| cas-postgres-first-real.json | e880ba2124a841e1a0acc40f5aea39af86a7a1494905346446e583b52b9b64c4 |
| cas-postgres-real-final.json | f0a547187dc12b382fa1bde73805f4cc293cf05441b4150e10414cdd1f0cb8fc |
| cas-postgres-real-pass.json | 1a884ff7b2020b0dc9b56bf13f36ba77c7baa469895aabf8add5556b42436ed0 |
