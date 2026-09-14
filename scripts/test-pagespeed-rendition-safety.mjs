import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const repository = resolve(new URL('..', import.meta.url).pathname);
const migration = join(repository, 'scripts', 'migrate-pagespeed-renditions.mjs');
const retiredMigration = join(repository, 'scripts', 'migrate-history-webp.mjs');
const fixtureRoot = mkdtempSync(join(tmpdir(), 'nganha-rendition-safety-'));
const releaseManifest = join(fixtureRoot, 'release-manifest.json');
const rollbackRun = join(fixtureRoot, 'rollback-run');
const existingRun = join(fixtureRoot, 'existing-run');

const release = {
  schemaVersion: 2,
  status: 'applied_verified',
  applied: true,
  renditionEntries: [],
};
writeFileSync(releaseManifest, `${JSON.stringify(release, null, 2)}\n`);
const releaseBytes = readFileSync(releaseManifest);
writeFileSync(join(fixtureRoot, '.env.local'), [
  'NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:9',
  'SUPABASE_SERVICE_ROLE_KEY=test-service-role-key',
].join('\n'));

const run = (argumentsList) => spawnSync(process.execPath, [migration, ...argumentsList], {
  cwd: fixtureRoot,
  env: { ...process.env, NO_COLOR: '1' },
  encoding: 'utf8',
  timeout: 5000,
});

// The invalid loopback endpoint forces the first read to fail. The safety
// property under test is that rollback has already copied its *output* to a
// new run directory without ever rewriting the release input.
const rollback = run([
  '--mode=rollback',
  '--config=brand_history',
  `--release-manifest=${releaseManifest}`,
  `--run-dir=${rollbackRun}`,
]);
assert.notEqual(rollback.status, 0, 'fixture must stop before any real Supabase call');
assert.deepEqual(readFileSync(releaseManifest), releaseBytes, 'rollback must not overwrite its release manifest');
const rollbackOutput = JSON.parse(readFileSync(join(rollbackRun, 'manifest.json'), 'utf8'));
assert.equal(rollbackOutput.status, 'rollback_started');
assert.equal(rollbackOutput.releaseManifest.basename, 'release-manifest.json');
assert.equal(typeof rollbackOutput.releaseManifest.sha256, 'string');
assert.match(readFileSync(join(rollbackRun, 'journal.jsonl'), 'utf8'), /rollback_release_loaded/);

// A reused run directory must fail before database work and preserve the
// existing artifact; this prevents date-based manifest overwrites.
mkdirSync(existingRun, { recursive: true });
const existingManifest = join(existingRun, 'manifest.json');
writeFileSync(existingManifest, 'DO NOT OVERWRITE\n');
const reused = run(['--mode=dry-run', '--config=brand_history', `--run-dir=${existingRun}`]);
assert.notEqual(reused.status, 0, 'existing run directory must be rejected');
assert.equal(readFileSync(existingManifest, 'utf8'), 'DO NOT OVERWRITE\n');

const retired = spawnSync(process.execPath, [retiredMigration], { cwd: fixtureRoot, encoding: 'utf8' });
assert.equal(retired.status, 1, 'legacy migration must fail closed');
assert.match(retired.stderr, /retired and intentionally performs no work/);

const source = readFileSync(migration, 'utf8');
assert.match(source, /supabase\.rpc\('webbooking_compare_and_swap_system_config'/);
assert.doesNotMatch(source, /from\('SystemConfigs'\)\s*\.update\(/);
assert.match(source, /--release-manifest must not be the run output manifest/);
assert.doesNotMatch(readFileSync(retiredMigration, 'utf8'), /SystemConfigs'\)\s*\.update/);

const adminHistoryRoute = readFileSync(join(repository, 'src', 'app', 'api', 'admin', 'history', 'route.ts'), 'utf8');
assert.match(adminHistoryRoute, /supabase\.rpc\('webbooking_compare_and_swap_system_config'/);
assert.doesNotMatch(adminHistoryRoute, /from\('SystemConfigs'\)\s*\.update\(/);
assert.match(adminHistoryRoute, /p_expected_exists:\s*Boolean\(current\)/);

const systemSettingsRoute = readFileSync(join(repository, 'src', 'app', 'api', 'admin', 'system-settings', 'route.ts'), 'utf8');
assert.match(systemSettingsRoute, /supabase\.rpc\('webbooking_compare_and_swap_system_config'/);
assert.match(systemSettingsRoute, /systemConfigRevision\(currentHistory\?\.value \?\? null\)/);
assert.match(systemSettingsRoute, /brand_history phải được lưu trong một yêu cầu riêng/);
assert.doesNotMatch(systemSettingsRoute, /key:\s*'brand_history',\s*value:/);

const casMigration = readFileSync(join(repository, 'supabase', 'migrations', '20260914_system_configs_jsonb_cas.sql'), 'utf8');
assert.match(casMigration, /config\.value IS NOT DISTINCT FROM p_expected_value/);
assert.match(casMigration, /p_key NOT IN \('brand_history', 'about_story_content'\)/);
assert.match(casMigration, /SECURITY INVOKER/);
assert.match(casMigration, /REVOKE ALL ON FUNCTION[\s\S]+FROM PUBLIC/);
assert.match(casMigration, /GRANT EXECUTE[\s\S]+TO service_role/);

console.log('PASS rendition migration safety: immutable rollback input, unique run artifacts, RPC-only config writes');
