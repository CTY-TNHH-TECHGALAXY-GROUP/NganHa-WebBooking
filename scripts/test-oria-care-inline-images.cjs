const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  new Function('require', 'module', 'exports', 'setTimeout', code)(name => mocks[name] || require(name), module, module.exports, () => 0);
  return module.exports;
}
function nodes(node) {
  if (!node || typeof node !== 'object') return [];
  return Array.isArray(node) ? node.flatMap(nodes) : [node, ...nodes(node.props?.children)];
}
const data = load('src/data/oriaCareData.ts');
const initial = structuredClone(data.DEFAULT_ORIA_CARE_CONFIG);
initial.storyPhotos = ['original-0.webp', 'original-1.webp', 'original-2.webp'];
const states = [];
let cursor = 0;
let uploadError = null;
let uploads = 0;
const saved = [];
global.fetch = async (_url, options) => { saved.push(JSON.parse(options.body)); return { ok: true }; };
const mocks = {
  react: { ...React, useState(value) {
    const index = cursor++;
    if (!(index in states)) states[index] = index === 0 ? initial : index === 1 ? false : value;
    return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
  }, useEffect() {} },
  'next/link': { __esModule: true, default: 'a' },
  '@/data/oriaCareData': data,
  '@/components/Admin/WatermarkControl': { WatermarkControl: 'WatermarkControl' },
  '@/lib/supabase': { createClient: () => ({ storage: { from(bucket) {
    assert.equal(bucket, 'media-uploads');
    return {
      async upload(path) { uploads++; assert(path.startsWith('oriacare/paragraph-1-0-')); return { error: uploadError }; },
      getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/inline.webp' } }),
    };
  } } }) },
};
const Editor = load('src/components/Admin/OriaCareEditor.tsx', mocks).default;
function render() { cursor = 0; return Editor({ introductionMerged: true }); }
function find(predicate) { return nodes(render()).find(predicate); }
function button(text) { return find(node => node.type === 'button' && nodes(node.props.children).length === 0 && node.props.children === text) || find(node => node.type === 'button' && Array.isArray(node.props.children) && node.props.children.includes(text)); }
function fileInput() { return find(node => node.type === 'input' && node.props.accept === 'image/jpeg,image/png,image/webp,image/avif'); }
function uploadEvent(type, size) { const input = { files: [{ type, size, name: 'photo.webp' }], value: 'selected' }; return { currentTarget: input, target: input }; }
async function main() {
  render();
  const before = structuredClone(states[0]);
  button('Thêm ảnh sau đoạn này').props.onClick();
  assert.equal(states[0].sections[1].paragraphImages[0].src, '');
  assert.equal(states[3], true, 'Adding a frame must mark the editor unsaved');
  find(node => node.type === 'input' && node.props.type === 'url').props.onChange({ target: { value: 'https://example.com/draft.webp' } });
  find(node => node.type === 'WatermarkControl' && node.props.onChangeOpacity.toString().includes('updateParagraphImage')).props.onChangeOpacity(35);
  const valid = uploadEvent('image/webp', 1024);
  const pending = fileInput().props.onChange(valid);
  assert(find(node => node.type === 'button' && node.props.onClick?.name === 'handleSave').props.disabled);
  assert(nodes(render()).filter(node => node.type === 'input' && node.props.type === 'file').every(node => node.props.disabled), 'Parallel uploads must not unlock saving before every image is ready');
  await pending;
  assert.equal(uploads, 1);
  assert.equal(valid.currentTarget.value, '');
  assert.deepEqual(states[0].sections[1].paragraphImages[0], { src: 'https://example.com/inline.webp', watermarkEnabled: true, watermarkOpacity: 35 });
  assert.deepEqual(states[0].storyPhotos, before.storyPhotos, 'Existing three frames must stay untouched');
  assert.deepEqual(states[0].sections[1].paragraphs, before.sections[1].paragraphs);
  for (const invalid of [uploadEvent('image/svg+xml', 100), uploadEvent('image/png', 10 * 1024 * 1024 + 1)]) {
    await fileInput().props.onChange(invalid);
    assert.equal(uploads, 1);
    assert.equal(states[6].type, 'error');
  }
  uploadError = new Error('Upload failed');
  const originalError = console.error;
  let reportedFailure = false;
  console.error = () => { reportedFailure = true; };
  try { await fileInput().props.onChange(uploadEvent('image/png', 100)); }
  finally { console.error = originalError; }
  assert(reportedFailure);
  assert.equal(states[0].sections[1].paragraphImages[0].src, 'https://example.com/inline.webp');
  assert.equal(states[5], null);
  await find(node => node.type === 'button' && node.props.onClick?.name === 'handleSave').props.onClick();
  assert.equal(saved.length, 2);
  assert.equal(data.hydrateOriaCareConfig(saved[0].oria_care_content).sections[1].paragraphImages[0].watermarkOpacity, 35);
  const Page = load('src/components/OriaCare/OriaCarePage.tsx', {
    react: { ...React, useState: value => [value, () => {}], useEffect() {} },
    'next/link': mocks['next/link'], '@/data/oriaCareData': data,
    'framer-motion': { motion: new Proxy({}, { get: (_target, key) => key }), useReducedMotion: () => true },
    '@/components/TranslationProvider': { useTranslation: () => ({ currentLang: 'en', setCurrentLang() {} }) },
    '@/components/SystemSettingsProvider': { useSystemSettings: () => ({ systemSettings: {} }) },
    './OriaCarePage.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, key) => key }) },
  }).default;
  const tree = Page({ initialConfig: data.hydrateOriaCareConfig(saved[0].oria_care_content), embedded: true, skipIntroduction: true });
  const content = nodes(tree);
  const textIndex = content.findIndex(node => node.type === 'p' && node.props.children === initial.sections[1].paragraphs[0].en);
  const imageIndex = content.findIndex(node => node.type === 'img' && node.props.src === 'https://example.com/inline.webp');
  const nextIndex = content.findIndex(node => node.type === 'p' && node.props.children === initial.sections[1].paragraphs[1].en);
  assert(textIndex < imageIndex && imageIndex < nextIndex, 'Image must appear between the chosen paragraphs');
  assert(content.some(node => node.props?.className === 'media-watermark' && node.props.style?.opacity === 0.35));
  button('Bỏ khung ảnh').props.onClick();
  assert.equal(states[0].sections[1].paragraphImages[0], null);
  assert.equal(data.hydrateOriaCareConfig(states[0]).sections[1].paragraphImages[0], null);
  assert.deepEqual(states[0].storyPhotos, before.storyPhotos);
  assert.equal(data.hydrateOriaCareConfig({ ...initial, sections: [{ ...initial.sections[0], paragraphImages: [{ src: 'valid.webp', watermarkOpacity: 999 }, null, { src: 5 }] }] }).sections[0].paragraphImages[0].watermarkOpacity, 15);
  console.log('Oria Care inline images passed: add, URL, upload, validation, failure recovery, watermark, save/reload, placement and remove; existing content preserved.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
