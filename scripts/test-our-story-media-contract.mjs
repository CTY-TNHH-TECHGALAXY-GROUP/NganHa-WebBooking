import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const repository = resolve(new URL('..', import.meta.url).pathname);

const loadTypeScriptModule = (filename, dependencies = {}) => {
  const source = readFileSync(filename, 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
    fileName: filename,
  });
  const module = { exports: {} };
  new Function('exports', 'module', 'require', compiled.outputText)(
    module.exports,
    module,
    (request) => dependencies[request] || require(request),
  );
  return module.exports;
};

const media = loadTypeScriptModule(resolve(repository, 'src/lib/media/responsiveSources.ts'));
const story = loadTypeScriptModule(resolve(repository, 'src/components/OurStory/OurStory.data.ts'), {
  '@/lib/media/responsiveSources': media,
  '@/lib/constants': {},
});
const storyComponentSource = readFileSync(resolve(repository, 'src/components/OurStory/OurStory.tsx'), 'utf8');

const originalV1 = 'https://example.test/original-v1.webp';
const originalV2 = 'https://example.test/original-v2.webp';
const v1Renditions = {
  '320': 'https://example.test/original-v1-w320.webp',
  '960': 'https://example.test/original-v1-w960.webp',
};

assert.deepEqual(
  media.normalizeResponsiveSources({ '64': 'https://example.test/64.webp', '0': 'no', bad: 'no', '128': '', '192': 1 }),
  { '64': 'https://example.test/64.webp' },
  'malformed width descriptors and non-URLs are removed before a srcset is emitted',
);
assert.deepEqual(
  media.responsiveSourcesForImage(originalV1, v1Renditions, originalV1),
  v1Renditions,
  'a matching source keeps its own derivatives',
);
assert.equal(
  media.responsiveSourcesForImage(originalV2, v1Renditions, originalV1),
  undefined,
  'a V2 original must not expose V1 derivatives',
);
assert.deepEqual(
  media.responsiveSourcesForImage(originalV2, v1Renditions),
  v1Renditions,
  'a legacy map without an identity remains a compatible fallback',
);
assert.equal(
  media.responsiveSourcesForImage('', v1Renditions, originalV1),
  undefined,
  'an empty original never emits an orphaned source map',
);

const imageV1 = {
  image: originalV1,
  responsiveSources: v1Renditions,
  responsiveSourceImage: originalV1,
  title: { vi: 'Ảnh V1', en: 'Image V1' },
};
assert.strictEqual(
  media.replaceMediaSourceAndClearRenditions(imageV1, 'image', originalV1, 'responsiveSources', 'responsiveSourceImage'),
  imageV1,
  'a text-only edit leaves rendition metadata intact',
);
assert.deepEqual(
  media.replaceMediaSourceAndClearRenditions(imageV1, 'image', originalV2, 'responsiveSources', 'responsiveSourceImage'),
  { image: originalV2, title: imageV1.title },
  'a source replacement removes only its stale map and identity',
);

const historyV1 = { chapters: [{ scenes: [{ ...imageV1 }] }] };
assert.deepEqual(
  media.clearStaleHistoryResponsiveSources(historyV1, { chapters: [{ scenes: [{ ...imageV1, title: { vi: 'Chỉ sửa chữ' } }] }] }),
  { chapters: [{ scenes: [{ ...imageV1, title: { vi: 'Chỉ sửa chữ' } }] }] },
  'a History text edit retains its rendition metadata',
);
assert.deepEqual(
  media.clearStaleHistoryResponsiveSources(historyV1, { chapters: [{ scenes: [{ ...imageV1, image: originalV2 }] }] }),
  { chapters: [{ scenes: [{ image: originalV2, title: imageV1.title }] }] },
  'a History source replacement clears only the stale rendition metadata',
);

const reorderedHistory = {
  chapters: [{ scenes: [
    { id: 'scene-a', image: originalV1, responsiveSources: v1Renditions, responsiveSourceImage: originalV1, title: 'A' },
    { id: 'scene-b', image: 'https://example.test/original-b.webp', responsiveSources: { '320': 'https://example.test/original-b-w320.webp' }, responsiveSourceImage: 'https://example.test/original-b.webp', title: 'B' },
  ] }],
};
const reorderedIncoming = {
  chapters: [{ scenes: [
    { id: 'scene-b', image: 'https://example.test/original-b-v2.webp', responsiveSources: { '320': 'https://example.test/original-b-w320.webp' }, responsiveSourceImage: 'https://example.test/original-b.webp', title: 'B' },
    { id: 'scene-a', image: originalV1, responsiveSources: v1Renditions, responsiveSourceImage: originalV1, title: 'A' },
  ] }],
};
assert.deepEqual(
  media.clearStaleHistoryResponsiveSources(reorderedHistory, reorderedIncoming),
  {
    chapters: [{ scenes: [
      { id: 'scene-b', image: 'https://example.test/original-b-v2.webp', title: 'B' },
      { id: 'scene-a', image: originalV1, responsiveSources: v1Renditions, responsiveSourceImage: originalV1, title: 'A' },
    ] }],
  },
  'a reorder pairs by stable identity: changed source clears its own map and unchanged source keeps its map',
);

const storyV1 = { locationSection: { cityImage: originalV1, cityImageResponsiveSources: v1Renditions, cityImageResponsiveSource: originalV1, title: { vi: 'V1' } } };
assert.deepEqual(
  media.clearStaleOurStoryResponsiveSources(storyV1, { locationSection: { ...storyV1.locationSection, cityImage: originalV2 } }),
  { locationSection: { cityImage: originalV2, title: { vi: 'V1' } } },
  'an Our Story source replacement clears only its stale rendition metadata',
);

const hydrated = story.hydrateOurStoryConfig({
  contentVersion: 3,
  header: { badge: { vi: 'Bản tiếng Việt mới' } },
  locationSection: {
    cityImage: originalV2,
    cityImageResponsiveSources: { ...v1Renditions, 'oops': 'broken' },
    cityImageResponsiveSource: originalV1,
  },
  filmReel: {
    frames: [{
      id: 99,
      frameTag: 'TEST',
      image: originalV2,
      responsiveSources: { '128': 'https://example.test/original-v2-w128.webp', wrong: 'broken' },
      responsiveSourceImage: originalV2,
      badge: { vi: 'Khung' },
      title: { vi: 'Khung phim' },
      desc: { vi: 'Mô tả' },
    }],
  },
});
assert.equal(hydrated.header.badge.vi, 'Bản tiếng Việt mới', 'a locale/text edit is preserved independently of media metadata');
assert.deepEqual(hydrated.locationSection.cityImageResponsiveSources, v1Renditions, 'hydration preserves valid map members only');
assert.equal(
  media.responsiveSourcesForImage(
    hydrated.locationSection.cityImage,
    hydrated.locationSection.cityImageResponsiveSources,
    hydrated.locationSection.cityImageResponsiveSource,
  ),
  undefined,
  'hydrated V2 content still rejects an explicitly V1 map',
);
assert.deepEqual(hydrated.filmReel.frames[0].responsiveSources, { '128': 'https://example.test/original-v2-w128.webp' });

assert.deepEqual(
  media.selectResponsiveSourceCandidate(originalV1, { '64': '/64.webp', '128': '/128.webp', '192': '/192.webp' }, originalV1, 64, 1),
  { width: 64, url: '/64.webp', requiredWidth: 64, undersized: false },
  'thumbnail selection uses the smallest candidate covering box × DPR',
);
assert.deepEqual(
  media.selectResponsiveSourceCandidate(originalV1, { '64': '/64.webp', '128': '/128.webp', '192': '/192.webp' }, originalV1, 64, 3),
  { width: 192, url: '/192.webp', requiredWidth: 192, undersized: false },
  'thumbnail selection scales its target by DPR',
);
assert.deepEqual(
  media.selectResponsiveSourceCandidate(originalV1, { '64': '/64.webp', '128': '/128.webp' }, originalV1, 96, 3),
  { width: 128, url: '/128.webp', requiredWidth: 288, undersized: true },
  'missing width coverage is explicitly marked undersized instead of being reported as an exact fit',
);
assert.match(storyComponentSource, /mediaGenerationRef\.current \+= 1/, 'decode generation must invalidate stale source events');
assert.match(storyComponentSource, /generation !== mediaGenerationRef\.current/, 'stale decode promises must not settle the current source');
assert.match(storyComponentSource, /key=\{sourceKey\}/, 'fallback source changes must remount the image element');

assert.equal(media.deferredMediaStateAfterDecode(320), 'loaded');
assert.equal(media.deferredMediaStateAfterDecode(0), 'error');
assert.deepEqual(media.deferredMediaErrorAction(true, false), {
  state: 'loading', useResponsiveSource: false, retryOriginal: true,
});
assert.deepEqual(media.deferredMediaErrorAction(false, true), {
  state: 'error', useResponsiveSource: false, retryOriginal: false,
});

console.log('PASS Our Story media contract: identity, legacy fallback, text preservation, source replacement, malformed maps, locale hydration, and load states');
