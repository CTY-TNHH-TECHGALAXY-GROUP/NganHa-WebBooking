import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SAIGON_COFFEE_PILOT_DOCUMENT,
  SAIGON_COFFEE_PILOT_HEADER,
  resolveSaigonCoffeePilotMedia,
} from '../../../content/saigonCoffeePilot.ts';
import { parseContentDocument } from '../parseContentDocument.ts';
import { resolveLocalizedValue } from '../resolveLocalizedValue.ts';
import { contentDocumentSchema } from '../schemas/contentSchemas.ts';

test('pilot fixture passes the canonical V1 schema and parser', () => {
  assert.equal(contentDocumentSchema.safeParse(SAIGON_COFFEE_PILOT_DOCUMENT).success, true);
  const parsed = parseContentDocument(SAIGON_COFFEE_PILOT_DOCUMENT);
  assert.equal(parsed.status, 'valid');
  if (parsed.status === 'valid') {
    assert.deepEqual(parsed.skippedBlockIds, []);
    assert.deepEqual(parsed.document.blocks.map((block) => block.id), [
      'coffee-intro',
      'coffee-feature-image',
      'coffee-section-one-heading',
      'coffee-section-one-copy',
      'coffee-section-one-quote',
      'coffee-section-one-note',
      'coffee-divider-one',
      'coffee-section-two-heading',
      'coffee-section-two-copy',
      'coffee-perspective-quote',
      'coffee-divider-two',
      'coffee-section-three-heading',
      'coffee-section-three-copy',
      'coffee-ask-oria',
      'coffee-related-heading',
      'coffee-related-copy',
    ]);
  }
});

test('pilot block IDs are unique and media references resolve without persisted URLs', () => {
  const ids = SAIGON_COFFEE_PILOT_DOCUMENT.blocks.map((block) => block.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(JSON.stringify(SAIGON_COFFEE_PILOT_DOCUMENT).includes('images.unsplash.com'), false);

  for (const block of SAIGON_COFFEE_PILOT_DOCUMENT.blocks) {
    if (block.type !== 'image') continue;
    assert.equal('url' in block.props, false);
    assert.equal('resolvedAsset' in block.props, false);
    const asset = resolveSaigonCoffeePilotMedia(block.props.mediaId);
    assert.equal(asset?.id, block.props.mediaId);
    assert.equal(asset?.type, 'image');
    assert.equal(Boolean(asset?.width && asset.height), true);
  }
  assert.equal(resolveSaigonCoffeePilotMedia('missing-media'), null);

  const feature = SAIGON_COFFEE_PILOT_DOCUMENT.blocks.find((block) => block.id === 'coffee-feature-image');
  assert.equal(feature?.type, 'image');
  if (feature?.type === 'image') {
    assert.equal(feature.props.aspectRatio, '16:9');
    assert.equal(feature.props.fit, 'cover');
    assert.deepEqual(feature.props.focalPoint, { x: 55, y: 46 });
    assert.equal(feature.props.zoom, 1);
    assert.equal(feature.props.presentation, 'wide');
  }
});

test('pilot sparse locales follow requested locale then English then Vietnamese', () => {
  assert.equal(resolveLocalizedValue(SAIGON_COFFEE_PILOT_HEADER.title, 'vi').locale, 'vi');
  assert.equal(resolveLocalizedValue(SAIGON_COFFEE_PILOT_HEADER.title, 'en').locale, 'en');
  assert.equal(resolveLocalizedValue(SAIGON_COFFEE_PILOT_HEADER.title, 'jp').locale, 'en');
  assert.equal(resolveLocalizedValue(SAIGON_COFFEE_PILOT_HEADER.title, 'jp').value, 'How Saigon drinks coffee.');

  const heading = SAIGON_COFFEE_PILOT_DOCUMENT.blocks.find((block) => block.id === 'coffee-section-one-heading');
  assert.equal(heading?.type, 'heading');
  if (heading?.type === 'heading') {
    assert.equal(resolveLocalizedValue(heading.props.text, 'cn').locale, 'en');
    assert.equal(resolveLocalizedValue(heading.props.text, 'cn').value, 'Start with what people actually drink.');
  }
});

test('pilot RichText keeps structured lists and representative formatting', () => {
  const intro = SAIGON_COFFEE_PILOT_DOCUMENT.blocks.find((block) => block.id === 'coffee-intro');
  assert.equal(intro?.type, 'richText');
  if (!intro || intro.type !== 'richText') return;
  const english = intro.props.content.en;
  assert.equal(english?.type, 'doc');
  assert.equal(english?.content.some((node) => node.type === 'bulletList'), true);
  assert.equal(
    english?.content.some((node) => node.content?.some((child) => child.marks?.some((mark) => mark.type === 'bold'))),
    true,
  );
});
