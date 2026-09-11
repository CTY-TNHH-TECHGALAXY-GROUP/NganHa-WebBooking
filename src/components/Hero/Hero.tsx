// Hero.tsx - Cinematic Fullscreen Hero (Showcase Style)
'use client';

import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronDown, ChevronLeft, ChevronRight, Play } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { BRANCH_LIST } from '@/data/branches';
import SmartLogo from '@/components/SmartLogo';
import { Locale } from '@/lib/constants';
import { trackAnalytics } from '@/lib/analytics/client';
import {
  heroStagger, fadeInUp, heroTitle, scaleIn, branchEntrance,
} from './Hero.animation';

// 🔧 UI CONFIGURATION
const HERO_PARTICLE_COUNT = 30;
const VIDEO_FIRST_FRAME_TIMEOUT_MS = 15000;

/**
 * Server-to-client contract for the homepage hero configuration.
 *
 * The server passes `initialHeroConfig` to avoid a second client config request.
 * An empty array is a resolved empty configuration, not a default-video signal.
 */
export interface HeroVideoConfig {
  id?: string | number | null;
  url?: string | null;
  media_url?: string | null;
  poster?: string | null;
  poster_url?: string | null;
  sort_order?: number | null;
}

export interface HeroProps {
  initialHeroConfig?: {
    status: ConfigState;
    videos: HeroVideoConfig[];
  };
  initialVideos?: HeroVideoConfig[];
}

interface ResolvedHeroVideo {
  id: string;
  url: string;
  poster?: string;
  sortOrder: number;
}

type ConfigState = 'loading' | 'ready' | 'error' | 'empty';
type PlaybackState = 'idle' | 'loading' | 'ready' | 'error';
type MediaFailureKind = 'source' | 'timeout';

interface MediaFailure {
  attemptKey: string;
  kind: MediaFailureKind;
}

type FrameAwareVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (callback: () => void) => number;
};

interface PendingFrameRequest {
  attemptKey: string;
  video: HTMLVideoElement;
  handle: number;
}

interface HeroStatusCopy {
  configLoading: string;
  videoLoading: string;
  configError: string;
  configEmpty: string;
  videoError: string;
  videoTimeout: string;
  autoplayBlocked: string;
  retry: string;
  nextVideo: string;
  playVideo: string;
}

const HERO_STATUS_COPY: Record<string, HeroStatusCopy> = {
  vi: {
    configLoading: 'Dang chuan bi khong gian thu gian...',
    videoLoading: 'Dang chuan bi video...',
    configError: 'Khong the tai cau hinh video trang chu.',
    configEmpty: 'Hien chua co video duoc cau hinh cho trang chu.',
    videoError: 'Video trang chu nay khong the tai.',
    videoTimeout: 'Video mat qua nhieu thoi gian de chuan bi.',
    autoplayBlocked: 'Tu dong phat bi chan. Hay dung nut phat video.',
    retry: 'Thu lai',
    nextVideo: 'Video tiep theo',
    playVideo: 'Phat video',
  },
  en: {
    configLoading: 'Preparing your experience...',
    videoLoading: 'Preparing the selected video...',
    configError: 'Homepage video settings could not be loaded.',
    configEmpty: 'No homepage video is currently configured.',
    videoError: 'This homepage video could not be loaded.',
    videoTimeout: 'The homepage video took too long to prepare.',
    autoplayBlocked: 'Autoplay was blocked. Use the play button to start the video.',
    retry: 'Try again',
    nextVideo: 'Next video',
    playVideo: 'Play video',
  },
  cn: {
    configLoading: '正在准备用于放松的空间...',
    videoLoading: '正在准备选中的视频...',
    configError: '无法加载主页视频设置。',
    configEmpty: '目前尚未配置主页视频。',
    videoError: '此主页视频无法加载。',
    videoTimeout: '主页视频准备时间过长。',
    autoplayBlocked: '自动播放被阻止。请使用播放按钮开始视频。',
    retry: '重试',
    nextVideo: '下一个视频',
    playVideo: '播放视频',
  },
  jp: {
    configLoading: 'リラックスできる空間を準備しています...',
    videoLoading: '選択した動画を準備しています...',
    configError: 'ホームページの動画設定を読み込めませんでした。',
    configEmpty: 'ホームページ動画が設定されていません。',
    videoError: 'このホームページ動画を読み込めませんでした。',
    videoTimeout: 'ホームページ動画の準備に時間がかかっています。',
    autoplayBlocked: '自動再生がブロックされました。再生ボタンを使用してください。',
    retry: '再試行',
    nextVideo: '次の動画',
    playVideo: '動画を再生',
  },
  kr: {
    configLoading: '편안한 공간을 준비하고 있습니다...',
    videoLoading: '선택한 영상을 준비하고 있습니다...',
    configError: '홈페이지 영상 설정을 불러오지 못했습니다.',
    configEmpty: '현재 홈페이지 영상이 설정되지 않았습니다.',
    videoError: '이 홈페이지 영상을 불러오지 못했습니다.',
    videoTimeout: '홈페이지 영상 준비에 너무 오래 걸리고 있습니다.',
    autoplayBlocked: '자동 재생이 차단되었습니다. 재생 버튼을 사용해 영상을 시작하세요.',
    retry: '다시 시도',
    nextVideo: '다음 영상',
    playVideo: '영상 재생',
  },
};

const getRequestedVideoIndex = (count: number) => {
  if (count <= 0 || typeof window === 'undefined') return 0;

  const requestedVideo = Number(new URLSearchParams(window.location.search).get('heroVideo'));
  return Number.isInteger(requestedVideo) && requestedVideo >= 0 && requestedVideo < count
    ? requestedVideo
    : 0;
};

const normalizeHeroVideos = (value: unknown): ResolvedHeroVideo[] => {
  if (!Array.isArray(value)) return [];

  return value
    .flatMap((candidate, index) => {
      if (!candidate || typeof candidate !== 'object') return [];

      const video = candidate as HeroVideoConfig;
      const source = [video.url, video.media_url]
        .find((item): item is string => typeof item === 'string' && item.trim().length > 0)
        ?.trim();

      if (!source) return [];

      const poster = [video.poster, video.poster_url]
        .find((item): item is string => typeof item === 'string' && item.trim().length > 0)
        ?.trim();

      return [{
        id: video.id === null || video.id === undefined ? `hero-video-${index}` : String(video.id),
        url: source,
        poster,
        sortOrder: typeof video.sort_order === 'number' ? video.sort_order : index,
      }];
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
};

// ═══════════════════════════════════════════
// HERO COMPONENT
// ═══════════════════════════════════════════

const Hero = ({ initialHeroConfig, initialVideos }: HeroProps) => {
  const { currentLang } = useTranslation();
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const hasInitialVideoConfig = initialHeroConfig !== undefined || Array.isArray(initialVideos);
  const initialVideoValues = initialHeroConfig?.videos ?? initialVideos;
  const initialResolvedVideos = useMemo(
    () => initialVideoValues === undefined ? null : normalizeHeroVideos(initialVideoValues),
    [initialVideoValues],
  );
  const initialConfigState: ConfigState | null = initialHeroConfig
    ? initialHeroConfig.status === 'ready' && initialResolvedVideos?.length === 0
      ? 'empty'
      : initialHeroConfig.status
    : initialResolvedVideos === null
      ? null
      : initialResolvedVideos.length > 0 ? 'ready' : 'empty';
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [selectionReady, setSelectionReady] = useState(false);
  const [homepageVideos, setHomepageVideos] = useState<ResolvedHeroVideo[] | null>(initialResolvedVideos);
  const [configState, setConfigState] = useState<ConfigState>(() => {
    return initialConfigState || 'loading';
  });
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [videoRetryCount, setVideoRetryCount] = useState(0);
  const [readyAttemptKey, setReadyAttemptKey] = useState<string | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [mediaFailure, setMediaFailure] = useState<MediaFailure | null>(null);

  const videoCount = homepageVideos?.length ?? 0;

  useEffect(() => {
    if (!hasInitialVideoConfig) return;

    const nextVideos = initialResolvedVideos || [];
    setHomepageVideos(nextVideos);
    setConfigState(initialConfigState || (nextVideos.length > 0 ? 'ready' : 'empty'));
    setSelectionReady(false);
    setPlaybackState('idle');
    setReadyAttemptKey(null);
    setMediaFailure(null);
    setAutoplayBlocked(false);
  }, [hasInitialVideoConfig, initialConfigState, initialResolvedVideos]);

  // Mảng hiển thị branch
  const displayBranches = BRANCH_LIST.map((branch, index) => {
    if (index === 0) {
      return {
        ...branch,
        address: systemSettings?.address ? getLocalizedText(systemSettings.address, currentLang as Locale, branch.address) : branch.address,
        googleMaps: systemSettings?.googleMaps || branch.googleMaps,
        hours: systemSettings?.hours || branch.hours,
      };
    }
    return branch;
  });
  
  useEffect(() => {
    if (hasInitialVideoConfig) return;

    // The homepage must never invent a video source when the server contract
    // was not provided. This also prevents an accidental default download.
    setConfigState('error');
    setHomepageVideos(null);
    setSelectionReady(false);
    setPlaybackState('idle');
  }, [hasInitialVideoConfig]);

  useEffect(() => {
    if (!homepageVideos || homepageVideos.length === 0) {
      setSelectionReady(false);
      return;
    }

    const requestedIndex = getRequestedVideoIndex(homepageVideos.length);
    setActiveVideoIndex(requestedIndex);
    setSelectionReady(true);
    setPlaybackState('idle');
    setReadyAttemptKey(null);
    readyAttemptKeyRef.current = null;
    setMediaFailure(null);
    setAutoplayBlocked(false);
  }, [homepageVideos]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const activeAttemptKeyRef = useRef<string | null>(null);
  const readyAttemptKeyRef = useRef<string | null>(null);
  const startedAttemptKeyRef = useRef<string | null>(null);
  const failedAttemptKeyRef = useRef<string | null>(null);
  const pendingFrameRequestRef = useRef<PendingFrameRequest | null>(null);

  const activeVideo = selectionReady && homepageVideos
    ? homepageVideos[activeVideoIndex] || homepageVideos[0]
    : null;
  const activeVideoKey = activeVideo ? `${activeVideo.id}|${activeVideo.url}` : null;
  const activeAttemptKey = activeVideoKey ? `${activeVideoKey}|${videoRetryCount}` : null;
  activeAttemptKeyRef.current = activeAttemptKey;

  useEffect(() => {
    if (!activeAttemptKey) return;

    setPlaybackState('loading');
    setReadyAttemptKey(null);
    readyAttemptKeyRef.current = null;
    setMediaFailure(null);
    setAutoplayBlocked(false);
  }, [activeAttemptKey]);

  const cancelPendingFrame = useCallback(() => {
    const pendingRequest = pendingFrameRequestRef.current;
    if (!pendingRequest) return;

    const frameVideo = pendingRequest.video as FrameAwareVideo;
    frameVideo.cancelVideoFrameCallback?.(pendingRequest.handle);
    pendingFrameRequestRef.current = null;
  }, []);

  useEffect(() => {
    if (playbackState !== 'loading') {
      cancelPendingFrame();
      return;
    }

    return cancelPendingFrame;
  }, [activeAttemptKey, cancelPendingFrame, playbackState]);

  useEffect(() => {
    if (!activeAttemptKey || playbackState !== 'loading') return;

    const timeoutId = window.setTimeout(() => {
      if (activeAttemptKeyRef.current !== activeAttemptKey) return;

      setMediaFailure({ attemptKey: activeAttemptKey, kind: 'timeout' });
      setPlaybackState('error');
    }, VIDEO_FIRST_FRAME_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeAttemptKey, playbackState]);

  const markFirstFrameReady = useCallback((video: HTMLVideoElement, attemptKey: string) => {
    if (activeAttemptKeyRef.current !== attemptKey || videoRef.current !== video) return;
    if (readyAttemptKeyRef.current === attemptKey) return;

    readyAttemptKeyRef.current = attemptKey;
    cancelPendingFrame();
    setReadyAttemptKey(attemptKey);
    setPlaybackState('ready');
  }, [cancelPendingFrame]);

  const attemptVideoPlayback = useCallback((video: HTMLVideoElement, attemptKey: string) => {
    if (activeAttemptKeyRef.current !== attemptKey || videoRef.current !== video) return;

    if (video.ended || (video.duration && video.currentTime >= video.duration - 0.2)) {
      video.currentTime = 0;
    }

    try {
      const playPromise = video.play();
      playPromise?.catch(() => {
        if (activeAttemptKeyRef.current !== attemptKey || videoRef.current !== video) return;

        setAutoplayBlocked(true);
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          markFirstFrameReady(video, attemptKey);
        }
      });
    } catch {
      setAutoplayBlocked(true);
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        markFirstFrameReady(video, attemptKey);
      }
    }
  }, [markFirstFrameReady]);

  const handleVideoLoadedData = useCallback((video: HTMLVideoElement, attemptKey: string) => {
    if (activeAttemptKeyRef.current !== attemptKey || videoRef.current !== video) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;

    const frameVideo = video as FrameAwareVideo;
    if (typeof frameVideo.requestVideoFrameCallback === 'function') {
      const pendingRequest = pendingFrameRequestRef.current;
      if (!pendingRequest || pendingRequest.attemptKey !== attemptKey) {
        const handle = frameVideo.requestVideoFrameCallback(() => {
          markFirstFrameReady(video, attemptKey);
        });
        pendingFrameRequestRef.current = { attemptKey, video, handle };
      }
      attemptVideoPlayback(video, attemptKey);
      return;
    }

    // Older browsers do not expose requestVideoFrameCallback. loadeddata is the
    // first decodable-frame event, and readyState guards against metadata-only readiness.
    markFirstFrameReady(video, attemptKey);
    attemptVideoPlayback(video, attemptKey);
  }, [attemptVideoPlayback, markFirstFrameReady]);

  const handleVideoPlaying = useCallback((video: HTMLVideoElement, attemptKey: string) => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      markFirstFrameReady(video, attemptKey);
    }
  }, [markFirstFrameReady]);

  const handleVideoError = useCallback((video: HTMLVideoElement, attemptKey: string) => {
    if (activeAttemptKeyRef.current !== attemptKey || videoRef.current !== video) return;

    cancelPendingFrame();
    setMediaFailure({ attemptKey, kind: 'source' });
    setPlaybackState('error');
  }, [cancelPendingFrame]);

  useEffect(() => {
    if (!activeAttemptKey || playbackState !== 'loading' || !videoRef.current) return;

    const video = videoRef.current;
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      handleVideoLoadedData(video, activeAttemptKey);
    }
  }, [activeAttemptKey, handleVideoLoadedData, playbackState]);

  const goToVideo = useCallback((nextIndex: number) => {
    if (videoCount <= 0 || nextIndex === activeVideoIndex) return;

    setActiveVideoIndex(nextIndex);
    setVideoRetryCount(0);
    setReadyAttemptKey(null);
    readyAttemptKeyRef.current = null;
    setMediaFailure(null);
    setAutoplayBlocked(false);
    setPlaybackState('loading');
  }, [activeVideoIndex, videoCount]);

  const handleNextVideo = useCallback(() => {
    if (videoCount <= 0) return;
    goToVideo((activeVideoIndex + 1) % videoCount);
  }, [activeVideoIndex, goToVideo, videoCount]);

  const handlePrevVideo = useCallback(() => {
    if (videoCount <= 0) return;
    goToVideo((activeVideoIndex - 1 + videoCount) % videoCount);
  }, [activeVideoIndex, goToVideo, videoCount]);

  const handleRetry = useCallback(() => {
    if (configState === 'error' || configState === 'empty') {
      window.location.reload();
      return;
    }

    if (!activeAttemptKey) return;

    setVideoRetryCount((count) => count + 1);
    readyAttemptKeyRef.current = null;
    setReadyAttemptKey(null);
    setMediaFailure(null);
    setAutoplayBlocked(false);
    setPlaybackState('loading');
  }, [activeAttemptKey, configState]);

  // Auto-retry silently in background when video fails or times out without disturbing the spinner
  useEffect(() => {
    if (playbackState !== 'error') return;

    const timer = setTimeout(() => {
      if (videoCount > 1) {
        handleNextVideo();
      } else {
        handleRetry();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [playbackState, videoCount, handleNextVideo, handleRetry]);

  const handleManualPlay = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeAttemptKey) return;

    attemptVideoPlayback(video, activeAttemptKey);
  }, [activeAttemptKey, attemptVideoPlayback]);

  // Memoize particles to avoid hydration mismatch
  const particles = useMemo(() =>
    Array.from({ length: HERO_PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      left: `${(i * 3.33) % 100}%`,
      top: `${(i * 7.77) % 100}%`,
      delay: `${(i * 0.2) % 6}s`,
      duration: `${4 + (i * 0.13) % 4}s`,
    })),
  []);



  const [touchStart, setTouchStart] = useState(0);
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const dist = touchStart - touchEnd;
    if (dist > 50) handleNextVideo();
    else if (dist < -50) handlePrevVideo();
    setTouchStart(0);
  };

  const statusCopy = HERO_STATUS_COPY[currentLang] || HERO_STATUS_COPY.en;
  const heroReady = Boolean(
    activeAttemptKey &&
    playbackState === 'ready' &&
    readyAttemptKey === activeAttemptKey,
  );
  return (
    <section id="hero" className="hero-section hero-section--cinematic" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      <style>{'@keyframes hero-video-loading-spin { to { transform: rotate(360deg); } }'}</style>
      {/* Particles */}
      <div className="hero-particles">
        {particles.map((p) => (
          <div key={p.id} className="hero-particle" style={{
            left: p.left,
            top: p.top,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }} />
        ))}
      </div>

      {/* Animated Gradient BG */}
      <div className="hero-gradient-bg" />

      {/* The configured source is the only video mounted on the homepage. */}
      <div className="hero-bg" aria-hidden={!heroReady}>
        {activeVideo && selectionReady ? (
          <div
            key={activeAttemptKey || activeVideoKey || activeVideo.id}
            className="hero-video-wrapper active"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: heroReady ? 1 : 0,
              transition: 'opacity 800ms ease-in-out',
              zIndex: 1,
            }}
          >
            <video
              ref={(element) => {
                videoRef.current = element;
              }}
              className="hero-video"
              src={activeVideo.url}
              {...(activeVideo.poster ? { poster: activeVideo.poster } : {})}
              autoPlay
              muted
              playsInline
              loop={videoCount === 1}
              preload="auto"
              onLoadedData={(event) => {
                const attemptKey = activeAttemptKeyRef.current;
                if (attemptKey) handleVideoLoadedData(event.currentTarget, attemptKey);
              }}
              onPlaying={(event) => {
                const attemptKey = activeAttemptKeyRef.current;
                if (attemptKey && startedAttemptKeyRef.current !== attemptKey) {
                  startedAttemptKeyRef.current = attemptKey;
                  trackAnalytics('hero_video_started', { identifier: activeVideo.id });
                }
                if (attemptKey) handleVideoPlaying(event.currentTarget, attemptKey);
              }}
              onEnded={videoCount > 1 ? handleNextVideo : undefined}
              onError={(event) => {
                const attemptKey = activeAttemptKeyRef.current;
                if (attemptKey && failedAttemptKeyRef.current !== attemptKey) {
                  failedAttemptKeyRef.current = attemptKey;
                  trackAnalytics('hero_video_failed', { identifier: activeVideo.id });
                }
                if (attemptKey) handleVideoError(event.currentTarget, attemptKey);
              }}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          </div>
        ) : null}
        {heroReady ? <div className="hero-overlay" style={{ zIndex: 2 }} /> : null}
      </div>

      {!heroReady ? (
        <div
          className="hero-video-loading-screen"
          role="status"
          aria-live="polite"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            background: '#070605',
            color: '#f1d487',
            textAlign: 'center',
          }}
        >
          <span
            aria-hidden="true"
            style={{
              justifySelf: 'center',
              width: '32px',
              height: '32px',
              border: '2.5px solid rgba(241, 212, 135, 0.25)',
              borderTopColor: '#f1d487',
              borderRadius: '50%',
              animation: 'hero-video-loading-spin 900ms linear infinite',
            }}
          />
        </div>
      ) : null}

      {heroReady ? <motion.div
        className="hero-content"
        initial="hidden"
        animate="visible"
        variants={heroStagger}
      >


        {getLocalizedText(systemSettings?.homepage_content?.hero?.subtitle, currentLang as Locale, '') ? (
          <motion.span className="hero-cinematic-sub" variants={fadeInUp}>
            {getLocalizedText(systemSettings?.homepage_content?.hero?.subtitle, currentLang as Locale, '')}
          </motion.span>
        ) : null}

        {/* Main Block: Logo + Slogan + Company Name */}
        <div className="flex flex-col items-center justify-center -translate-y-12 md:-translate-y-24 gap-4 md:gap-6 z-10 relative">
          {/* Main Title (Oria Spa Logo) */}
          <motion.div className="flex justify-center items-center" variants={heroTitle}>
            <SmartLogo theme="dark" className="w-[min(300px,calc(100vw-48px))] md:w-[450px] lg:w-[550px] h-auto object-contain drop-shadow-2xl" />
          </motion.div>

          
        </div>


        {getLocalizedText(systemSettings?.homepage_content?.hero?.tagline, currentLang as Locale, '') ? (
          <motion.p className="hero-cinematic-tagline" variants={fadeInUp}>
            {getLocalizedText(systemSettings?.homepage_content?.hero?.tagline, currentLang as Locale, '')}
          </motion.p>
        ) : null}

        {autoplayBlocked ? (
          <button
            type="button"
            onClick={handleManualPlay}
            aria-label={statusCopy.playVideo}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              alignSelf: 'center',
              border: '1px solid rgba(241, 212, 135, 0.7)',
              borderRadius: '6px',
              padding: '10px 16px',
              background: 'rgba(7, 6, 5, 0.55)',
              color: '#f1d487',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <Play size={16} aria-hidden="true" />
            {statusCopy.playVideo}
          </button>
        ) : null}



        {/* Chevrons Navigation for Desktop */}
        {videoCount > 1 && (
          <div className="hero-nav-controls" style={{ zIndex: 10 }}>
            <button
              onClick={handlePrevVideo}
              className="hero-nav-arrow hero-nav-arrow--left"
              aria-label="Previous Video"
            >
              <ChevronLeft size={28} />
            </button>
            <button
              onClick={handleNextVideo}
              className="hero-nav-arrow hero-nav-arrow--right"
              aria-label="Next Video"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        )}

        {/* Pagination Dots & Text */}
        {videoCount > 1 && (
          <div className="hero-pagination" style={{ zIndex: 10 }}>
            <span className="hero-pagination-number">
              {String(activeVideoIndex + 1).padStart(2, '0')} / {String(videoCount).padStart(2, '0')}
            </span>
            <div className="hero-pagination-dots">
              {homepageVideos?.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-pagination-dot ${idx === activeVideoIndex ? 'active' : ''}`}
                  onClick={() => goToVideo(idx)}
                  aria-label={`Go to video ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}


      </motion.div> : null}

    </section>
  );
};

export default Hero;
