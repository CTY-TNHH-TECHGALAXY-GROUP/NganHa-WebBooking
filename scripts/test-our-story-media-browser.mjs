import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3321';
const parsedBase = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(parsedBase.hostname)) {
  throw new Error('This regression test only accepts a loopback TEST_BASE_URL');
}

const outputPath = path.resolve(
  process.env.OUR_STORY_MEDIA_REPORT || 'plans/pagespeed-remediation-20260913/remaining/agent-a/our-story-browser-report.json',
);
const transparentImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADUlEQVR4nGNgYGBgAAAABQABpfZFQAAAAABJRU5ErkJggg==';

const snapshot = page => page.evaluate(() => {
  const viewport = { width: window.innerWidth, height: window.innerHeight };
  const images = [...document.querySelectorAll('img[data-media-state]')].map((image, index) => {
    const rect = image.getBoundingClientRect();
    const source = image.parentElement?.querySelector('source');
    const isVisible = rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width;
    const isWithinRootMargin = rect.bottom > -200 && rect.top < viewport.height + 200
      && rect.right > 0 && rect.left < viewport.width;
    return {
      index,
      alt: image.alt,
      src: image.getAttribute('src') || '',
      currentSrc: image.currentSrc,
      sourceSrcSet: source?.getAttribute('srcset') || null,
      state: image.dataset.mediaState,
      ariaBusy: image.getAttribute('aria-busy'),
      naturalWidth: image.naturalWidth,
      complete: image.complete,
      box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      isVisible,
      isWithinRootMargin,
    };
  });
  return { viewport, images };
});

const isRealSource = image => image.src !== transparentImage && !image.src.startsWith('data:image/gif');
const assertDeferredOutsideMargin = (phase) => {
  const far = phase.images.filter(image => !image.isWithinRootMargin);
  assert.ok(far.length > 0, 'fixture needs at least one Our Story slot outside the +200px margin');
  assert.ok(far.every(image => !isRealSource(image) && !image.sourceSrcSet), 'outside-margin slots must not expose a real URL or srcset');
};
const assertDecodedVisible = (phase) => {
  const visible = phase.images.filter(image => image.isVisible);
  assert.ok(visible.length > 0, 'fixture needs a visible Our Story media slot');
  assert.ok(visible.every(image => isRealSource(image)
    && image.naturalWidth > 0
    && image.state === 'loaded'
    && image.ariaBusy === 'false'), 'visible slots must decode and finish aria-busy');
};

const scrollToSelector = async (page, selector) => {
  await page.waitForFunction((value) => Boolean(document.querySelector(value)), selector, { timeout: 15_000 });
  const found = await page.evaluate((value) => {
    const target = document.querySelector(value);
    if (!(target instanceof HTMLElement)) return false;
    target.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
    return true;
  }, selector);
  assert.equal(found, true, `${selector} must be a real production DOM target`);
};

const runBrowserPass = async ({ disableIntersectionObserver = false } = {}) => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    serviceWorkers: 'block',
  });
  if (disableIntersectionObserver) {
    await context.addInitScript(() => {
      Object.defineProperty(window, 'IntersectionObserver', { configurable: true, value: undefined });
    });
  }
  const page = await context.newPage();
  const requests = [];
  page.on('request', request => {
    if (request.resourceType() === 'image') requests.push(request.url());
  });

  try {
    const response = await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    assert.equal(response.status(), 200, 'homepage must return HTTP 200');
    assert.equal(new URL(response.url()).pathname, '/', 'homepage must finish on the expected URL');
    await scrollToSelector(page, '#our-story');
    await page.waitForTimeout(700);
    const before = await snapshot(page);

    if (!disableIntersectionObserver) assertDeferredOutsideMargin(before);

    // The section reserves a long editorial layout; its top can be visible
    // while the first image is still far below the fold. Scroll an actual
    // deferred media slot so decode and +200px eligibility are measured at
    // the requested geometry rather than inferred from the section anchor.
    const mediaSlot = await page.evaluate(() => {
      const target = document.querySelector('img[data-media-state]');
      if (!(target instanceof HTMLElement)) {
        return { found: false, mediaCount: document.querySelectorAll('img[data-media-state]').length };
      }
      target.scrollIntoView({ behavior: 'auto', block: 'start', inline: 'nearest' });
      return { found: true, mediaCount: document.querySelectorAll('img[data-media-state]').length };
    });
    assert.equal(
      mediaSlot.found,
      true,
      `Our Story must expose a deferred media slot in the production DOM (mediaCount=${mediaSlot.mediaCount}, url=${await page.url()})`,
    );
    await page.waitForFunction(() => {
      const imgs = [...document.querySelectorAll('img[data-media-state]')].filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.bottom > 0 && rect.top < window.innerHeight && rect.right > 0 && rect.left < window.innerWidth;
      });
      return imgs.length > 0 && imgs.every(img => img.dataset.mediaState === 'loaded' && img.getAttribute('aria-busy') === 'false');
    }, undefined, { timeout: 15000 });
    await page.waitForTimeout(500);
    const storyVisible = await snapshot(page);
    assertDecodedVisible(storyVisible);

    await scrollToSelector(page, '#film-strip-reel');
    await page.waitForTimeout(700);
    const filmBefore = await snapshot(page);
    const filmBeforeLoaded = filmBefore.images.filter(image => image.alt && image.state === 'loaded').map(image => image.index);
    await page.evaluate(() => {
      const scroller = document.querySelector('[class*="_journeyScroller__"]');
      if (scroller instanceof HTMLElement) scroller.scrollLeft = scroller.scrollWidth;
    });
    await page.waitForTimeout(850);
    const filmAfterFastScroll = await snapshot(page);
    await page.evaluate(() => {
      const scroller = document.querySelector('[class*="_journeyScroller__"]');
      if (scroller instanceof HTMLElement) scroller.scrollLeft = 0;
    });
    await page.waitForTimeout(650);
    const filmAfterReturn = await snapshot(page);
    const filmAfterLoaded = filmAfterFastScroll.images.filter(image => image.alt && image.state === 'loaded').map(image => image.index);
    assert.ok(filmAfterLoaded.length >= filmBeforeLoaded.length, 'horizontal film-strip scroll must not discard loaded slots');
    assert.ok(
      filmAfterReturn.images
        .filter(image => filmBeforeLoaded.includes(image.index))
        .every(image => image.state === 'loaded' && image.ariaBusy === 'false'),
      'returning across the film strip must not reset previously decoded slots',
    );

    if (disableIntersectionObserver) {
      assert.ok(before.images.every(image => isRealSource(image)), 'without IntersectionObserver all reserved slots use the original source fallback');
      assert.ok(storyVisible.images.every(image => image.state === 'loaded' || image.state === 'error'), 'IO fallback must always settle aria-busy state');
    }

    return {
      status: response.status(),
      finalUrl: response.url(),
      viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
      disableIntersectionObserver,
      before,
      storyVisible,
      filmBefore,
      filmAfterFastScroll,
      filmAfterReturn,
      imageRequests: [...new Set(requests)],
    };
  } finally {
    await context.close();
    await browser.close();
  }
};

const result = {
  baseUrl,
  runs: [
    await runBrowserPass(),
    await runBrowserPass(),
    await runBrowserPass(),
    await runBrowserPass({ disableIntersectionObserver: true }),
  ],
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, runCount: result.runs.length, imageRequestCounts: result.runs.map(run => run.imageRequests.length) }, null, 2));
