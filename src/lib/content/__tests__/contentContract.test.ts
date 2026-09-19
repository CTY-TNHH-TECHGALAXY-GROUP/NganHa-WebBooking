import assert from 'node:assert/strict';
import test from 'node:test';
import { contentBlockSchema, focalPointSchema, linkUrl, videoBlockSchema, zoomSchema } from '../schemas/index.ts';
import { imageComposition } from '../imageComposition.ts';
import { parseContentDocument } from '../parseContentDocument.ts';
import { resolveLocalizedValue } from '../resolveLocalizedValue.ts';

test('validates a V1 document and preserves block order', () => {
  const result = parseContentDocument({
    schemaVersion: 1,
    blocks: [
      { id: 'heading-1', type: 'heading', props: { text: { en: 'Hello' }, level: 2 } },
      { id: 'divider-1', type: 'divider', props: { style: 'subtle-line' } },
    ],
  });
  assert.equal(result.status, 'valid');
  if (result.status === 'valid') assert.deepEqual(result.document.blocks.map((block) => block.id), ['heading-1', 'divider-1']);
});

test('skips unknown and malformed blocks without invalidating the document', () => {
  const result = parseContentDocument({
    schemaVersion: 1,
    blocks: [
      { id: 'unknown-1', type: 'futureBlock', props: {} },
      { id: 'bad-1', type: 'heading', props: { text: { en: 'bad' }, level: 1 } },
      { id: 'good-1', type: 'divider', props: { style: 'gold-flourish' } },
    ],
  });
  assert.equal(result.status, 'valid');
  if (result.status === 'valid') {
    assert.deepEqual(result.document.blocks.map((block) => block.id), ['good-1']);
    assert.deepEqual(result.skippedBlockIds, ['unknown-1', 'bad-1']);
  }
});

test('distinguishes unsupported schema versions', () => {
  assert.equal(parseContentDocument({ schemaVersion: 2, blocks: [] }).status, 'unsupported');
  assert.equal(parseContentDocument({ blocks: [] }).status, 'invalid');
  assert.equal(parseContentDocument({ schemaVersion: 1, blocks: 'bad' }).status, 'invalid');
});

test('uses requested locale, then English, then Vietnamese', () => {
  assert.equal(resolveLocalizedValue({ jp: '日本語', en: 'English', vi: 'Tiếng Việt' }, 'jp').value, '日本語');
  assert.equal(resolveLocalizedValue({ en: 'English', vi: 'Tiếng Việt' }, 'jp').value, 'English');
  assert.equal(resolveLocalizedValue({ vi: 'Tiếng Việt' }, 'jp').value, 'Tiếng Việt');
});

test('rejects unsafe URLs and out-of-range composition values', () => {
  assert.equal(linkUrl.safeParse('javascript:alert(1)').success, false);
  assert.equal(linkUrl.safeParse('//evil.example/path').success, false);
  assert.equal(focalPointSchema.safeParse({ x: -1, y: 50 }).success, false);
  assert.equal(focalPointSchema.safeParse({ x: 50, y: 101 }).success, false);
  assert.equal(zoomSchema.safeParse(1.03).success, false);
  assert.equal(zoomSchema.safeParse(1.25).success, true);
  assert.equal(contentBlockSchema.safeParse({
    id: 'cta-1',
    type: 'cta',
    customClass: 'unsafe',
    props: { title: { en: 'Go' }, buttonText: { en: 'Go' }, buttonUrl: 'javascript:alert(1)', variant: 'gold-solid' },
  }).success, false);
  assert.equal(contentBlockSchema.safeParse({
    id: 'rich-1',
    type: 'richText',
    props: { content: { en: { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'x', marks: [{ type: 'link', attrs: { href: 'javascript:alert(1)' } }] }] }] } } },
  }).success, false);
  assert.equal(videoBlockSchema.safeParse({
    id: 'video-1',
    type: 'video',
    props: { source: { type: 'external', provider: 'youtube', url: 'https://video.example.com/watch?v=bad' } },
  }).success, false);
  assert.equal(videoBlockSchema.safeParse({
    id: 'video-2',
    type: 'video',
    props: { source: { type: 'external', provider: 'vimeo', url: 'https://www.youtube.com/watch?v=bad' } },
  }).success, false);
  assert.equal(videoBlockSchema.safeParse({
    id: 'video-3',
    type: 'video',
    props: { source: { type: 'external', provider: 'youtube', url: 'not-a-url' } },
  }).success, false);
});

test('rejects duplicate IDs and excessive block counts', () => {
  const duplicate = parseContentDocument({
    schemaVersion: 1,
    blocks: [
      { id: 'same', type: 'divider', props: { style: 'subtle-line' } },
      { id: 'same', type: 'divider', props: { style: 'gold-flourish' } },
    ],
  });
  assert.equal(duplicate.status, 'valid');
  if (duplicate.status === 'valid') assert.deepEqual(duplicate.skippedBlockIds, ['same']);
  assert.equal(parseContentDocument({ schemaVersion: 1, blocks: Array.from({ length: 501 }, (_, index) => ({ id: `b-${index}`, type: 'divider', props: { style: 'subtle-line' } })) }).status, 'invalid');
});

test('maps normalized image composition to responsive CSS values', () => {
  const parsed = contentBlockSchema.parse({
    id: 'image-1',
    type: 'image',
    props: { mediaId: 'media-1', aspectRatio: '1:1', focalPoint: { x: 43, y: 27 }, zoom: 1.25 },
  });
  if (parsed.type !== 'image') throw new Error('Expected image block');
  assert.deepEqual(imageComposition(parsed, 1200, 800), {
    objectPosition: '43% 27%',
    transform: 'scale(1.25)',
    aspectRatio: '1 / 1',
  });
});
