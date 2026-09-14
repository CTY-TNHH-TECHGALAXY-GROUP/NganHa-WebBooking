#!/usr/bin/env node

/**
 * Build and (only with --mode=apply) publish versioned image renditions.
 *
 * The default mode is dry-run. It reads the two content rows, records a
 * private backup, and writes a sanitized manifest/journal, but it never
 * writes Storage or SystemConfigs. Apply is deliberately explicit and uses
 * upsert:false plus a raw JSON value CAS; timestamp alone is not a CAS here
 * because the legacy history writer does not update updated_at consistently.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const bucket = 'media-uploads';
const planDir = path.join(root, 'plans', 'pagespeed-remediation-20260913', 'remaining', 'agent-b');
const option = name => process.argv.slice(2).find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const modeArg = option('mode');
const mode = (modeArg || 'dry-run').toLowerCase();
const configFilter = option('config') || 'all';
const requestedRunId = option('run-id');
const runId = requestedRunId || `ps-b-${crypto.randomUUID()}`;
if (!/^[A-Za-z0-9_-]{8,100}$/.test(runId)) throw new Error('run-id must contain only letters, digits, _ or -');
const runDir = path.resolve(option('run-dir') || path.join(planDir, 'runs', runId));
const manifestPath = path.resolve(option('manifest') || path.join(runDir, 'manifest.json'));
const journalPath = path.resolve(option('journal') || path.join(runDir, 'journal.jsonl'));
const releaseManifestPath = option('release-manifest') ? path.resolve(option('release-manifest')) : null;
const backupDir = option('backup-dir') ? path.resolve(option('backup-dir')) : null;

const historyWidths = [320, 640, 960];

function parseEnvFile(filename) {
  if (!fs.existsSync(filename)) return {};
  const result = {};
  for (const line of fs.readFileSync(filename, 'utf8').split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match) result[match[1]] = match[2].replace(/^"|"$/g, '');
  }
  return result;
}

const env = { ...parseEnvFile(path.join(root, '.env.local')), ...process.env };
const sha256 = value => crypto.createHash('sha256').update(value).digest('hex');
const canonicalize = value => {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(canonicalize);
  return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
};
const revisionOf = value => sha256(JSON.stringify(canonicalize(value ?? null)));
const clone = value => JSON.parse(JSON.stringify(value));
const safeName = value => path.basename(value).replace(/\.[^.]+$/, '').replace(/[^A-Za-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();

function sanitizeUrl(raw) {
  if (typeof raw !== 'string') return null;
  if (raw.startsWith('/')) return { url: raw, host: null, path: raw, signed: false };
  try {
    const url = new URL(raw);
    return { url: `${url.origin}${url.pathname}`, host: url.host, path: url.pathname, signed: Boolean(url.search || url.hash) };
  } catch {
    return null;
  }
}

function collectMediaRefs(configKey, value) {
  const refs = [];
  const walk = (node, pointer, parent, key) => {
    if (Array.isArray(node)) {
      node.forEach((item, index) => walk(item, `${pointer}/${index}`, node, String(index)));
      return;
    }
    if (!node || typeof node !== 'object') {
      const historyPointer = /^\/chapters\/\d+\/scenes\/\d+\/image$/.test(pointer);
      const storyPointer = /^\/locationSection\/(cityImage|streetSignImage)$/.test(pointer);
      const inScope = configKey === 'brand_history' ? historyPointer : configKey === 'about_story_content' && storyPointer;
      if (inScope && typeof node === 'string' && sanitizeUrl(node)) {
        refs.push({ configKey, pointer, sourceUrl: node, mediaKey: key });
      }
      return;
    }
    for (const [childKey, child] of Object.entries(node)) {
      const childPointer = `${pointer}/${childKey.replace(/~/g, '~0').replaceAll('/', '~1')}`;
      if (childKey === 'responsiveSources') continue;
      walk(child, childPointer, node, childKey);
    }
  };
  walk(value, '', null, '');
  return refs;
}

function getAt(value, pointer) {
  return pointer.split('/').slice(1).reduce((node, token) => node?.[token.replace(/~1/g, '/').replace(/~0/g, '~')], value);
}

function setAt(value, pointer, next) {
  const tokens = pointer.split('/').slice(1).map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
  const leaf = tokens.pop();
  const parent = tokens.reduce((node, token) => node[token], value);
  parent[leaf] = next;
}

function deleteAt(value, pointer) {
  const tokens = pointer.split('/').slice(1).map(token => token.replace(/~1/g, '/').replace(/~0/g, '~'));
  const leaf = tokens.pop();
  const parent = tokens.reduce((node, token) => node?.[token], value);
  if (parent && Object.prototype.hasOwnProperty.call(parent, leaf)) delete parent[leaf];
}

function equalValues(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function siblingPointer(pointer, mediaKey) {
  const tokens = pointer.split('/');
  tokens.pop();
  const renditionKey = mediaKey === 'image' ? 'responsiveSources' : `${mediaKey}ResponsiveSources`;
  tokens.push(renditionKey);
  return tokens.join('/');
}

function assertDurablePrivateBackupDir() {
  if (!backupDir) throw new Error('apply requires --backup-dir=<durable-private-directory>');
  const temporaryDirectory = path.resolve(os.tmpdir());
  if (backupDir === temporaryDirectory || backupDir.startsWith(`${temporaryDirectory}${path.sep}`)) {
    throw new Error('backup-dir must be durable private storage, not the operating-system temporary directory');
  }
  if (backupDir === root || backupDir.startsWith(`${root}${path.sep}`)) {
    throw new Error('backup-dir must be outside the repository');
  }
}

function privateBackupPath(runId, row) {
  assertDurablePrivateBackupDir();
  const dir = path.join(backupDir, runId);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch { /* best effort on non-POSIX */ }
  const filename = path.join(dir, `${row.key}-backup.json`);
  fs.writeFileSync(filename, `${JSON.stringify(row, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  try { fs.chmodSync(filename, 0o600); } catch { /* best effort on non-POSIX */ }
  return filename;
}

let runArtifactsInitialized = false;
let activeManifest = null;

function initializeRunArtifacts() {
  if (runArtifactsInitialized) return;
  if (releaseManifestPath && releaseManifestPath === manifestPath) {
    throw new Error('--release-manifest must not be the run output manifest');
  }
  fs.mkdirSync(runDir, { recursive: true, mode: 0o700 });
  if (fs.existsSync(manifestPath) || fs.existsSync(journalPath)) {
    throw new Error(`refusing to overwrite existing run artifacts: ${runDir}`);
  }
  fs.writeFileSync(journalPath, '', { flag: 'wx', mode: 0o600 });
  runArtifactsInitialized = true;
  appendJournal({ runId, phase: 'run_started', mode, manifestPath, journalPath });
}

function writeRunManifest(value) {
  if (!runArtifactsInitialized) throw new Error('run artifacts are not initialized');
  if (fs.existsSync(manifestPath)) {
    fs.writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  } else {
    fs.writeFileSync(manifestPath, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
}

function appendJournal(event) {
  if (!runArtifactsInitialized) throw new Error('run artifacts are not initialized');
  fs.appendFileSync(journalPath, `${JSON.stringify({ at: new Date().toISOString(), ...event })}\n`);
}

function publicUrl(objectPath) {
  const base = new URL(env.NEXT_PUBLIC_SUPABASE_URL);
  const encoded = objectPath.split('/').map(part => encodeURIComponent(part)).join('/');
  return `${base.origin}/storage/v1/object/public/${bucket}/${encoded}`;
}

async function readRows(supabase) {
  const keys = configFilter === 'all' ? ['brand_history', 'about_story_content'] : [configFilter];
  const { data, error } = await supabase.from('SystemConfigs').select('id,key,value,updated_at').in('key', keys);
  if (error) throw new Error(`config inventory failed: ${error.message}`);
  return keys.map(key => data.find(row => row.key === key)).filter(Boolean);
}

async function readBytes(url) {
  if (url.startsWith('/')) {
    const relative = url.replace(/^\//, '');
    const filename = path.resolve(root, 'public', relative);
    if (!filename.startsWith(path.resolve(root, 'public') + path.sep)) throw new Error(`unsafe local path: ${url}`);
    if (!fs.existsSync(filename)) throw new Error(`missing local source: ${url}`);
    return { buffer: fs.readFileSync(filename), sourceFile: filename };
  }
  const safe = sanitizeUrl(url);
  if (!safe?.url) throw new Error(`invalid source URL: ${url}`);
  const response = await fetch(safe.url, { cache: 'no-store' });
  if (!response.ok) throw new Error(`source GET ${response.status}: ${safe.path}`);
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('image/')) throw new Error(`source MIME ${contentType}: ${safe.path}`);
  return { buffer: Buffer.from(await response.arrayBuffer()), sourceFile: null };
}

async function buildRenditions(source, widths, group) {
  const metadata = await sharp(source.buffer).metadata();
  if (!metadata.width || !metadata.height || metadata.animated) throw new Error(`unsupported image source: ${source.sourceFile || source.url}`);
  const sourceRaw = await sharp(source.buffer).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const entries = [];
  for (const requestedWidth of widths) {
    const width = Math.min(requestedWidth, metadata.width);
    const output = await sharp(source.buffer).resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 6 }).toBuffer();
    const outputMeta = await sharp(output).metadata();
    const outputRaw = await sharp(output).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const targetHash = sha256(output);
    const base = safeName(source.name || source.url || 'asset');
    const targetPath = `${group}/${base}-${targetHash.slice(0, 16)}-w${outputMeta.width}.webp`;
    entries.push({
      requestedWidth,
      width: outputMeta.width,
      height: outputMeta.height,
      targetPath,
      targetUrl: publicUrl(targetPath),
      targetBytes: output.length,
      targetSha256: targetHash,
      sourceRawChannels: sourceRaw.info.channels,
      targetRawChannels: outputRaw.info.channels,
      quality: 82,
      withoutEnlargement: true,
      _buffer: output,
    });
  }
  return { metadata, entries };
}

async function verifyPublic(entry) {
  const head = await fetch(entry.targetUrl, { method: 'HEAD', cache: 'no-store' });
  const headMime = (head.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!head.ok || headMime !== 'image/webp') throw new Error(`HEAD verify failed ${head.status}/${headMime}: ${entry.targetPath}`);
  const get = await fetch(entry.targetUrl, { cache: 'no-store' });
  const getMime = (get.headers.get('content-type') || '').split(';')[0].toLowerCase();
  if (!get.ok || getMime !== 'image/webp') throw new Error(`GET verify failed ${get.status}/${getMime}: ${entry.targetPath}`);
  const bytes = Buffer.from(await get.arrayBuffer());
  if (sha256(bytes) !== entry.targetSha256) throw new Error(`GET hash mismatch: ${entry.targetPath}`);
  const meta = await sharp(bytes).metadata();
  if (meta.width !== entry.width || meta.height !== entry.height) throw new Error(`GET dimensions mismatch: ${entry.targetPath}`);
  return {
    headStatus: head.status,
    getStatus: get.status,
    responseMime: getMime,
    responseBytes: bytes.length,
    cacheControl: get.headers.get('cache-control'),
    etagPresent: Boolean(get.headers.get('etag')),
  };
}

function sanitizeEntry(entry) {
  const { _buffer, ...safe } = entry;
  return safe;
}

/**
 * The JSON document itself is the revision token. Never replace this with a
 * read/hash/update sequence: another writer could commit between those calls.
 * The reviewed SQL migration grants this function only to service_role.
 */
async function compareAndSwapConfig(supabase, { key, expectedExists, expectedValue, nextValue }) {
  const { data, error } = await supabase.rpc('webbooking_compare_and_swap_system_config', {
    p_key: key,
    p_expected_exists: expectedExists,
    p_expected_value: expectedValue,
    p_next_value: nextValue,
  });
  if (error) {
    throw new Error(`config CAS RPC unavailable or failed for ${key}: ${error.message}`);
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  if (row.key !== key || !Object.prototype.hasOwnProperty.call(row, 'value')) {
    throw new Error(`config CAS RPC returned an invalid row for ${key}`);
  }
  return row;
}

function readReleaseManifest() {
  if (!releaseManifestPath) throw new Error('rollback requires --release-manifest=<applied-manifest.json>');
  const source = fs.readFileSync(releaseManifestPath);
  const checksum = sha256(source);
  const release = JSON.parse(source.toString('utf8'));
  if (release.status !== 'applied_verified' || release.applied !== true) {
    throw new Error('rollback requires an applied manifest');
  }
  return { release, checksum };
}

async function main() {
  if (!['dry-run', 'apply', 'rollback', 'inventory'].includes(mode)) throw new Error(`unsupported mode: ${mode}`);
  if (!['all', 'brand_history', 'about_story_content'].includes(configFilter)) throw new Error(`unsupported config filter: ${configFilter}`);
  if ((mode === 'apply' || mode === 'rollback') && configFilter === 'all') {
    throw new Error(`${mode} requires --config=brand_history or --config=about_story_content; one document per release avoids cross-row partial commits`);
  }
  if (mode === 'apply') assertDurablePrivateBackupDir();
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env vars are required for config inventory');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  initializeRunArtifacts();

  // Rollback is intentionally dispatched before any inventory, image build,
  // or manifest write. Its release manifest is an immutable input; this run
  // receives a separate journal and manifest under its own UUID directory.
  if (mode === 'rollback') {
    const { release, checksum } = readReleaseManifest();
    const rollbackManifest = {
      schemaVersion: 2,
      runId,
      mode,
      status: 'rollback_started',
      releaseManifest: { basename: path.basename(releaseManifestPath), sha256: checksum },
      results: [],
    };
    writeRunManifest(rollbackManifest);
    appendJournal({ runId, phase: 'rollback_release_loaded', releaseManifestSha256: checksum });
    const releaseRows = await readRows(supabase);
    if (releaseRows.length !== (configFilter === 'all' ? 2 : 1)) throw new Error(`missing requested config: ${configFilter}`);
    for (const row of releaseRows) {
      const items = (release.renditionEntries || []).filter(item => item.configKey === row.key);
      if (!items.length) continue;
      const next = clone(row.value);
      const changedPointers = [];
      for (const item of items) for (const rollbackPatch of item.rollbackPointers || []) {
        const current = getAt(next, `${rollbackPatch.pointer}/${rollbackPatch.width}`);
        if (current !== rollbackPatch.targetUrl) throw new Error(`ROLLBACK_CONFLICT at ${rollbackPatch.pointer}/${rollbackPatch.width}`);
        if (rollbackPatch.hadPrevious) setAt(next, `${rollbackPatch.pointer}/${rollbackPatch.width}`, rollbackPatch.previousValue);
        else deleteAt(next, `${rollbackPatch.pointer}/${rollbackPatch.width}`);
        changedPointers.push(`${rollbackPatch.pointer}/${rollbackPatch.width}`);
      }
      appendJournal({ runId, phase: 'rollback_config_intent', configKey: row.key, changedPointers });
      const updated = await compareAndSwapConfig(supabase, {
        key: row.key,
        expectedExists: true,
        expectedValue: row.value,
        nextValue: next,
      });
      if (!updated) throw new Error(`ROLLBACK_CONFLICT: config changed before CAS for ${row.key}`);
      if (!equalValues(updated.value, next)) throw new Error(`rollback CAS returned unexpected value for ${row.key}`);
      const result = { configKey: row.key, changedPointers, afterRevision: revisionOf(updated.value), status: 'applied_verified' };
      rollbackManifest.results.push(result);
      writeRunManifest(rollbackManifest);
      appendJournal({ runId, phase: 'rollback_config_result', ...result });
    }
    rollbackManifest.status = 'rollback_applied_verified';
    writeRunManifest(rollbackManifest);
    console.log(JSON.stringify({ mode, status: rollbackManifest.status, manifestPath, journalPath }, null, 2));
    return;
  }

  if (mode === 'apply' && !backupDir) throw new Error('apply requires --backup-dir=<durable-private-directory>');
  const rows = await readRows(supabase);
  if (rows.length !== (configFilter === 'all' ? 2 : 1)) throw new Error(`missing requested config: ${configFilter}`);
  for (const row of rows) {
    if (!row.value || typeof row.value !== 'object' || Array.isArray(row.value)) {
      throw new Error(`${row.key} must be a JSON object before building or applying renditions`);
    }
  }
  const backups = rows.map(row => ({
    key: row.key,
    ...(mode === 'apply' ? { path: privateBackupPath(runId, row) } : {}),
    revision: revisionOf(row.value),
    valueSha256: sha256(JSON.stringify(row.value)),
    rowId: row.id,
  }));
  if (mode === 'apply') appendJournal({ runId, phase: 'backup_created', mode, backups });
  const sources = [];
  for (const row of rows) {
    for (const ref of collectMediaRefs(row.key, row.value)) {
      const safe = sanitizeUrl(ref.sourceUrl);
      if (!safe) continue;
      if (safe.signed) throw new Error(`signed source URLs require a reviewed stable source: ${safe.path}`);
      const existing = sources.find(item => item.configKey === row.key && item.sourceUrl === ref.sourceUrl);
      if (existing) existing.references.push({ pointer: ref.pointer, mediaKey: ref.mediaKey });
      else sources.push({ configKey: row.key, sourceUrl: ref.sourceUrl, sourceHost: safe.host, sourcePath: safe.path, references: [{ pointer: ref.pointer, mediaKey: ref.mediaKey }] });
    }
  }
  if (mode === 'inventory') {
    const result = { schemaVersion: 2, runId, mode, bucket, sourceCount: sources.length, configRevisions: backups, sources, status: 'inventoried' };
    writeRunManifest(result);
    appendJournal({ runId, phase: 'inventory_complete', sourceCount: sources.length });
    console.log(JSON.stringify({ mode, sourceCount: sources.length, manifestPath }, null, 2));
    return;
  }
  const renditionEntries = [];
  for (const source of sources) {
    const data = await readBytes(source.sourceUrl);
    const group = source.sourcePath.includes('/history/') || source.configKey === 'brand_history' ? 'history' : (source.sourcePath.split('/').at(-2) || 'marketing');
    const name = source.sourcePath.split('/').at(-1);
    const built = await buildRenditions({ ...data, url: source.sourceUrl, name }, historyWidths, group);
    renditionEntries.push({ configKey: source.configKey, sourceUrl: source.sourceUrl, sourcePath: source.sourcePath, references: source.references, sourceBytes: data.buffer.length, sourceSha256: sha256(data.buffer), sourceWidth: built.metadata.width, sourceHeight: built.metadata.height, sourceMime: built.metadata.format ? `image/${built.metadata.format}` : null, renditions: built.entries.map(sanitizeEntry) });
    source._built = built.entries;
  }
  for (const item of renditionEntries.filter(entry => entry.configKey)) {
    const row = rows.find(candidate => candidate.key === item.configKey);
    item.rollbackPointers = [];
    for (const reference of item.references) {
      const pointer = siblingPointer(reference.pointer, reference.mediaKey);
      for (const entry of item.renditions) {
        const existing = getAt(row.value, pointer);
        const widthKey = String(entry.width);
        item.rollbackPointers.push({ pointer, width: widthKey, targetUrl: entry.targetUrl, hadPrevious: Boolean(existing && Object.prototype.hasOwnProperty.call(existing, widthKey)), previousValue: existing?.[widthKey] ?? null });
      }
    }
  }
  const base = {
    schemaVersion: 2,
    runId,
    mode,
    bucket,
    prefix: 'history',
    contentType: 'image/webp',
    sourceCount: sources.length,
    backupReferences: backups,
    renditionEntries,
    configResults: [],
    status: 'built',
  };
  activeManifest = base;
  writeRunManifest(base);
  if (mode === 'dry-run') {
    appendJournal({ runId, phase: 'dry_run_complete', sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), storageWrites: 0, configWrites: 0 });
    base.status = 'dry_run_verified';
    writeRunManifest(base);
    console.log(JSON.stringify({ mode, sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), storageWrites: 0, configWrites: 0, manifestPath, journalPath }, null, 2));
    return;
  }
  appendJournal({ runId, phase: 'storage_write_begin', storageWrites: 0 });
  for (const item of renditionEntries.filter(entry => entry.configKey)) {
    for (const entry of item.renditions) {
      const built = sources.find(source => source.sourceUrl === item.sourceUrl && source.configKey === item.configKey)?._built.find(candidate => candidate.targetPath === entry.targetPath);
      if (!built) throw new Error(`candidate missing for ${entry.targetPath}`);
      appendJournal({ runId, phase: 'storage_write_intent', targetPath: entry.targetPath, targetSha256: entry.targetSha256 });
      const upload = await supabase.storage.from(bucket).upload(entry.targetPath, built._buffer, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
      if (upload.error && !/already exists|duplicate|409/i.test(upload.error.message || '')) throw new Error(`upload failed: ${entry.targetPath}`);
      const verification = await verifyPublic({ ...entry, width: entry.width, height: entry.height });
      Object.assign(entry, verification, { status: 'uploaded_verified' });
      appendJournal({ runId, phase: 'storage_write_result', targetPath: entry.targetPath, status: 'uploaded_verified', verification });
      writeRunManifest(base);
    }
  }
  for (const configKey of ['brand_history', 'about_story_content']) {
    const row = rows.find(candidate => candidate.key === configKey);
    const items = renditionEntries.filter(entry => entry.configKey === configKey);
    if (!row || !items.length) continue;
    const next = clone(row.value);
    const changedPointers = [];
    for (const item of items) {
      for (const reference of item.references) {
        const pointer = siblingPointer(reference.pointer, reference.mediaKey);
        const previous = getAt(next, pointer);
        const updated = { ...(previous && typeof previous === 'object' ? previous : {}) };
        for (const rendition of item.renditions) {
          updated[String(rendition.width)] = rendition.targetUrl;
          changedPointers.push(`${pointer}/${rendition.width}`);
        }
        setAt(next, pointer, updated);
      }
    }
    if (equalValues(next, row.value)) continue;
    appendJournal({ runId, phase: 'config_write_intent', configKey: row.key, sourceRevision: revisionOf(row.value), changedPointers });
    const updated = await compareAndSwapConfig(supabase, {
      key: row.key,
      expectedExists: true,
      expectedValue: row.value,
      nextValue: next,
    });
    if (!updated) throw new Error(`CONFIG_CONFLICT: config changed before CAS for ${row.key}`);
    if (!equalValues(updated.value, next)) throw new Error(`config CAS returned unexpected value for ${row.key}`);
    const result = { configKey: row.key, status: 'applied_verified', afterRevision: revisionOf(updated.value), changedPointers };
    base.configResults.push(result);
    writeRunManifest(base);
    appendJournal({ runId, phase: 'config_write_result', ...result });
  }
  base.status = 'applied_verified';
  base.applied = true;
  base.afterRevisions = base.configResults.map(result => ({ key: result.configKey, revision: result.afterRevision }));
  writeRunManifest(base);
  console.log(JSON.stringify({ mode, status: 'applied_verified', sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), manifestPath, journalPath }, null, 2));
}

main().catch(error => {
  if (runArtifactsInitialized) {
    if (activeManifest && mode === 'apply') {
      activeManifest.status = activeManifest.configResults?.length ? 'apply_partial' : 'apply_failed';
      activeManifest.applied = false;
      activeManifest.failure = {
        message: error instanceof Error ? error.message : String(error),
        at: new Date().toISOString(),
        recovery: 'Do not reuse this run. Preserve its journal and use a new run only after an operator reviews any uploaded objects and config writes. A partially applied manifest is intentionally not rollback-eligible.',
      };
      try { writeRunManifest(activeManifest); } catch { /* preserve the original failure when evidence cannot be written */ }
    }
    appendJournal({ phase: 'failed', message: error instanceof Error ? error.message : String(error) });
  }
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
