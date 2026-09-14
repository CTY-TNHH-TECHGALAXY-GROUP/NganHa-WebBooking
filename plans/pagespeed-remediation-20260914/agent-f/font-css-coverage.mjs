import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const baseUrl = process.env.FONT_COVERAGE_BASE_URL || 'https://oria-spa.vercel.app';
const output = process.env.FONT_COVERAGE_OUTPUT || '/private/tmp/font-css-coverage.json';
const routes = [
  '/', '/vi', '/vi/new-user/standard/menu', '/vi/new-user/standard/checkout',
  '/booking', '/history', '/en/new-user/standard/menu', '/cn/new-user/standard/menu',
];
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 900 },
];
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function measure(browser, route, viewport) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  await context.addInitScript(() => {
    window.__fontCoverage = { cls: 0 };
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) window.__fontCoverage.cls += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await context.newPage();
  const requests = [];
  const responses = [];
  const capture = (url, type) => type === 'font' || url.includes('fonts.googleapis.com') || url.includes('.woff');
  page.on('request', (request) => {
    if (capture(request.url(), request.resourceType())) requests.push({ type: request.resourceType(), url: request.url() });
  });
  page.on('response', (response) => {
    if (capture(response.url(), response.request().resourceType())) responses.push({ type: response.request().resourceType(), url: response.url(), status: response.status(), headers: response.headers() });
  });
  await page.coverage.startCSSCoverage();
  const response = await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(2000);
  const css = await page.coverage.stopCSSCoverage();
  const result = await page.evaluate(() => ({
    title: document.title,
    luxuryCount: document.querySelectorAll('.font-luxury').length,
    fontFaces: Array.from(document.fonts).map((font) => ({ family: font.family, weight: font.weight, status: font.status })),
    stylesheets: Array.from(document.styleSheets).map((sheet) => sheet.href).filter(Boolean),
    cls: window.__fontCoverage.cls,
    readyState: document.readyState,
  }));
  await context.close();
  return {
    route, viewport, httpStatus: response?.status() ?? null, requests, responses,
    cssCoverage: css.map((entry) => ({ url: entry.url, total: entry.text?.length ?? 0, used: (entry.ranges || []).reduce((sum, range) => sum + range.end - range.start, 0) })),
    ...result,
  };
}

const browser = await chromium.launch({ headless: true });
const measurements = [];
try {
  for (const viewport of viewports) {
    for (const route of routes) {
      try {
        measurements.push(await measure(browser, route, viewport));
        console.log(`measured ${viewport.name} ${route}`);
      } catch (error) {
        measurements.push({ route, viewport, error: String(error) });
        console.error(`failed ${viewport.name} ${route}: ${error}`);
      }
    }
  }
} finally {
  await browser.close();
}
fs.mkdirSync(new URL('.', `file://${output}`).pathname, { recursive: true });
fs.writeFileSync(output, JSON.stringify({ baseUrl, measurements }, null, 2));
console.log(`wrote ${output}`);
