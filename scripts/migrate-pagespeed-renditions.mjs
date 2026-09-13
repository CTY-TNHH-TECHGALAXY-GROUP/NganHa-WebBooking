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
import path from 'node:path';
import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';

const root = process.cwd();
const bucket = 'media-uploads';
const planDir = path.join(root, 'plans', 'pagespeed-remediation-20260913', 'remaining', 'agent-b');
const args = new Set(process.argv.slice(2));
const modeArg = process.argv.find(value => value.startsWith('--mode='));
const mode = (modeArg ? modeArg.slice('--mode='.length) : 'dry-run').toLowerCase();
const configFilter = process.argv.find(value => value.startsWith('--config='))?.slice('--config='.length) || 'all';
const manifestPath = process.argv.find(value => value.startsWith('--manifest='))?.slice('--manifest='.length)
  || path.join(planDir, `rendition-manifest-${new Date().toISOString().slice(0, 10)}.json`);
const journalPath = process.argv.find(value => value.startsWith('--journal='))?.slice('--journal='.length)
  || path.join(planDir, `migration-journal-${new Date().toISOString().slice(0, 10)}.jsonl`);

const historyWidths = [320, 640, 960];
const chatbotWidths = [64, 128, 192];

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

function privateBackupPath(runId, row) {
  const dir = path.join('/private/tmp', 'nganha-pagespeed-agent-b', runId);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try { fs.chmodSync(dir, 0o700); } catch { /* best effort on non-POSIX */ }
  const filename = path.join(dir, `${row.key}-backup.json`);
  fs.writeFileSync(filename, `${JSON.stringify(row, null, 2)}\n`, { mode: 0o600 });
  try { fs.chmodSync(filename, 0o600); } catch { /* best effort on non-POSIX */ }
  return filename;
}

function appendJournal(event) {
  fs.mkdirSync(path.dirname(journalPath), { recursive: true });
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

async function main() {
  if (!['dry-run', 'apply', 'rollback', 'inventory'].includes(mode)) throw new Error(`unsupported mode: ${mode}`);
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase env vars are required for config inventory');
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
  const runId = `ps-b-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}`;
  const rows = await readRows(supabase);
  if (rows.length !== (configFilter === 'all' ? 2 : 1)) throw new Error(`missing requested config: ${configFilter}`);
  const backups = rows.map(row => ({ key: row.key, path: privateBackupPath(runId, row), revision: revisionOf(row.value), valueSha256: sha256(JSON.stringify(row.value)), rowId: row.id }));
  appendJournal({ runId, phase: 'backup_created', mode, backups });
  const sources = [];
  for (const row of rows) {
    for (const ref of collectMediaRefs(row.key, row.value)) {
      const safe = sanitizeUrl(ref.sourceUrl);
      if (!safe) continue;
      const existing = sources.find(item => item.configKey === row.key && item.sourceUrl === safe.url);
      if (existing) existing.references.push({ pointer: ref.pointer, mediaKey: ref.mediaKey });
      else sources.push({ configKey: row.key, sourceUrl: safe.url, sourceHost: safe.host, sourcePath: safe.path, references: [{ pointer: ref.pointer, mediaKey: ref.mediaKey }] });
    }
  }
  if (mode === 'inventory') {
    const result = { schemaVersion: 1, runId, mode, bucket, sourceCount: sources.length, configRevisions: backups, sources };
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    fs.writeFileSync(manifestPath, `${JSON.stringify(result, null, 2)}\n`);
    console.log(JSON.stringify({ mode, sourceCount: sources.length, manifestPath }, null, 2));
    return;
  }
  const renditionEntries = [];
  const localBuilt = new Map();
  for (const source of sources) {
    const data = await readBytes(source.sourceUrl);
    const group = source.sourcePath.includes('/history/') || source.configKey === 'brand_history' ? 'history' : (source.sourcePath.split('/').at(-2) || 'marketing');
    const name = source.sourcePath.split('/').at(-1);
    const built = await buildRenditions({ ...data, url: source.sourceUrl, name }, historyWidths, group);
    renditionEntries.push({ configKey: source.configKey, sourceUrl: source.sourceUrl, sourcePath: source.sourcePath, references: source.references, sourceBytes: data.buffer.length, sourceSha256: sha256(data.buffer), sourceWidth: built.metadata.width, sourceHeight: built.metadata.height, sourceMime: built.metadata.format ? `image/${built.metadata.format}` : null, renditions: built.entries.map(sanitizeEntry) });
    source._built = built.entries;
  }
  const chatbotPath = path.join(root, 'public', 'images', 'chatbot-icon.webp');
  if (fs.existsSync(chatbotPath)) {
    const chatbot = await buildRenditions({ buffer: fs.readFileSync(chatbotPath), sourceFile: chatbotPath, url: '/images/chatbot-icon.webp', name: 'chatbot-icon.webp' }, chatbotWidths, 'local-optimized');
    localBuilt.set('/images/chatbot-icon.webp', chatbot.entries);
    renditionEntries.push({ configKey: null, sourceUrl: '/images/chatbot-icon.webp', sourcePath: '/images/chatbot-icon.webp', references: [{ consumer: 'FloatingWidgets', note: 'consumer wiring owned by Agent A' }], sourceBytes: fs.statSync(chatbotPath).size, sourceSha256: sha256(fs.readFileSync(chatbotPath)), sourceWidth: chatbot.metadata.width, sourceHeight: chatbot.metadata.height, sourceMime: 'image/webp', renditions: chatbot.entries.map((entry) => ({ ...sanitizeEntry(entry), targetPath: `public/images/optimized/chatbot-icon.${entry.targetSha256.slice(0, 16)}.${entry.width}.webp`, targetUrl: null })) });
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
  const base = { schemaVersion: 1, runId, mode, bucket, prefix: 'history', contentType: 'image/webp', sourceCount: sources.length, backupReferences: backups, renditionEntries };
  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, `${JSON.stringify(base, null, 2)}\n`);
  if (mode === 'dry-run') {
    appendJournal({ runId, phase: 'dry_run_complete', sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), storageWrites: 0, configWrites: 0 });
    console.log(JSON.stringify({ mode, sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), storageWrites: 0, configWrites: 0, manifestPath, journalPath }, null, 2));
    return;
  }
  if (mode === 'rollback') {
    const release = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    if (release.status !== 'applied_verified' && release.applied !== true) throw new Error('rollback requires an applied manifest');
    const releaseRows = await readRows(supabase);
    for (const row of releaseRows) {
      const items = (release.renditionEntries || []).filter(item => item.configKey === row.key);
      if (!items.length) continue;
      const next = clone(row.value);
      const changed = [];
      for (const item of items) for (const patch of item.rollbackPointers || []) {
        const current = getAt(next, `${patch.pointer}/${patch.width}`);
        if (current !== patch.targetUrl) throw new Error(`ROLLBACK_CONFLICT at ${patch.pointer}/${patch.width}`);
        if (patch.hadPrevious) setAt(next, `${patch.pointer}/${patch.width}`, patch.previousValue);
        else deleteAt(next, `${patch.pointer}/${patch.width}`);
        changed.push(`${patch.pointer}/${patch.width}`);
      }
      const update = await supabase.from('SystemConfigs').update({ value: next }).eq('id', row.id).eq('key', row.key).eq('value', JSON.stringify(row.value)).select('id,key,value,updated_at').maybeSingle();
      if (update.error) throw new Error(`rollback failed for ${row.key}: ${update.error.message}`);
      if (!update.data) throw new Error(`ROLLBACK_CONFLICT: conditional update affected zero rows for ${row.key}`);
      appendJournal({ runId, phase: 'rollback_result', configKey: row.key, changedPointers: changed, status: 'applied' });
    }
    console.log(JSON.stringify({ mode, status: 'rollback_applied', manifestPath, journalPath }, null, 2));
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
      fs.writeFileSync(manifestPath, `${JSON.stringify(base, null, 2)}\n`);
    }
  }
  for (const item of renditionEntries.filter(entry => entry.configKey)) {
    const row = rows.find(candidate => candidate.key === item.configKey);
    const next = clone(row.value);
    const changedPointers = [];
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
    if (equalValues(next, row.value)) continue;
    appendJournal({ runId, phase: 'config_write_intent', configKey: row.key, sourceRevision: revisionOf(row.value), changedPointers });
    const update = await supabase.from('SystemConfigs').update({ value: next }).eq('id', row.id).eq('key', row.key).eq('value', JSON.stringify(row.value)).select('id,key,value,updated_at').maybeSingle();
    if (update.error) throw new Error(`config CAS failed for ${row.key}: ${update.error.message}`);
    if (!update.data) throw new Error(`CONFIG_CONFLICT: conditional update affected zero rows for ${row.key}`);
    const readBack = await supabase.from('SystemConfigs').select('id,key,value,updated_at').eq('id', row.id).eq('key', row.key).maybeSingle();
    if (readBack.error || !readBack.data || revisionOf(readBack.data.value) !== revisionOf(next)) throw new Error(`config read-back failed for ${row.key}`);
    appendJournal({ runId, phase: 'config_write_result', configKey: row.key, status: 'applied_verified', afterRevision: revisionOf(readBack.data.value), changedPointers });
  }
  for (const item of renditionEntries.filter(entry => entry.configKey === null)) {
    for (const rendition of item.renditions) {
      const localTarget = path.join(root, rendition.targetPath);
      const built = localBuilt.get(item.sourceUrl)?.find(entry => entry.width === rendition.width);
      if (built) { fs.mkdirSync(path.dirname(localTarget), { recursive: true }); fs.writeFileSync(localTarget, built._buffer, { flag: 'wx' }); }
    }
  }
  base.status = 'applied_verified';
  base.applied = true;
  base.afterRevisions = (await readRows(supabase)).map(row => ({ key: row.key, revision: revisionOf(row.value) }));
  fs.writeFileSync(manifestPath, `${JSON.stringify(base, null, 2)}\n`);
  console.log(JSON.stringify({ mode, status: 'applied_verified', sourceCount: sources.length, renditionCount: renditionEntries.reduce((sum, item) => sum + item.renditions.length, 0), manifestPath, journalPath }, null, 2));
}

main().catch(error => {
  appendJournal({ phase: 'failed', message: error instanceof Error ? error.message : String(error) });
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
