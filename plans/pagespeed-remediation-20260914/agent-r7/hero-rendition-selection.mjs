export const HERO_MOBILE_BREAKPOINT = 768;

const localString = (value) => typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

/**
 * Selects exactly one candidate before a video element receives `src`.
 * The current CMS contract has only `url`/`media_url`; the optional fields
 * are intentionally additive and are not wired into production until the
 * migration and no-double-fetch browser gates pass.
 */
export function selectHeroRendition(video, viewportWidth, breakpoint = HERO_MOBILE_BREAKPOINT) {
  if (!video || typeof video !== 'object') return null;
  const fallback = localString(video.url) || localString(video.media_url);
  const mobile = localString(video.mobile_url) || localString(video.mobileUrl);
  const desktop = localString(video.desktop_url) || localString(video.desktopUrl);
  if (viewportWidth < breakpoint) return mobile || desktop || fallback;
  return desktop || mobile || fallback;
}

export function isLocalHeroCandidate(value) {
  const source = localString(value);
  return Boolean(source && !/^https?:\/\//i.test(source));
}
