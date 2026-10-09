const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const base = process.env.FIRST_PAINT_BASE_URL || 'http://127.0.0.1:3017';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
    for (const path of ['/', '/en', '/cn', '/jp', '/kr']) {
      const page = await context.newPage();
      let weatherCalls = 0;
      page.on('request', request => { if (request.url().includes('/api/weather/spa')) weatherCalls++; });
      await page.goto(base + path, { waitUntil: 'load' });
      const weather = page.locator('[data-weather-status]');
      await weather.waitFor({ state: 'visible' });
      assert.equal(weatherCalls, 0, 'Weather must be present without client API requests');
      assert(await page.locator('[data-testid="hero-poster"]').isVisible());
      assert.equal(await page.locator('[class*="splashContainer"]').count(), 0);
      assert.equal(await page.locator('.hero-content').evaluate(element => getComputedStyle(element).opacity), '1');
      assert.equal(await page.locator('video').count(), 0, 'Do not attach a rendition before client source selection');
      console.log(path, 'server HTML: weather, poster and hero content visible without JavaScript');
      await page.close();
    }
    const otherPage = await context.newPage();
    await otherPage.goto(base + '/oriahome', { waitUntil: 'domcontentloaded' });
    assert.equal(await otherPage.locator('[class*="splashContainer"]').count(), 1, 'Preserve splash on other public pages');
    await context.close();
    for (const width of [390, 1440]) {
      const hydrated = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await hydrated.newPage();
      const sources = new Set();
      const errors = [];
      page.on('request', request => { if (/hero.*\.mp4/.test(request.url())) sources.add(request.url()); });
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base + '/en', { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => {
        const video = document.querySelector('[data-testid="hero-video"]');
        return video && video.readyState >= 2;
      }, { timeout: 45000 });
      assert.equal(sources.size, 1, 'Exactly one hero rendition must download');
      assert.equal(await page.locator('[data-testid="hero-video"]').count(), 1);
      const source = [...sources][0];
      assert(source.includes(width < 621 ? 'mobile' : 'desktop'), source);
      assert.deepEqual(errors, []);
      assert(await page.locator('[data-weather-status]').isVisible());
      console.log(width, 'hydration: weather visible, one correct video rendition, no page errors');
      await hydrated.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
