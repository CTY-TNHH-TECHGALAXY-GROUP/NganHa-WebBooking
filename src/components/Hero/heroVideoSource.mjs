export const HERO_MOBILE_BREAKPOINT = 768;

const nonEmptyString = (value) => (
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null
);

/**
 * Chooses one configured rendition before a video element is given a source.
 * The mobile and desktop fields are optional; canonical url/media_url remains
 * the backward-compatible fallback for existing Hero configurations.
 */
export function selectHeroVideoSource(video, viewportWidth, breakpoint = HERO_MOBILE_BREAKPOINT) {
  if (!video || typeof video !== 'object') return null;

  const fallback = nonEmptyString(video.url) || nonEmptyString(video.media_url);
  const mobile = nonEmptyString(video.mobileUrl) || nonEmptyString(video.mobile_url);
  const desktop = nonEmptyString(video.desktopUrl) || nonEmptyString(video.desktop_url);

  return viewportWidth < breakpoint
    ? mobile || desktop || fallback
    : desktop || mobile || fallback;
}

/**
 * Assigns one selected source and calls load exactly once for a video attempt.
 * Keeping this imperative avoids a server-rendered or pre-selection React src
 * attribute that could begin downloading a second rendition during hydration.
 */
export function attachHeroVideoSource(video, source, attemptKey, previousAttachment) {
  if (!video || !source || !attemptKey) return previousAttachment || null;

  if (
    previousAttachment?.attemptKey === attemptKey
    && previousAttachment.video === video
    && previousAttachment.source === source
  ) {
    return previousAttachment;
  }

  video.src = source;
  video.load();

  return { attemptKey, source, video };
}
