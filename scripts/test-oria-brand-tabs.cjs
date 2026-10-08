const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(file, mocks = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    fileName: file,
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => mocks[name] || require(name), module, module.exports);
  return module.exports;
}

const navigation = load('src/lib/oriaNavigation.ts');
const spaContent = load('src/data/oriaSpaContent.ts');
assert.equal(navigation.ORIA_BRANDS.length, 6);
for (const label of ['Therapy', 'Trị liệu', '理疗', '治疗', 'セラピー', '테라피', '치료']) assert.equal(navigation.renamedTherapyLabel(label), 'Deep Body Treament');
assert.equal(navigation.renamedTherapyLabel('Custom treatment'), 'Custom treatment');
assert.equal(new Set(navigation.ORIA_BRANDS.map(brand => brand.href)).size, 6);
assert.equal(navigation.oriaBrandHref('/', 'en'), '/en');
assert.equal(navigation.oriaBrandHref('/oriahome', 'jp'), '/jp/oriahome');
assert.equal(navigation.oriaBrandHref('/local-tour', 'cn'), '/cn/local-tour');
assert.equal(navigation.oriaBrandHref('/academy', 'kr'), '/academy');
for (const [hash, expected] of [['#history-2015', 'history'], ['#welcome', 'space'], ['#floor2', 'space'], ['#services', 'service'], ['#our-story', 'our-story'], ['#unknown', null]]) {
  assert.equal(navigation.spaTabFromHash(hash), expected);
}

const slots = [];
const effects = [];
let cursor = 0;
let locale = 'en';
let savedSpaServiceContent;
let stripScrolls = 0;
let focusedIndex = -1;
global.window = {
  location: { pathname: '/en', search: '?keep=1', hash: '' },
  history: { replaceState(_state, _unused, path) {
    assert(path.startsWith('/en?keep=1#'), 'Switching tabs must preserve the path and query');
    window.location.hash = path.slice(path.indexOf('#'));
  } },
  addEventListener(_name, handler) { this.hashHandler = handler; },
  removeEventListener() {},
};
const hooks = {
  useState(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = initial;
    return [slots[index], value => { slots[index] = value; }];
  },
  useRef(initial) {
    const index = cursor++;
    if (!(index in slots)) slots[index] = { current: initial === null ? {
      scrollIntoView() { stripScrolls++; },
      querySelectorAll() { return navigation.SPA_TABS.map((_, i) => ({ focus() { focusedIndex = i; }, scrollIntoView() {} })); },
    } : initial };
    return slots[index];
  },
  useEffect(effect) { effects.push(effect); },
};
const fakeContent = name => ({ __esModule: true, default: name });
const Tabs = load('src/components/OriaSpa/OriaSpaTabs.tsx', {
  react: hooks,
  'next/dynamic': { __esModule: true, default: loader => loader.toString().match(/components\/(.*?)['"]/)?.[1] || 'LazyContent' },
  'next/link': fakeContent('Link'),
  '@/components/OurStory/OurStory': fakeContent('OurStory'),
  '@/components/TranslationProvider': { useTranslation: () => ({ currentLang: locale }) },
  '@/components/SystemSettingsProvider': { useSystemSettings: () => ({
    systemSettings: { homepage_content: { spaServiceContent: savedSpaServiceContent, navigation: { designJourneyBadge: '55%', therapy: { en: 'Therapy' } } } },
    getLocalizedText: (text, lang, fallback) => text?.[lang] || fallback,
  }) },
  '@/lib/oriaNavigation': navigation,
  '@/data/oriaSpaContent': spaContent,
  './OriaSpaTabs.module.css': { __esModule: true, default: new Proxy({}, { get: (_target, key) => key }) },
}).default;

function render() { cursor = 0; return Tabs(); }
function descendants(node) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(descendants);
  return [node, ...descendants(node.props?.children)];
}
function nodes(tree, role) { return descendants(tree).filter(node => node.props?.role === role); }
function selected(tree) { return nodes(tree, 'tab').find(node => node.props['aria-selected']); }
function panel(tree, id) { return nodes(tree, 'tabpanel').find(node => node.props.id === `oria-panel-${id}`); }
function click(tree, id) { nodes(tree, 'tab').find(node => node.props.id === `oria-tab-${id}`).props.onClick(); return render(); }

let tree = render();
effects[0]();
assert.equal(stripScrolls, 0, 'Homepage must start at the video hero without scrolling');
assert.equal(selected(tree).props.id, 'oria-tab-our-story');
assert.equal(nodes(tree, 'tab').length, 7);
assert.equal(descendants(panel(tree, 'history').props.children).length, 0, 'History should load only when opened');
tree = click(tree, 'service');
assert.equal(selected(tree).props.id, 'oria-tab-service');
const links = descendants(tree).filter(node => node.type === 'Link');
assert.equal(links.length, 3);
assert.equal(links[1].props.href, '/en/pure-relaxation');
assert(links.some(link => link.props.children[1].props.children === '55%'), 'Configured badges must be preserved');
assert(links.some(link => link.props.children[1].props.children === '30%'));
assert(links.some(link => link.props.children[1].props.children === '20%'));
assert.equal(links[0].props.href, '/design-your-journey');
assert.equal(links[2].props.href, '/therapy');
assert(descendants(links[2]).some(node => node.props?.className === 'serviceTitle' && node.props.children === 'Deep Body Treament'));
assert(descendants(links[0]).some(node => node.props?.className === 'serviceDescription' && node.props.children.includes('in person')));
assert(descendants(links[2]).some(node => node.props?.className === 'serviceAction' && node.props.children === 'Coming soon'));
assert(links.every(link => descendants(link).some(node => node.props?.['aria-hidden'] === 'true')), 'Decorative arrows must not clutter link names');
tree = click(tree, 'lost-and-found');
const retained = panel(tree, 'lost-and-found').props.children;
assert(retained.some(Boolean));
tree = click(tree, 'history');
assert.equal(panel(tree, 'lost-and-found').props.hidden, true);
assert.deepEqual(panel(tree, 'lost-and-found').props.children, retained, 'Lost & Found stays mounted to preserve form input');
tree = click(tree, 'space');
assert.equal(descendants(panel(tree, 'history').props.children).length, 0, 'Hidden History must unmount its animation listeners');
let prevented = false;
nodes(tree, 'tab')[0].props.onKeyDown({ key: 'ArrowLeft', preventDefault() { prevented = true; } });
tree = render();
assert(prevented);
assert.equal(focusedIndex, 6);
assert.equal(selected(tree).props.id, 'oria-tab-privileges');
window.location.hash = '#history-2026';
window.hashHandler();
tree = render();
assert.equal(selected(tree).props.id, 'oria-tab-history');
const previousStripScrolls = stripScrolls;
window.location.hash = '#history-2015';
window.hashHandler();
assert.equal(stripScrolls, previousStripScrolls, 'Chapter navigation inside History must keep its native anchor behavior');
for (locale of ['vi', 'en', 'cn', 'jp', 'kr']) {
  tree = render();
  assert(nodes(tree, 'tab').every(node => typeof node.props.children === 'string' && node.props.children.length));
  tree = click(tree, 'service');
  const serviceDescriptions = descendants(tree).filter(node => node.props?.className === 'serviceDescription');
  assert.equal(serviceDescriptions.length, 3);
  assert(serviceDescriptions.every(node => typeof node.props.children === 'string' && node.props.children.length));
  assert.equal(descendants(tree).filter(node => node.props?.className === 'serviceAction').length, 3);
}
const adminSource = fs.readFileSync('src/app/admin/layout.tsx', 'utf8');
const adminAst = ts.createSourceFile('layout.tsx', adminSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
function adminInitializer(name) {
  for (const statement of adminAst.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    const declaration = statement.declarationList.declarations.find(item => item.name.getText(adminAst) === name);
    if (declaration) return declaration.initializer.getText(adminAst);
  }
  throw new Error(`Missing admin navigation constant: ${name}`);
}
const icons = ['LayoutDashboard', 'BookOpen', 'FileText', 'Wrench', 'Film', 'Search', 'Globe', 'Settings', 'ArchiveRestore', 'ImagePlus', 'Compass', 'Home', 'Trees', 'Store', 'BarChart3', 'UserCog'];
const adminItems = new Function(...icons, `return ${adminInitializer('NAV_ITEMS')}`)(...icons);
const adminGroups = new Function(`return ${adminInitializer('NAV_GROUPS')}`)();
const groupedRoutes = adminGroups.flatMap(group => group.hrefs);
assert.equal(groupedRoutes.length, adminItems.length);
assert.equal(new Set(groupedRoutes).size, adminItems.length);
assert(adminItems.every(item => groupedRoutes.includes(item.href)), 'Every management tool belongs to exactly one group');
assert.equal(adminItems.find(item => item.href === '/admin/analytics').gate, 'analytics');
assert.equal(adminItems.find(item => item.href === '/admin/editor-permissions').gate, 'editorPermissions');
assert(!adminSource.includes('nav-panel-empty'), 'Public menu changes must stay outside admin');
const headerSource = fs.readFileSync('src/components/Header/Header.tsx', 'utf8');
assert(headerSource.includes('className="nav-panel-left nav-panel-empty" aria-hidden="true"'));
assert(!headerSource.includes('NAV_ITEMS.map((item) => renderCategory(item))'), 'The brown panel must not duplicate the brand card');
assert(headerSource.includes('brand.sub &&'), 'Keep the existing brand card copy');
assert(headerSource.includes('aria-controls="oria-brand-links"'));

const menuEffects = [];
let stateIndex = 0;
let menuOpen = true;
let keyHandler;
let menuFocus;
const first = { tabIndex: 0, getClientRects: () => [1], focus: () => { menuFocus = 'first'; } };
const last = { tabIndex: 0, getClientRects: () => [1], focus: () => { menuFocus = 'last'; } };
const hidden = { tabIndex: 0, getClientRects: () => [], focus: () => { throw new Error('Hidden links must not receive focus'); } };
const menu = { querySelectorAll: () => [first, hidden, last], contains: element => [first, last].includes(element) };
global.document = {
  activeElement: last, documentElement: { scrollTop: 0 },
  addEventListener: (name, callback) => { if (name === 'keydown') keyHandler = callback; },
  removeEventListener() {},
};
window.requestAnimationFrame = () => 1;
window.cancelAnimationFrame = () => {};
const headerLogic = load('src/components/Header/Header.logic.ts', {
  react: {
    useState: initial => [stateIndex++ === 0 ? true : initial, value => { menuOpen = value; }],
    useRef: () => ({ current: { closest: () => menu } }),
    useEffect: callback => menuEffects.push(callback),
  },
  '@/components/TranslationProvider': { useTranslation: () => ({ currentLang: 'en', setCurrentLang() {}, t() {} }) },
});
headerLogic.useHeaderLogic();
menuEffects.forEach(callback => callback());
function menuKey(key, shiftKey = false) {
  let prevented = false;
  keyHandler({ key, shiftKey, preventDefault: () => { prevented = true; } });
  return prevented;
}
assert(menuKey('Tab'));
assert.equal(menuFocus, 'first');
document.activeElement = first;
assert(menuKey('Tab', true));
assert.equal(menuFocus, 'last');
assert.equal(menuKey('Tab'), false, 'Normal navigation within the menu should keep native Tab behavior');
document.activeElement = {};
assert(menuKey('Tab'));
assert.equal(menuFocus, 'first');
assert(menuKey('Escape'));
assert.equal(menuOpen, false);
console.log('Oria navigation and tabs passed: 6 brands, 7 tabs, 5 languages, badges, keyboard, deep links and retained Lost & Found.');

async function testNavigationBackgroundUpload() {
  const state = [];
  let index = 0;
  let uploads = 0;
  let uploadError = null;
  const Page = load('src/app/admin/content/homepage/page.tsx', {
    react: {
      useState(initial) {
        const slot = index++;
        if (!(slot in state)) state[slot] = slot === 0 ? false : initial;
        return [state[slot], value => { state[slot] = typeof value === 'function' ? value(state[slot]) : value; }];
      },
      useEffect() {},
    },
    '@/lib/oriaNavigation': navigation,
    '@/data/oriaSpaContent': spaContent,
    '@/lib/supabase': { createClient: () => ({ storage: { from: bucket => {
      assert.equal(bucket, 'media-uploads');
      return {
        async upload(path, _file, options) { uploads++; assert(path.startsWith('marketing/navigation-')); assert.equal(options.upsert, false); return { error: uploadError }; },
        getPublicUrl: () => ({ data: { publicUrl: 'https://example.com/navigation.webp' } }),
      };
    } } }) },
  }).default;
  function page() { index = 0; return Page(); }
  function input() { return descendants(page()).find(node => node.props?.type === 'file'); }
  function event(type, size) { return { currentTarget: { files: [{ type, size }], value: 'selected' } }; }
  page();
  const partial = { spaServiceContent: { intro: { vi: 'Nội dung riêng', en: '' } }, untouched: 'keep' };
  const snapshot = JSON.stringify(partial);
  const hydrated = spaContent.fillLocalizedDefaults({ spaServiceContent: spaContent.DEFAULT_SPA_SERVICE_CONTENT }, partial);
  assert.equal(JSON.stringify(partial), snapshot);
  assert.equal(hydrated.untouched, 'keep');
  assert.equal(hydrated.spaServiceContent.intro.vi, 'Nội dung riêng');
  assert.equal(hydrated.spaServiceContent.intro.en, '');
  for (const field of Object.keys(spaContent.DEFAULT_SPA_SERVICE_CONTENT)) {
    for (const lang of ['vi', 'en', 'cn', 'jp', 'kr']) assert(state[5].spaServiceContent[field][lang].trim());
  }
  const introduction = descendants(page()).find(node => node.type === 'textarea' && node.props.value === state[5].spaServiceContent.intro.vi);
  introduction.props.onChange({ target: { value: 'Giới thiệu chỉnh trong admin' } });
  assert.equal(state[5].spaServiceContent.intro.vi, 'Giới thiệu chỉnh trong admin');
  assert.equal(state[5].spaServiceContent.intro.en, spaContent.DEFAULT_SPA_SERVICE_CONTENT.intro.en);
  let saved;
  global.fetch = async (url, options) => { assert.equal(url, '/api/admin/system-settings'); saved = JSON.parse(options.body); return { ok: true }; };
  const timeout = global.setTimeout;
  global.setTimeout = () => 0;
  try {
    await descendants(page()).find(node => node.type === 'button' && node.props.onClick?.name === 'handleSave').props.onClick();
  } finally { global.setTimeout = timeout; }
  assert.equal(saved.homepage_content.spaServiceContent.intro.vi, 'Giới thiệu chỉnh trong admin');
  savedSpaServiceContent = saved.homepage_content.spaServiceContent;
  locale = 'vi';
  const updated = click(render(), 'service');
  assert(descendants(updated).some(node => node.type === 'p' && node.props.children === 'Giới thiệu chỉnh trong admin'));
  console.log('Admin service content passed: five-language defaults, preserved saved values, editing, save payload and website display.');
  const before = JSON.parse(JSON.stringify(state[5]));
  assert.equal(before.navigation.bgImage, navigation.DEFAULT_NAVIGATION_BACKGROUND);
  const valid = event('image/webp', 1024);
  const pending = input().props.onChange(valid);
  assert(descendants(page()).some(node => node.type === 'button' && node.props.onClick?.name === 'handleSave' && node.props.disabled), 'Saving is disabled while an image is uploading');
  await pending;
  assert.equal(uploads, 1);
  assert.equal(state[5].navigation.bgImage, 'https://example.com/navigation.webp');
  assert.deepEqual({ ...state[5], navigation: { ...state[5].navigation, bgImage: before.navigation.bgImage } }, before);
  assert.equal(valid.currentTarget.value, '');
  assert.equal(state[2], false);
  for (const invalid of [event('image/svg+xml', 100), event('image/png', 10 * 1024 * 1024 + 1)]) {
    await input().props.onChange(invalid);
    assert.equal(uploads, 1);
    assert.equal(state[3].type, 'error');
    assert.equal(invalid.currentTarget.value, '');
  }
  uploadError = new Error('Upload failed');
  const failed = event('image/png', 100);
  await input().props.onChange(failed);
  assert.equal(state[5].navigation.bgImage, 'https://example.com/navigation.webp', 'Failed uploads must preserve the previous image');
  assert.equal(state[3].type, 'error');
  assert.equal(state[2], false);
  assert.equal(failed.currentTarget.value, '');
  console.log('Navigation background upload passed: preview, file validation, failure recovery, save gating and preserved content.');
}
testNavigationBackgroundUpload().catch(error => { console.error(error); process.exitCode = 1; });
