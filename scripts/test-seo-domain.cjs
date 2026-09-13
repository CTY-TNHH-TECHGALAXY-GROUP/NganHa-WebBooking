const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const assert = require('node:assert/strict');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...args) {
  return resolve.call(this, request.startsWith('@/') ? path.join(root, 'src', request.slice(2)) : request, ...args);
};
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    fileName: filename,
  }).outputText, filename);
}

async function main() {
  const { getSiteOrigin, buildPageMetadata } = require('../src/lib/seo/metadata.ts');
  const official = 'https://oria-spa.vercel.app';
  process.env.NODE_ENV = 'production';
  for (const value of ['', 'invalid', 'https://nganha.vercel.app', 'https://oriaspa.vercel.app', 'https://preview.example', 'http://localhost:3002', 'https://user:pass@oria-spa.vercel.app', 'https://oria-spa.vercel.app?x=1', official+'/path']) {
    process.env.NEXT_PUBLIC_SITE_URL = value;
    assert.equal(getSiteOrigin().origin, official, value);
    assert.equal(getSiteOrigin().pathname, '/');
  }
  process.env.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3002';
  assert.equal(getSiteOrigin().origin, 'http://localhost:3002');
  delete process.env.NEXT_PUBLIC_SITE_URL;
  await require('../src/lib/seo/__tests__/seo.test.ts').runSeoTests();

  const { normalizeSeoConfig } = require('../src/lib/seo/config.ts');
  const config = normalizeSeoConfig(null);
  const seo = require('../src/lib/seo/metadata.ts');
  seo.getPageMetadata = async descriptor => buildPageMetadata(config, descriptor);
  for (const step of ['menu', 'checkout']) {
    const layout = require(`../src/app/[lang]/new-user/[menuType]/${step}/layout.tsx`);
    for (const lang of ['vi','en','cn','jp','kr']) {
      const pathname = `/${lang}/new-user/standard/${step}`;
      const result = await layout.generateMetadata({params:Promise.resolve({lang,menuType:'standard'})}, Promise.resolve({openGraph:{title:'Preserve existing title',url:official,images:[]}}));
      assert.equal(result.alternates.canonical, official+pathname);
      assert.equal(result.openGraph.url, official+pathname);
      assert.equal(result.openGraph.title, 'Preserve existing title');
      assert.equal(result.robots, undefined, 'Inherit existing robots policy');
      assert.equal(result.alternates.languages['x-default'], undefined);
      for (const [locale,tag] of Object.entries({vi:'vi',en:'en',cn:'zh-CN',jp:'ja',kr:'ko'})) {
        assert.equal(result.alternates.languages[tag], `${official}/${locale}/new-user/standard/${step}`);
      }
    }
  }
  console.log('SEO behavior, production origin, and 10 workflow locale metadata cases: PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
