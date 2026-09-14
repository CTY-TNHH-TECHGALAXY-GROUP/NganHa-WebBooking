#!/usr/bin/env node

/**
 * Loopback-only runtime trace for Agent E.
 *
 * This harness is intentionally diagnostic: it targets loopback only and never
 * submits a form or directly calls storage, Supabase, or Vercel. The page may
 * make its normal same-origin requests. If the local server or browser is
 * unavailable, it writes BLOCKED/NO_DATA instead of fabricating metrics.
 */

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const outputDir = path.resolve(process.argv[2] || 'plans/pagespeed-remediation-20260913/remaining/agent-e');
const baseUrl = process.argv[3] || 'http://127.0.0.1:3002';
const runId = `agent-e-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${crypto.randomUUID()}`;
const reportPath = path.join(outputDir, `runtime-trace-${runId}.json`);
const tracePath = path.join(outputDir, `runtime-trace-${runId}.trace.json`);
fs.mkdirSync(outputDir, { recursive: true });

function writeReport(report) {
  fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ reportPath, tracePath: report.tracePath || null, status: report.status }, null, 2));
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

const report = {
  status: 'NO_DATA',
  runId,
  baseUrl: parsedBase.origin,
  profile: 'Chromium headless, 390x844, DPR2, touch, CPU4x; loopback diagnostic',
  startedAt: new Date().toISOString(),
  steps: [],
  errors: [],
  tracePath,
};

let browser;
let context;
let page;
const traceEvents = [];
const requests = new Map();
let currentPhase = 'boot';
try {
  browser = await chromium.launch({ headless: true });
  context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  cdp.on('Network.requestWillBeSent', ({ requestId, request, type }) => {
    requests.set(requestId, { url: request.url, type, phase: currentPhase, status: null, mime: null, bytes: 0 });
  });
  cdp.on('Network.responseReceived', ({ requestId, response, type }) => {
    const request = requests.get(requestId) || { phase: currentPhase, bytes: 0 };
    requests.set(requestId, { ...request, url: response.url, type, status: response.status, mime: response.mimeType });
  });
  cdp.on('Network.loadingFinished', ({ requestId, encodedDataLength }) => {
    const request = requests.get(requestId);
    if (request) request.bytes = encodedDataLength;
  });
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => report.errors.push(`pageerror: ${error.message}`));
  await page.addInitScript(() => {
    const state = {
      phase: 'boot',
      phases: [],
      geometryReads: [],
      computedStyleReads: [],
      longTasks: [],
      layoutShifts: [],
      suppressInstrumentation: false,
    };
    window.__agentERuntimeTrace = state;
    const record = (bucket, method) => {
      if (state.suppressInstrumentation) return;
      const list = state[bucket];
      if (!list || list.length >= 500) return;
      list.push({
        t: performance.now(),
        phase: state.phase,
        method,
        stack: new Error().stack?.split('\n').slice(2, 8) || [],
      });
    };
    const originalRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function traceRect(...args) {
      record('geometryReads', 'getBoundingClientRect');
      return originalRect.apply(this, args);
    };
    const originalComputedStyle = window.getComputedStyle;
    window.getComputedStyle = function traceComputedStyle(...args) {
      record('computedStyleReads', 'getComputedStyle');
      return originalComputedStyle.apply(window, args);
    };
    window.__agentESetPhase = phase => {
      state.phase = phase;
      state.phases.push({ t: performance.now(), phase });
    };
    window.__agentECollectAnimations = () => {
      state.suppressInstrumentation = true;
      try {
        return [...document.querySelectorAll('*')].flatMap(element => {
          const style = getComputedStyle(element);
          return style.animationName !== 'none' ? [{
            tag: element.tagName,
            className: String(element.className),
            name: style.animationName,
            duration: style.animationDuration,
            playState: style.animationPlayState,
          }] : [];
        }).slice(0, 100);
      } finally {
        state.suppressInstrumentation = false;
      }
    };
    window.__agentECaptureRuntime = () => JSON.parse(JSON.stringify(state));
    if ('PerformanceObserver' in window) {
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            state.longTasks.push({
              start: entry.startTime,
              duration: entry.duration,
              attribution: entry.attribution?.map(item => ({
                name: item.name,
                containerType: item.containerType,
                containerName: item.containerName,
                containerSrc: item.containerSrc,
              })) || [],
            });
          }
        }).observe({ type: 'longtask', buffered: true });
      } catch {}
      try {
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) state.layoutShifts.push({ start: entry.startTime, value: entry.value });
          }
        }).observe({ type: 'layout-shift', buffered: true });
      } catch {}
    }
  });

  await cdp.send('Network.enable');
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const traceComplete = new Promise(resolve => {
    cdp.on('Tracing.dataCollected', payload => traceEvents.push(...payload.value));
    cdp.once('Tracing.tracingComplete', resolve);
  });
  await cdp.send('Tracing.start', {
    transferMode: 'ReportEvents',
    categories: [
      'devtools.timeline',
      'blink.user_timing',
      'disabled-by-default-devtools.timeline',
      'disabled-by-default-devtools.timeline.frame',
    ].join(','),
  });

  async function markPhase(phase) {
    currentPhase = phase;
    await page.evaluate(value => window.__agentESetPhase?.(value), phase);
  }

  async function captureAnimations() {
    return page.evaluate(() => window.__agentECollectAnimations?.() || []);
  }

  async function captureRuntime() {
    return page.evaluate(() => window.__agentECaptureRuntime?.() || null);
  }

  async function captureStep(name, action) {
    const step = { name, startedAt: new Date().toISOString(), status: 'RUNNING' };
    report.steps.push(step);
    try {
      await markPhase(name);
      await action(step);
      step.runtime = await captureRuntime();
      if (step.status === 'RUNNING') step.status = 'PASS';
    } catch (error) {
      step.status = 'BLOCKED';
      step.reason = error instanceof Error ? error.message : String(error);
    }
  }

  await captureStep('homepage', async step => {
    const response = await page.goto(`${parsedBase.origin}/`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    step.httpStatus = response?.status() ?? null;
    await page.waitForTimeout(1200);
    step.snapshot = await page.evaluate(() => ({
      url: location.href,
      scrollHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
      videos: [...document.querySelectorAll('video')].map(video => ({ src: video.currentSrc, preload: video.preload, readyState: video.readyState })),
      images: document.images.length,
    }));
    step.animations = await captureAnimations();
  });

  await captureStep('history-scroll', async step => {
    const target = page.locator('#history').first();
    if (!(await target.count())) throw new Error('History anchor #history not found');
    await target.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    const phases = [0, 0.75, 1.5, 2.5, 3.5];
    step.snapshots = [];
    for (const multiplier of phases) {
      await markPhase(`history-scroll-${multiplier}`);
      await page.evaluate(value => window.scrollTo({ top: window.innerHeight * value, behavior: 'auto' }), multiplier);
      await page.waitForTimeout(350);
      step.snapshots.push(await page.evaluate(() => {
        const historyImages = [...document.querySelectorAll('[data-history-chapter] img')].map(image => image.currentSrc);
        const loadedImages = [...new Set(historyImages.filter(source => source.startsWith('http')))].sort();
        return {
          scrollY: window.scrollY,
          scrollHeight: document.documentElement.scrollHeight,
          chapters: document.querySelectorAll('[data-history-chapter]').length,
          historyImageCount: historyImages.length,
          loadedImages,
          placeholderCount: historyImages.filter(source => source.startsWith('data:')).length,
          emptyCount: historyImages.filter(source => !source).length,
        };
      }));
    }
    step.animations = await captureAnimations();
  });

  await captureStep('menu', async step => {
    const trigger = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], button.menu-toggle').filter({ visible: true }).first();
    if (!(await trigger.count())) { step.status = 'NO_DATA'; step.reason = 'no visible menu trigger matched allowlisted selectors'; return; }
    await trigger.click();
    await page.waitForTimeout(250);
    step.snapshot = await page.evaluate(() => ({ url: location.href, dialogs: document.querySelectorAll('[role="dialog"]').length, expanded: [...document.querySelectorAll('button[aria-expanded="true"]')].length }));
    step.animations = await captureAnimations();
    await page.keyboard.press('Escape').catch(() => {});
  });

  await captureStep('chat', async step => {
    const trigger = page.locator('button[aria-label*="contact" i], button[aria-label*="chat" i], [data-chatbot-trigger]').filter({ visible: true }).first();
    if (!(await trigger.count())) { step.status = 'NO_DATA'; step.reason = 'no visible chat trigger matched allowlisted selectors'; return; }
    await trigger.click();
    await page.waitForTimeout(250);
    step.snapshot = await page.evaluate(() => ({ url: location.href, dialogs: document.querySelectorAll('[role="dialog"]').length, images: document.images.length }));
    step.animations = await captureAnimations();
    await page.keyboard.press('Escape').catch(() => {});
  });

  await captureStep('checkout-read-only', async step => {
    const response = await page.goto(`${parsedBase.origin}/en/new-user/standard/checkout`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    step.httpStatus = response?.status() ?? null;
    await page.waitForTimeout(800);
    step.snapshot = await page.evaluate(() => ({ url: location.href, forms: document.forms.length, buttons: document.querySelectorAll('button').length }));
    step.animations = await captureAnimations();
  });

  await cdp.send('Tracing.end');
  await traceComplete;
  fs.writeFileSync(tracePath, JSON.stringify({ traceEvents }));
  const finalState = await page.evaluate(() => {
    return { viewport: document.querySelector('meta[name="viewport"]')?.content || null };
  });
  const layouts = traceEvents.filter(event => ['Layout', 'UpdateLayoutTree', 'ForcedLayout'].includes(event.name));
  const finalRuntime = report.steps.at(-1)?.runtime || null;
  const longTasks = finalRuntime?.longTasks || [];
  const geometry = finalRuntime?.geometryReads || [];
  report.finishedAt = new Date().toISOString();
  const hasPass = report.steps.some(step => step.status === 'PASS');
  const hasBlocked = report.steps.some(step => step.status === 'BLOCKED');
  const hasNoData = report.steps.some(step => step.status === 'NO_DATA');
  report.status = hasBlocked || (hasPass && hasNoData)
    ? 'PARTIAL'
    : hasNoData ? 'NO_DATA' : 'PASS';
  report.page = { viewport: finalState.viewport, runtime: finalRuntime };
  report.attribution = {
    traceEventCount: traceEvents.length,
    // The raw trace preserves every event; keep the report reviewable by showing
    // the 50 most expensive layout events.
    slowestLayoutEvents: layouts.map(event => ({ name: event.name, ts: event.ts, durationMs: Number(event.dur || 0) / 1000, args: event.args?.data || event.args?.beginData || {} })).sort((a, b) => b.durationMs - a.durationMs).slice(0, 50),
    layoutEventCount: layouts.length,
    layoutDurationMs: layouts.reduce((sum, event) => sum + Number(event.dur || 0) / 1000, 0),
    geometryReadCount: geometry.length,
    geometryReadsByPhase: geometry.reduce((counts, read) => { counts[read.phase] = (counts[read.phase] || 0) + 1; return counts; }, {}),
    longTaskCount: longTasks.length,
    longTaskDurationMs: longTasks.reduce((sum, task) => sum + task.duration, 0),
  };
  report.requests = [...requests.values()].filter(request => request.type === 'Image' || request.type === 'Script').sort((a, b) => b.bytes - a.bytes).slice(0, 100);
  report.requestSummaryByPhase = report.requests.reduce((summary, request) => {
    const phase = request.phase || 'unknown';
    const entry = summary[phase] || { imageCount: 0, scriptCount: 0, bytes: 0, unknownBytes: 0 };
    if (request.type === 'Image') entry.imageCount += 1;
    if (request.type === 'Script') entry.scriptCount += 1;
    if (request.bytes > 0) entry.bytes += request.bytes;
    else entry.unknownBytes += 1;
    summary[phase] = entry;
    return summary;
  }, {});
} catch (error) {
  report.status = 'BLOCKED';
  report.reason = error instanceof Error ? error.message : String(error);
  report.finishedAt = new Date().toISOString();
  try { await page?.close(); } catch {}
  try { await context?.close(); } catch {}
  try { await browser?.close(); } catch {}
  writeReport(report);
  process.exit(0);
}

try { await context.close(); } catch {}
try { await browser.close(); } catch {}
writeReport(report);
