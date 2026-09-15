import assert from 'node:assert/strict';
import fs from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.MENU_FOCUS_BASE_URL || 'http://127.0.0.1:3388';
const evidencePath = process.env.MENU_FOCUS_EVIDENCE;
const profiles = [
  { name: 'mobile-390-dpr2', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: 'desktop-1440-dpr1', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
];

const waitForVisible = async (locator, visible) => {
  if (visible) await locator.waitFor({ state: 'visible', timeout: 3000 });
  else await locator.waitFor({ state: 'hidden', timeout: 3000 });
};

const browser = await chromium.launch({ headless: true });
const runs = [];
try {
  for (const profile of profiles) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.deviceScaleFactor,
      locale: 'en-US',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    const run = { profile: profile.name, homepage: null, headerMenu: {}, contactMenu: {} };
    try {
      const response = await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      run.homepage = response?.status() || null;
      assert.equal(run.homepage, 200);
      run.environment = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        innerHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      }));
      assert.equal(run.environment.innerWidth, profile.viewport.width);
      assert.equal(run.environment.innerHeight, profile.viewport.height);
      assert.equal(run.environment.devicePixelRatio, profile.deviceScaleFactor);

      const menuTrigger = page.getByRole('button', { name: 'Toggle menu' }).first();
      const menuOverlay = page.locator('nav.nav-fullscreen-overlay').first();
      const menuClose = page.getByRole('button', { name: 'Close menu' }).first();
      await menuTrigger.click();
      await waitForVisible(menuOverlay, true);
      await menuClose.waitFor({ state: 'visible', timeout: 3000 });
      run.headerMenu.openFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
      assert.equal(run.headerMenu.openFocus, 'Close menu');
      await page.keyboard.press('Escape');
      await waitForVisible(menuOverlay, false);
      run.headerMenu.escapeClosed = true;
      run.headerMenu.escapeFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
      assert.equal(run.headerMenu.escapeFocus, 'Toggle menu');

      const contactTrigger = page.getByRole('button', { name: 'Contact Us' }).first();
      const contactMenu = page.locator('#floating-contact-menu').first();
      await contactTrigger.click();
      await waitForVisible(contactMenu, true);
      await page.keyboard.press('Escape');
      await waitForVisible(contactMenu, false);
      run.contactMenu.escapeClosed = true;
      run.contactMenu.escapeFocus = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
      assert.equal(run.contactMenu.escapeFocus, 'Contact Us');
      run.status = 'PASS';
    } catch (error) {
      run.status = 'FAIL';
      run.error = error instanceof Error ? error.message : String(error);
    } finally {
      runs.push(run);
      await context.close();
    }
  }
} finally {
  await browser.close();
}

const report = {
  testedSha: process.env.MENU_FOCUS_TESTED_SHA || 'unknown',
  baseUrl,
  profiles: runs,
  status: runs.every((run) => run.status === 'PASS') ? 'PASS' : 'FAIL',
};
if (evidencePath) fs.writeFileSync(evidencePath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'PASS') process.exitCode = 1;
