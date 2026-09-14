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

export const deferredMediaStateAfterDecode = (naturalWidth: number): DeferredMediaState => (
  naturalWidth > 0 ? 'loaded' : 'error'
);

export const deferredMediaErrorAction = (hasResponsiveSource: boolean, fallbackAttempted: boolean) => (
  hasResponsiveSource && !fallbackAttempted
    ? { state: 'loading' as const, useResponsiveSource: false, retryOriginal: true }
    : { state: 'error' as const, useResponsiveSource: false, retryOriginal: false }
);
