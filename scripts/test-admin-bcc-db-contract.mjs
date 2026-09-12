import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const analyticsServer = read('src/lib/analytics/server.ts');
const migration = read('supabase/migrations/20260912_webbooking_admin_analytics_reviewed.sql');
const preflight = read('supabase/verification/20260912_webbooking_admin_analytics_preflight_read_only.sql');
const postflight = read('supabase/verification/20260912_webbooking_admin_analytics_postflight_read_only.sql');

assert.match(migration, /\bBEGIN;/);
assert.match(migration, /COMMIT;\s*$/);
assert.doesNotMatch(migration, /FOR\s+check_record\s+IN[\s\S]*DROP\s+CONSTRAINT/i);
assert.doesNotMatch(migration, /DROP\s+POLICY[\s\S]*ILIKE|DROP\s+POLICY[\s\S]*pg_policies/i);
assert.match(migration, /DROP CONSTRAINT "WebbookingAdminUsers_role_check"/);
assert.match(migration, /ADD CONSTRAINT "WebbookingAdminUsers_role_check"/);
assert.match(migration, /GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE[\s\S]*TO service_role;/);
assert.match(migration, /webbooking_has_admin_capability\(UUID, TEXT, TEXT\)/);
assert.match(migration, /webbooking_replace_editor_capabilities\(UUID, UUID, TEXT\[\], BIGINT\)/);
assert.match(migration, /webbooking_analytics_maintain\(\)/);
assert.match(migration, /v_finalize_before\s+TIMESTAMPTZ/);
assert.match(migration, /received_at\s*<\s*v_finalize_before/);
assert.match(migration, /WHERE received_at < v_finalize_before/);
assert.match(migration, /webbooking_media_upload_capability_insert/);
assert.match(migration, /recruitment_images and other storage buckets are/);
assert.doesNotMatch(migration, /cron\.schedule\s*\(/i);

assert.doesNotMatch(analyticsServer, /\.insert\s*\(/);
assert.equal((analyticsServer.match(/\.upsert\s*\(/g) || []).length, 2);
assert.match(analyticsServer, /onConflict: 'event_id', ignoreDuplicates: true/);
assert.match(analyticsServer, /onConflict: 'conversion_key', ignoreDuplicates: true/);

assert.match(preflight, /SET TRANSACTION READ ONLY/);
assert.match(preflight, /ROLLBACK;/);
assert.match(preflight, /pg_constraint/);
assert.match(preflight, /aclexplode/);
assert.match(preflight, /pg_policies/);
assert.match(preflight, /schemaname = 'storage'[\s\S]*tablename = 'objects'/);
assert.match(preflight, /proname = 'schedule'/);
assert.match(preflight, /WebbookingAnalyticsEvents/);

assert.match(postflight, /SET TRANSACTION READ ONLY/);
assert.match(postflight, /has_table_privilege\('service_role'/);
assert.match(postflight, /has_function_privilege\('service_role'/);
assert.match(postflight, /webbooking_replace_editor_capabilities\(uuid,uuid,text\[\],bigint\)/);
assert.match(postflight, /analytics conversion key is unique/);
assert.match(postflight, /security-definer functions use a fixed search path/);
assert.match(postflight, /media-uploads write policies are narrow/);
assert.match(postflight, /recruitment_images storage impact/);
assert.match(postflight, /pg_cron schedule/);

console.log('admin/bcc/analytics reviewed DB contract: PASS');
