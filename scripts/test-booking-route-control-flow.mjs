import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const routePath = path.join(root, 'src/app/api/bookings/route.ts');
const contractPath = path.join(root, 'src/lib/booking/contract.ts');
const fixturePath = path.join(root, 'scripts/fixtures/booking-api-validation.json');
const routeSource = fs.readFileSync(routePath, 'utf8');
const contractSource = fs.readFileSync(contractPath, 'utf8');
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));

assert.equal(fixture.version, 1);
assert.ok(Array.isArray(fixture.cases) && fixture.cases.length >= 8);
for (const id of ['body-null', 'body-array', 'unicode-name-valid', 'idempotency-conflict', 'atomic-schema-unavailable']) {
  assert.ok(fixture.cases.some((testCase) => testCase.id === id), `missing fixture case: ${id}`);
}

const replayStart = routeSource.indexOf("if (replay.state === 'complete')");
const mailDispatchStart = routeSource.indexOf('const mail = await sendBookingConfirmationEmail');
const writerReplayStart = routeSource.indexOf('if (writerReplay)');
const reconcileStart = routeSource.indexOf('async function reconcileAfterUncertainCommit');
const localizedServicesStart = routeSource.indexOf('function localizedServices');
const conversionHelperStart = routeSource.indexOf('recordConversionAfterVerifiedCommit');
const conversionCallStart = routeSource.indexOf('await recordConversionAfterVerifiedCommit(supabase, committedSnapshot');

assert.ok(replayStart >= 0, 'booking route must retain an idempotent replay branch');
assert.ok(mailDispatchStart > replayStart, 'mail dispatch must remain after replay handling');

const replayBlock = routeSource.slice(replayStart, mailDispatchStart);
assert.match(replayBlock, /responseForSnapshot\(replay\.snapshot, true\)/);
assert.doesNotMatch(replayBlock, /sendBookingConfirmationEmail\s*\(/);
assert.match(routeSource, /findReplay\(supabase, finalKey, \{ waitForItems: true \}\)/);
assert.match(routeSource, /responseForIncompleteBooking\(replay\.bookingId\)/);
assert.match(routeSource, /responseForUnverifiedBooking/);
assert.match(routeSource, /reconcileAfterUncertainCommit/);
assert.ok(writerReplayStart > replayStart && writerReplayStart < mailDispatchStart, 'writer replay must be handled before mail dispatch');
assert.doesNotMatch(routeSource.slice(writerReplayStart, mailDispatchStart), /sendBookingConfirmationEmail\s*\(/);
assert.ok(reconcileStart >= 0 && localizedServicesStart > reconcileStart, 'uncertain commit reconciliation branch must remain explicit');
assert.doesNotMatch(routeSource.slice(reconcileStart, localizedServicesStart), /sendBookingConfirmationEmail\s*\(/);
assert.ok(conversionHelperStart >= 0, 'verified conversion helper boundary must remain explicit');
assert.ok(conversionCallStart >= 0 && conversionCallStart < mailDispatchStart, 'verified conversion must be awaited before email dispatch');
assert.doesNotMatch(routeSource, /void\s+recordVerifiedBookingConversion\s*\(/);
assert.match(routeSource, /request\.headers\.get\('x-analytics-consent'\) !== 'granted'/);
assert.match(routeSource, /rawSessionId && isUuid\(rawSessionId\)/);
assert.match(routeSource, /BOOKING_TIME_IN_PAST/);
assert.match(contractSource, /INVALID_PHONE/);
assert.match(routeSource, /BOOKING_TEMPORARILY_UNAVAILABLE/);
assert.match(routeSource, /supabase\.rpc\('webbooking_allocate_booking_number'/);
assert.match(routeSource, /supabase\.rpc\('webbooking_commit_booking'/);
assert.doesNotMatch(routeSource, /from\(['"]Bookings['"]\)\.insert/);
assert.doesNotMatch(routeSource, /from\(['"]BookingItems['"]\)\.insert/);
assert.doesNotMatch(routeSource, /from\(['"]Bookings['"]\)\.delete/);
assert.doesNotMatch(routeSource, /generateCollisionSafeFallbackId/);
assert.doesNotMatch(routeSource, /PRIVATE_ROOM_DEFAULT_PRICE/);

const replayFixture = fixture.cases.find((testCase) => testCase.id === 'replay-no-mail');
assert.deepEqual(replayFixture.expect, { status: 200, response: { idempotent: true }, mailCalls: 0 });

console.log('PASS: booking replay control-flow guard and API validation fixture contract');
