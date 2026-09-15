export type ResponsiveSources = Record<string, string>;

export type ResponsiveSourceCandidate = {
  width: number;
  url: string;
};

export type DeferredMediaState = 'deferred' | 'loading' | 'loaded' | 'error';

const validWidth = (width: string) => /^(?:[1-9]\d*)$/.test(width) && Number.isSafeInteger(Number(width));

/**
 * Keeps only usable native-image width descriptors. The output stays in the
 * persisted object shape so old content can continue to use its map.
 */
export const normalizeResponsiveSources = (value: unknown): ResponsiveSources | undefined => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;

  const sources = Object.entries(value).reduce<ResponsiveSources>((result, [width, url]) => {
    if (validWidth(width) && typeof url === 'string' && url.trim().length > 0) {
      result[width] = url;
    }
    return result;
  }, {});

  return Object.keys(sources).length > 0 ? sources : undefined;
};

/**
 * New maps declare the original image URL they were generated from. A map
 * without that field predates the identity contract and remains a compatible
 * fallback; a declared mismatch must never render a stale derivative.
 */
export const responsiveSourcesForImage = (
  image: string | null | undefined,
  sources: unknown,
  responsiveSourceImage?: string | null,
): ResponsiveSources | undefined => {
  const normalized = normalizeResponsiveSources(sources);
  if (!image || !normalized) return undefined;
  if (typeof responsiveSourceImage === 'string' && responsiveSourceImage.length > 0 && responsiveSourceImage !== image) {
    return undefined;
  }
  return normalized;
};

/**
 * Selects the smallest available derivative that can cover a rendered box at
 * its device-pixel ratio. The result deliberately exposes `undersized` when
 * the manifest does not contain a wide enough candidate; callers can then
 * keep the original instead of silently upscaling a derivative. Native
 * `srcset` selection remains the browser's source of truth for rendered
 * images, while this helper gives tests and editors a deterministic audit
 * primitive for the same box × DPR rule.
 */
export const selectResponsiveSourceCandidate = (
  image: string | null | undefined,
  sources: unknown,
  responsiveSourceImage: string | null | undefined,
  boxCssWidth: number,
  devicePixelRatio = 1,
): (ResponsiveSourceCandidate & { requiredWidth: number; undersized: boolean }) | undefined => {
  const accepted = responsiveSourcesForImage(image, sources, responsiveSourceImage);
  const requiredWidth = Math.max(1, Math.ceil(
    (Number.isFinite(boxCssWidth) ? boxCssWidth : 0)
    * (Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1),
  ));
  if (!accepted) return undefined;

  const candidates = Object.entries(accepted)
    .map(([width, url]) => ({ width: Number(width), url }))
    .filter(candidate => Number.isSafeInteger(candidate.width) && candidate.width > 0)
    .sort((a, b) => a.width - b.width);
  if (candidates.length === 0) return undefined;

  const selected = candidates.find(candidate => candidate.width >= requiredWidth) || candidates[candidates.length - 1];
  return { ...selected, requiredWidth, undersized: selected.width < requiredWidth };
};

/**
 * Writer-side helper for an editor that replaces one original image. Calling
 * this only for a changed image preserves rendition metadata on text edits.
 */
export const replaceMediaSourceAndClearRenditions = <T extends Record<string, unknown>>(
  media: T,
  sourceKey: string,
  nextSource: string,
  renditionKey: string,
  identityKey: string,
): T => {
  if (media[sourceKey] === nextSource) return media;
  const next = { ...media, [sourceKey]: nextSource } as Record<string, unknown>;
  delete next[renditionKey];
  delete next[identityKey];
  return next as T;
};

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord => (
  Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const cloneDocument = <T extends JsonRecord>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const clearChangedMedia = (
  previous: JsonRecord | undefined,
  next: JsonRecord | undefined,
  sourceKey: string,
  renditionKey: string,
  identityKey: string,
) => {
  if (!previous || !next || previous[sourceKey] === next[sourceKey]) return;
  delete next[renditionKey];
  delete next[identityKey];
};

const records = (value: unknown): JsonRecord[] => Array.isArray(value)
  ? value.filter(isRecord)
  : [];

/**
 * Finds the previous item that represents the same editable media slot. CMS
 * arrays can be reordered, so index-only pairing can clear a valid rendition
 * map from an unchanged item or leave a stale map on the item whose source
 * changed. Stable ids are preferred; legacy records use their existing label
 * fields before falling back to the same index for source replacements.
 */
const recordIdentity = (value: JsonRecord): string | undefined => {
  const stableFields = ['id', 'key', 'frameId', 'year', 'title', 'label', 'icon'];
  for (const field of stableFields) {
    const candidate = value[field];
    if (typeof candidate === 'string' && candidate.trim()) return `${field}:${candidate.trim()}`;
    if (typeof candidate === 'number' && Number.isFinite(candidate)) return `${field}:${candidate}`;
  }
  return undefined;
};

const pairPreviousRecord = (
  previousItems: JsonRecord[],
  nextItem: JsonRecord,
  index: number,
): JsonRecord | undefined => {
  const identity = recordIdentity(nextItem);
  if (identity) {
    const matched = previousItems.find(item => recordIdentity(item) === identity);
    if (matched) return matched;
  }
  return previousItems[index];
};

/**
 * A stale editor draft may carry the previous original's map. Before the CAS
 * writer saves a changed original, discard only that original's derivatives.
 * Identity-less maps remain compatible when the original is unchanged.
 */
export const clearStaleHistoryResponsiveSources = <T extends JsonRecord>(previous: unknown, incoming: T): T => {
  const next = cloneDocument(incoming);
  const priorChapters = records(isRecord(previous) ? previous.chapters : undefined);
  records(next.chapters).forEach((chapter, chapterIndex) => {
    const priorChapter = pairPreviousRecord(priorChapters, chapter, chapterIndex);
    const priorScenes = records(priorChapter?.scenes);
    records(chapter.scenes).forEach((scene, sceneIndex) => {
      clearChangedMedia(
        pairPreviousRecord(priorScenes, scene, sceneIndex),
        scene,
        'image',
        'responsiveSources',
        'responsiveSourceImage',
      );
    });
  });
  return next;
};

export const clearStaleOurStoryResponsiveSources = <T extends JsonRecord>(previous: unknown, incoming: T): T => {
  const next = cloneDocument(incoming);
  const prior = isRecord(previous) ? previous : {};

  const priorLocation = isRecord(prior.locationSection) ? prior.locationSection : undefined;
  const nextLocation = isRecord(next.locationSection) ? next.locationSection : undefined;
  clearChangedMedia(priorLocation, nextLocation, 'cityImage', 'cityImageResponsiveSources', 'cityImageResponsiveSource');
  clearChangedMedia(priorLocation, nextLocation, 'streetSignImage', 'streetSignImageResponsiveSources', 'streetSignImageResponsiveSource');

  const priorAtmosphere = isRecord(prior.atmosphereSection) ? prior.atmosphereSection : undefined;
  const nextAtmosphere = isRecord(next.atmosphereSection) ? next.atmosphereSection : undefined;
  clearChangedMedia(priorAtmosphere, nextAtmosphere, 'nightStreetImage', 'nightStreetImageResponsiveSources', 'nightStreetImageResponsiveSource');

  const clearImageList = (previousItems: JsonRecord[], nextItems: JsonRecord[]) => {
    nextItems.forEach((item, index) => clearChangedMedia(
      pairPreviousRecord(previousItems, item, index),
      item,
      'image',
      'responsiveSources',
      'responsiveSourceImage',
    ));
  };
  clearImageList(records(isRecord(prior.filmReel) ? prior.filmReel.frames : undefined), records(isRecord(next.filmReel) ? next.filmReel.frames : undefined));
  clearImageList(records(isRecord(prior.specialtySection) ? prior.specialtySection.pillars : undefined), records(isRecord(next.specialtySection) ? next.specialtySection.pillars : undefined));
  clearImageList(records(isRecord(prior.specialtySection) ? prior.specialtySection.menuNiches : undefined), records(isRecord(next.specialtySection) ? next.specialtySection.menuNiches : undefined));
  return next;
};

export const deferredMediaStateAfterDecode = (naturalWidth: number): DeferredMediaState => (
  naturalWidth > 0 ? 'loaded' : 'error'
);

export const deferredMediaErrorAction = (hasResponsiveSource: boolean, fallbackAttempted: boolean) => (
  hasResponsiveSource && !fallbackAttempted
    ? { state: 'loading' as const, useResponsiveSource: false, retryOriginal: true }
    : { state: 'error' as const, useResponsiveSource: false, retryOriginal: false }
);
