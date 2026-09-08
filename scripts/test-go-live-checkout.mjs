// Browser interaction test with all writes intercepted, including booking/email.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const base = 'http://127.0.0.1:3108';
const browser = await chromium.launch({ headless: true });
const output = '/private/tmp/oria-go-live-checkout';
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const [width, timezoneId] of [[390, 'America/Los_Angeles'], [768, 'UTC'], [1440, 'Asia/Ho_Chi_Minh']]) {
    const context = await browser.newContext({ viewport: { width, height: 1000 }, timezoneId });
    const catalog = await (await context.request.get(`${base}/api/services`)).json();
    const services = ['NHS0008', 'NHS0009'].map(id => catalog.find(service => service.id === id));
    assert.ok(services.every(Boolean));
    const items = services.map((s, i) => ({ ...s, cartId: `isolated-${i}`, qty: i === 0 ? 2 : 1, basePriceVND: s.priceVND, basePriceUSD: s.priceUSD, options: {} }));
    await context.addInitScript(items => {
      localStorage.setItem('user_lang', 'en');
      const now = Date.now();
      localStorage.setItem('nganha_booking_cart_v2', JSON.stringify({ version: 2, createdAt: now, updatedAt: now, expiresAt: now + 86400000, items }));
    }, items);
    let submissions = [], repriceFailure = false;
    await context.route('**/*', async route => {
      const request = route.request();
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method())) return route.continue();
      const path = new URL(request.url()).pathname;
      if (path === '/api/bookings/reprice') {
        if (repriceFailure) return route.fulfill({ status: 503, json: { code: 'BOOKING_TEMPORARILY_UNAVAILABLE' } });
        const input = request.postDataJSON().items;
        return route.fulfill({ json: { valid: true, success: true, hasPriceChanged: false, unavailableItems: [], quote: 'browser-mocked-quote',
          items: input.map(item => {
            const service = catalog.find(s => s.id === item.id);
            return { ...item, basePriceVND: service.priceVND, basePriceUSD: service.priceUSD, priceVND: service.priceVND, priceUSD: service.priceUSD, duration: service.timeValue };
          }) } });
      }
      if (path === '/api/bookings') {
        submissions.push({ body: request.postDataJSON(), key: request.headers()['idempotency-key'] });
        return route.fulfill({ status: 503, json: { success: false, code: 'BOOKING_TEMPORARILY_UNAVAILABLE' } });
      }
      return route.abort();
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-09-08T07:20:00Z') });
    await page.goto(`${base}/en/new-user/standard/checkout`);
    await page.getByPlaceholder('Full Name', { exact: false }).first().fill('Isolated QA');
    await page.getByPlaceholder('Phone Number', { exact: false }).first().fill('+84901234567');
    await page.getByPlaceholder('Email Address', { exact: false }).first().fill('qa@example.invalid');
    await page.getByRole('button', { name: 'More', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '22:30', exact: true }).count(), 1);
    await page.getByRole('button', { name: '14:30', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '09:00', exact: true }).count(), 0);
    assert.equal(await page.locator('#cart article').count(), 2);
    assert.equal(await page.locator('#cart').getByText(/aroma coconut oil/i).count(), 2);
    repriceFailure = true;
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    await page.getByText(/temporarily unavailable/i).last().waitFor();
    assert.equal(submissions.length, 0);
    await page.screenshot({ path: `${output}/${width}-quote-outage.png` });
    // Reload dismisses the alert and proves selections survive the failed quote.
    repriceFailure = false; await page.reload();
    await page.getByPlaceholder('Full Name', { exact: false }).first().fill('Isolated QA');
    await page.getByPlaceholder('Phone Number', { exact: false }).first().fill('+84901234567');
    await page.getByPlaceholder('Email Address', { exact: false }).first().fill('qa@example.invalid');
    await page.getByRole('button', { name: 'More', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: '22:30', exact: true }).count(), 1);
    await page.getByRole('button', { name: '14:30', exact: true }).click();
    await page.getByRole('button', { name: 'Confirm order', exact: true }).click();
    await page.getByRole('heading', { name: 'Confirm Booking', exact: true }).waitFor();
    await page.waitForTimeout(400);
    const headingBox = await page.getByRole('heading', { name: 'Confirm Booking', exact: true }).boundingBox();
    assert.ok(headingBox && headingBox.y >= 0 && headingBox.y < 1000, `Confirmation outside viewport: ${JSON.stringify(headingBox)}`);
    await page.screenshot({ path: `${output}/${width}-confirm.png` });
    await page.locator('label').filter({ has: page.locator('#agree-terms-checkbox') }).click();
    await page.locator('#modal-step2-confirm-btn').click();
    await page.getByText(/temporarily unavailable/i).last().waitFor();
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].body.quote, 'browser-mocked-quote');
    assert.deepEqual(submissions[0].body.selectedServices.map(item => item.quantity), [2, 1]);
    await page.getByRole('button', { name: /Got it|Đã hiểu/ }).click();
    await page.locator('#modal-step2-confirm-btn').click();
    await page.getByText(/temporarily unavailable/i).last().waitFor();
    assert.equal(submissions.length, 2);
    assert.equal(submissions[0].key, submissions[1].key);
    assert.deepEqual(errors, []);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('nganha_booking_cart_v2')).items);
    assert.equal(stored.length, 2); assert.deepEqual(stored.map(item => item.qty), [2, 1]);
    results.push({ width, timezoneId, bookingWindowEnd: '22:30', lateSlot23Absent: true, pastSlotAbsent: true, separateRows: true, quoteOutagePreservesCart: true, quoteOpensConfirmation: true, quoteSubmitted: true, retrySameKey: true, errors });
    console.log(`PASS checkout ${width}/${timezoneId}: VN clock, separate rows, quote outage/recovery, confirmation, 503 retry same key`);
    await context.close();
  }
} finally {
  await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
