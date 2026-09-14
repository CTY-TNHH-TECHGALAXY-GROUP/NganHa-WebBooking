import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseUrl = process.env.HERO_TEST_BASE_URL || 'http://localhost:3137';
const viewport = { width: 390, height: 844 };
const mediaPattern = '**/*.mp4';
const posterPattern = '**/hero-spa-bg.jpg';

const failureCopy = /khong the tai|could not be loaded|无法加载|読み込めません|불러오지 못했습니다/i;
const playCopy = /Phat video|Play video|播放视频|動画を再生|영상 재생/i;

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function createPage(browser, configure) {
  const context = await browser.newContext({ viewport, serviceWorkers: 'block' });
  const page = await context.newPage();
  if (configure) await configure(page);
  return { context, page };
}

async function openHero(page) {
  const response = await page.goto(new URL('/', baseUrl).toString(), {
    waitUntil: 'domcontentloaded',
    timeout: 45_000,
  });
  assert.equal(response?.status(), 200, 'homepage must return HTTP 200');
  await page.getByTestId('hero-video').waitFor({ state: 'attached', timeout: 20_000 });
  await page.getByTestId('hero-poster').waitFor({ state: 'visible', timeout: 20_000 });
}

async function runScenario(browser, name, configure, test) {
  const { context, page } = await createPage(browser, configure);
  try {
    await test(page);
    console.log(`PASS ${name}`);
  } finally {
    await context.close();
  }
}

const browser = await chromium.launch({ headless: true });
try {
  await runScenario(browser, 'slow video keeps poster visible before first frame', async (page) => {
    await page.route(mediaPattern, async (route) => {
      await wait(4_000);
      await route.continue();
    });
  }, async (page) => {
    await openHero(page);
    const state = await page.getByTestId('hero-video-wrapper').evaluate((wrapper) => ({
      wrapperOpacity: getComputedStyle(wrapper).opacity,
      posterOpacity: getComputedStyle(document.querySelector('[data-testid="hero-poster"]')).opacity,
    }));
    assert.equal(state.wrapperOpacity, '0', 'slow video must stay behind the poster');
    assert.equal(state.posterOpacity, '1', 'poster must remain visible while video is slow');
  });

  await runScenario(browser, 'broken CMS poster falls back to local poster', async (page) => {
    await page.route(posterPattern, (route) => route.abort());
    await page.route(mediaPattern, async (route) => {
      await wait(4_000);
      await route.continue();
    });
  }, async (page) => {
    const fallbackResponsePromise = page.waitForResponse((response) => (
      response.url().endsWith('/images/hero-spa-poster.webp')
    ), { timeout: 20_000 });
    await openHero(page);
    const poster = page.getByTestId('hero-poster');
    await page.waitForFunction(() => (
      document.querySelector('[data-testid="hero-poster"]')?.getAttribute('src') === '/images/hero-spa-poster.webp'
    ), undefined, { timeout: 20_000 });
    const fallbackResponse = await fallbackResponsePromise;
    assert.equal(await poster.getAttribute('src'), '/images/hero-spa-poster.webp');
    assert.match(fallbackResponse.headers()['content-type'] || '', /^image\/webp(?:;|$)/i);
    const decoded = await poster.evaluate((image) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const context = canvas.getContext('2d');
      context?.drawImage(image, 0, 0, 1, 1);
      return {
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        pixel: context ? Array.from(context.getImageData(0, 0, 1, 1).data) : [],
      };
    });
    assert.equal(decoded.complete, true);
    assert.equal(decoded.naturalWidth, 640);
    assert.equal(decoded.naturalHeight, 640);
    assert.equal(decoded.pixel.length, 4);
    assert.ok(decoded.pixel.some((channel) => channel !== 0), 'fallback must decode to non-empty pixels');
    assert.equal(await poster.evaluate((image) => getComputedStyle(image).opacity), '1');
    assert.equal(await page.getByTestId('hero-video-wrapper').evaluate((wrapper) => getComputedStyle(wrapper).opacity), '0');
    assert.equal(await page.locator('.hero-video-loading-screen').count(), 0, 'poster fallback must keep Hero content usable');
  });

  await runScenario(browser, 'autoplay rejection exposes manual play action', async (page) => {
    await page.addInitScript(() => {
      const originalPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function playWithPolicy() {
        if (this instanceof HTMLVideoElement) {
          return Promise.reject(new DOMException('Autoplay denied by test', 'NotAllowedError'));
        }
        return originalPlay.call(this);
      };
    });
  }, async (page) => {
    await openHero(page);
    const manualPlay = page.getByRole('button', { name: playCopy });
    await manualPlay.waitFor({ state: 'visible', timeout: 20_000 });
    assert.match(await manualPlay.innerText(), playCopy);
    assert.ok(Number(await page.getByTestId('hero-poster').evaluate((image) => getComputedStyle(image).opacity)) > 0);
  });

  await runScenario(browser, 'video error keeps poster and exposes retry', async (page) => {
    await page.route(mediaPattern, (route) => route.abort());
  }, async (page) => {
    await openHero(page);
    const status = page.locator('[role="status"]').filter({ hasText: failureCopy });
    await status.waitFor({ state: 'visible', timeout: 20_000 });
    assert.ok(await page.getByRole('button', { name: /Thu lai|Try again|重试|再試行|다시 시도/i }).count());
    assert.equal(await page.getByTestId('hero-poster').evaluate((image) => getComputedStyle(image).opacity), '1');
  });

  await runScenario(browser, 'hidden document pauses playing video', undefined, async (page) => {
    await openHero(page);
    const video = page.getByTestId('hero-video');
    await page.waitForFunction(() => {
      const element = document.querySelector('[data-testid="hero-video"]');
      return element && element.readyState >= 2 && !element.paused;
    }, undefined, { timeout: 35_000 });
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => 'hidden',
      });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await page.waitForFunction(() => document.querySelector('[data-testid="hero-video"]')?.paused === true, undefined, { timeout: 5_000 });
    assert.equal(await video.evaluate((element) => element.paused), true);
  });
} finally {
  await browser.close();
}
