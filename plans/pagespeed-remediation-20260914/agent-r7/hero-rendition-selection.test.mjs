import assert from 'node:assert/strict';
import test from 'node:test';
import { isLocalHeroCandidate, selectHeroRendition } from './hero-rendition-selection.mjs';

const candidate = {
  url: '/videos/hero-original.mp4',
  mobile_url: '/videos/hero-mobile-720.mp4',
  desktop_url: '/videos/hero-desktop-1280.mp4',
};

test('mobile selects mobile candidate before load', () => {
  assert.equal(selectHeroRendition(candidate, 390), '/videos/hero-mobile-720.mp4');
});

test('desktop selects desktop candidate before load', () => {
  assert.equal(selectHeroRendition(candidate, 1440), '/videos/hero-desktop-1280.mp4');
});

test('missing mobile candidate falls back to desktop then canonical', () => {
  assert.equal(selectHeroRendition({ ...candidate, mobile_url: '' }, 390), candidate.desktop_url);
  assert.equal(selectHeroRendition({ url: candidate.url, mobile_url: '' }, 390), candidate.url);
});

test('current contract remains canonical and does not invent a remote source', () => {
  assert.equal(selectHeroRendition({ url: candidate.url }, 390), candidate.url);
  assert.equal(selectHeroRendition({ media_url: candidate.url }, 1440), candidate.url);
  assert.equal(selectHeroRendition({}, 390), null);
});

test('local-only gate rejects arbitrary remote candidates', () => {
  assert.equal(isLocalHeroCandidate('/videos/hero-mobile-720.mp4'), true);
  assert.equal(isLocalHeroCandidate('https://example.invalid/hero.mp4'), false);
  assert.equal(isLocalHeroCandidate(''), false);
});
