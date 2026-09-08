export type MediaType = 'image' | 'video';

export type MediaPatch = {
  media_url: string | null;
  media_type: MediaType | null;
  expectedMediaUrl?: string | null;
  expectedMediaType?: MediaType | null;
};

type MediaPatchResult =
  | { ok: true; value: MediaPatch }
  | { ok: false; code: 'INVALID_MEDIA_PATCH' | 'CATALOG_READ_ONLY'; message: string };

const allowedKeys = new Set(['media_url', 'media_type', 'expectedMediaUrl', 'expectedMediaType']);

const normalizeUrl = (value: unknown): string | null | undefined => {
  if (value === null) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return undefined;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
  try {
    const parsed = new URL(trimmed);
    return ['http:', 'https:'].includes(parsed.protocol) ? trimmed : undefined;
  } catch {
    return undefined;
  }
};

const normalizeType = (value: unknown): MediaType | null | undefined => {
  if (value === null) return null;
  return value === 'image' || value === 'video' ? value : undefined;
};

export function parseMediaPatch(body: unknown): MediaPatchResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false, code: 'INVALID_MEDIA_PATCH', message: 'Media payload must be an object.' };
  }

  const source = body as Record<string, unknown>;
  const forbidden = Object.keys(source).filter((key) => !allowedKeys.has(key));
  if (forbidden.length) {
    return { ok: false, code: 'CATALOG_READ_ONLY', message: 'Only media fields can be changed from this admin.' };
  }
  if (!Object.prototype.hasOwnProperty.call(source, 'media_url') || !Object.prototype.hasOwnProperty.call(source, 'media_type')) {
    return { ok: false, code: 'INVALID_MEDIA_PATCH', message: 'media_url and media_type are required.' };
  }

  const mediaUrl = normalizeUrl(source.media_url);
  const mediaType = normalizeType(source.media_type);
  if (mediaUrl === undefined || mediaType === undefined || (mediaUrl === null) !== (mediaType === null)) {
    return { ok: false, code: 'INVALID_MEDIA_PATCH', message: 'Media URL and media type are invalid or do not match.' };
  }

  const hasExpectedMediaUrl = Object.prototype.hasOwnProperty.call(source, 'expectedMediaUrl');
  const hasExpectedMediaType = Object.prototype.hasOwnProperty.call(source, 'expectedMediaType');
  if (hasExpectedMediaUrl !== hasExpectedMediaType) {
    return { ok: false, code: 'INVALID_MEDIA_PATCH', message: 'Expected media URL and type must be provided together.' };
  }

  const expectedMediaUrl = hasExpectedMediaUrl ? normalizeUrl(source.expectedMediaUrl) : undefined;
  const expectedMediaType = hasExpectedMediaType ? normalizeType(source.expectedMediaType) : undefined;
  if (hasExpectedMediaUrl && (expectedMediaUrl === undefined || expectedMediaType === undefined || (expectedMediaUrl === null) !== (expectedMediaType === null))) {
    return { ok: false, code: 'INVALID_MEDIA_PATCH', message: 'Expected media values are invalid or do not match.' };
  }

  return { ok: true, value: { media_url: mediaUrl, media_type: mediaType, expectedMediaUrl, expectedMediaType } };
}
