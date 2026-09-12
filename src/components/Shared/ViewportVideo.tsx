'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type SyntheticEvent,
  type VideoHTMLAttributes,
} from 'react';

type ViewportVideoProps = Omit<
  VideoHTMLAttributes<HTMLVideoElement>,
  'src' | 'poster' | 'autoPlay' | 'preload' | 'onEnded'
> & {
  src: string;
  poster?: string;
  onEnded?: () => void;
  /** Keep first-viewport/hero media ready immediately. */
  eager?: boolean;
  /** Release a video source after it stays outside the unload range. */
  unloadAfterMs?: number;
  /** Keep the source attached for media that must remain resident. */
  disableUnload?: boolean;
};

const NEAR_ROOT_MARGIN = '600px 0px';
const UNLOAD_ROOT_MARGIN = '200% 0px';
const DEFAULT_UNLOAD_AFTER_MS = 15_000;

const isCurrentVideoSource = (video: HTMLVideoElement, expectedSrc?: string) => {
  if (!expectedSrc || !video.currentSrc) return Boolean(expectedSrc);
  try {
    return new URL(video.currentSrc, document.baseURI).href === new URL(expectedSrc, document.baseURI).href;
  } catch {
    return video.currentSrc === expectedSrc;
  }
};

/**
 * Controls a decorative video from its wrapper's viewport state.
 *
 * A near observer attaches the source early enough to avoid a blank frame,
 * while a separate visible observer is the only thing allowed to start
 * playback. A third observer releases a source that has stayed more than two
 * viewport heights away for the configured grace period.
 */
export default function ViewportVideo({
  src,
  poster,
  onEnded,
  eager = false,
  unloadAfterMs = DEFAULT_UNLOAD_AFTER_MS,
  disableUnload = false,
  ...videoProps
}: ViewportVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onEndedRef = useRef(onEnded);
  const sourceRef = useRef(src);
  const sourceAttachedRef = useRef(eager);
  const nearRef = useRef(eager);
  const visibleRef = useRef(eager);
  const documentVisibleRef = useRef(true);
  const resumeTimeRef = useRef(0);
  const unloadTimerRef = useRef<number | null>(null);
  const generationRef = useRef(0);

  const [isNear, setIsNear] = useState(eager);
  const [isVisible, setIsVisible] = useState(eager);
  const [sourceAttached, setSourceAttached] = useState(eager);
  const [attachedSrc, setAttachedSrc] = useState<string | undefined>(eager ? src : undefined);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  const clearUnloadTimer = useCallback(() => {
    if (unloadTimerRef.current !== null) {
      window.clearTimeout(unloadTimerRef.current);
      unloadTimerRef.current = null;
    }
  }, []);

  const syncPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video || !sourceAttachedRef.current) return;

    if (!visibleRef.current || !documentVisibleRef.current) {
      video.pause();
      return;
    }

    const generation = generationRef.current;
    const playResult = video.play();
    if (playResult && typeof playResult.catch === 'function') {
      playResult.catch(() => {
        // Autoplay can be rejected by browser policy. The next visibility or
        // foreground event will try again without creating a retry loop.
        if (generation !== generationRef.current) return;
      });
    }
  }, []);

  useEffect(() => {
    if (sourceRef.current === src) return;

    sourceRef.current = src;
    generationRef.current += 1;
    resumeTimeRef.current = 0;

    const attach = eager || nearRef.current || visibleRef.current;
    sourceAttachedRef.current = attach;
    setSourceAttached(attach);
    setAttachedSrc(attach ? src : undefined);
  }, [eager, src]);

  useEffect(() => {
    documentVisibleRef.current = document.visibilityState === 'visible';

    const handleVisibilityChange = () => {
      documentVisibleRef.current = document.visibilityState === 'visible';
      syncPlayback();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [syncPlayback]);

  useEffect(() => {
    const node = videoRef.current;
    if (!node) return;

    const supportsObserver = 'IntersectionObserver' in window;
    if (!supportsObserver) {
      // Preserve functionality on older browsers. Playback remains gated by
      // document visibility, but the source cannot be strictly viewport-gated.
      sourceAttachedRef.current = true;
      nearRef.current = true;
      visibleRef.current = true;
      setIsNear(true);
      setIsVisible(true);
      setSourceAttached(true);
      setAttachedSrc(sourceRef.current);
      return;
    }

    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        const near = entry?.isIntersecting ?? false;
        nearRef.current = near;
        setIsNear(near);
        if (near && !sourceAttachedRef.current) {
          sourceAttachedRef.current = true;
          setSourceAttached(true);
          setAttachedSrc(sourceRef.current);
        }
      },
      { rootMargin: NEAR_ROOT_MARGIN, threshold: 0 },
    );

    const visibleObserver = new IntersectionObserver(
      ([entry]) => {
        const visible = entry?.isIntersecting ?? false;
        visibleRef.current = visible;
        setIsVisible(visible);
        if (visible) {
          clearUnloadTimer();
          if (!sourceAttachedRef.current) {
            sourceAttachedRef.current = true;
            setSourceAttached(true);
            setAttachedSrc(sourceRef.current);
          }
          syncPlayback();
        } else {
          node.pause();
        }
      },
      { threshold: 0.01 },
    );

    const unloadObserver = new IntersectionObserver(
      ([entry]) => {
        const withinUnloadRange = entry?.isIntersecting ?? false;
        if (withinUnloadRange || eager || disableUnload || !sourceAttachedRef.current) {
          clearUnloadTimer();
          return;
        }

        clearUnloadTimer();
        unloadTimerRef.current = window.setTimeout(() => {
          unloadTimerRef.current = null;
          const video = videoRef.current;
          if (
            !video ||
            visibleRef.current ||
            document.visibilityState !== 'visible' ||
            video.controls ||
            document.pictureInPictureElement === video
          ) {
            return;
          }

          if (Number.isFinite(video.currentTime) && video.currentTime > 0) {
            resumeTimeRef.current = video.currentTime;
          }
          sourceAttachedRef.current = false;
          setSourceAttached(false);
          setAttachedSrc(undefined);
        }, Math.max(0, unloadAfterMs));
      },
      { rootMargin: UNLOAD_ROOT_MARGIN, threshold: 0 },
    );

    nearObserver.observe(node);
    visibleObserver.observe(node);
    unloadObserver.observe(node);

    return () => {
      clearUnloadTimer();
      nearObserver.disconnect();
      visibleObserver.disconnect();
      unloadObserver.disconnect();
    };
  }, [clearUnloadTimer, disableUnload, eager, syncPlayback, unloadAfterMs]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!sourceAttached) {
      video.pause();
      video.removeAttribute('src');
      video.load();
      return;
    }

    syncPlayback();
  }, [attachedSrc, sourceAttached, syncPlayback]);

  const handleLoadedMetadata = (event: SyntheticEvent<HTMLVideoElement>) => {
    const video = event.currentTarget;
    // A metadata event from a source that was replaced during a tab switch or
    // unload must not restore time or notify the current media state.
    if (!isCurrentVideoSource(video, attachedSrc)) return;

    const resumeAt = resumeTimeRef.current;
    if (resumeAt > 0 && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.min(resumeAt, Math.max(0, video.duration - 0.1));
      resumeTimeRef.current = 0;
    }

    videoProps.onLoadedMetadata?.(event);
    syncPlayback();
  };

  const handleEnded = () => {
    const video = videoRef.current;
    if (video && isCurrentVideoSource(video, attachedSrc) && visibleRef.current && documentVisibleRef.current) {
      onEndedRef.current?.();
    }
  };

  return (
    <video
      {...videoProps}
      ref={videoRef}
      src={attachedSrc}
      poster={attachedSrc ? poster : undefined}
      autoPlay={false}
      muted
      playsInline
      preload={isVisible ? 'auto' : isNear ? 'metadata' : 'none'}
      onLoadedMetadata={handleLoadedMetadata}
      onEnded={handleEnded}
    />
  );
}
