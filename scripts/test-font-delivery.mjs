import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3312';
const parsed = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(parsed.hostname)) {
  throw new Error('Font evidence only accepts a loopback TEST_BASE_URL');
}

const evidenceDir = path.resolve('plans/pagespeed-remediation-20260913/remaining/agent-d');
const testedSha = process.env.TEST_SHA || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const locales = [
  ['vi', 'vi-VN', 'Tiếng Việt Đặng Á'],
  ['en', 'en-US', 'English Typography'],
  ['cn', 'zh-CN', '中文汉字'],
  ['jp', 'ja-JP', '日本語'],
  ['kr', 'ko-KR', '한국어'],
];

const browser = await chromium.launch({ headless: true });
const rows = [];

for (const [locale, browserLocale, sample] of locales) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    locale: browserLocale,
  });
  await context.addInitScript(() => {
    window.__fontAudit = { layoutShifts: [] };
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__fontAudit.layoutShifts.push({ value: entry.value, startTime: entry.startTime });
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch { /* browser does not expose layout-shift */ }
    }
  });
  const page = await context.newPage();
  const startedAt = new Date().toISOString();
  const response = await page.goto(`${baseUrl}/${locale}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  const before = await page.evaluate(() => ({
    innerWidth,
    innerHeight,
    dpr: devicePixelRatio,
    lang: document.documentElement.lang,
    status: document.fonts.status,
    faces: [...document.fonts].map((face) => ({ family: face.family, weight: face.weight, style: face.style, status: face.status })),
  }));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  const after = await page.evaluate((text) => {
    const span = document.createElement('span');
    span.textContent = text;
    span.style.cssText = 'position:fixed;left:-10000px;white-space:nowrap;font:700 32px "Playfair Display",serif';
    document.body.append(span);
    const faces = [...document.fonts].map((face) => ({ family: face.family, weight: face.weight, style: face.style, status: face.status }));
    const resources = performance.getEntriesByType('resource').map((entry) => entry.name).filter((name) => /\.(?:woff2?|ttf|otf)(?:\?|$)/i.test(name));
    const result = {
      status: document.fonts.status,
      faces,
      checks: {
        playfair400: document.fonts.check('400 32px "Playfair Display"'),
        playfair700: document.fonts.check('700 32px "Playfair Display"'),
        inter400: document.fonts.check('400 16px Inter'),
        cinzel700: document.fonts.check('700 32px Cinzel'),
      },
      sampleWidth: span.getBoundingClientRect().width,
      resources,
      layoutShifts: window.__fontAudit?.layoutShifts || [],
    };
    span.remove();
    return result;
  }, sample);
  const requestCounts = after.resources.reduce((counts, url) => {
    counts[url] = (counts[url] || 0) + 1;
    return counts;
  }, {});
  rows.push({
    locale,
    browserLocale,
    route: `/${locale}`,
    startedAt,
    responseStatus: response.status(),
    viewport: { width: before.innerWidth, height: before.innerHeight, deviceScaleFactor: before.dpr },
    htmlLang: before.lang,
    before,
    after: { ...after, cls: after.layoutShifts.reduce((sum, entry) => sum + entry.value, 0) },
    fontResourceCounts: requestCounts,
    duplicateFontUrls: Object.entries(requestCounts).filter(([, count]) => count > 1).map(([url, count]) => ({ url, count })),
    licenseDisposition: 'NOT_VERIFIED — repository has no machine-readable license reference for remote Google font responses or public/fonts assets',
  });
  await context.close();
}

await mkdir(evidenceDir, { recursive: true });
const output = {
  testedSha,
  server: baseUrl,
  browser: `Chromium ${await browser.version()}`,
  timestamp: new Date().toISOString(),
  profile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, cache: 'new context per locale', waitAfterFontsReadyMs: 300 },
  rows,
  dispositions: {
    fouc: 'NOT_VERIFIED — this lab run records font status before/after DOM readiness but does not replace a visual first-paint capture',
    cls: 'Measured from PerformanceObserver layout-shift entries; this is lab evidence, not field p75',
    pinch: 'NOT_VERIFIED — no physical iOS/Android device was available',
    zoom200: 'NOT_VERIFIED — browser zoom requires real browser/device verification',
    zoom500: 'NOT_VERIFIED — browser zoom requires real browser/device verification',
  },
};
await writeFile(path.join(evidenceDir, 'font-matrix-scripted-20260915.json'), `${JSON.stringify(output, null, 2)}\n`);
await browser.close();
console.log(JSON.stringify({
  testedSha,
  locales: rows.length,
  statuses: rows.map((row) => row.responseStatus),
  dimensions: rows.map((row) => row.viewport),
  duplicateUrls: rows.flatMap((row) => row.duplicateFontUrls).length,
  cls: rows.map((row) => ({ locale: row.locale, value: row.after.cls })),
}, null, 2));
