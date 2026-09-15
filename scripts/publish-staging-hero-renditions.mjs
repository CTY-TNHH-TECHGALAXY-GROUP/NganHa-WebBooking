import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

// Explicitly scoped to the staging project/bucket authorized by the owner.
const base = 'https://adzfohfdindovfcpaizb.supabase.co';
assert.equal(process.env.NEXT_PUBLIC_SUPABASE_URL, base);
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(key, 'Missing service credentials');
const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
const destination = process.argv.find(arg => arg.startsWith('--evidence='))?.slice(11);
assert.ok(destination, 'Require --evidence=<new directory>');
fs.mkdirSync(destination, { recursive: false, mode: 0o700 });
const save = (name, value) => fs.writeFileSync(path.join(destination, name), JSON.stringify(value, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const assets = [
  ['mobile_url', 'hero-mobile-optimized-12s.mp4', '7aaf77c3e4d8748984188a7310d2181678b81c12dcedcbc3fc223391502dfee0'],
  ['desktop_url', 'hero-desktop-optimized-12s.mp4', 'eac8669e8f3cf85efb4785493852802a3d31b06deafa7f4914e61565a03850af'],
];
const verified = [];
for (const [field, name, expectedHash] of assets) {
  const url = `${base}/storage/v1/object/public/media-uploads/marketing/${name}`;
  const response = await fetch(url);
  assert.equal(response.status, 200);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(hash(bytes), expectedHash);
  verified.push({ field, url, bytes: bytes.length, sha256: expectedHash });
}
const endpoint = `${base}/rest/v1/SystemConfigs`;
const query = new URLSearchParams({ key: 'eq.hero_videos', select: 'value' });
const beforeResponse = await fetch(`${endpoint}?${query}`, { headers });
assert.equal(beforeResponse.status, 200);
const rows = await beforeResponse.json();
assert.equal(rows.length, 1);
const before = rows[0].value;
assert.ok(Array.isArray(before));
const after = structuredClone(before);
const matches = after.filter(video => decodeURIComponent(video.url || video.media_url || '').endsWith('/homepage/0807(1).mp4'));
assert.equal(matches.length, 1, 'Expected one matching original Hero; refuse ambiguous update');
for (const asset of verified) matches[0][asset.field] = asset.url;
save('before.json', before);
save('candidate.json', after);
save('assets.json', verified);
if (!process.argv.includes('--apply')) {
  console.log('Prepared only; add --apply to publish staging configuration.');
  process.exit(0);
}
// Compare the complete JSONB snapshot in the same PATCH statement to avoid
// overwriting concurrent admin edits. Keep original URL, poster and playlist.
const condition = new URLSearchParams({ key: 'eq.hero_videos', value: `eq.${JSON.stringify(before)}`, select: 'value' });
const update = await fetch(`${endpoint}?${condition}`, { method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ value: after }) });
assert.equal(update.status, 200, `Staging update returned ${update.status}`);
const changed = await update.json();
assert.equal(changed.length, 1, 'Concurrent configuration change; no matching update');
assert.deepEqual(changed[0].value, after);
const read = await fetch(`${endpoint}?${query}`, { headers });
assert.equal(read.status, 200);
assert.deepEqual((await read.json())[0].value, after);
save('result.json', { status: 'PASS_STAGING_CONFIG_READBACK', completedAt: new Date().toISOString(), configKey: 'hero_videos', assets: verified, rollback: 'PATCH before.json only when current value equals candidate.json; preserve intervening edits.', cache: 'Server config cache may take at least 60 seconds to revalidate; browser delivery not verified by this DB readback.' });
console.log('PASS: staging hero_videos updated; both URLs and unchanged playlist fields read back successfully.');
