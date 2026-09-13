import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.TEST_BASE_URL || 'http://127.0.0.1:3312';
const parsedBase = new URL(baseUrl);
if (!['127.0.0.1', 'localhost'].includes(parsedBase.hostname)) {
  throw new Error('This regression test only accepts a loopback TEST_BASE_URL');
}

const outputPath = path.resolve(
  process.env.HISTORY_MEDIA_REPORT || 'plans/pagespeed-remediation-20260913/history-media-gating-report.json',
);
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const page = await context.newPage();
const requests = [];
page.on('request', request => {
  if (/\/storage\/v1\/object\/public\/media-uploads\/history\/.*-w\d+\.webp(?:\?|$)/.test(request.url())) {
    requests.push(request.url());
  }
});

const readStage = () => page.evaluate(() => [...document.querySelectorAll('[data-history-chapter]')].map(article => {
  const slides = [...article.querySelectorAll('[class*="_slide__"]')];
  const activeIndex = slides.findIndex(slide => slide.className.includes('_slideActive__'));
  const sourceIndices = slides
    .map((slide, index) => slide.querySelector('source') ? index : -1)
    .filter(index => index >= 0);
  const nextIndex = slides.length ? (activeIndex + 1) % slides.length : -1;
  return {
    chapter: article.getAttribute('data-history-index'),
    activeIndex,
    sourceIndices,
    eligible: sourceIndices.every(index => index === activeIndex || index === nextIndex),
    stageImages: slides.map(slide => {
      const image = slide.querySelector('img');
      return image ? { src: image.src, currentSrc: image.currentSrc, loading: image.loading } : null;
    }),
  };
}));

try {
  const response = await page.goto(`${baseUrl}/history`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(1600);
  const before = await readStage();
  const thumbBefore = await page.evaluate(() => [...document.querySelectorAll('[class*="_sceneThumb__"] img')].map(image => ({
    src: image.src,
    currentSrc: image.currentSrc,
    loading: image.loading,
  })));

  const farThumb = page.locator('[data-history-chapter]').last().locator('[class*="_sceneThumb__"] img').first();
  await farThumb.scrollIntoViewIfNeeded();
  await page.waitForTimeout(2200);
  const after = await readStage();
  const thumbAfter = await farThumb.evaluate(image => ({
    src: image.src,
    currentSrc: image.currentSrc,
    naturalWidth: image.naturalWidth,
    loading: image.loading,
    complete: image.complete,
  }));

  const result = {
    baseUrl,
    route: '/history',
    viewport: { width: 390, height: 844, deviceScaleFactor: 2 },
    status: response.status(),
    before,
    after,
    thumbBefore,
    thumbAfter,
    historyRequests: [...new Set(requests)],
    assertions: {
      everyStageSourceIsActiveOrNextBeforeScroll: before.every(chapter => chapter.eligible),
      everyStageSourceIsActiveOrNextAfterScroll: after.every(chapter => chapter.eligible),
      inactiveStageImagesStayPlaceholders: [...before, ...after].every(chapter => {
        const eligible = new Set(chapter.sourceIndices);
        return chapter.stageImages.every((image, index) => eligible.has(index)
          ? !image.src.startsWith('data:image/gif')
          : image.src.startsWith('data:image/gif'));
      }),
      thumbnailsAreLazy: thumbBefore.every(image => image.loading === 'lazy'),
      thumbnailUsesSmallCandidate: /-w320\.webp(?:\?|$)/.test(thumbAfter.currentSrc) && thumbAfter.naturalWidth > 0,
      stageUsesLargerCandidate: after.some(chapter => chapter.stageImages.some(image => image?.currentSrc.includes('-w960.webp'))),
    },
  };
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    outputPath,
    status: result.status,
    assertions: result.assertions,
    requestCount: result.historyRequests.length,
  }, null, 2));
  if (Object.values(result.assertions).some(value => !value)) process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
