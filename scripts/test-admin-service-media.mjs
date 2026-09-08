import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseMediaPatch } from '../src/lib/admin/mediaPatch.ts';

const routePath = path.resolve('src/app/api/admin/services/[id]/route.ts');
const routeSource = fs.readFileSync(routePath, 'utf8');
const publicServicesSource = fs.readFileSync(path.resolve('src/app/api/services/route.ts'), 'utf8');
const bookingRouteSource = fs.readFileSync(path.resolve('src/app/api/admin/bookings/route.ts'), 'utf8');
const bookingItemRouteSource = fs.readFileSync(path.resolve('src/app/api/admin/bookings/[id]/route.ts'), 'utf8');

const valid = parseMediaPatch({
  media_url: '/media/services/aroma.webp',
  media_type: 'image',
});
assert.equal(valid.ok, true, 'relative media URLs should be accepted');

const validVideo = parseMediaPatch({
  media_url: 'https://cdn.example.com/service.mp4',
  media_type: 'video',
  expectedMediaUrl: null,
  expectedMediaType: null,
});
assert.equal(validVideo.ok, true, 'HTTPS video URLs and null expectations should be accepted');

const invalidProtocol = parseMediaPatch({
  media_url: 'javascript:alert(1)',
  media_type: 'image',
});
assert.equal(invalidProtocol.ok, false);
assert.equal(invalidProtocol.code, 'INVALID_MEDIA_PATCH');

const protocolRelative = parseMediaPatch({
  media_url: '//external.example.com/service.webp',
  media_type: 'image',
});
assert.equal(protocolRelative.ok, false, 'protocol-relative URLs must not bypass URL validation');

const catalogWrite = parseMediaPatch({
  media_url: '/media/service.webp',
  media_type: 'image',
  priceVND: 1,
});
assert.equal(catalogWrite.ok, false);
assert.equal(catalogWrite.code, 'CATALOG_READ_ONLY');

const unknownWrite = parseMediaPatch({
  media_url: '/media/service.webp',
  media_type: 'image',
  unknown: true,
});
assert.equal(unknownWrite.ok, false);
assert.equal(unknownWrite.code, 'CATALOG_READ_ONLY');

assert.match(routeSource, /\.update\(\{ media_url: parsed\.value\.media_url, media_type: parsed\.value\.media_type \}\)/);
assert.match(routeSource, /export const PUT = updateMedia/);
assert.match(routeSource, /export const PATCH = updateMedia/);
assert.doesNotMatch(routeSource, /priceVND:\s*body|duration:\s*body|isActive:\s*body|category:\s*body/);
assert.match(publicServicesSource, /nameEN, nameVN, nameCN, nameJP, nameKR/);
assert.match(publicServicesSource, /media_url, media_type/);
assert.doesNotMatch(bookingRouteSource, /getSupabaseAdmin|from\(['"]Bookings['"]\)/);
assert.doesNotMatch(bookingItemRouteSource, /getSupabaseAdmin|from\(['"]Bookings['"]\)|\.update\(/);

console.log('PASS: service media-only contract and CMS booking isolation are enforced.');
