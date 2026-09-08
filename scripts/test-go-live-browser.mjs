import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const base = process.env.TEST_BASE_URL || 'http://127.0.0.1:3108';
if (!['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw Error('Only loopback preview is allowed');
const output = '/private/tmp/oria-go-live-browser';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
try {
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1440, height: 900 }]) {
    for (const lang of ['vi', 'en', 'jp', 'kr', 'cn']) {
      const context = await browser.newContext({ viewport, timezoneId: viewport.width === 390 ? 'America/Los_Angeles' : 'Asia/Ho_Chi_Minh' });
      await context.addInitScript(lang => localStorage.setItem('user_lang', lang), lang);
      // Reading real content is allowed; every browser mutation is blocked.
      await context.route('**/*', route => ['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) ? route.continue() : route.abort());
      const page = await context.newPage();
      for (const path of [`/${lang}/new-user/standard/checkout`, '/pure-relaxation', '/history', '/design-your-journey']) {
        const errors = [], failed = [];
        const onError = error => errors.push(error.message);
        const onResponse = response => { if (response.status() >= 400) failed.push({ status: response.status(), url: response.url().split('?')[0] }); };
        page.on('pageerror', onError); page.on('response', onResponse);
        const response = await page.goto(base + path, { waitUntil: 'domcontentloaded', timeout: 45000 });
        await page.waitForTimeout(1500);
        const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth,
          brokenImages: [...document.images].filter(img => img.complete && !img.naturalWidth && img.getBoundingClientRect().width > 0).map(img => img.currentSrc || img.src),
          title: document.querySelector('h1')?.textContent, textLength: document.body.innerText.length }));
        const name = `${viewport.width}-${lang}-${path.replace(/\W+/g, '-')}`;
        if (lang === 'en' || lang === 'vi') await page.screenshot({ path: join(output, `${name}.png`) });
        const result = { viewport: viewport.width, lang, path, status: response.status(), errors, failed, ...layout };
        results.push(result); console.log(JSON.stringify({ viewport: viewport.width, lang, path, status: result.status, errors: errors.length, overflow: layout.scrollWidth > layout.width, brokenImages: layout.brokenImages.length }));
        page.off('pageerror', onError); page.off('response', onResponse);
      }
      await context.close();
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();
  for (const path of ['/demo-3d', '/history-demo.html', '/admin/login', '/admin/services/pure']) {
    const r = await page.goto(base + path); await page.waitForTimeout(300);
    results.push({ path, status: r.status(), finalPath: new URL(page.url()).pathname,
      sidebar: await page.getByText('NganHa Admin', { exact: true }).count(), emailType: await page.locator('input').first().getAttribute('type').catch(() => null) });
  }
  await context.close();
} finally {
  await writeFile(join(output, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close();
}
const failures = results.filter(r => r.errors?.length || r.scrollWidth > r.width || r.brokenImages?.length || (r.status >= 500));
console.log(`Browser read-only matrix: ${results.length} cases, ${failures.length} cases need review. Evidence: ${output}`);
if (failures.length) process.exitCode = 1;
