#!/usr/bin/env node

/**
 * Loopback-only runtime measurement harness.
 *
 * This is deliberately a diagnostic/acceptance tool, not a Lighthouse
 * replacement. It never submits a form and rejects every non-loopback URL.
 * A timing run omits monkey-patched geometry instrumentation; a diagnostic run
 * records that instrumentation separately, so its overhead is not presented
 * as a timing result.
 *
 * Usage:
 *   node scripts/trace-runtime-loopback.mjs [outputDir] [loopbackUrl] [--runs=3] [--mode=diagnostic|timing]
 */

import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const positional = process.argv.slice(2).filter(value => !value.startsWith('--'));
const option = name => process.argv.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3);
const outputDir = path.resolve(positional[0] || 'plans/pagespeed-remediation-20260913/remaining/agent-q');
const baseUrl = positional[1] || 'http://127.0.0.1:3002';
const runCount = Math.max(1, Number.parseInt(option('runs') || '3', 10) || 3);
const mode = option('mode') || 'diagnostic';
const numberOption = (name, fallback, minimum) => {
  const value = Number(option(name));
  return Number.isFinite(value) && value >= minimum ? value : fallback;
};
const booleanOption = (name, fallback) => {
  const value = option(name);
  if (value === undefined) return fallback;
  return value === 'true' || value === '1';
};
const label = option('label') || 'candidate';
const profileWidth = numberOption('width', 390, 240);
const profileHeight = numberOption('height', 844, 240);
const profileDpr = numberOption('dpr', 2, 0.5);
const profileCpu = numberOption('cpu', 4, 1);
const profileTouch = booleanOption('touch', profileWidth <= 760);
const profileMobile = booleanOption('mobile', profileWidth <= 760);
const runId = `agent-q-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomUUID()}`;
const reportPath = path.join(outputDir, `runtime-trace-${runId}.json`);
fs.mkdirSync(outputDir, { recursive: true });
let testedSha = null;
try { testedSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(); } catch {}

const SELECTORS = Object.freeze({
  home: '/',
  checkout: '/en/new-user/standard/checkout',
  ourStory: '#our-story',
  history: '#history',
  historyChapters: '#history [data-history-chapter]',
  menu: 'button[aria-label="Toggle menu"]',
  menuOverlay: 'nav.nav-fullscreen-overlay',
  menuClose: 'button[aria-label="Close menu"]',
  chat: 'button[aria-label="Contact Us"]',
  chatPanel: '.floating-widgets [aria-label="Call hotline"]',
  // `.filmStrip` is the visual frame and intentionally has overflow:hidden.
  // `.journeyScroller` is the source-owned horizontal scroll container.
  filmStrip: '#our-story [class*="journeyScroller"]',
});
const PROFILE = Object.freeze({
  browser: 'Chromium headless',
  viewport: { width: profileWidth, height: profileHeight },
  dpr: profileDpr,
  mobile: profileMobile,
  touch: profileTouch,
  cpuThrottleRate: profileCpu,
  cache: 'cold context; cache enabled for explicit checkout/back warm replay',
  smoothScroll: 'disabled for document and scroll containers by a test-only style; recorded below',
  label,
});

function writeReport(report) {
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, status: report.status, runCount: report.runs?.length || 0 }, null, 2));
}

function statusFromSteps(steps) {
  if (!steps.length) return 'NO_DATA';
  if (steps.some(step => step.status === 'BLOCKED')) return 'BLOCKED';
  if (steps.some(step => step.status === 'NOT_VERIFIED')) return 'NOT_VERIFIED';
  return 'PASS';
}

function medianAndRange(values) {
  const usable = values.filter(value => Number.isFinite(value)).sort((a, b) => a - b);
  if (!usable.length) return { count: 0, median: null, min: null, max: null };
  const midpoint = Math.floor(usable.length / 2);
  return {
    count: usable.length,
    median: usable.length % 2 ? usable[midpoint] : (usable[midpoint - 1] + usable[midpoint]) / 2,
    min: usable[0],
    max: usable.at(-1),
  };
}

function requestSummary(requests) {
  const byPhase = {};
  for (const request of requests) {
    const phase = request.phase || 'unattributed';
    const entry = byPhase[phase] ||= {
      requestCount: 0, transferBytes: 0, unknownTransferCount: 0,
      cachedCount: 0, failedCount: 0, range206Count: 0,
      imageCount: 0, mediaCount: 0, scriptCount: 0,
    };
    entry.requestCount += 1;
    if (!Number.isFinite(request.encodedDataLength)) entry.unknownTransferCount += 1;
    else entry.transferBytes += request.encodedDataLength;
    if (request.fromCache) entry.cachedCount += 1;
    if (request.failed) entry.failedCount += 1;
    if (request.status === 206) entry.range206Count += 1;
    if (request.type === 'Image') entry.imageCount += 1;
    if (request.type === 'Media') entry.mediaCount += 1;
    if (request.type === 'Script') entry.scriptCount += 1;
  }
  const all = Object.values(byPhase).reduce((total, entry) => ({
    requestCount: total.requestCount + entry.requestCount,
    transferBytes: total.transferBytes + entry.transferBytes,
    unknownTransferCount: total.unknownTransferCount + entry.unknownTransferCount,
    cachedCount: total.cachedCount + entry.cachedCount,
    failedCount: total.failedCount + entry.failedCount,
    range206Count: total.range206Count + entry.range206Count,
    imageCount: total.imageCount + entry.imageCount,
    mediaCount: total.mediaCount + entry.mediaCount,
    scriptCount: total.scriptCount + entry.scriptCount,
  }), { requestCount: 0, transferBytes: 0, unknownTransferCount: 0, cachedCount: 0, failedCount: 0, range206Count: 0, imageCount: 0, mediaCount: 0, scriptCount: 0 });
  return { all, byPhase };
}

function runtimeDelta(before, after) {
  if (!before || !after || before.navigationId !== after.navigationId) return null;
  const since = before.capturedAt;
  const newer = entries => (entries || []).filter(entry => entry.t >= since);
  const longTasks = newer(after.longTasks);
  const phaseStarts = (after.phases || []).filter(entry => entry.phase === after.phase && entry.t >= since);
  return {
    navigationId: after.navigationId,
    timeOrigin: after.timeOrigin,
    phase: after.phase,
    phaseStart: phaseStarts[0]?.t ?? since,
    phaseEnd: after.capturedAt,
    start: since,
    end: after.capturedAt,
    geometryReads: newer(after.geometryReads),
    computedStyleReads: newer(after.computedStyleReads),
    longTasks,
    layoutShifts: newer(after.layoutShifts),
    longTaskDurationMs: longTasks.reduce((sum, entry) => sum + entry.duration, 0),
  };
}

let parsedBase;
try {
  parsedBase = new URL(baseUrl);
} catch {
  writeReport({ status: 'BLOCKED', reason: 'base URL is invalid; loopback only', baseUrl, runId });
  process.exit(0);
}
if (!['127.0.0.1', 'localhost', '[::1]', '::1'].includes(parsedBase.hostname)) {
  writeReport({ status: 'BLOCKED', reason: 'refusing non-loopback target', baseUrl, runId });
  process.exit(0);
}
if (!['diagnostic', 'timing'].includes(mode)) {
  writeReport({ status: 'BLOCKED', reason: '--mode must be diagnostic or timing', baseUrl, runId });
  process.exit(0);
}

const report = {
  status: 'NO_DATA', runId, baseUrl: parsedBase.origin, startedAt: new Date().toISOString(),
  testedSha,
  mode,
  profile: PROFILE,
  configSnapshot: {
    harnessVersion: '2026-09-15.q2',
    selectors: SELECTORS,
    runCount,
    testOnlySmoothScrollPolicy: PROFILE.smoothScroll,
    cachePolicy: PROFILE.cache,
  },
  notes: [
    'Totals are computed from the complete per-request dataset before the display list is capped.',
    'encodedDataLength is transfer data for that request. HTTP 206 ranges are not expanded to file size.',
    'Zero-byte, cached, failed, or unfinished requests remain explicit and are never claimed as savings.',
    'Diagnostic geometry/computed-style instrumentation is not a timing benchmark.',
  ],
  runs: [],
  errors: [],
};

async function addRuntimeInitScript(page) {
  await page.addInitScript(({ diagnostic, navigationSeed }) => {
    const documentNavigationId = `${navigationSeed}:${crypto.randomUUID()}`;
    const state = {
      navigationId: documentNavigationId, timeOrigin: performance.timeOrigin, phase: 'boot', phases: [],
      geometryReads: [], computedStyleReads: [], longTasks: [], layoutShifts: [],
      suppressInstrumentation: false,
    };
    const limit = 500;
    const now = () => performance.now();
    const record = (bucket, method) => {
      if (!diagnostic || state.suppressInstrumentation || state[bucket].length >= limit) return;
      state[bucket].push({ t: now(), phase: state.phase, method, stack: new Error().stack?.split('\n').slice(2, 8) || [] });
    };
    if (diagnostic) {
      const rect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = function traceRect(...args) {
        record('geometryReads', 'getBoundingClientRect');
        return rect.apply(this, args);
      };
      const computed = window.getComputedStyle;
      window.getComputedStyle = function traceComputedStyle(...args) {
        record('computedStyleReads', 'getComputedStyle');
        return computed.apply(window, args);
      };
    }
    window.__agentQResetNavigation = (phase = 'navigation-ready') => {
      // Keep the per-document identity and event buffers. Clearing buffered
      // entries here used to discard initial-load work and made later phases
      // look cheaper than they were.
      state.navigationId = documentNavigationId;
      state.timeOrigin ||= performance.timeOrigin;
      state.phase = phase;
      state.phases.push({ t: now(), phase });
      return { navigationId: state.navigationId, timeOrigin: state.timeOrigin, t: now() };
    };
    window.__agentQSetPhase = phase => {
      state.phase = phase;
      state.phases.push({ t: now(), phase });
    };
    window.__agentQCaptureRuntime = () => JSON.parse(JSON.stringify({ ...state, capturedAt: now() }));
    window.__agentQCollectAnimations = () => {
      state.suppressInstrumentation = true;
      try {
        return [...document.querySelectorAll('*')].flatMap(element => {
          const style = getComputedStyle(element);
          return style.animationName !== 'none' ? [{ tag: element.tagName, className: String(element.className), name: style.animationName, duration: style.animationDuration, playState: style.animationPlayState }] : [];
        }).slice(0, 100);
      } finally { state.suppressInstrumentation = false; }
    };
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(list => list.getEntries().forEach(entry => state.longTasks.push({
          t: entry.startTime, start: entry.startTime, duration: entry.duration,
          attribution: entry.attribution?.map(item => ({ name: item.name, containerType: item.containerType, containerName: item.containerName, containerSrc: item.containerSrc })) || [],
        }))).observe({ type: 'longtask', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) state.layoutShifts.push({ t: entry.startTime, start: entry.startTime, value: entry.value });
        })).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    }
  }, { diagnostic: mode === 'diagnostic', navigationSeed: runId });
}

async function waitForStableScroll(page, samples = 4, axis = 'y') {
  return page.evaluate(async ({ sampleCount, axis: scrollAxis }) => {
    const positions = [];
    let stableSamples = 0;
    for (let index = 0; index < 60; index += 1) {
      await new Promise(resolve => setTimeout(resolve, 50));
      const position = { x: scrollX, y: scrollY };
      if (scrollAxis === 'x') position.x = document.scrollingElement?.scrollLeft || 0;
      positions.push(position);
      const recent = positions.slice(-sampleCount);
      const stable = recent.length === sampleCount
        && recent.every(item => Math.abs(item.x - recent[0].x) <= 0.5 && Math.abs(item.y - recent[0].y) <= 0.5);
      stableSamples = stable ? stableSamples + 1 : 0;
      if (stableSamples >= 2) return { stable: true, positions: recent, final: recent.at(-1) };
    }
    const recent = positions.slice(-sampleCount);
    return { stable: false, positions: recent, final: recent.at(-1) };
  }, { sampleCount: samples, axis });
}

async function waitForVisualVisibility(page, selector, expected, timeout = 3000) {
  await page.waitForFunction(({ targetSelector, shouldBeVisible }) => {
    const element = document.querySelector(targetSelector);
    if (!element) return !shouldBeVisible;
    let current = element;
    while (current && current !== document.body) {
      const style = getComputedStyle(current);
      const rect = current.getBoundingClientRect();
      const visible = style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number.parseFloat(style.opacity || '1') > 0.01
        && rect.width > 0 && rect.height > 0;
      if (!visible) return !shouldBeVisible;
      current = current.parentElement;
    }
    return shouldBeVisible;
  }, { targetSelector: selector, shouldBeVisible: expected }, { timeout });
}

async function waitForDecodedPicture(page, selector, index, timeout = 15000) {
  await page.waitForFunction(({ rootSelector, pictureIndex }) => {
    const root = document.querySelectorAll(rootSelector)[pictureIndex];
    if (!root) return false;
    const image = root.querySelector('img');
    if (!image) return false;
    const rect = image.getBoundingClientRect();
    const visible = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    return visible && image.currentSrc && !image.currentSrc.startsWith('data:')
      && (image.dataset.mediaState === 'loaded' || image.dataset.mediaState === 'error');
  }, { rootSelector: selector, pictureIndex: index }, { timeout });
}

async function targetBox(page, selector, index = 0) {
  return page.locator(selector).nth(index).evaluate(element => {
    const rect = element.getBoundingClientRect();
    const viewport = { width: innerWidth, height: innerHeight };
    const intersects = rect.bottom > 0 && rect.top < viewport.height && rect.right > 0 && rect.left < viewport.width;
    return { x: rect.x, y: rect.y, top: rect.top, right: rect.right, bottom: rect.bottom, left: rect.left, width: rect.width, height: rect.height, viewport, intersects };
  });
}

async function scrollToTarget(page, selector, index = 0) {
  const target = page.locator(selector).nth(index);
  if (!await target.count()) throw new Error(`required selector missing: ${selector}`);
  await target.evaluate(element => element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' }));
  const stability = await waitForStableScroll(page, 4, 'y');
  const box = await targetBox(page, selector, index);
  if (!stability.stable) throw new Error(`scroll did not stabilize for ${selector}[${index}]`);
  if (!box.intersects || box.width <= 0 || box.height <= 0) throw new Error(`target is not in viewport for ${selector}[${index}]`);
  return { scroll: stability.final, stability, targetBox: box };
}

async function decodedVisibleImages(page, rootSelector, index = 0) {
  return page.locator(rootSelector).nth(index).evaluate(async root => {
    const images = [...root.querySelectorAll('img')].filter(image => {
      const rect = image.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    });
    return Promise.all(images.map(async image => {
      let decodeError = null;
      if (image.currentSrc && !image.currentSrc.startsWith('data:')) {
        try { await image.decode(); } catch (error) { decodeError = String(error); }
      }
      const rect = image.getBoundingClientRect();
      return {
        currentSrc: image.currentSrc,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        decodeError,
        state: image.dataset.mediaState || null,
        ariaBusy: image.getAttribute('aria-busy'),
        box: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      };
    }));
  });
}

function assertDecoded(step, images, label, { requireMediaState = false } = {}) {
  const realImages = images.filter(image => image.currentSrc && !image.currentSrc.startsWith('data:'));
  step.decodedImages = images;
  if (!realImages.length) throw new Error(`${label}: no visible image URL was attached`);
  const broken = realImages.filter(image => !image.naturalWidth || image.decodeError
    || (requireMediaState && (image.state !== 'loaded' || image.ariaBusy !== 'false')));
  if (broken.length) throw new Error(`${label}: ${broken.length} visible image(s) failed naturalWidth/decode assertion`);
}

async function runMeasurement(runIndex) {
  const run = {
    index: runIndex + 1,
    state: 'cold_then_warm',
    startedAt: new Date().toISOString(),
    steps: [],
    errors: [],
    cacheTransitions: [],
    tracePath: path.join(outputDir, `runtime-trace-${runId}-run${runIndex + 1}.trace.json`),
  };
  let browser;
  let context;
  let page;
  let cdp;
  const requests = new Map();
  const traceEvents = [];
  let currentPhase = 'boot';
  try {
    browser = await chromium.launch({ headless: true });
    context = await browser.newContext({ viewport: PROFILE.viewport, deviceScaleFactor: PROFILE.dpr, isMobile: true, hasTouch: PROFILE.touch });
    page = await context.newPage();
    await addRuntimeInitScript(page);
    cdp = await context.newCDPSession(page);
    cdp.on('Network.requestWillBeSent', ({ requestId, request, type, initiator, timestamp, redirectResponse }) => {
      if (redirectResponse) {
        requests.set(`${requestId}:redirect:${timestamp}`, {
          requestId,
          url: redirectResponse.url,
          type,
          initiator: initiator?.type || null,
          initiatorDetails: initiator || null,
          start: timestamp,
          end: timestamp,
          status: redirectResponse.status,
          mime: redirectResponse.mimeType || null,
          responseHeaders: redirectResponse.headers || null,
          fromCache: false,
          failed: false,
          failure: null,
          encodedDataLength: null,
          phase: currentPhase,
          redirect: true,
          complete: true,
        });
      }
      const headers = request.headers || {};
      requests.set(requestId, {
        requestId,
        url: request.url,
        method: request.method,
        range: headers.Range || headers.range || null,
        type,
        initiator: initiator?.type || null,
        initiatorDetails: initiator || null,
        start: timestamp,
        end: null,
        status: null,
        mime: null,
        responseHeaders: null,
        cacheControl: null,
        contentLength: null,
        fromCache: false,
        failed: false,
        failure: null,
        canceled: false,
        encodedDataLength: null,
        phase: currentPhase,
        redirect: false,
        complete: false,
      });
    });
    cdp.on('Network.responseReceived', ({ requestId, response, type, timestamp }) => {
      const request = requests.get(requestId);
      if (!request) return;
      Object.assign(request, {
        url: response.url,
        type,
        status: response.status,
        mime: response.mimeType,
        responseHeaders: response.headers || null,
        cacheControl: response.headers?.['cache-control'] || response.headers?.['Cache-Control'] || null,
        contentLength: response.headers?.['content-length'] || response.headers?.['Content-Length'] || null,
        fromCache: Boolean(response.fromDiskCache || response.fromPrefetchCache || response.fromServiceWorker),
        responseTimestamp: timestamp,
      });
    });
    cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength, timestamp }) => {
      const request = requests.get(requestId);
      if (request) Object.assign(request, { encodedDataLength, end: timestamp, complete: true, completion: 'finished' });
    });
    cdp.on('Network.loadingFailed', ({ requestId, errorText, canceled, timestamp }) => {
      const request = requests.get(requestId);
      if (request) Object.assign(request, { failed: true, failure: errorText, canceled: Boolean(canceled), end: timestamp, complete: true, completion: 'failed' });
    });
    page.on('console', message => { if (message.type() === 'error') run.errors.push(`console: ${message.text()}`); });
    page.on('pageerror', error => run.errors.push(`pageerror: ${error.message}`));
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    run.cacheTransitions.push({ at: new Date().toISOString(), disabled: true, reason: 'cold-start' });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: PROFILE.cpuThrottleRate });
    const traceComplete = new Promise(resolve => {
      cdp.on('Tracing.dataCollected', payload => traceEvents.push(...payload.value));
      cdp.once('Tracing.tracingComplete', resolve);
    });
    await cdp.send('Tracing.start', { transferMode: 'ReportEvents', categories: ['devtools.timeline', 'blink.user_timing', 'disabled-by-default-devtools.timeline', 'disabled-by-default-devtools.timeline.frame'].join(',') });

    async function markPhase(phase) {
      currentPhase = phase;
      await page.evaluate(value => window.__agentQSetPhase?.(value), phase);
    }
    async function captureRuntime() { return page.evaluate(() => window.__agentQCaptureRuntime?.() || null); }
    async function setCacheDisabled(disabled, reason) {
      await cdp.send('Network.setCacheDisabled', { cacheDisabled: disabled });
      run.cacheTransitions.push({ at: new Date().toISOString(), disabled, reason });
    }
    async function captureStep(name, action) {
      const step = { name, startedAt: new Date().toISOString(), status: 'RUNNING' };
      run.steps.push(step);
      try {
        await markPhase(name);
        const before = await captureRuntime();
        await action(step);
        const after = await captureRuntime();
        step.runtime = {
          navigationId: after?.navigationId || null,
          timeOrigin: after?.timeOrigin || null,
          phase: after?.phase || null,
          phaseStart: after?.phases?.filter(entry => entry.phase === after.phase).at(-1)?.t || null,
          delta: runtimeDelta(before, after),
        };
        step.endedAt = new Date().toISOString();
        if (step.status === 'RUNNING') step.status = 'PASS';
      } catch (error) {
        step.status = 'NOT_VERIFIED';
        step.reason = error instanceof Error ? error.message : String(error);
        step.endedAt = new Date().toISOString();
      }
    }
    async function navigate(step, route, navigationPhase) {
      currentPhase = navigationPhase;
      const response = await page.goto(`${parsedBase.origin}${route}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(800);
      step.httpStatus = response?.status() ?? null;
      step.finalURL = page.url();
      if (!response || response.status() < 200 || response.status() >= 300) throw new Error(`${route}: expected HTTP 2xx, got ${step.httpStatus}`);
      const final = new URL(page.url());
      if (final.origin !== parsedBase.origin || final.pathname !== route) throw new Error(`${route}: unexpected final URL ${page.url()}`);
      step.navigation = await page.evaluate(() => {
        const style = document.createElement('style');
        style.dataset.agentQSmoothScroll = 'disabled';
        style.textContent = 'html, html * { scroll-behavior: auto !important; }';
        document.head.append(style);
        return window.__agentQResetNavigation?.('navigation-ready') || null;
      });
      if (!step.navigation?.navigationId || !step.navigation?.timeOrigin) throw new Error(`${route}: runtime did not initialize after navigation`);
    }

    await captureStep('homepage-navigation', step => navigate(step, SELECTORS.home, 'homepage-navigation'));
    await captureStep('our-story-baseline', async step => {
      const target = await scrollToTarget(page, SELECTORS.ourStory);
      step.target = target;
      const slots = await page.locator(`${SELECTORS.ourStory} picture`).count();
      if (!slots) throw new Error('Our Story has no picture slots');
      step.slotCount = slots;
    });
    const ourStorySlots = await page.locator(`${SELECTORS.ourStory} picture`).count();
    for (let index = 0; index < ourStorySlots; index += 1) {
      await captureStep(`our-story-slot-${index + 1}`, async step => {
        step.target = await scrollToTarget(page, `${SELECTORS.ourStory} picture`, index);
        await waitForDecodedPicture(page, `${SELECTORS.ourStory} picture`, index);
        assertDecoded(
          step,
          await decodedVisibleImages(page, `${SELECTORS.ourStory} picture`, index),
          `Our Story slot ${index + 1}`,
          { requireMediaState: true },
        );
      });
    }
    const chapterCount = await page.locator(SELECTORS.historyChapters).count();
    if (!chapterCount) {
      run.steps.push({ name: 'history-inventory', status: 'NOT_VERIFIED', reason: 'History chapter selector found no target', startedAt: new Date().toISOString(), endedAt: new Date().toISOString() });
    }
    for (let cycle = 1; cycle <= 3; cycle += 1) {
      for (let index = 0; index < chapterCount; index += 1) {
        await captureStep(`history-cycle-${cycle}-chapter-${index + 1}`, async step => {
          step.target = await scrollToTarget(page, SELECTORS.historyChapters, index);
          await page.waitForTimeout(250);
          assertDecoded(step, await decodedVisibleImages(page, SELECTORS.historyChapters, index), `History cycle ${cycle} chapter ${index + 1}`);
        });
      }
    }
    await captureStep('our-story-film-strip-horizontal', async step => {
      const strip = page.locator(SELECTORS.filmStrip).first();
      if (!await strip.count()) throw new Error('Our Story film strip selector found no target');
      step.target = await scrollToTarget(page, SELECTORS.filmStrip);
      const horizontal = await strip.evaluate(element => {
        const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth);
        element.scrollTo({ left: maxScrollLeft, behavior: 'auto' });
        return { requestedScrollLeft: maxScrollLeft, scrollLeft: element.scrollLeft, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth };
      });
      const stableHorizontal = await page.evaluate(async selector => {
        const element = document.querySelector(selector);
        if (!(element instanceof HTMLElement)) return { stable: false, positions: [] };
        const positions = [];
        for (let index = 0; index < 30; index += 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
          positions.push(element.scrollLeft);
          const recent = positions.slice(-4);
          if (recent.length === 4 && recent.every(value => Math.abs(value - recent[0]) <= 0.5)) {
            return { stable: true, positions: recent, final: recent.at(-1) };
          }
        }
        return { stable: false, positions: positions.slice(-4), final: positions.at(-1) };
      }, SELECTORS.filmStrip);
      step.horizontalStability = stableHorizontal;
      const settledHorizontal = await strip.evaluate(element => ({
        scrollLeft: element.scrollLeft,
        scrollWidth: element.scrollWidth,
        clientWidth: element.clientWidth,
      }));
      step.horizontal = { ...horizontal, ...settledHorizontal };
      if (settledHorizontal.scrollWidth <= settledHorizontal.clientWidth) {
        step.horizontal.notApplicable = true;
        step.horizontal.reason = 'film strip has no horizontal overflow at this viewport';
      } else if (settledHorizontal.scrollLeft <= 0 || !stableHorizontal.stable) {
        throw new Error('film strip is horizontally scrollable but did not reach a stable non-zero scroll position');
      }
    });
    await captureStep('menu-open-close-focus', async step => {
      const trigger = page.locator(SELECTORS.menu).first();
      if (!await trigger.count()) throw new Error('menu trigger selector found no target');
      await trigger.click();
      const overlay = page.locator(SELECTORS.menuOverlay).first();
      await waitForVisualVisibility(page, SELECTORS.menuOverlay, true, 3000);
      const close = page.locator(SELECTORS.menuClose).first();
      if (!await close.count()) throw new Error('menu close control missing after open');
      await close.click();
      await waitForVisualVisibility(page, SELECTORS.menuOverlay, false, 3000);
      step.focusState = await page.evaluate(selector => ({
        returned: document.activeElement?.matches(selector) || false,
        activeTag: document.activeElement?.tagName || null,
        activeLabel: document.activeElement?.getAttribute('aria-label') || null,
      }), SELECTORS.menu);
      step.focusReturned = step.focusState.returned;
      if (!step.focusReturned) throw new Error('menu focus did not return to the trigger');
    });
    await captureStep('chat-open', async step => {
      const trigger = page.locator(SELECTORS.chat).first();
      if (!await trigger.count()) throw new Error('known chat trigger selector found no target');
      await trigger.click();
      const panel = page.locator(SELECTORS.chatPanel).first();
      await waitForVisualVisibility(page, SELECTORS.chatPanel, true, 3000);
      step.panelVisible = true;
      await trigger.click();
      await waitForVisualVisibility(page, SELECTORS.chatPanel, false, 3000);
    });
    await setCacheDisabled(false, 'warm-replay-before-checkout');
    await captureStep('checkout-navigation-read-only', step => navigate(step, SELECTORS.checkout, 'checkout-navigation'));
    await captureStep('homepage-back-warm', async step => {
      currentPhase = 'homepage-back-warm';
      await page.goBack({ waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(1000);
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(500);
      step.finalURL = page.url();
      if (new URL(page.url()).pathname !== SELECTORS.home) throw new Error(`back navigation did not return home: ${page.url()}`);
      step.navigation = await page.evaluate(() => window.__agentQResetNavigation?.('homepage-back-warm') || null);
      if (!step.navigation?.navigationId || !step.navigation?.timeOrigin) throw new Error('back navigation did not produce a document runtime identity');
      step.target = await scrollToTarget(page, SELECTORS.history);
    });
    await cdp.send('Tracing.end');
    await traceComplete;
    fs.writeFileSync(run.tracePath, JSON.stringify({ runId, run: run.index, traceEvents }));
    const layouts = traceEvents.filter(event => ['Layout', 'UpdateLayoutTree', 'ForcedLayout'].includes(event.name));
    run.attribution = {
      traceEventCount: traceEvents.length,
      layoutEventCount: layouts.length,
      layoutDurationMs: layouts.reduce((sum, event) => sum + Number(event.dur || 0) / 1000, 0),
      slowestLayoutEvents: layouts.map(event => ({ name: event.name, ts: event.ts, durationMs: Number(event.dur || 0) / 1000, args: event.args?.data || event.args?.beginData || {} })).sort((a, b) => b.durationMs - a.durationMs).slice(0, 50),
      note: 'Trace layout attribution is not assigned to a component unless CDP exposes a source/selector.',
    };
    run.requests = [...requests.values()].sort((a, b) => (a.start || 0) - (b.start || 0));
    run.requestTotals = requestSummary(run.requests);
    run.requestDisplay = [...run.requests]
      .sort((a, b) => (Number.isFinite(b.encodedDataLength) ? b.encodedDataLength : -1) - (Number.isFinite(a.encodedDataLength) ? a.encodedDataLength : -1))
      .slice(0, 100);
    const displayTruncated = run.requests.length > run.requestDisplay.length;
    const documentNavigations = run.steps.map(step => step.navigation).filter(Boolean);
    const navigationIds = documentNavigations.map(navigation => navigation.navigationId).filter(Boolean);
    const allNavigationIdsUnique = navigationIds.length > 0
      && new Set(navigationIds).size === navigationIds.length
      && documentNavigations.every(navigation => Number.isFinite(navigation.timeOrigin));
    run.requestLedger = {
      complete: true,
      requestCount: run.requests.length,
      displayLimit: 100,
      displayTruncated,
      unfinishedCount: run.requests.filter(request => !request.complete).length,
      unknownTransferCount: run.requestTotals.all.unknownTransferCount,
      note: 'The full ledger is retained in run.requests. requestDisplay is presentation-only and may be capped at 100.',
    };
    run.selfChecks = {
      http2xxAndExpectedFinalURL: run.steps.filter(step => step.name === 'homepage-navigation' || step.name === 'checkout-navigation-read-only').every(step => step.status === 'PASS'),
      requiredSelectorsAndAssertions: run.steps.filter(step => ['our-story-baseline', 'our-story-film-strip-horizontal', 'menu-open-close-focus', 'chat-open', 'homepage-back-warm'].includes(step.name)).every(step => step.status === 'PASS'),
      fullRequestLedgerRetained: run.requestLedger.complete && run.requestTotals.all.requestCount === run.requestLedger.requestCount && (!displayTruncated || run.requestDisplay.length === 100),
      navigationIdentityUniquePerStep: allNavigationIdsUnique,
      noTransferSubstitution: run.requests.every(request => request.encodedDataLength === null || Number.isFinite(request.encodedDataLength)),
    };
    run.status = statusFromSteps(run.steps);
    if (Object.values(run.selfChecks).some(check => check === false)) run.status = 'NOT_VERIFIED';
  } catch (error) {
    run.status = 'BLOCKED';
    run.reason = error instanceof Error ? error.message : String(error);
  } finally {
    run.finishedAt = new Date().toISOString();
    try { await context?.close(); } catch {}
    try { await browser?.close(); } catch {}
  }
  return run;
}

for (let index = 0; index < runCount; index += 1) report.runs.push(await runMeasurement(index));
report.finishedAt = new Date().toISOString();
report.status = report.runs.some(run => run.status === 'BLOCKED') ? 'BLOCKED' : report.runs.some(run => run.status === 'NOT_VERIFIED') ? 'NOT_VERIFIED' : report.runs.every(run => run.status === 'PASS') ? 'PASS' : 'NO_DATA';
report.matchedRunSummary = {
  requiredRunCount: runCount,
  completedRunCount: report.runs.length,
  sessionTransferBytes: medianAndRange(report.runs.map(run => run.requestTotals?.all.transferBytes)),
  sessionMediaRequests: medianAndRange(report.runs.map(run => run.requestTotals?.all.mediaCount)),
  statuses: report.runs.map(run => run.status),
  note: 'This covers the complete scripted session, including checkout. Do not call it a homepage total or compare it with a run using a different SHA, selector/config snapshot, profile, or scroll position.',
};
writeReport(report);
