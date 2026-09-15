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

// 3. Deterministic Simulation: Concurrent Writes, Stale Revision Rejection & Rollback Machine
class MockSystemConfigCAS {
  constructor(initialData = {}) {
    this.table = new Map(Object.entries(initialData));
  }

  // Simulates PostgreSQL row-level lock and compare_and_swap_system_config RPC
  async compareAndSwap(callerRole, key, expectedExists, expectedValue, nextValue) {
    if (callerRole !== 'service_role') {
      throw new Error(`42501: permission denied for function webbooking_compare_and_swap_system_config by role ${callerRole}`);
    }
    if (!['brand_history', 'about_story_content'].includes(key)) {
      throw new Error(`22023: Unsupported SystemConfigs key: ${key}`);
    }
    if (nextValue === null || typeof nextValue !== 'object') {
      throw new Error('22023: Next SystemConfigs value must be a JSON object');
    }
    if (!expectedExists && expectedValue !== null) {
      throw new Error('22023: Absent config cannot have an expected JSON value');
    }

    // Atomic write
    const current = this.table.get(key) || null;
    const currentExists = current !== null;

    if (currentExists !== expectedExists) {
      return []; // Conflict: 0 rows updated
    }

    if (currentExists) {
      const currentJson = JSON.stringify(current);
      const expectedJson = JSON.stringify(expectedValue);
      if (currentJson !== expectedJson) {
        return []; // Conflict: 0 rows updated (CAS value mismatch)
      }
    }

    // Success
    this.table.set(key, structuredClone(nextValue));
    return [{ key, value: nextValue, updated_at: new Date().toISOString() }];
  }
}

// Test Suite: Concurrency, Permissions, Scope, Rollback
async function runTests() {
  const store = new MockSystemConfigCAS({
    brand_history: { version: 1, title: 'Initial Brand History' }
  });

  // Test 3.1: Non-service_role is rejected
  for (const role of ['anon', 'authenticated', 'public']) {
    await assert.rejects(
      () => store.compareAndSwap(role, 'brand_history', true, { version: 1, title: 'Initial Brand History' }, { version: 2 }),
      /permission denied/
    );
  }

  // Test 3.2: Unsupported key is rejected
  await assert.rejects(
    () => store.compareAndSwap('service_role', 'unsupported_key', false, null, { foo: 'bar' }),
    /Unsupported SystemConfigs key/
  );

  // Test 3.3: Concurrent conflicting writes
  // Editor A and Editor B both read version 1
  const initialSnap = store.table.get('brand_history');
  const promiseA = store.compareAndSwap('service_role', 'brand_history', true, initialSnap, { version: 2, author: 'Editor A' });
  const promiseB = store.compareAndSwap('service_role', 'brand_history', true, initialSnap, { version: 2, author: 'Editor B' });

  const [resA, resB] = await Promise.all([promiseA, promiseB]);
  const succeeded = [resA, resB].filter(r => r.length > 0);
  const conflicted = [resA, resB].filter(r => r.length === 0);

  assert.equal(succeeded.length, 1, 'Exactly one concurrent writer must succeed');
  assert.equal(conflicted.length, 1, 'The competing concurrent writer must receive a zero-row conflict');

  // Test 3.4: Stale expected value is rejected
  const staleRes = await store.compareAndSwap('service_role', 'brand_history', true, initialSnap, { version: 3, author: 'Stale Writer' });
  assert.equal(staleRes.length, 0, 'Stale expected value must yield 0 rows (conflict)');

  // Test 3.5: Rollback verification
  // Current state is held by whichever succeeded
  const currentBeforeRollback = store.table.get('brand_history');
  // Legitimate rollback with matching output state restores initial state
  const rollbackRes = await store.compareAndSwap('service_role', 'brand_history', true, currentBeforeRollback, initialSnap);
  assert.equal(rollbackRes.length, 1, 'Rollback with verified expected state must succeed');
  assert.deepEqual(store.table.get('brand_history'), initialSnap, 'State after rollback must equal initial state');

  // If another edit occurred in the meantime, rollback must conflict and NOT overwrite
  const intermediateEdit = { version: 99, author: 'Concurrent User' };
  store.table.set('brand_history', intermediateEdit);
  const failedRollback = await store.compareAndSwap('service_role', 'brand_history', true, currentBeforeRollback, initialSnap);
  assert.equal(failedRollback.length, 0, 'Rollback with stale target state must conflict and abort without overwriting');
  assert.deepEqual(store.table.get('brand_history'), intermediateEdit, 'Store must retain intermediate edit untouched');

  console.log('PASS local source assertions and JavaScript simulation only. PostgreSQL ACL, concurrent transactions, crash recovery, and migration rollback remain NOT VERIFIED by this test.');
}

await runTests();
