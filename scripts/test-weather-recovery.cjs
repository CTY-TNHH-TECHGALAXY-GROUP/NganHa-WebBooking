const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const state = [];
let cursor = 0;
let effect;
let timer;
let cleared;
let signal;
let outcome = 'network';
global.sessionStorage = { getItem: () => null };
global.setTimeout = (callback, delay) => { timer = { callback, delay }; return 1; };
global.clearTimeout = id => { cleared = id; };
global.fetch = async (_url, options) => {
  signal = options.signal;
  if (outcome === 'network') throw new Error('Temporary failure');
  return { ok: outcome !== 'http', json: async () => outcome === 'null' ? null : { status: outcome } };
};
const mocks = {
  react: {
    useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = value; }]; },
    useEffect: callback => { effect = callback; },
  },
  '@/components/TranslationProvider': { useTranslation: () => ({ currentLang: 'en' }) },
  '@/lib/zIndex': { Z: { FLOATING: 90 } },
  './SpaWeatherStatus.i18n': { weatherTexts: { en: { noRain: 'No rain', rain: 'Rain', showWeather: 'Weather' } } },
  './SpaWeatherStatus.module.css': { default: {} },
};
const moduleObject = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/components/weather/SpaWeatherStatus.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
new Function('require', 'module', 'exports', code)(name => mocks[name] || require(name), moduleObject, moduleObject.exports);
const Component = moduleObject.exports.default;
const i18nModule = { exports: {} };
new Function('require', 'module', 'exports', ts.transpileModule(fs.readFileSync('src/components/weather/SpaWeatherStatus.i18n.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText)(require, i18nModule, i18nModule.exports);
mocks['./SpaWeatherStatus.i18n'].weatherTexts = i18nModule.exports.weatherTexts;
function descendants(node) { return !node || typeof node !== 'object' ? [] : Array.isArray(node) ? node.flatMap(descendants) : [node, ...descendants(node.props?.children)]; }
const props = { isContactMenuOpen: false, isGreetingVisible: false };
(async () => {
  for (const lang of ['vi', 'en', 'cn', 'jp', 'kr']) {
    state.length = 0; cursor = 0;
    const seeded = Component({ ...props, initialStatus: 'rain', lang });
    assert.equal(seeded.props['data-weather-status'], 'rain');
    assert(descendants(seeded).some(node => (Array.isArray(node.props?.children) ? node.props.children : [node.props?.children]).includes(i18nModule.exports.weatherTexts[lang].rain)));
  }
  state.length = 0; cursor = 0;
  assert.equal(Component({ ...props, initialStatus: 'invalid' }), null);
  state.length = 0; cursor = 0;
  assert.equal(Component(props), null);
  const cleanup = effect();
  await Promise.resolve(); await Promise.resolve();
  assert.equal(timer.delay, 30_000);
  for (const failure of ['http', 'null', 'invalid']) {
    outcome = failure; await timer.callback(); assert.equal(timer.delay, 30_000); assert.equal(state[0], null);
  }
  outcome = 'no_rain'; await timer.callback();
  assert.equal(state[0], 'no_rain'); assert.equal(timer.delay, 600_000);
  cursor = 0;
  assert.equal(Component(props).props['data-weather-status'], 'no_rain');
  outcome = 'network'; await timer.callback();
  assert.equal(state[0], 'no_rain'); assert.equal(timer.delay, 30_000);
  cleanup(); assert(signal.aborted); assert.equal(cleared, 1);
  const previousTimer = timer;
  outcome = 'rain'; await timer.callback();
  assert.equal(state[0], 'no_rain'); assert.equal(timer, previousTimer);
  console.log('Weather initial rendering and recovery passed (5 locales): retry failures, recover widget, refresh, retain last status and stop on unmount.');
})().catch(error => { console.error(error); process.exitCode = 1; });
