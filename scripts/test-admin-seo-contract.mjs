import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const config = read('src/lib/seo/config.ts');
const route = read('src/app/api/admin/seo/route.ts');
const metadata = read('src/lib/seo/metadata.ts');
const sitemap = read('src/app/sitemap.ts');

assert.match(config, /export async function getSeoConfigSnapshot/);
assert.match(config, /export async function saveSeoConfigIfCurrent/);
assert.match(config, /\.eq\('value', expectedFilterValue\)/);
assert.match(config, /expectedRowExists: boolean/);
assert.doesNotMatch(config, /\.eq\('value', expectedRawValue\)/);
assert.match(route, /revisionToken\(snapshot\.rawValue\)/);
assert.match(route, /typeof body\.expectedRevision !== 'string'/);
assert.match(route, /saveSeoConfigIfCurrent\(/);
assert.match(metadata, /fields\.canonicalPath \|\| localizedPath/);
assert.match(metadata, /defaultFields\.canonicalPath \|\|/);
assert.match(sitemap, /hydrateLocalTourConfig/);
assert.match(sitemap, /getSupabaseAdmin/);
assert.match(sitemap, /fields\.canonicalPath \|\| localized/);

console.log('admin SEO revision/canonical/sitemap contract: PASS');
