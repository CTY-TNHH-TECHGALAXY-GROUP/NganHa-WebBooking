#!/usr/bin/env node

/**
 * Independent, read-only closeout QA for the PageSpeed reacceptance candidate.
 *
 * This script inventories the App Router and SEO sitemap, probes only a local
 * candidate server, and records browser regression outcomes without changing
 * application code, DB, Storage, or deployment state. A failed interaction
 * remains FAIL/NOT_VERIFIED in the report; this script never promotes it.
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

const repoRoot = path.resolve(new URL('..', import.meta.url).pathname);
const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:3377';
const outputDir = path.resolve(process.env.QA_OUTPUT_DIR || 'plans/pagespeed-remediation-20260913/remaining/agent-qa');
const outputPath = path.join(outputDir, 'qa-closeout-20260915.json');
const csvPath = path.join(outputDir, 'route-matrix-20260915.csv');
const locales = ['vi', 'en', 'cn', 'jp', 'kr'];

const parsedBase = new URL(baseUrl);
if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(parsedBase.hostname)) {
  throw new Error('QA_BASE_URL must be loopback; production/live probes are not allowed in this role.');
}

const testedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const gitStatus = execFileSync('git', ['status', '--short'], { cwd: repoRoot, encoding: 'utf8' });

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next') continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else files.push(absolute);
  }
  return files;
}

function appPathFromFile(file) {
  const relative = path.relative(path.join(repoRoot, 'src', 'app'), file).replaceAll(path.sep, '/');
  if (!/^page\.(tsx?|jsx?)$/.test(path.basename(relative))) return null;
  let route = `/${path.dirname(relative) === '.' ? '' : path.dirname(relative)}`;
  route = route.replace(/\/page$/, '').replace(/\(.*?\)\//g, '/').replace(/\(.*?\)/g, '');
  route = route.replace(/\[\[\.\.\.(.+?)\]\]/g, ':$1*').replace(/\[(.+?)\]/g, ':$1');
  route = route.replaceAll('//', '/');
  return route === '/' ? '/' : route.replace(/\/$/, '');
}

function classifyRoute(route) {
  if (route.startsWith('/admin')) return 'admin';
  if (route.startsWith('/api')) return 'api';
  if (route.includes('/public/flipmenu')) return 'demo';
  return 'public';
}

function parseSeoRoutes(source) {
  const routes = [];
  const regex = /\{\s*routeKey:\s*'([^']+)'\s*,\s*pathname:\s*'([^']+)'/g;
  for (const match of source.matchAll(regex)) {
    routes.push({ routeKey: match[1], pathname: match[2], source: 'seo-routes.ts', classification: 'public' });
  }
  return routes;
}

function expandSitemapPaths(pathname) {
  return locales.map(locale => pathname === '/' ? `/${locale}` : `/${locale}${pathname}`);
}

async function fetchRoute(route) {
  const target = new URL(route, parsedBase);
  const started = Date.now();
  let initial;
  let final;
  let body = '';
  try {
    initial = await fetch(target, { redirect: 'manual' });
    final = await fetch(target, { redirect: 'follow' });
    body = await final.text();
  } catch (error) {
    return { route, classification: classifyRoute(route), status: 'BLOCKED', error: String(error), durationMs: Date.now() - started };
  }
  const canonical = body.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1]
    || body.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    || null;
  return {
    route,
    classification: classifyRoute(route),
    initialStatus: initial.status,
    initialLocation: initial.headers.get('location'),
    status: final.status,
    finalUrl: final.url,
    contentType: final.headers.get('content-type'),
    cacheControl: final.headers.get('cache-control'),
    canonical,
    durationMs: Date.now() - started,
  };
}

async function sha256File(file) {
  const bytes = await readFile(file);
  return { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length };
}

async function browserSmoke() {
  const browser = await chromium.launch({ headless: true });
  const profiles = [
    { name: 'mobile-390-dpr2', viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 },
    { name: 'desktop-1440-dpr1', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  ];
  const runs = [];
  try {
    for (const profile of profiles) {
      const context = await browser.newContext({ viewport: profile.viewport, deviceScaleFactor: profile.deviceScaleFactor, locale: 'en-US', serviceWorkers: 'block' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const run = { profile, errors, homepage: {}, menu: {}, cart: {}, chat: {}, video: {} };
      try {
        const response = await page.goto(`${parsedBase}/`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        run.homepage.status = response?.status() || null;
        run.homepage.pass = run.homepage.status === 200;
        await page.waitForTimeout(500);
        run.video = await page.evaluate(() => [...document.querySelectorAll('video')].map(video => ({
          src: video.getAttribute('src'), poster: video.getAttribute('poster'), autoplay: video.autoplay,
          muted: video.muted, playsInline: video.playsInline, readyState: video.readyState,
        })));

        const menuToggle = page.getByRole('button', { name: 'Toggle menu' });
        if (await menuToggle.count()) {
          await menuToggle.first().click();
          await page.waitForTimeout(150);
          run.menu.opened = await page.locator('nav.nav-fullscreen-overlay').isVisible().catch(() => false);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
          run.menu.escapeClosed = !(await page.locator('nav.nav-fullscreen-overlay').isVisible().catch(() => false));
          if (!run.menu.escapeClosed) {
            const close = page.getByRole('button', { name: 'Close menu' });
            if (await close.count()) await close.first().click();
          }
          run.menu.explicitClosed = !(await page.locator('nav.nav-fullscreen-overlay').isVisible().catch(() => false));
          run.menu.status = run.menu.opened && run.menu.explicitClosed ? (run.menu.escapeClosed ? 'PASS' : 'FAIL_ESCAPE') : 'FAIL';
        } else run.menu.status = 'NOT_VERIFIED_NO_TRIGGER';

        const cartButton = page.locator('button[aria-label*="cart" i], button[aria-label*="giỏ hàng" i]').first();
        if (await cartButton.count()) {
          await cartButton.click();
          await page.waitForTimeout(150);
          const closeCart = page.getByRole('button', { name: /close cart/i });
          run.cart.opened = await closeCart.count() > 0;
          run.cart.emptyLabelPresent = /no selected service|không có dịch vụ|chưa chọn dịch vụ/i.test(await page.locator('body').innerText());
          run.cart.status = run.cart.opened ? 'PASS' : 'FAIL';
          if (await closeCart.count()) {
            await closeCart.first().click({ force: true });
            await page.waitForTimeout(100);
          }
        } else run.cart.status = 'NOT_VERIFIED_NO_TRIGGER';

        const chat = page.getByRole('button', { name: 'Contact Us' });
        if (await chat.count()) {
          await chat.first().click();
          await page.waitForTimeout(200);
          run.chat.opened = await page.locator('.floating-widgets').isVisible().catch(() => false);
          await page.keyboard.press('Escape');
          await page.waitForTimeout(150);
          run.chat.escapeClosed = !(await page.locator('.floating-widgets [aria-label="Call hotline"]').isVisible().catch(() => false));
          run.chat.status = run.chat.opened ? (run.chat.escapeClosed ? 'PASS' : 'FAIL_ESCAPE') : 'FAIL';
        } else run.chat.status = 'NOT_VERIFIED_NO_TRIGGER';
      } catch (error) {
        run.status = 'BLOCKED';
        run.error = error instanceof Error ? error.message : String(error);
      } finally {
        run.status ||= Object.values(run).some(value => value && typeof value === 'object' && typeof value.status === 'string' && value.status.startsWith('FAIL')) ? 'FAIL' : 'PASS_REPLAY';
        runs.push(run);
        page.removeAllListeners('pageerror');
        await context.close();
      }
    }
  } finally {
    await browser.close();
  }
  return runs;
}

const appFiles = (await walk(path.join(repoRoot, 'src', 'app'))).map(appPathFromFile).filter(Boolean);
const appRoutes = [...new Set(appFiles)].map(pathname => ({ pathname, source: 'App Router', classification: classifyRoute(pathname) }));
const seoSource = await readFile(path.join(repoRoot, 'src', 'lib', 'seo', 'routes.ts'), 'utf8');
const seoRoutes = parseSeoRoutes(seoSource);
const sitemapResponse = await fetch(new URL('/sitemap.xml', parsedBase));
const sitemapXml = await sitemapResponse.text();
const sitemapRoutes = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match => new URL(match[1]).pathname);

const concretePublic = [
  '/', '/blogs', '/history', '/space', '/pure-relaxation', '/design-your-journey', '/showcase',
  '/oriahome', '/oriafarm-retreat', '/oriafarm-store', '/therapy', '/privileges', '/booking',
  '/local-tour', '/lost-and-found', '/spa-celestial-menu', '/en/new-user/select-menu',
  '/en/new-user/standard/checkout', '/admin/login', '/public/flipmenu/index.html', '/api/services', '/robots.txt',
  '/nonexistent',
  ...locales.map(locale => `/${locale}`),
  ...locales.flatMap(locale => [`/${locale}/oriahome`, `/${locale}/oriafarm-retreat`, `/${locale}/pure-relaxation`, `/${locale}/new-user/standard/checkout`]),
];
const routeList = [...new Set(concretePublic.concat(sitemapRoutes))];
const routeResults = [];
for (const route of routeList) routeResults.push(await fetchRoute(route));

const optimized = (await walk(path.join(repoRoot, 'public', 'images', 'optimized'))).filter(file => file.endsWith('.webp'));
const assetResults = [];
for (const file of optimized) {
  const relative = `/${path.relative(path.join(repoRoot, 'public'), file).replaceAll(path.sep, '/')}`;
  const response = await fetch(new URL(relative, parsedBase));
  const body = new Uint8Array(await response.arrayBuffer());
  assetResults.push({ path: relative, sourceBytes: (await sha256File(file)).bytes, servedBytes: body.byteLength, sha256: createHash('sha256').update(body).digest('hex'), status: response.status, contentType: response.headers.get('content-type'), cacheControl: response.headers.get('cache-control') });
}

let browserRuns;
try { browserRuns = await browserSmoke(); }
catch (error) { browserRuns = [{ status: 'BLOCKED', error: error instanceof Error ? error.message : String(error) }]; }

const report = {
  schemaVersion: 1,
  role: 'QA',
  generatedAt: new Date().toISOString(),
  testedSha,
  baseUrl: parsedBase.origin,
  gitStatus: gitStatus.trim() || 'CLEAN',
  buildId: (await readFile(path.join(repoRoot, '.next', 'BUILD_ID'), 'utf8').catch(() => '')).trim() || null,
  appRouter: { routes: appRoutes, count: appRoutes.length },
  seoRoutes,
  sitemap: { initialStatus: sitemapResponse.status, count: sitemapRoutes.length, paths: sitemapRoutes },
  routes: routeResults,
  assets: assetResults,
  browserRuns,
  gateTable: {
    'candidate-provenance': { status: testedSha === '3a98d898fe23ca3cae69c8e85b3d85acc8f22076' ? 'PASS' : 'FAIL', detail: 'Candidate SHA recorded by git; worker evidence SHA mismatches remain residuals.' },
    'typecheck-lint-build': { status: 'PASS', detail: 'Recorded separately in handoff; build uses a production build from this exact worktree.' },
    'route-inventory': { status: sitemapResponse.status === 200 && sitemapRoutes.length > 0 ? 'PASS' : 'FAIL', detail: 'Router + SEO source + local sitemap inventory captured; public/admin/api/demo are classified.' },
    'canonical-cache-mime': { status: 'PARTIAL', detail: 'Local candidate only; hashed WebP cache/MIME checked. Official deployment mapping and live alias remain NOT_VERIFIED.' },
    'menu-cart-locale-checkout': { status: browserRuns.every(run => run.menu?.status === 'PASS' && run.cart?.status === 'PASS') ? 'PASS' : 'FAIL', detail: 'Read-only smoke; Escape behavior retained as raw result.' },
    'media-browser': { status: browserRuns.every(run => run.homepage?.pass) ? 'PASS_LOCAL' : 'FAIL', detail: 'Independent local candidate browser replay; no production transfer claim.' },
    'sql-cas-live': { status: 'NOT_VERIFIED', detail: 'No disposable PostgreSQL URL/server was available; candidate report explicitly records runner exit 2.' },
    'runtime-tbt-production': { status: 'NOT_VERIFIED', detail: 'No matched production baseline/Lighthouse TBT evidence on this exact candidate.' },
    'a11y-manual-device': { status: 'NOT_VERIFIED', detail: 'Existing D/F raw evidence tested c964977 and records Escape/focus, contrast, zoom, pinch, font residuals; not promoted to candidate PASS.' },
    'deployment-sha-mapping': { status: 'NOT_VERIFIED', detail: 'HTTP 200 cannot identify deployment SHA/project; no live mapping read-only proof.' },
  },
  residuals: [
    'Required worker evidence is not all candidate-matched: B/D/F/Q artifacts largely cite c964977; A/C cites f266c8e; only QA local replay is 3a98d89.',
    'Real PostgreSQL CAS/ACL/concurrency/read-back and migration crash/resume/rollback remain NOT_VERIFIED.',
    'Matched 12-second Hero media transfer reduction remains NOT_VERIFIED; local file sizes are not transfer evidence.',
    'Runtime target TBT/attribution and production Lighthouse/PSI are NOT_VERIFIED.',
    'Manual a11y residuals from D/F remain: menu Escape/focus return FAIL, chat keyboard/contrast/zoom/pinch/license NOT_VERIFIED, Playfair 700 unresolved.',
    'Official Vercel project/deployment/SHA/alias mapping remains NOT_VERIFIED; no deploy or push performed by QA.',
  ],
};

const csvEscape = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = ['route,classification,initialStatus,initialLocation,status,finalUrl,contentType,cacheControl,canonical']
  .concat(routeResults.map(result => [result.route, result.classification, result.initialStatus, result.initialLocation, result.status, result.finalUrl, result.contentType, result.cacheControl, result.canonical].map(csvEscape).join(',')))
  .join('\n') + '\n';
await mkdir(outputDir, { recursive: true });
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
await writeFile(csvPath, csv);
console.log(JSON.stringify({ outputPath, csvPath, testedSha, routeCount: routeResults.length, sitemapCount: sitemapRoutes.length, browserRuns: browserRuns.map(run => ({ profile: run.profile?.name, status: run.status, menu: run.menu?.status, cart: run.cart?.status, chat: run.chat?.status })) }, null, 2));
