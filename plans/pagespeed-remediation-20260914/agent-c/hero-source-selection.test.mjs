import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { attachHeroVideoSource, HERO_MOBILE_BREAKPOINT, selectHeroVideoSource } from '../../../src/components/Hero/heroVideoSource.mjs';

const renditionSet = {
  url: '/videos/hero-original.mp4',
  media_url: '/videos/hero-legacy.mp4',
  mobile_url: '/videos/hero-mobile-720.mp4',
  desktop_url: '/videos/hero-desktop-1280.mp4',
};

test('selects one mobile or desktop rendition with canonical fallback', () => {
  assert.equal(selectHeroVideoSource(renditionSet, 390), renditionSet.mobile_url);
  assert.equal(selectHeroVideoSource(renditionSet, 1440), renditionSet.desktop_url);
  assert.equal(selectHeroVideoSource(renditionSet, HERO_MOBILE_BREAKPOINT), renditionSet.desktop_url);
  assert.equal(selectHeroVideoSource({ ...renditionSet, mobile_url: ' ' }, 390), renditionSet.desktop_url);
  assert.equal(selectHeroVideoSource({ url: renditionSet.url }, 390), renditionSet.url);
  assert.equal(selectHeroVideoSource({ media_url: renditionSet.media_url }, 1440), renditionSet.media_url);
  assert.equal(selectHeroVideoSource({}, 390), null);
});

test('accepts the server-normalized camelCase rendition fields', () => {
  assert.equal(selectHeroVideoSource({
    url: '/videos/canonical.mp4',
    mobileUrl: '/videos/mobile.mp4',
    desktopUrl: '/videos/desktop.mp4',
  }, 390), '/videos/mobile.mp4');
  assert.equal(selectHeroVideoSource({
    url: 'https://cdn.example.test/canonical.mp4',
    desktopUrl: 'https://cdn.example.test/desktop.mp4',
  }, 1440), 'https://cdn.example.test/desktop.mp4');
});

test('attaches one source and loads exactly once per attempt', () => {
  const video = {
    src: '',
    loads: 0,
    load() { this.loads += 1; },
  };

  const first = attachHeroVideoSource(video, renditionSet.mobile_url, 'attempt-1', null);
  const repeat = attachHeroVideoSource(video, renditionSet.mobile_url, 'attempt-1', first);
  const retry = attachHeroVideoSource(video, renditionSet.mobile_url, 'attempt-2', repeat);

  assert.equal(video.src, renditionSet.mobile_url);
  assert.equal(video.loads, 2);
  assert.equal(repeat, first);
  assert.equal(retry?.attemptKey, 'attempt-2');
});

test('Hero starts source-free and delegates assignment to the one-source helper', () => {
  const heroSource = readFileSync(new URL('../../../src/components/Hero/Hero.tsx', import.meta.url), 'utf8');
  const configSource = readFileSync(new URL('../../../src/lib/config/heroVideos.ts', import.meta.url), 'utf8');
  assert.match(heroSource, /preload=\{selectedVideoSource \? 'auto' : 'none'\}/);
  assert.doesNotMatch(heroSource, /src=\{activeVideo\.url\}/);
  assert.match(heroSource, /attachHeroVideoSource\(\s*video,\s*selectedVideoSource,/);
  assert.doesNotMatch(heroSource, /<source\b/);
  assert.match(heroSource, /poster=\{posterSource \|\| DEFAULT_HERO_POSTER\}/);
  assert.match(configSource, /mobile_url\?: string/);
  assert.match(configSource, /desktop_url\?: string/);
  assert.match(configSource, /normalizeVideoUrl\(mobileUrl\)/);
  assert.match(configSource, /normalizeVideoUrl\(desktopUrl\)/);
});

console.log('PASS hero source selection: one rendition is selected before exactly one attachment per attempt');
