import crypto from 'node:crypto';
import fs from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const OFFICIAL_ORIGIN = 'https://oria-spa.vercel.app';
const SEO_CONFIG_KEY = 'seo_config';
const EXPECTED_STALE_PATH = '/oria-spa.vercel.app';
const APPLY = process.argv.includes('--apply');

function loadEnvFile() {
  try {
    const source = fs.readFileSync('.env.local', 'utf8');
    for (const line of source.split(/\r?\n/)) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  } catch {
    // CI/deployment environments provide variables directly.
  }
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function revision(value) {
  return crypto.createHash('sha256').update(JSON.stringify(value ?? null)).digest('hex');
}

function assertConfigShape(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !value.global || typeof value.global !== 'object') {
    throw new Error('seo_config has an unexpected shape; refusing to update');
  }
}

function buildNextConfig(config) {
  assertConfigShape(config);
  const next = JSON.parse(JSON.stringify(config));
  const changedPaths = [];
  for (const [locale, entry] of Object.entries(next.global)) {
    for (const status of ['draft', 'published']) {
      if (!entry?.[status] || typeof entry[status] !== 'object') continue;
      const current = entry[status].canonicalPath;
      if (current === undefined || current === '') continue;
      if (current !== EXPECTED_STALE_PATH) {
        throw new Error(`Unexpected global.${locale}.${status}.canonicalPath=${JSON.stringify(current)}; refusing to overwrite`);
      }
      entry[status].canonicalPath = '';
      changedPaths.push(`global.${locale}.${status}.canonicalPath`);
    }
  }
  return { next, changedPaths };
}

loadEnvFile();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: row, error: readError } = await supabase
  .from('SystemConfigs')
  .select('id,key,value,updated_at')
  .eq('key', SEO_CONFIG_KEY)
  .maybeSingle();
if (readError) throw new Error(`Read seo_config failed: ${readError.message}`);
if (!row) throw new Error('seo_config row not found; refusing to insert a replacement');

const { next, changedPaths } = buildNextConfig(row.value);
const beforeHash = revision(stable(row.value));
const afterHash = revision(stable(next));
console.log(JSON.stringify({
  mode: APPLY ? 'apply' : 'dry-run',
  officialOrigin: OFFICIAL_ORIGIN,
  rowId: row.id,
  updatedAt: row.updated_at,
  beforeHash,
  afterHash,
  changedPaths,
  changed: beforeHash !== afterHash,
}, null, 2));

if (!APPLY || beforeHash === afterHash) process.exit(0);

const { data: updated, error: updateError } = await supabase
  .from('SystemConfigs')
  .update({ value: next })
  .eq('key', SEO_CONFIG_KEY)
  .eq('value', JSON.stringify(row.value))
  .select('id,key,value,updated_at')
  .maybeSingle();
if (updateError) throw new Error(`Conditional update failed: ${updateError.message}`);
if (!updated) throw new Error('Conditional update matched no row; another writer changed seo_config');

const verifyHash = revision(stable(updated.value));
if (verifyHash !== afterHash) throw new Error(`Post-update hash mismatch: expected ${afterHash}, received ${verifyHash}`);
console.log(JSON.stringify({
  mode: 'applied',
  rowId: updated.id,
  updatedAt: updated.updated_at,
  verifiedHash: verifyHash,
  changedPaths,
}, null, 2));
