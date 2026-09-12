import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const args = new Set(process.argv.slice(2));
const apply = args.has('--apply');
const manifestPath = path.resolve('plans/scroll-media-20260912/history-webp-manifest-20260912.json');
const reportPath = path.resolve('plans/scroll-media-20260912/history-webp-apply-20260912.json');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (match) env[match[1]] = match[2].replace(/^"|"$/g, '');
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bucket = 'media-uploads';
const projectHost = new URL(supabaseUrl).hostname;

const canonicalize = value => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
};
const revisionOf = value => crypto.createHash('sha256').update(JSON.stringify(canonicalize(value ?? null))).digest('hex');
const sha256 = buffer => crypto.createHash('sha256').update(buffer).digest('hex');

const replaceSceneUrls = (config, mapping) => {
  const next = structuredClone(config);
  for (const chapter of next?.chapters || []) {
    for (const scene of chapter?.scenes || []) {
      const current = scene?.image;
      if (typeof current === 'string' && mapping.has(current)) scene.image = mapping.get(current);
    }
  }
  return next;
};

const normalizeLocalSource = rawUrl => {
  if (typeof rawUrl !== 'string' || !rawUrl.startsWith('/images/history/')) return null;
  const relative = rawUrl.replace(/^\//, '');
  const candidate = path.resolve('public', relative);
  if (fs.existsSync(candidate)) return candidate;
  if (/\.jpg$/i.test(candidate)) {
    const png = candidate.replace(/\.jpg$/i, '.png');
    if (fs.existsSync(png)) return png;
  }
  throw new Error(`Local History source is missing: ${rawUrl}`);
};

const getSceneEntries = config => {
  const entries = [];
  for (const [chapterIndex, chapter] of (config?.chapters || []).entries()) {
    for (const [sceneIndex, scene] of (chapter?.scenes || []).entries()) {
      if (typeof scene?.image !== 'string' || !scene.image.startsWith('/images/history/')) continue;
      entries.push({
        rawUrl: scene.image,
        sourcePath: normalizeLocalSource(scene.image),
        pointer: `/chapters/${chapterIndex}/scenes/${sceneIndex}/image`,
        chapterId: chapter?.id ?? null,
        sceneId: scene?.id ?? null,
      });
    }
  }
  return entries;
};

const loadRow = async () => {
  const { data, error } = await supabase
    .from('SystemConfigs')
    .select('id,key,value,updated_at')
    .eq('key', 'brand_history')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('SystemConfigs.brand_history was not found');
  return data;
};

const run = async () => {
  const row = await loadRow();
  const sourceRevision = revisionOf(row.value);
  const entries = getSceneEntries(row.value);
  const unique = [...new Map(entries.map(entry => [entry.rawUrl, entry])).values()];
  const mapping = new Map();
  const manifestEntries = [];

  for (const entry of unique) {
    const sourceBuffer = fs.readFileSync(entry.sourcePath);
    const sourceMeta = await sharp(sourceBuffer).metadata();
    const sourceRaw = await sharp(sourceBuffer).ensureAlpha().raw().toBuffer();
    const targetBuffer = await sharp(sourceBuffer).webp({ lossless: true, effort: 6 }).toBuffer();
    const targetMeta = await sharp(targetBuffer).metadata();
    const targetRaw = await sharp(targetBuffer).ensureAlpha().raw().toBuffer();
    const targetSha = sha256(targetBuffer);
    const pixelExact = sourceRaw.equals(targetRaw);
    if (!pixelExact) throw new Error(`Pixel QA failed for ${entry.rawUrl}`);
    if (targetMeta.width !== sourceMeta.width || targetMeta.height !== sourceMeta.height) {
      throw new Error(`Dimension QA failed for ${entry.rawUrl}`);
    }

    const filename = path.basename(entry.sourcePath).replace(/\.[^.]+$/i, '');
    const targetPath = `history/${filename}-${targetSha.slice(0, 16)}.webp`;
    const targetUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${targetPath}`;
    mapping.set(entry.rawUrl, targetUrl);
    const manifestEntry = {
      sourceUrl: entry.rawUrl,
      sourcePath: entry.sourcePath.replace(`${process.cwd()}/`, ''),
      references: entries.filter(item => item.rawUrl === entry.rawUrl),
      sourceMime: sourceMeta.format ? `image/${sourceMeta.format}` : null,
      sourceBytes: sourceBuffer.length,
      sourceSha256: sha256(sourceBuffer),
      width: sourceMeta.width,
      height: sourceMeta.height,
      targetPath,
      targetUrl,
      targetBytes: targetBuffer.length,
      targetSha256: targetSha,
      targetWidth: targetMeta.width,
      targetHeight: targetMeta.height,
      conversionOptions: { format: 'webp', lossless: true, effort: 6 },
      pixelExact,
      status: apply ? 'ready_for_upload' : 'dry_run_verified',
    };
    manifestEntries.push(manifestEntry);

    if (!apply) continue;
    const existing = await supabase.storage.from(bucket).download(targetPath);
    if (!existing.error && existing.data) {
      const existingBytes = Buffer.from(await existing.data.arrayBuffer());
      if (sha256(existingBytes) !== targetSha) throw new Error(`Target exists with different bytes: ${targetPath}`);
      manifestEntry.status = 'uploaded_verified';
      continue;
    }
    const { error: uploadError } = await supabase.storage.from(bucket).upload(targetPath, targetBuffer, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (uploadError) throw uploadError;
    const verify = await supabase.storage.from(bucket).download(targetPath);
    if (verify.error || !verify.data) throw verify.error || new Error(`Unable to verify ${targetPath}`);
    const verifyBytes = Buffer.from(await verify.data.arrayBuffer());
    if (sha256(verifyBytes) !== targetSha) throw new Error(`Uploaded bytes failed verification: ${targetPath}`);
    manifestEntry.status = 'uploaded_verified';
  }

  let applied = false;
  let postRow = null;
  if (apply) {
    const latest = await loadRow();
    if (revisionOf(latest.value) !== sourceRevision || latest.updated_at !== row.updated_at) {
      throw new Error('brand_history changed during upload; no config update was applied');
    }
    const nextValue = replaceSceneUrls(latest.value, mapping);
    const { data, error } = await supabase
      .from('SystemConfigs')
      .update({ value: nextValue, updated_at: new Date().toISOString() })
      .eq('id', row.id)
      .eq('key', 'brand_history')
      .eq('updated_at', row.updated_at)
      .select('id,key,value,updated_at')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Conditional brand_history update affected no row');
    postRow = data;
    applied = true;
  }

  const report = {
    runId: `history-webp-${new Date().toISOString().replace(/\D/g, '').slice(0, 14)}`,
    mode: apply ? 'apply' : 'dry-run',
    bucket,
    prefix: 'history',
    contentType: 'image/webp',
    sourceConfigRevision: sourceRevision,
    sourceUpdatedAt: row.updated_at,
    sourceRowId: row.id,
    referenceCount: entries.length,
    uniqueCount: unique.length,
    sourceBytes: manifestEntries.reduce((sum, item) => sum + item.sourceBytes, 0),
    targetBytes: manifestEntries.reduce((sum, item) => sum + item.targetBytes, 0),
    savedBytes: manifestEntries.reduce((sum, item) => sum + item.sourceBytes - item.targetBytes, 0),
    applied,
    postConfigRevision: postRow ? revisionOf(postRow.value) : null,
    entries: manifestEntries,
    excluded: [{ path: '/images/about-bg.png', reason: 'outside public/images/history and may be shared' }],
  };
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({
    mode: report.mode,
    references: report.referenceCount,
    unique: report.uniqueCount,
    sourceBytes: report.sourceBytes,
    targetBytes: report.targetBytes,
    savedBytes: report.savedBytes,
    applied: report.applied,
    reportPath: reportPath.replace(`${process.cwd()}/`, ''),
  }, null, 2));
};

run().catch(error => {
  console.error(error?.message || error);
  process.exitCode = 1;
});
