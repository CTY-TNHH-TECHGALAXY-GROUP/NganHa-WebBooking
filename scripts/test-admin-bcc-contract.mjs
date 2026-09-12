import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const bcc = read('src/lib/notificationSettings.ts');
const route = read('src/app/api/admin/notification-settings/route.ts');
const booking = read('src/app/api/bookings/route.ts');
const mailer = read('src/lib/mailer.ts');
const settingsPage = read('src/app/admin/system-settings/page.tsx');
const publicRoute = read('src/app/api/public/site-content/route.ts');
const permissionsRoute = read('src/app/api/admin/editor-permissions/route.ts');
const permissionsPage = read('src/app/admin/editor-permissions/page.tsx');
const adminLayout = read('src/app/admin/layout.tsx');

assert.match(bcc, /MAX_BCC_RECIPIENTS\s*=\s*5/);
assert.match(bcc, /normalizeBccRecipients/);
assert.match(bcc, /\\[\\r\\n\\0\\]/);
assert.match(route, /withCapability/);
assert.match(route, /NOTIFICATION_SETTINGS_CAPABILITY/);
assert.match(route, /notification_settings\.manage/);
assert.match(route, /saveNotificationSettings/);
assert.doesNotMatch(route, /\.upsert\(/, 'BCC writes must not use an unconditional upsert');
assert.match(route, /method|PATCH/);
assert.match(booking, /readNotificationSettings/);
assert.match(booking, /bccRecipients/);
assert.match(mailer, /mailOptions\.bcc/);
assert.match(settingsPage, /\/api\/admin\/notification-settings/);
assert.match(settingsPage, /MAX_BCC_RECIPIENTS/);
assert.match(permissionsRoute, /withCapability/);
assert.match(permissionsRoute, /webbooking_replace_editor_capabilities/);
assert.match(permissionsRoute, /PERMISSION_CONFLICT/);
assert.match(permissionsPage, /response\.status === 409/);
assert.match(adminLayout, /\/admin\/analytics/);
assert.match(adminLayout, /\/admin\/editor-permissions/);
assert.match(adminLayout, /navigationAccess\[item\.gate\]/);
assert.doesNotMatch(publicRoute, /notification_settings/);

console.log('PASS: admin BCC capability, private storage boundary, booking integration, validation, and UI contract');
