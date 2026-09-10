const { chromium } = require('playwright');
const fs = require('node:fs');
const out = 'plans/video-loading-20260910';
(async () => {
  const browser = await chromium.launch();
  const results = [];
  try {
    for (const scenario of [
      { name: 'desktop', path: '/', width: 1440, height: 900 },
      { name: 'mobile-vi', path: '/vi', width: 390, height: 844 },
      { name: 'video-error', path: '/', width: 1440, height: 900, fail: true },
    ]) {
      const page = await browser.newPage({ viewport: scenario });
      const errors = [], media = [], config = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('request', r => {
        if (/\.mp4/i.test(r.url())) media.push(r.url());
        if (r.url().includes('/api/hero-videos')) config.push(r.url());
      });
      if (scenario.fail) await page.route(/\.mp4/i, r => r.abort());
      const response = await page.goto('http://localhost:3123' + scenario.path, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(18000);
      const state = await page.evaluate(() => ({
        title: document.title,
        loader: document.querySelector('.hero-video-loading-screen')?.textContent,
        videos: [...document.querySelectorAll('#hero video')].map(v => ({ src: v.currentSrc, readyState: v.readyState, time: v.currentTime, paused: v.paused })),
        overflow: document.documentElement.scrollWidth > innerWidth,
        text: document.body.innerText.slice(0, 300),
      }));
      await page.screenshot({ path: `${out}/${scenario.name}.png` });
      if (scenario.fail) {
        await page.unroute(/\.mp4/i);
        await page.locator('.hero-video-loading-screen button').click();
        await page.waitForFunction(() => {
          const v = document.querySelector('#hero video');
          return v && v.currentTime > 0 && !document.querySelector('.hero-video-loading-screen');
        }, { timeout: 20000 });
        state.retryRecovered = true;
      }
      results.push({ name: scenario.name, status: response.status(), errors, media, config, state });
      await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(`${out}/browser-results.json`, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
