import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const baseUrl = process.env.FONT_COVERAGE_BASE_URL || 'https://oria-spa.vercel.app';
const routes = ['/vi/new-user/standard/menu', '/booking'];
const browser = await chromium.launch({ headless: true });
try {
  for (const route of routes) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const failures = [];
    const errors = [];
    page.on('requestfailed', (request) => failures.push({ url: request.url(), error: request.failure()?.errorText }));
    page.on('pageerror', (error) => errors.push(String(error)));
    await page.goto(new URL(route, baseUrl).toString(), { waitUntil: 'networkidle', timeout: 60000 });
    const category = page.locator('button').filter({ hasText: 'Chăm Sóc Cơ Thể' }).first();
    if (!(await category.count())) throw new Error(`category control not found on ${route}`);
    await category.click();
    await page.waitForTimeout(2000);
    const state = await page.locator('.font-luxury').evaluateAll((nodes) => nodes.slice(0, 5).map((node) => ({
      text: node.textContent?.trim(), family: getComputedStyle(node).fontFamily, weight: getComputedStyle(node).fontWeight,
    })));
    const ready = await page.evaluate(async () => {
      await document.fonts.load('700 16px Cinzel');
      return document.fonts.check('700 16px Cinzel');
    });
    console.log(JSON.stringify({ route, state, fontReady: ready, failures, errors }));
    await page.close();
  }
} finally {
  await browser.close();
}
