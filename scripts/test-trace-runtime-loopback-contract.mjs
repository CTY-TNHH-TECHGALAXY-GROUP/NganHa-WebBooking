#!/usr/bin/env node

/**
 * Contract checks for the loopback harness. These exercise only a disposable
 * local HTTP fixture: no application server, database, storage, or network
 * service is contacted.
 */

import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const harness = new URL('./trace-runtime-loopback.mjs', import.meta.url);
const outputDir = mkdtempSync(path.join(os.tmpdir(), 'agent-q-trace-contract-'));
const server = createServer((_, response) => {
  response.writeHead(404, { 'content-type': 'text/html' });
  response.end('<!doctype html><title>fixture missing</title>');
});

const runHarness = async (targetUrl, targetOutputDir) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, [harness.pathname, targetOutputDir, targetUrl, '--runs=1', '--mode=timing'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  const timeout = setTimeout(() => child.kill('SIGTERM'), 60000);
  child.stdout.on('data', chunk => { stdout += chunk; });
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.on('error', reject);
  child.on('close', status => {
    clearTimeout(timeout);
    resolve({ status, stdout, stderr });
  });
});

try {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert(address && typeof address === 'object');
  const execution = await runHarness(`http://127.0.0.1:${address.port}`, outputDir);
  assert.equal(execution.status, 0, execution.stderr || execution.stdout);
  const created = JSON.parse(execution.stdout);
  const report = JSON.parse(readFileSync(created.reportPath, 'utf8'));
  assert.equal(report.status, 'NOT_VERIFIED');
  assert.match(report.testedSha, /^[0-9a-f]{40}$/);
  assert.equal(report.runs.length, 1);
  assert.equal(report.runs[0].steps[0].name, 'homepage-navigation');
  assert.equal(report.runs[0].steps[0].status, 'NOT_VERIFIED');
  assert.match(report.runs[0].steps[0].reason, /expected HTTP 2xx/);
  assert.ok(Array.isArray(report.runs[0].requests));
  assert.ok(report.runs[0].requestTotals?.all);
  assert.ok(Array.isArray(report.runs[0].requestDisplay));
  assert.ok(report.runs[0].requestDisplay.length <= 100);

  const ledgerOutputDir = mkdtempSync(path.join(os.tmpdir(), 'agent-q-trace-ledger-contract-'));
  const ledgerServer = createServer((request, response) => {
    if (request.url === '/' || request.url === '/en/new-user/standard/checkout') {
      const assets = request.url === '/'
        ? Array.from({ length: 120 }, (_, index) => `<img src="/fixture-${index}.gif" alt="fixture">`).join('')
        : '';
      response.writeHead(200, { 'content-type': 'text/html', 'cache-control': 'public, max-age=60' });
      response.end(`<!doctype html><html><body>${assets}</body></html>`);
      return;
    }
    response.writeHead(200, { 'content-type': 'image/gif', 'cache-control': 'public, max-age=60' });
    response.end(Buffer.from('GIF89a', 'ascii'));
  });
  try {
    await new Promise(resolve => ledgerServer.listen(0, '127.0.0.1', resolve));
    const ledgerAddress = ledgerServer.address();
    assert(ledgerAddress && typeof ledgerAddress === 'object');
    const ledgerExecution = await runHarness(`http://127.0.0.1:${ledgerAddress.port}`, ledgerOutputDir);
    assert.equal(ledgerExecution.status, 0, ledgerExecution.stderr || ledgerExecution.stdout);
    const ledgerCreated = JSON.parse(ledgerExecution.stdout);
    const ledgerReport = JSON.parse(readFileSync(ledgerCreated.reportPath, 'utf8'));
    const ledgerRun = ledgerReport.runs[0];
    assert.ok(ledgerRun.requestTotals.all.requestCount > 100, 'fixture must exercise more than the display cap');
    assert.equal(ledgerRun.requestLedger.displayTruncated, true);
    assert.equal(ledgerRun.requestLedger.complete, true);
    assert.equal(ledgerRun.selfChecks.fullRequestLedgerRetained, true);
    assert.equal(ledgerRun.requestTotals.all.requestCount, ledgerRun.requestLedger.requestCount);
  } finally {
    await new Promise(resolve => ledgerServer.close(resolve));
    rmSync(ledgerOutputDir, { recursive: true, force: true });
  }
  console.log('trace runtime loopback contract: PASS');
} finally {
  await new Promise(resolve => server.close(resolve));
  rmSync(outputDir, { recursive: true, force: true });
}
