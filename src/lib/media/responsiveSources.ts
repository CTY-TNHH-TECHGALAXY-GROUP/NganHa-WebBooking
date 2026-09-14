export type ResponsiveSources = Record<string, string>;

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
 * A stale editor draft may carry the previous original's map. Before the CAS
 * writer saves a changed original, discard only that original's derivatives.
 * Identity-less maps remain compatible when the original is unchanged.
 */
export const clearStaleHistoryResponsiveSources = <T extends JsonRecord>(previous: unknown, incoming: T): T => {
  const next = cloneDocument(incoming);
  const priorChapters = records(isRecord(previous) ? previous.chapters : undefined);
  records(next.chapters).forEach((chapter, chapterIndex) => {
    const priorScenes = records(priorChapters[chapterIndex]?.scenes);
    records(chapter.scenes).forEach((scene, sceneIndex) => {
      clearChangedMedia(priorScenes[sceneIndex], scene, 'image', 'responsiveSources', 'responsiveSourceImage');
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
    nextItems.forEach((item, index) => clearChangedMedia(previousItems[index], item, 'image', 'responsiveSources', 'responsiveSourceImage'));
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
