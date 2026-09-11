const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const Module = require('node:module');
const ts = require('typescript');
const rootDir = path.resolve(__dirname, '..');
const resolve = Module._resolveFilename;
Module._resolveFilename = function (name, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(rootDir, 'src', name.slice(2)) : name, ...args);
};
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, filename) => {
  module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  }).outputText, filename);
};
const { JSDOM } = require('jsdom');
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost' });
global.window = dom.window;
global.document = dom.window.document;
global.HTMLElement = dom.window.HTMLElement;
global.IS_REACT_ACT_ENVIRONMENT = true;
const React = require('react');
const { createRoot } = require('react-dom/client');
const Modal = require('../src/components/CustomForYou').default;
const root = createRoot(document.getElementById('root'));
const base = { ID: 'NHS1000', NAMES: { en: 'TEST NHS1000', vi: 'TEST NHS1000' }, SHOW_CUSTOM_FOR_YOU: true, SHOW_PREFERENCES: true, SHOW_STRENGTH: true, SHOW_GENDER: false, SHOW_FOCUS: false, SHOW_NOTES: true, FOCUS_POSITION: {} };
let saved;
let counter = 0;
async function render(flags = {}, extra = {}) {
  saved = undefined;
  await React.act(async () => root.render(React.createElement(Modal, { key: ++counter, isOpen: true, onClose() {}, onSave(value) { saved = value; }, serviceData: { ...base, ...flags }, lang: 'en', ...extra })));
}
async function click(label) {
  const button = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === label);
  assert.ok(button, `Missing button: ${label}`);
  await React.act(async () => button.click());
}
const text = () => document.body.textContent;
let failed = 0;
async function test(name, fn) {
  try { await fn(); console.log(`PASS ${name}`); } catch (error) { failed++; console.error(`FAIL ${name}: ${error.message}`); }
}
(async () => {
  await test('01 NHS1000 defaults: medium, no therapist or focus', async () => {
    await render(); await click('SAVE'); assert.equal(saved.strength, 'medium'); assert.equal(saved.therapist, undefined); assert.deepEqual(saved.bodyParts, { focus: [], avoid: [] }); assert.ok(!text().includes('Random'));
  });
  await test('02 change strength and save', async () => {
    await render(); await click('Strong'); await click('SAVE'); assert.equal(saved.strength, 'strong');
  });
  await test('03 preferences disabled overrides child flags', async () => {
    await render({ SHOW_PREFERENCES: false, SHOW_GENDER: true }); await click('SAVE'); assert.equal(saved.strength, undefined); assert.equal(saved.therapist, undefined); assert.ok(!text().includes('Medium'));
  });
  await test('04 false/null/missing strength never generates medium', async () => {
    for (const value of [false, null, undefined]) { await render({ SHOW_STRENGTH: value }); await click('SAVE'); assert.equal(saved.strength, undefined); }
  });
  await test('05 enabled gender allows explicit selection', async () => {
    await render({ SHOW_GENDER: true }); await click('Female'); await click('SAVE'); assert.equal(saved.therapist, 'female');
  });
  await test('06 unavailable focus configurations show no body selector', async () => {
    for (const value of [{}, null, [], '{bad', { FOOT: false }]) { await render({ SHOW_FOCUS: true, FOCUS_POSITION: value }); await click('SAVE'); assert.deepEqual(saved.bodyParts, { focus: [], avoid: [] }); assert.equal(document.querySelectorAll('textarea').length, 1); }
  });
  await test('07 notes disabled hides notes and room', async () => {
    await render({ SHOW_NOTES: false }, { privateRoomPriceVND: 105000 }); assert.equal(document.querySelectorAll('textarea').length, 0); assert.ok(!text().includes('Private Room')); await click('SAVE'); assert.equal(saved.addons, undefined);
  });
  await test('08 room toggle preserves parent pressure', async () => {
    await render({}, { privateRoomPriceVND: 105000 }); const checkbox = document.querySelector('input[type="checkbox"]'); assert.ok(checkbox); await React.act(async () => checkbox.click()); await click('SAVE'); assert.equal(saved.addons.privateRoom, true); assert.equal(saved.strength, 'medium');
  });
  await test('09 legacy meaningful choices visibly require review', async () => {
    await render({}, { initialData: { strength: 'strong', therapist: 'female', bodyParts: { focus: ['FOOT'], avoid: ['BACK'] }, notes: { tag0: false, tag1: true, content: 'TEST allergy' } } }); assert.ok(document.querySelector('[role="alert"]')); await click('SAVE'); assert.equal(saved.therapist, undefined); assert.deepEqual(saved.bodyParts, { focus: [], avoid: [] }); assert.equal(saved.notes.content, 'TEST allergy'); assert.equal(saved.strength, 'strong');
  });
  await test('10 five languages save and closed modal cleanup', async () => {
    for (const [lang, label] of [['vi','LƯU'],['en','SAVE'],['cn','保存'],['jp','保存'],['kr','저장']]) { await render({}, { lang }); await click(label); assert.equal(saved.strength, 'medium'); }
    await render({}, { isOpen: false }); assert.equal(document.getElementById('root').textContent, ''); assert.ok(!document.body.classList.contains('modal-open'));
  });
  await React.act(async () => root.unmount());
  console.log(`Modal DOM acceptance: ${10 - failed}/10 passed`);
  process.exitCode = failed ? 1 : 0;
})();
