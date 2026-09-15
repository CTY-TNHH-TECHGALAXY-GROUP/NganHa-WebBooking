import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');

// 1. Verify SQL CAS Migration Contract & ACLs
const sql = read('supabase/migrations/20260914_system_configs_jsonb_cas.sql');
assert.match(sql, /BEGIN;/);
assert.match(sql, /CREATE OR REPLACE FUNCTION public\.webbooking_compare_and_swap_system_config\(/);
assert.match(sql, /p_key\s+TEXT/);
assert.match(sql, /p_expected_exists\s+BOOLEAN/);
assert.match(sql, /p_expected_value\s+JSONB/);
assert.match(sql, /p_next_value\s+JSONB/);
assert.match(sql, /SECURITY INVOKER/);
assert.match(sql, /p_key NOT IN \('brand_history', 'about_story_content'\)/, 'Scope must be strictly limited to protected content keys');
assert.match(sql, /REVOKE ALL ON FUNCTION public\.webbooking_compare_and_swap_system_config[\s\S]*FROM PUBLIC;/);
assert.match(sql, /REVOKE ALL ON FUNCTION public\.webbooking_compare_and_swap_system_config[\s\S]*FROM anon, authenticated;/);
assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.webbooking_compare_and_swap_system_config[\s\S]*TO service_role;/);
assert.match(sql, /atttypid = 'text'::regtype/, 'SystemConfigs.key must remain text');
assert.match(sql, /indnkeyatts = 1/);
assert.match(sql, /indnatts = 1/);
assert.match(sql, /indpred IS NULL/);
assert.match(sql, /indexprs IS NULL/);
assert.match(sql, /has_table_privilege\('service_role'/);
assert.match(sql, /relforcerowsecurity/);
assert.match(sql, /COMMIT;/);

// 2. Verify Application Routes Enforce Mandatory expectedRevision
const historyRoute = read('src/app/api/admin/history/route.ts');
assert.match(historyRoute, /typeof body\.expectedRevision !== 'string' \|\| !body\.expectedRevision\.trim\(\)/, 'History route must strictly reject missing/empty expectedRevision');
assert.match(historyRoute, /VALIDATION_ERROR/, 'Rejection code must be VALIDATION_ERROR');
assert.match(historyRoute, /actualRevision !== expectedRevision/, 'Stale revision must trigger CONTENT_CONFLICT');
assert.match(historyRoute, /webbooking_compare_and_swap_system_config/, 'History route must write via CAS RPC');

const systemSettingsRoute = read('src/app/api/admin/system-settings/route.ts');
assert.match(systemSettingsRoute, /typeof expectedRevision !== 'string' \|\| !expectedRevision\.trim\(\)/, 'System settings route must strictly reject missing/empty expectedRevision for protected content');
assert.match(systemSettingsRoute, /CONTENT_CONFLICT/, 'Stale revision must trigger 409 CONTENT_CONFLICT');
assert.match(systemSettingsRoute, /webbooking_compare_and_swap_system_config/, 'System settings route must write protected content via CAS RPC');

const realDbRunner = read('scripts/test-cas-postgres.mjs');
assert.match(realDbRunner, /PAGESPEED_TEST_DATABASE_URL/);
assert.match(realDbRunner, /CREATE DATABASE/);
assert.match(realDbRunner, /Two independent PostgreSQL transactions/);
assert.match(realDbRunner, /NOT_VERIFIED/);

console.log('PASS local source contract assertions only. Run scripts/test-cas-postgres.mjs against an explicitly supplied loopback disposable PostgreSQL URL for the real DB gate; no JavaScript simulation is accepted as database evidence.');
