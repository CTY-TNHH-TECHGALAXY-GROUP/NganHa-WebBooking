import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const clientSource = fs.readFileSync(path.join(root, 'src/lib/analytics/client.ts'), 'utf8');
const routeSource = fs.readFileSync(path.join(root, 'src/app/api/analytics/route.ts'), 'utf8');

assert.match(clientSource, /'X-Analytics-Consent': 'granted'/);
assert.match(clientSource, /getAnalyticsConsent\(\) !== 'granted'/);
assert.match(routeSource, /request\.headers\.get\('x-analytics-consent'\) !== 'granted'/);
assert.match(routeSource, /CONSENT_REQUIRED/);

console.log('PASS: analytics ingest requires explicit granted consent');
