import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const mobilePath = resolve(process.env.HERO_MOBILE_PATH || '/private/tmp/nganha-hero-mobile-720-v2.mp4');
const desktopPath = resolve(process.env.HERO_DESKTOP_PATH || '/private/tmp/nganha-hero-desktop-1280.mp4');
const mobile = readFileSync(mobilePath);
const desktop = readFileSync(desktopPath);
const files = new Map([
  ['/hero-mobile-720.mp4', mobile],
  ['/hero-desktop-1280.mp4', desktop],
]);
const requestLog = [];

function serveRange(request, response, body) {
  const range = request.headers.range;
  if (!range) {
    response.writeHead(200, {
      'accept-ranges': 'bytes',
      'content-length': body.length,
      'content-type': 'video/mp4',
    });
    response.end(body);
    return;
  }
  const match = /^bytes=(\d+)-(\d*)$/.exec(range);
  if (!match) {
    response.writeHead(416, { 'content-range': `bytes */${body.length}` });
    response.end();
    return;
  }
  const start = Number(match[1]);
  const end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
  if (start >= body.length || end < start) {
    response.writeHead(416, { 'content-range': `bytes */${body.length}` });
    response.end();
    return;
  }
  const chunk = body.subarray(start, end + 1);
  response.writeHead(206, {
    'accept-ranges': 'bytes',
    'content-length': chunk.length,
    'content-range': `bytes ${start}-${end}/${body.length}`,
    'content-type': 'video/mp4',
  });
  response.end(chunk);
}

const server = createServer((request, response) => {
  const body = files.get(request.url?.split('?')[0] || '');
  if (!body) {
    response.writeHead(404);
    response.end();
    return;
  }
  requestLog.push({ path: request.url, range: request.headers.range || null });
  serveRange(request, response, body);
});
await new Promise((resolveServer) => server.listen(0, '127.0.0.1', resolveServer));
const address = server.address();
const origin = `http://127.0.0.1:${address.port}`;

const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const scenario of [
    { name: 'mobile', width: 390, expectedPath: '/hero-mobile-720.mp4', expectedDimensions: [720, 404] },
    { name: 'desktop', width: 1440, expectedPath: '/hero-desktop-1280.mp4', expectedDimensions: [1280, 720] },
  ]) {
    requestLog.length = 0;
    const context = await browser.newContext({ viewport: { width: scenario.width, height: 844 } });
    const page = await context.newPage();
    await page.setContent('<video id="hero-video" preload="none" muted playsinline></video>');
    const state = await page.evaluate(({ origin: pageOrigin }) => {
      const video = document.querySelector('#hero-video');
      const candidates = {
        url: `${pageOrigin}/hero-original.mp4`,
        mobile_url: `${pageOrigin}/hero-mobile-720.mp4`,
        desktop_url: `${pageOrigin}/hero-desktop-1280.mp4`,
      };
      const beforeLoad = {
        hasSrc: video.hasAttribute('src'),
        src: video.getAttribute('src'),
        readyState: video.readyState,
      };
      const fallback = candidates.url || candidates.media_url || null;
      const selected = window.innerWidth < 768
        ? candidates.mobile_url || candidates.desktop_url || fallback
        : candidates.desktop_url || candidates.mobile_url || fallback;
      video.src = selected;
      video.load();
      return { beforeLoad, selected, afterLoadSrc: video.getAttribute('src') };
    }, { origin });
    assert.equal(state.beforeLoad.hasSrc, false, `${scenario.name}: video had a source before selection`);
    assert.equal(state.beforeLoad.readyState, 0, `${scenario.name}: video was not pristine before selection`);
    assert.equal(new URL(state.selected).pathname, scenario.expectedPath);
    assert.equal(new URL(state.afterLoadSrc).pathname, scenario.expectedPath);
    await page.waitForFunction(() => document.querySelector('#hero-video')?.readyState >= 1, undefined, { timeout: 15000 });
    const decoded = await page.locator('#hero-video').evaluate((video) => ({
      readyState: video.readyState,
      width: video.videoWidth,
      height: video.videoHeight,
      duration: video.duration,
      currentSrc: video.currentSrc,
    }));
    const paths = requestLog.map((request) => request.path?.split('?')[0]);
    assert.deepEqual([...new Set(paths)], [scenario.expectedPath], `${scenario.name}: more than one rendition was fetched`);
    assert.deepEqual([decoded.width, decoded.height], scenario.expectedDimensions);
    assert.ok(decoded.duration > 25, `${scenario.name}: candidate did not decode its full duration`);
    results.push({ scenario: scenario.name, state, decoded, requests: [...requestLog] });
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((resolveServer) => server.close(resolveServer));
}

console.log(JSON.stringify({
  status: 'PASS',
  candidates: {
    mobile: { path: mobilePath, bytes: statSync(mobilePath).size },
    desktop: { path: desktopPath, bytes: statSync(desktopPath).size },
  },
  results,
}, null, 2));
