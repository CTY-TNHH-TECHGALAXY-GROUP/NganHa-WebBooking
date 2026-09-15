#!/usr/bin/env node

/**
 * Exercise the reviewed SystemConfigs CAS migration against a disposable
 * PostgreSQL database. This is deliberately separate from the source-contract
 * test: a JavaScript Map is not evidence for ACLs, RLS, or independent
 * PostgreSQL transactions.
 *
 * The runner is fail-closed. It accepts only an explicitly supplied
 * PAGESPEED_TEST_DATABASE_URL (or --database-url=) whose host is loopback,
 * creates a random disposable database, and reports NOT_VERIFIED when the
 * pg client/server is unavailable. It never connects to Supabase production.
 */

import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationPath = path.join(repository, 'supabase', 'migrations', '20260914_system_configs_jsonb_cas.sql');
const option = name => process.argv.slice(2).find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const databaseUrl = option('database-url') || process.env.PAGESPEED_TEST_DATABASE_URL;
const evidencePath = option('evidence');
const testedSha = option('tested-sha') || 'unknown';
const startedAt = new Date().toISOString();
const results = [];

function record(id, status, detail, extra = {}) {
  results.push({ id, status, detail, ...extra });
}

function safeTarget(url) {
  const host = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function cloneUrlWithDatabase(raw, database) {
  const url = new URL(raw);
  url.pathname = `/${database}`;
  return url.toString();
}

async function loadPg() {
  try {
    const module = await import('pg');
    return module.Client || module.default?.Client;
  } catch (error) {
    record('environment.pg-client', 'NOT_VERIFIED', `Cannot load npm package pg: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function query(client, text, values = []) {
  return client.query(text, values);
}

async function setRole(client, role) {
  await query(client, `SET ROLE ${quoteIdentifier(role)}`);
}

async function resetRole(client) {
  await query(client, 'RESET ROLE');
}

async function callCas(client, expectedExists, expectedValue, nextValue, key = 'brand_history') {
  return query(
    client,
    `SELECT key, value, updated_at
       FROM public.webbooking_compare_and_swap_system_config($1, $2, $3::jsonb, $4::jsonb)`,
    [key, expectedExists, expectedValue === undefined ? null : JSON.stringify(expectedValue), JSON.stringify(nextValue)],
  );
}

async function expectSqlState(fn, code, id) {
  try {
    await fn();
    throw new Error(`Expected SQLSTATE ${code}, but statement succeeded`);
  } catch (error) {
    if (error?.message?.startsWith('Expected SQLSTATE')) throw error;
    assert.equal(error.code, code, `${id}: unexpected SQLSTATE/message`);
    record(id, 'PASS', `Rejected with SQLSTATE ${code}`);
  }
}

function saveEvidence(payload) {
  if (!evidencePath) return;
  const absolute = path.resolve(evidencePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true, mode: 0o700 });
  fs.writeFileSync(absolute, `${JSON.stringify(payload, null, 2)}\n`, { mode: 0o600 });
}

async function reportNotVerified(detail) {
  const payload = {
    schemaVersion: 1,
    role: 'B',
    status: 'NOT_VERIFIED',
    startedAt,
    finishedAt: new Date().toISOString(),
    testedSha,
    database: 'not-connected',
    results: [...results, { id: 'postgresql', status: 'NOT_VERIFIED', detail }],
    residual: [
      'No disposable PostgreSQL server/client was available in this environment.',
      'ACL, RLS, independent transaction concurrency, crash/restart, and database read-back remain unverified.',
    ],
  };
  saveEvidence(payload);
  console.log(JSON.stringify(payload, null, 2));
  process.exitCode = 2;
}

async function main() {
  if (!databaseUrl) {
    await reportNotVerified('Set PAGESPEED_TEST_DATABASE_URL or --database-url=<loopback PostgreSQL URL> to run the real DB gate.');
    return;
  }

  let rootUrl;
  try {
    rootUrl = new URL(databaseUrl);
  } catch (error) {
    await reportNotVerified(`Invalid PostgreSQL URL: ${error instanceof Error ? error.message : String(error)}`);
    return;
  }
  if (!['postgres:', 'postgresql:'].includes(rootUrl.protocol)) {
    await reportNotVerified(`Unsupported URL protocol ${rootUrl.protocol}; only postgres/postgresql is accepted.`);
    return;
  }
  if (!safeTarget(rootUrl)) {
    await reportNotVerified(`Refusing non-loopback database host ${rootUrl.hostname}; production/non-disposable race tests are forbidden.`);
    return;
  }

  const Client = await loadPg();
  if (!Client) {
    await reportNotVerified('The project dependency pg is not installed; install dependencies and rerun in a disposable environment.');
    return;
  }

  const suffix = crypto.randomBytes(8).toString('hex');
  const database = `ps_b_cas_${suffix}`;
  const roleNames = ['service_role', 'anon', 'authenticated'];
  const createdRoles = [];
  let rootClient;
  let fixtureClient;
  const concurrentClients = [];

  try {
    rootClient = new Client({ connectionString: databaseUrl });
    await rootClient.connect();
    await query(rootClient, `CREATE DATABASE ${quoteIdentifier(database)}`);
    const fixtureUrl = cloneUrlWithDatabase(databaseUrl, database);
    fixtureClient = new Client({ connectionString: fixtureUrl });
    await fixtureClient.connect();

    for (const role of roleNames) {
      const roleResult = await query(
        rootClient,
        'SELECT 1 FROM pg_roles WHERE rolname = $1',
        [role],
      );
      if (roleResult.rowCount === 0) {
        await query(rootClient, `CREATE ROLE ${quoteIdentifier(role)} NOLOGIN${role === 'service_role' ? ' BYPASSRLS' : ''}`);
        createdRoles.push(role);
      }
    }

    await query(fixtureClient, `
      CREATE TABLE public."SystemConfigs" (
        id BIGSERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        value JSONB,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
      );
      CREATE UNIQUE INDEX "SystemConfigs_key_unique" ON public."SystemConfigs" (key);
      ALTER TABLE public."SystemConfigs" ENABLE ROW LEVEL SECURITY;
      GRANT USAGE ON SCHEMA public TO service_role, anon, authenticated;
      GRANT SELECT, INSERT, UPDATE ON public."SystemConfigs" TO service_role;
      GRANT USAGE, SELECT ON SEQUENCE public."SystemConfigs_id_seq" TO service_role;
      REVOKE ALL ON public."SystemConfigs" FROM anon, authenticated;
      INSERT INTO public."SystemConfigs" (key, value)
      VALUES ('brand_history', '{"title":"Initial","version":1,"unrelated":"keep"}'::jsonb);
    `);

    const migration = fs.readFileSync(migrationPath, 'utf8');
    await query(fixtureClient, migration);
    record('migration.apply', 'PASS', 'Reviewed CAS migration applied to disposable PostgreSQL database.');

    const functionAcl = await query(fixtureClient, `
      SELECT
        has_function_privilege('service_role', 'public.webbooking_compare_and_swap_system_config(text,boolean,jsonb,jsonb)', 'EXECUTE') AS service_execute,
        has_function_privilege('anon', 'public.webbooking_compare_and_swap_system_config(text,boolean,jsonb,jsonb)', 'EXECUTE') AS anon_execute,
        has_function_privilege('authenticated', 'public.webbooking_compare_and_swap_system_config(text,boolean,jsonb,jsonb)', 'EXECUTE') AS authenticated_execute
    `);
    assert.equal(functionAcl.rows[0].service_execute, true);
    assert.equal(functionAcl.rows[0].anon_execute, false);
    assert.equal(functionAcl.rows[0].authenticated_execute, false);
    record('acl.function', 'PASS', 'service_role can execute; anon/authenticated cannot execute.');

    const tableContract = await query(fixtureClient, `
      SELECT c.relrowsecurity, c.relforcerowsecurity,
        has_table_privilege('service_role', 'public."SystemConfigs"', 'SELECT') AS service_select,
        has_table_privilege('service_role', 'public."SystemConfigs"', 'INSERT') AS service_insert,
        has_table_privilege('service_role', 'public."SystemConfigs"', 'UPDATE') AS service_update,
        has_table_privilege('anon', 'public."SystemConfigs"', 'SELECT') AS anon_select,
        has_table_privilege('authenticated', 'public."SystemConfigs"', 'SELECT') AS authenticated_select
      FROM pg_class c
      WHERE c.oid = 'public."SystemConfigs"'::regclass
    `);
    const table = tableContract.rows[0];
    assert.equal(table.relrowsecurity, true);
    assert.equal(table.service_select, true);
    assert.equal(table.service_insert, true);
    assert.equal(table.service_update, true);
    assert.equal(table.anon_select, false);
    assert.equal(table.authenticated_select, false);
    record('acl.table-rls', 'PASS', 'SystemConfigs has RLS; service_role has required table privileges; anon/authenticated do not.');

    const indexContract = await query(fixtureClient, `
      SELECT i.indisunique, i.indisvalid, i.indisready, i.indpred IS NULL AS unpartial,
             i.indexprs IS NULL AS unexpression, i.indnkeyatts, i.indnatts,
             a.attname
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
      WHERE i.indrelid = 'public."SystemConfigs"'::regclass
        AND i.indisunique AND a.attname = 'key'
    `);
    assert.ok(indexContract.rows.some(row => row.indisvalid && row.indisready && row.unpartial && row.unexpression && row.indnkeyatts === 1 && row.indnatts === 1));
    record('schema.unique-key', 'PASS', 'A valid non-partial single-column unique index protects SystemConfigs.key.');

    await setRole(fixtureClient, 'service_role');
    const initial = await query(fixtureClient, `SELECT value FROM public."SystemConfigs" WHERE key = 'brand_history'`);
    const initialValue = initial.rows[0].value;
    const orderedDifferently = { unrelated: 'keep', version: 1, title: 'Initial' };
    const update = await callCas(fixtureClient, true, orderedDifferently, { title: 'Candidate', version: 2, unrelated: 'keep' });
    assert.equal(update.rowCount, 1);
    assert.equal(update.rows[0].value.title, 'Candidate');
    record('cas.jsonb-equality', 'PASS', 'JSONB expected value with reordered object keys matched atomically.');

    const stale = await callCas(fixtureClient, true, initialValue, { title: 'Stale', version: 99, unrelated: 'keep' });
    assert.equal(stale.rowCount, 0);
    record('cas.stale', 'PASS', 'Stale expected JSON returned zero rows without changing current value.');

    const currentForValidation = await awaitValue(fixtureClient);
    const nullExpected = await callCas(fixtureClient, true, null, { title: 'invalid' });
    assert.equal(nullExpected.rowCount, 0);
    assert.deepEqual(await awaitValue(fixtureClient), currentForValidation);
    record('cas.null-expected', 'PASS', 'JSON null does not match the current object and preserves its value; SQL CAS compares JSONB values, while API revision validation is a separate contract.');
    await expectSqlState(() => callCas(fixtureClient, false, { title: 'invalid' }, { title: 'invalid' }), '22023', 'cas.absent-value');
    await expectSqlState(() => callCas(fixtureClient, true, currentForValidation, ['invalid']), '22023', 'cas.next-array');
    await expectSqlState(() => callCas(fixtureClient, true, currentForValidation, null), '22023', 'cas.next-null');
    await expectSqlState(() => callCas(fixtureClient, true, currentForValidation, { title: 'invalid-key' }, 'system_settings'), '22023', 'cas.unsupported-key');
    await resetRole(fixtureClient);

    for (const role of ['anon', 'authenticated']) {
      await setRole(fixtureClient, role);
      try {
        await callCas(fixtureClient, true, { title: 'Candidate', version: 2, unrelated: 'keep' }, { title: 'denied' });
        throw new Error(`${role} unexpectedly executed CAS RPC`);
      } catch (error) {
        assert.match(String(error.message), /permission denied/);
      } finally {
        await resetRole(fixtureClient);
      }
    }
    record('acl.rpc-deny', 'PASS', 'anon/authenticated receive permission denied for the writer RPC.');

    await query(fixtureClient, `UPDATE public."SystemConfigs" SET value = '{"title":"Initial","version":1,"unrelated":"keep"}'::jsonb WHERE key = 'brand_history'`);
    const firstConcurrent = new Client({ connectionString: fixtureUrl });
    const secondConcurrent = new Client({ connectionString: fixtureUrl });
    concurrentClients.push(firstConcurrent, secondConcurrent);
    await Promise.all([firstConcurrent.connect(), secondConcurrent.connect()]);
    await Promise.all([setRole(firstConcurrent, 'service_role'), setRole(secondConcurrent, 'service_role')]);
    await Promise.all([query(firstConcurrent, 'BEGIN'), query(secondConcurrent, 'BEGIN')]);
    const snapshotA = (await query(firstConcurrent, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`)).rows[0].value;
    const snapshotB = (await query(secondConcurrent, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`)).rows[0].value;
    // Both snapshots are established before either writer starts. Each writer
    // must commit independently so the other can acquire the row lock.
    const writeAndCommit = async (client, snapshot, title) => {
      try {
        const result = await callCas(client, true, snapshot, { title, version: 2, unrelated: 'keep' });
        await query(client, 'COMMIT');
        return result;
      } catch (error) {
        await query(client, 'ROLLBACK');
        throw error;
      }
    };
    const outcomes = await Promise.allSettled([
      writeAndCommit(firstConcurrent, snapshotA, 'Writer A'),
      writeAndCommit(secondConcurrent, snapshotB, 'Writer B'),
    ]);
    for (const outcome of outcomes) if (outcome.status === 'rejected') throw outcome.reason;
    const [outcomeA, outcomeB] = outcomes.map(outcome => outcome.value);
    assert.equal([outcomeA.rowCount, outcomeB.rowCount].filter(value => value === 1).length, 1);
    assert.equal([outcomeA.rowCount, outcomeB.rowCount].filter(value => value === 0).length, 1);
    const afterConcurrent = await query(fixtureClient, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`);
    assert.match(afterConcurrent.rows[0].value.title, /^Writer [AB]$/);
    record('cas.concurrent-transactions', 'PASS', 'Two independent PostgreSQL transactions from one snapshot produced exactly one success and one conflict.', { outcomes: [outcomeA.rowCount, outcomeB.rowCount] });

    const current = afterConcurrent.rows[0].value;
    await setRole(fixtureClient, 'service_role');
    const rollback = await callCas(fixtureClient, true, current, initialValue);
    assert.equal(rollback.rowCount, 1);
    const readBack = await query(fixtureClient, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`);
    assert.deepEqual(readBack.rows[0].value, initialValue);
    const secondRollback = await callCas(fixtureClient, true, current, initialValue);
    assert.equal(secondRollback.rowCount, 0);
    await resetRole(fixtureClient);
    record('cas.rollback-readback', 'PASS', 'Rollback restored the exact fixture value; second rollback was a zero-row no-op.');

    await query(fixtureClient, `UPDATE public."SystemConfigs" SET value = '{"title":"Candidate","version":2,"unrelated":"preserve"}'::jsonb WHERE key='brand_history'`);
    await setRole(fixtureClient, 'service_role');
    const guardedRollback = await callCas(fixtureClient, true, current, initialValue);
    assert.equal(guardedRollback.rowCount, 0);
    await resetRole(fixtureClient);
    const unrelatedReadBack = await query(fixtureClient, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`);
    assert.equal(unrelatedReadBack.rows[0].value.unrelated, 'preserve');
    record('cas.rollback-conflict', 'PASS', 'Rollback conflict preserved an intervening unrelated edit.');

    await query(fixtureClient, `DELETE FROM public."SystemConfigs" WHERE key='about_story_content'`);
    await setRole(fixtureClient, 'service_role');
    const absentInsert = await callCas(fixtureClient, false, null, { title: 'New Story' }, 'about_story_content');
    assert.equal(absentInsert.rowCount, 1);
    const absentConflict = await callCas(fixtureClient, false, null, { title: 'Overwrite Attempt' }, 'about_story_content');
    assert.equal(absentConflict.rowCount, 0);
    await resetRole(fixtureClient);
    record('cas.absent-insert-conflict', 'PASS', 'Absent-row insert succeeded once; rerun with absent expectation returned conflict.');

    const payload = {
      schemaVersion: 1,
      role: 'B',
      status: 'PASS',
      startedAt,
      finishedAt: new Date().toISOString(),
      testedSha,
      database: 'disposable-local-postgresql',
      results,
      residual: [
        'This runner proves the CAS RPC/fixture DB behavior only.',
        'Migration storage failure injection, crash/restart/resume and durable backup restore require a separate storage adapter/fixture and remain NOT VERIFIED here.',
        'No production database, Storage bucket, or remote Supabase project was contacted.',
      ],
    };
    saveEvidence(payload);
    console.log(JSON.stringify(payload, null, 2));
  } catch (error) {
    record('runner', 'FAIL', error instanceof Error ? error.message : String(error), { code: error?.code || null });
    const payload = {
      schemaVersion: 1,
      role: 'B',
      status: 'FAIL',
      startedAt,
      finishedAt: new Date().toISOString(),
      testedSha,
      database: 'disposable-local-postgresql',
      results,
      residual: ['Inspect the failing fixture result before any integration; no production write was attempted.'],
    };
    saveEvidence(payload);
    console.error(JSON.stringify(payload, null, 2));
    process.exitCode = 1;
  } finally {
    for (const client of concurrentClients) {
      try { await client.end(); } catch { /* best effort cleanup */ }
    }
    if (fixtureClient) {
      try { await fixtureClient.end(); } catch { /* best effort cleanup */ }
    }
    if (rootClient) {
      try {
        await query(rootClient, `DROP DATABASE IF EXISTS ${quoteIdentifier(database)} WITH (FORCE)`);
      } catch { /* preserve test result if cleanup itself is unavailable */ }
      for (const role of createdRoles.reverse()) {
        try { await query(rootClient, `DROP ROLE IF EXISTS ${quoteIdentifier(role)}`); } catch { /* role may be shared */ }
      }
      try { await rootClient.end(); } catch { /* best effort cleanup */ }
    }
  }
}

async function awaitValue(client) {
  const result = await query(client, `SELECT value FROM public."SystemConfigs" WHERE key='brand_history'`);
  return result.rows[0]?.value ?? null;
}

await main();
