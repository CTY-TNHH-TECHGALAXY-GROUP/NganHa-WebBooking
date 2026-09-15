import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3344';
const parsedBase = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(parsedBase.hostname)) {
  throw new Error('This acceptance test only accepts a loopback TEST_BASE_URL');
}

const outputPath = path.resolve(
  process.env.OUR_STORY_AC_REPORT || 'plans/pagespeed-remediation-20260913/remaining/agent-ac/our-story-browser-ac-report.json',
);
const screenshotDirectory = path.resolve(
  process.env.OUR_STORY_AC_SCREENSHOTS || 'plans/pagespeed-remediation-20260913/remaining/agent-ac/screenshots',
);
const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
const profiles = [
  { name: 'mobile-cold-1', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: 'mobile-cold-2', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
  { name: 'desktop-cold', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  { name: 'mobile-intersection-observer-absent', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, disableIntersectionObserver: true },
];

const snapshot = page => page.evaluate(() => {
  const viewport = { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio };
  const images = [...document.querySelectorAll('#our-story img[data-media-state]')].map((image, index) => {
    const rect = image.getBoundingClientRect();
    const source = image.parentElement?.querySelector('source');
    return {
      index,
      src: image.getAttribute('src') || '',
      currentSrc: image.currentSrc,
      sourceSrcSet: source?.getAttribute('srcset') || null,
      state: image.dataset.mediaState,
      ariaBusy: image.getAttribute('aria-busy'),
      naturalWidth: image.naturalWidth,
      complete: image.complete,
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      visible: rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width,
      withinRootMargin: rect.bottom > -200 && rect.top < viewport.height + 200 && rect.right > 0 && rect.left < viewport.width,
    };
  });
  return { viewport, images, scrollY: window.scrollY };
});

const scrollFirstMedia = page => page.evaluate(() => {
  const target = document.querySelector('#our-story img[data-media-state]');
  if (!(target instanceof HTMLElement)) return false;
  target.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
  return true;
});

const runProfile = async profile => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    serviceWorkers: 'block',
  });
  if (profile.disableIntersectionObserver) {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
    });
  }
  const page = await context.newPage();
  const imageRequests = [];
  page.on('request', request => {
    if (request.resourceType() === 'image' && request.url().includes('/images/')) imageRequests.push(request.url());
  });

  try {
    const response = await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    assert.equal(response?.status(), 200, 'homepage must return HTTP 200');
    await page.waitForFunction(() => document.querySelectorAll('#our-story img[data-media-state]').length > 0, undefined, { timeout: 20_000 });
    await page.waitForTimeout(700);
    const before = await snapshot(page);
    assert.ok(before.images.length > 0, 'OurStory must expose media slots after hydration');

    const far = before.images.filter(image => !image.withinRootMargin);
    const deferredOutsideMargin = profile.disableIntersectionObserver || far.every(image => image.src === placeholder && !image.sourceSrcSet);
    assert.equal(deferredOutsideMargin, true, 'outside-margin slots must remain placeholders without a real src/srcset');

    assert.equal(await scrollFirstMedia(page), true, 'first OurStory slot must be a real DOM target');
    await page.waitForFunction(() => [...document.querySelectorAll('#our-story img[data-media-state]')]
      .some(image => {
        const rect = image.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && image.dataset.mediaState === 'loaded' && image.naturalWidth > 0;
      }), undefined, { timeout: 20_000 });
    const afterStoryScroll = await snapshot(page);
    const loadedVisible = afterStoryScroll.images.filter(image => image.visible && image.state === 'loaded');
    assert.ok(loadedVisible.length > 0, 'a visible OurStory slot must decode after scrolling to its actual box');
    assert.ok(loadedVisible.every(image => image.naturalWidth > 0 && image.ariaBusy === 'false'), 'decoded visible slots must settle aria-busy');

    if (profile.disableIntersectionObserver) {
      await page.waitForFunction(() => [...document.querySelectorAll('#our-story img[data-media-state]')]
        .every(image => image.dataset.mediaState === 'loaded' || image.dataset.mediaState === 'error'), undefined, { timeout: 60_000 });
    }

    const film = await page.evaluate(() => {
      const target = document.querySelector('#film-strip-reel');
      const scroller = document.querySelector('[class*="_journeyScroller__"]');
      if (!(target instanceof HTMLElement) || !(scroller instanceof HTMLElement)) return null;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
      return { beforeLoaded: [...document.querySelectorAll('#our-story img[data-media-state]')].filter(image => image.dataset.mediaState === 'loaded').length };
    });
    assert.ok(film, 'film-strip and its scroll container must exist in production DOM');
    await page.waitForTimeout(600);
    const filmBefore = await snapshot(page);
    await page.evaluate(() => {
      const scroller = document.querySelector('[class*="_journeyScroller__"]');
      if (scroller instanceof HTMLElement) scroller.scrollLeft = scroller.scrollWidth;
    });
    await page.waitForTimeout(900);
    const filmAfter = await snapshot(page);
    const loadedBefore = filmBefore.images.filter(image => image.state === 'loaded').length;
    const loadedAfter = filmAfter.images.filter(image => image.state === 'loaded').length;
    assert.ok(loadedAfter >= loadedBefore, 'horizontal film-strip scroll must not discard decoded media');

    if (profile.disableIntersectionObserver) {
      const afterFallbackSettle = await snapshot(page);
      assert.ok(afterFallbackSettle.images.every(image => image.src !== placeholder), 'IO fallback must expose original sources');
      assert.ok(afterFallbackSettle.images.every(image => image.state === 'loaded' || image.state === 'error'), 'IO fallback must settle every media state');
    }

    await mkdir(screenshotDirectory, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDirectory, `${profile.name}.png`), fullPage: false });
    return {
      name: profile.name,
      status: 'PASS',
      profile,
      before,
      afterStoryScroll,
      filmBefore,
      filmAfter,
      imageRequests: [...new Set(imageRequests)],
    };
  } finally {
    await context.close();
    await browser.close();
  }
};

const runs = [];
for (const profile of profiles) {
  try {
    runs.push(await runProfile(profile));
    console.log(`PASS ${profile.name}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    runs.push({ name: profile.name, status: 'FAIL', profile, error: message });
    console.error(`FAIL ${profile.name}: ${message}`);
  }
}

const report = {
  status: runs.every(run => run.status === 'PASS') ? 'PASS_LOCAL_BROWSER' : 'FAIL_LOCAL_BROWSER',
  generatedAt: new Date().toISOString(),
  testedSha: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: path.resolve(new URL('..', import.meta.url).pathname), encoding: 'utf8' }).trim(),
  baseUrl,
  runs,
  storageReadback: 'NOT_VERIFIED',
  liveTransfer: 'NOT_VERIFIED',
};
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, status: report.status, runStatuses: runs.map(run => `${run.name}:${run.status}`) }, null, 2));
if (report.status !== 'PASS_LOCAL_BROWSER') process.exitCode = 1;
