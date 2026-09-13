import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3312';
const parsedBase = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(parsedBase.hostname)) {
  throw new Error('This evidence test only accepts a loopback TEST_BASE_URL');
}

const evidenceDir = path.resolve('plans/pagespeed-remediation-20260913/remaining/agent-d');
const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
const routes = ['/', '/history', '/vi', '/en'];
const viewports = [
  { name: 'mobile', width: 390, height: 844, deviceScaleFactor: 2 },
  { name: 'desktop', width: 1440, height: 900, deviceScaleFactor: 1 },
];

const browser = await chromium.launch({ headless: true });
const rawAxe = [];
const manualChecks = [];

try {
  for (const viewport of viewports) {
    const context = await browser.newContext(viewport, { locale: 'en-US' });
    const page = await context.newPage();
    for (const route of routes) {
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1400);
      await page.addScriptTag({ path: axePath });
      const axe = await page.evaluate(async () => {
        const result = await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
        });
        return {
          violations: result.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
          incomplete: result.incomplete.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
          passes: result.passes.length,
        };
      });
      const state = await page.evaluate(() => {
        const viewportMeta = document.querySelector('meta[name="viewport"]');
        const logos = [...document.querySelectorAll('[role="img"][aria-label]')].map(node => ({
          label: node.getAttribute('aria-label'),
          svgHidden: node.querySelector('svg')?.getAttribute('aria-hidden') || null,
        }));
        const copyright = document.querySelector('footer p');
        const footer = document.querySelector('footer');
        const copyrightStyle = copyright ? getComputedStyle(copyright) : null;
        const footerStyle = footer ? getComputedStyle(footer) : null;
        const journey = document.querySelector('[class*="_journeyScroller__"]');
        return {
          viewportMeta: viewportMeta?.getAttribute('content') || null,
          logoCount: logos.length,
          logos,
          copyright: copyrightStyle ? {
            color: copyrightStyle.color,
            opacity: copyrightStyle.opacity,
            background: footerStyle?.backgroundColor || null,
          } : null,
          journey: journey ? {
            role: journey.getAttribute('role'),
            tabIndex: journey.tabIndex,
            label: journey.getAttribute('aria-label'),
          } : null,
          activeElement: document.activeElement?.tagName || null,
        };
      });
      rawAxe.push({ viewport: viewport.name, width: viewport.width, route, status: response.status(), errors, axe, state });
      page.removeAllListeners('pageerror');
    }

    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(1000);
    const zoomBefore = await page.evaluate(() => ({ innerWidth, visualScale: window.visualViewport?.scale || null }));
    let zoomKey = 'unsupported';
    try {
      await page.keyboard.press('Control+Plus');
      zoomKey = 'Control+Plus';
    } catch {
      // Headless Chromium can omit browser chrome zoom; the viewport contract is still recorded below.
    }
    await page.waitForTimeout(200);
    const zoomAfter = await page.evaluate(() => ({ innerWidth, visualScale: window.visualViewport?.scale || null }));
    const tabStates = [];
    for (let index = 0; index < 8; index += 1) {
      await page.keyboard.press('Tab');
      tabStates.push(await page.evaluate(() => ({
        tag: document.activeElement?.tagName || null,
        role: document.activeElement?.getAttribute('role') || null,
        label: document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent?.trim().slice(0, 80) || null,
      })));
    }
    manualChecks.push({
      viewport: viewport.name,
      route: '/',
      zoom: { key: zoomKey, before: zoomBefore, after: zoomAfter },
      tabStates,
      viewportContract: await page.locator('meta[name="viewport"]').getAttribute('content'),
    });
    await context.close();
  }
} finally {
  await browser.close();
}

await mkdir(evidenceDir, { recursive: true });
await writeFile(path.join(evidenceDir, 'raw-axe-after.json'), `${JSON.stringify(rawAxe, null, 2)}\n`);
await writeFile(path.join(evidenceDir, 'manual-zoom-keyboard.json'), `${JSON.stringify(manualChecks, null, 2)}\n`);
const failures = rawAxe.filter(item => item.status >= 400 || item.errors.length || item.axe.violations.length);
console.log(JSON.stringify({
  evidenceDir,
  cases: rawAxe.length,
  failures: failures.length,
  manualChecks: manualChecks.length,
  axeViolations: rawAxe.reduce((count, item) => count + item.axe.violations.length, 0),
}, null, 2));
if (failures.length) process.exitCode = 1;
