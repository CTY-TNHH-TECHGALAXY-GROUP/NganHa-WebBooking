import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const apply = process.argv.includes('--apply');
const bucket = 'media-uploads';
const widths = [320, 640, 960];
const reportPath = path.resolve(process.env.PAGESPEED_REPORT_DIR || 'plans/pagespeed-remediation-20260913', 'responsive-renditions-report.json');

const env = {};
for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase environment variables');

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const stable = value => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, stable(value[key])]));
  }
  return value;
};
const hash = value => crypto.createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const bytesHash = value => crypto.createHash('sha256').update(value).digest('hex');
const publicUrl = objectPath => `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
const parseObjectPath = value => {
  if (typeof value !== 'string') return null;
  try {
    const parsed = new URL(value);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = parsed.pathname.indexOf(marker);
    return index < 0 ? null : decodeURIComponent(parsed.pathname.slice(index + marker.length));
  } catch {
    return null;
  }
};

const loadConfig = async key => {
  const { data, error } = await supabase.from('SystemConfigs')
    .select('id,key,value,updated_at')
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`SystemConfigs.${key} was not found`);
  return data;
};

const sourcePathForHistory = objectPath => {
  const file = path.basename(objectPath).replace(/-[a-f0-9]{16}\.webp$/i, '');
  const candidates = ['.png', '.jpg', '.jpeg', '.webp'].map(extension => path.resolve('public/images/history', `${file}${extension}`));
  return candidates.find(candidate => fs.existsSync(candidate)) || null;
};

const readSource = async ({ objectPath, localPath }) => {
  if (localPath) return fs.readFileSync(localPath);
  const response = await fetch(publicUrl(objectPath));
  if (!response.ok) throw new Error(`Unable to download ${objectPath}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
};

const rendition = async (source, width) => sharp(source)
  .resize({ width, withoutEnlargement: true })
  .webp({ quality: 82, effort: 6 })
  .toBuffer();

const uploadAndVerify = async (objectPath, data) => {
  const expectedHash = bytesHash(data);
  if (!apply) return { objectPath, url: publicUrl(objectPath), bytes: data.length, sha256: expectedHash, status: 'dry-run' };

  let verifiedBytes = null;
  const existing = await supabase.storage.from(bucket).download(objectPath);
  if (!existing.error && existing.data) {
    const existingBytes = Buffer.from(await existing.data.arrayBuffer());
    if (bytesHash(existingBytes) !== expectedHash) throw new Error(`Existing object differs: ${objectPath}`);
    verifiedBytes = existingBytes;
  } else {
    const { error } = await supabase.storage.from(bucket).upload(objectPath, data, {
      contentType: 'image/webp',
      cacheControl: '31536000',
      upsert: false,
    });
    if (error) throw error;
    const verified = await supabase.storage.from(bucket).download(objectPath);
    if (verified.error || !verified.data) throw verified.error || new Error(`Unable to verify ${objectPath}`);
    verifiedBytes = Buffer.from(await verified.data.arrayBuffer());
    if (bytesHash(verifiedBytes) !== expectedHash) throw new Error(`Hash mismatch after upload: ${objectPath}`);
  }
  const head = await fetch(publicUrl(objectPath), { method: 'HEAD' });
  const contentType = head.headers.get('content-type') || '';
  if (!head.ok || !contentType.toLowerCase().includes('image/webp')) {
    throw new Error(`Public verification failed for ${objectPath}: ${head.status} ${contentType}`);
  }
  return { objectPath, url: publicUrl(objectPath), bytes: verifiedBytes.length, sha256: expectedHash, status: 'uploaded-verified', contentType };
};

const collectTargets = (history, story) => {
  const targets = [];
  for (const [chapterIndex, chapter] of (history.value.chapters || []).entries()) {
    for (const [sceneIndex, scene] of (chapter.scenes || []).entries()) {
      const objectPath = parseObjectPath(scene.image);
      const localPath = objectPath?.startsWith('history/') ? sourcePathForHistory(objectPath) : null;
      if (!objectPath || !objectPath.startsWith('history/') || !localPath) continue;
      targets.push({
        group: 'history',
        objectPath,
        localPath,
        pointer: `/chapters/${chapterIndex}/scenes/${sceneIndex}/image`,
        sourceUrl: scene.image,
      });
    }
  }
  const storyFields = [
    ['locationSection', 'cityImage'],
    ['locationSection', 'streetSignImage'],
  ];
  for (const [section, field] of storyFields) {
    const value = story.value?.[section]?.[field];
    const objectPath = parseObjectPath(value);
    if (!objectPath || !objectPath.startsWith('marketing/')) continue;
    targets.push({ group: 'our-story', objectPath, localPath: null, pointer: `/${section}/${field}`, sourceUrl: value });
  }
  return [...new Map(targets.map(target => [target.objectPath, target])).values()];
};

const updateResponsiveConfig = (value, entries) => {
  const next = structuredClone(value);
  for (const entry of entries.filter(item => item.renditions)) {
    const sourceMap = Object.fromEntries(entry.renditions.map(r => [String(r.width), r.url]));
    const match = entry.pointer.match(/^\/chapters\/(\d+)\/scenes\/(\d+)\/image$/);
    if (match) {
      const scene = next.chapters?.[Number(match[1])]?.scenes?.[Number(match[2])];
      if (scene) scene.responsiveSources = sourceMap;
      continue;
    }
    const storyMatch = entry.pointer.match(/^\/(locationSection)\/(cityImage|streetSignImage)$/);
    if (storyMatch && next[storyMatch[1]]) {
      next[storyMatch[1]][`${storyMatch[2]}ResponsiveSources`] = sourceMap;
    }
  }
  return next;
};

const run = async () => {
  const [history, story] = await Promise.all([loadConfig('brand_history'), loadConfig('about_story_content')]);
  const targets = collectTargets(history, story);
  const entries = [];
  const nextHistoryEntries = [];
  const nextStoryEntries = [];

  for (const target of targets) {
    const source = await readSource(target);
    const sourceMeta = await sharp(source).metadata();
    const sourceHash = bytesHash(source);
    const base = target.objectPath.replace(/\.[^.]+$/, '');
    const renditions = [];
    for (const width of widths) {
      const data = await rendition(source, width);
      const objectPath = `${base}-w${width}.webp`;
      renditions.push({ width, ...(await uploadAndVerify(objectPath, data)) });
    }
    const entry = {
      group: target.group,
      pointer: target.pointer,
      sourceUrl: target.sourceUrl,
      sourceObjectPath: target.objectPath,
      sourceBytes: source.length,
      sourceSha256: sourceHash,
      sourceWidth: sourceMeta.width || null,
      sourceHeight: sourceMeta.height || null,
      renditions,
    };
    entries.push(entry);
    (target.group === 'history' ? nextHistoryEntries : nextStoryEntries).push(entry);
  }

  const report = {
    runAt: new Date().toISOString(),
    mode: apply ? 'apply' : 'dry-run',
    bucket,
    widths,
    contentType: 'image/webp',
    historyBefore: { id: history.id, updatedAt: history.updated_at, sha256: hash(history.value) },
    storyBefore: { id: story.id, updatedAt: story.updated_at, sha256: hash(story.value) },
    entries,
    updates: [],
  };

  if (apply) {
    const latestHistory = await loadConfig('brand_history');
    const latestStory = await loadConfig('about_story_content');
    if (latestHistory.updated_at !== history.updated_at || hash(latestHistory.value) !== hash(history.value)) throw new Error('brand_history changed during rendition upload');
    if (latestStory.updated_at !== story.updated_at || hash(latestStory.value) !== hash(story.value)) throw new Error('about_story_content changed during rendition upload');

    const nextHistory = updateResponsiveConfig(latestHistory.value, nextHistoryEntries);
    const nextStory = updateResponsiveConfig(latestStory.value, nextStoryEntries);
    const historyUpdate = await supabase.from('SystemConfigs').update({ value: nextHistory, updated_at: new Date().toISOString() })
      .eq('id', latestHistory.id).eq('key', 'brand_history').eq('updated_at', latestHistory.updated_at)
      .select('id,key,value,updated_at').maybeSingle();
    if (historyUpdate.error) throw historyUpdate.error;
    if (!historyUpdate.data) throw new Error('Conditional brand_history update affected no row');
    const storyUpdate = await supabase.from('SystemConfigs').update({ value: nextStory, updated_at: new Date().toISOString() })
      .eq('id', latestStory.id).eq('key', 'about_story_content').eq('updated_at', latestStory.updated_at)
      .select('id,key,value,updated_at').maybeSingle();
    if (storyUpdate.error) throw storyUpdate.error;
    if (!storyUpdate.data) throw new Error('Conditional about_story_content update affected no row');
    report.updates = [
      { key: 'brand_history', after: { updatedAt: historyUpdate.data.updated_at, sha256: hash(historyUpdate.data.value) } },
      { key: 'about_story_content', after: { updatedAt: storyUpdate.data.updated_at, sha256: hash(storyUpdate.data.value) } },
    ];
  }

  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  const totals = entries.reduce((acc, entry) => {
    acc.sourceBytes += entry.sourceBytes;
    acc.renditionBytes += entry.renditions.reduce((sum, rendition) => sum + rendition.bytes, 0);
    return acc;
  }, { sourceBytes: 0, renditionBytes: 0 });
  console.log(JSON.stringify({ mode: report.mode, entries: entries.length, ...totals, reportPath }, null, 2));
};

run().catch(error => {
  console.error(error?.stack || error);
  process.exitCode = 1;
});
