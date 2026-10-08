import assert from 'node:assert/strict';
import { DEFAULT_HOME_SPA_CONFIG, hydrateHomeSpaConfig } from '../src/data/homeSpaData.ts';

const saved = {
  pageTitle: { vi: 'Oria Home Spa', en: 'My Oria Home Spa' },
  pageSubtitle: { vi: 'Nội dung riêng' },
  sections: [{
    id: 'custom-section',
    heading: { en: 'About Oria Home Spa' },
    paragraphs: [{ en: 'Visit Oria Home Spa at home.' }, { vi: 'Đoạn văn giữ nguyên' }],
  }],
  storyPhotos: ['https://example.com/photo.jpg'],
  storyPhotosWatermark: [false],
  storyPhotosWatermarkOpacity: [35],
  closingText: { en: 'Book Oria Home Spa' },
  ctaText: { en: 'Contact' },
  ctaLink: 'tel:+84123456789',
};
const before = structuredClone(saved);
const config = hydrateHomeSpaConfig(saved);
assert.deepEqual(saved, before, 'Reading content must not mutate the stored record');
assert.equal(config.pageTitle.vi, 'Oria Home Care');
assert.equal(config.pageTitle.en, 'My Oria Home Care');
assert.equal(config.sections[0].heading.en, 'About Oria Home Care');
assert.equal(config.sections[0].paragraphs[0].en, 'Visit Oria Home Care at home.');
assert.equal(config.closingText.en, 'Book Oria Home Care');
assert.equal(config.sections[0].id, saved.sections[0].id);
assert.deepEqual(config.sections[0].paragraphs[1], saved.sections[0].paragraphs[1]);
for (const key of ['pageSubtitle', 'storyPhotos', 'storyPhotosWatermark', 'storyPhotosWatermarkOpacity', 'ctaText', 'ctaLink']) {
  assert.deepEqual(config[key], saved[key], `${key} must be preserved`);
}
for (const title of Object.values(DEFAULT_HOME_SPA_CONFIG.pageTitle)) {
  assert.equal(title, 'Oria Home Care');
}
assert.deepEqual(hydrateHomeSpaConfig(null), DEFAULT_HOME_SPA_CONFIG);
console.log('Oria Home Care: legacy names updated; content, photos and settings preserved.');
