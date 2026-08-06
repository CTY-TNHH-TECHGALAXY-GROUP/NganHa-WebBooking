// Hero.tsx - Cinematic Fullscreen Hero (Showcase Style)
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { BRANCH_LIST } from '@/data/branches';
import { Locale } from '@/lib/constants';
import {
  heroStagger, fadeInUp, heroTitle, scaleIn, branchEntrance,
} from './Hero.animation';

// 🔧 UI CONFIGURATION
const HERO_PARTICLE_COUNT = 30;

// 🔧 TEXT CONTENT
const HERO_TEXT = {
  badge: '✦ Premium Spa & Barbershop ✦',
  subtitle: '',
  title: 'Oria Spa',
  subTitle2: 'Welcome to',
  tagline: '',
  cta1: 'BEST-SELLER',
  cta2: 'Đặt Lịch Ngay',
  scrollHint: 'Cuộn xuống để khám phá',
};

// ═══════════════════════════════════════════
// HERO COMPONENT
// ═══════════════════════════════════════════

const DEFAULT_HOMEPAGE_VIDEOS = [
  { id: 'foot-massage', url: '/videos/video1.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-v1', url: '/videos/space/v1-2.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-v3', url: '/videos/space/v3.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-v4', url: '/videos/space/v4-r.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-stair', url: '/videos/space/stair-resize.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-toilet', url: '/videos/space/toilet-resize.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
  { id: 'space-yumi', url: '/videos/space/yumi.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' },
];

const Hero = () => {
  const { t, currentLang } = useTranslation();
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<number[]>([0]);
  const [homepageVideos, setHomepageVideos] = useState<any[]>(DEFAULT_HOMEPAGE_VIDEOS);
  const videoCount = homepageVideos.length;

  const applyRequestedHeroVideo = useCallback((count: number) => {
    if (typeof window === 'undefined' || count <= 0) return;

    const params = new URLSearchParams(window.location.search);
    const requestedVideo = Number(params.get('heroVideo'));

    if (Number.isInteger(requestedVideo) && requestedVideo >= 0 && requestedVideo < count) {
      setActiveVideoIndex(requestedVideo);
      setLoadedIndices((prev) => (
        prev.includes(requestedVideo) ? prev : [...prev, requestedVideo]
      ));
    }
  }, []);

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
    fetch('/api/hero-videos')
      .then(res => res.json())
      .then(json => {
        const remoteVideos = Array.isArray(json.data)
          ? json.data
              .filter((video: any) => video?.url || video?.media_url)
              .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0))
          : [];

        if (json.success && remoteVideos.length > 0) {
          setHomepageVideos(remoteVideos);
          const params = new URLSearchParams(window.location.search);
          const requestedVideo = Number(params.get('heroVideo'));
          const nextIndex = Number.isInteger(requestedVideo) && requestedVideo >= 0 && requestedVideo < remoteVideos.length
            ? requestedVideo
            : 0;
          setActiveVideoIndex(nextIndex);
          setLoadedIndices([nextIndex]);
        }
      })
      .catch(err => console.error('Error fetching hero videos:', err));
  }, []);

  useEffect(() => {
    applyRequestedHeroVideo(videoCount);
  }, [applyRequestedHeroVideo, videoCount]);

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const handleNextVideo = useCallback(() => {
    setActiveVideoIndex((prev) => (prev + 1) % Math.max(videoCount, 1));
  }, [videoCount]);

  const handlePrevVideo = useCallback(() => {
    setActiveVideoIndex((prev) => (prev - 1 + Math.max(videoCount, 1)) % Math.max(videoCount, 1));
  }, [videoCount]);

  // Lazy load video index
  useEffect(() => {
    if (!loadedIndices.includes(activeVideoIndex)) {
      setLoadedIndices((prev) => [...prev, activeVideoIndex]);
    }
  }, [activeVideoIndex, loadedIndices]);

  // Handle Play/Pause
  useEffect(() => {
    videoRefs.current.forEach((video, idx) => {
      if (video) {
        if (idx === activeVideoIndex) {
          if (video.ended || (video.duration && video.currentTime >= video.duration - 0.2)) {
            video.currentTime = 0;
          }
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      }
    });
  }, [activeVideoIndex, loadedIndices]);

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

  return (
    <section id="hero" className="hero-section hero-section--cinematic">
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

      {/* Background Videos with Lazy-load & Cross-fade */}
      <div className="hero-bg">
        {homepageVideos.map((video, idx) => {
          const isActive = idx === activeVideoIndex;
          const isLoaded = loadedIndices.includes(idx);
          const videoUrl = video.url || video.media_url;
          const posterUrl = video.poster || video.poster_url || 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg';

          return (
            <div
              key={video.id}
              className={`hero-video-wrapper ${isActive ? 'active' : ''}`}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: isActive ? 1 : 0,
                transition: 'opacity 800ms ease-in-out',
                zIndex: isActive ? 1 : 0,
              }}
            >
              {isLoaded ? (
                <video
                  ref={(el) => {
                    videoRefs.current[idx] = el;
                  }}
                  className="hero-video"
                  src={videoUrl}
                  poster={posterUrl}
                  autoPlay={isActive}
                  muted
                  playsInline
                  loop={videoCount === 1}
                  onEnded={videoCount > 1 ? handleNextVideo : undefined}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  className="hero-image"
                  style={{ backgroundImage: `url(${posterUrl})` }}
                />
              )}
            </div>
          );
        })}
        <div className="hero-overlay" style={{ zIndex: 2 }} />
      </div>

      {/* Content */}
      <motion.div
        className="hero-content"
        initial="hidden"
        animate="visible"
        variants={heroStagger}
      >


        {t('hero_section', 'subtitle') || HERO_TEXT.subtitle ? (
          <motion.span className="hero-cinematic-sub" variants={fadeInUp}>
            {t('hero_section', 'subtitle') || HERO_TEXT.subtitle}
          </motion.span>
        ) : null}

        <motion.span className="hero-cinematic-sub2" variants={fadeInUp}>
          {t('hero_section', 'subTitle2') || HERO_TEXT.subTitle2}
        </motion.span>

        {/* Main Title */}
        <motion.h1 className="hero-cinematic-title" variants={heroTitle}>
          {t('hero_section', 'title') || HERO_TEXT.title}
        </motion.h1>

        <motion.div className="hero-cinematic-divider" variants={scaleIn} />

        {(t('hero_section', 'tagline') || HERO_TEXT.tagline) && (t('hero_section', 'tagline') !== 'SPA' || HERO_TEXT.tagline !== '') ? (
          <motion.p className="hero-cinematic-tagline" variants={fadeInUp}>
            {t('hero_section', 'tagline') === 'SPA' && HERO_TEXT.tagline === '' ? '' : (t('hero_section', 'tagline') || HERO_TEXT.tagline)}
          </motion.p>
        ) : null}

        {/* CTA Buttons */}
        <motion.div className="hero-ctas" variants={fadeInUp}>
          <a href="#best-seller" className="hero-cta-btn hero-cta-primary hero-cta--pill">
            {t('hero_section', 'cta1') || HERO_TEXT.cta1}
          </a>
          <a href={`/${currentLang}/new-user/standard/checkout`} className="hero-cta-btn hero-cta-secondary hero-cta--pill">
            {t('hero_section', 'cta2') || HERO_TEXT.cta2}
          </a>
        </motion.div>

        {/* Chevrons Navigation for Desktop */}
        {homepageVideos.length > 1 && (
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
        {homepageVideos.length > 1 && (
          <div className="hero-pagination" style={{ zIndex: 10 }}>
            <span className="hero-pagination-number">
              {String(activeVideoIndex + 1).padStart(2, '0')} / {String(homepageVideos.length).padStart(2, '0')}
            </span>
            <div className="hero-pagination-dots">
              {homepageVideos.map((_, idx) => (
                <button
                  key={idx}
                  className={`hero-pagination-dot ${idx === activeVideoIndex ? 'active' : ''}`}
                  onClick={() => setActiveVideoIndex(idx)}
                  aria-label={`Go to video ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Scroll Hint */}
        <motion.div className="hero-scroll-hint" variants={fadeInUp}>
          <ChevronDown size={20} className="hero-scroll-icon" />
          <span className="hero-scroll-text">{t('hero_section', 'scrollHint') || HERO_TEXT.scrollHint}</span>
        </motion.div>
      </motion.div>

      {/* Branch Cards — kept below hero content */}
      <motion.div
        id="branches"
        className="hero-branches"
        variants={branchEntrance}
        initial="hidden"
        animate="visible"
      >
        {displayBranches.map((branch) => (
          <a
            key={branch.id}
            href={branch.googleMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="branch-card"
          >
            <div className="branch-card-info">
              <div className="branch-card-row">
                <MapPin size={18} />
                <span>{branch.address}</span>
              </div>
              <div className="branch-card-row">
                <Clock size={18} />
                <span>Open {branch.hours}</span>
              </div>
              <div className="branch-card-row">
                <Clock size={18} />
                <span className="branch-last-order">Last order: 11:30pm</span>
              </div>
            </div>
          </a>
        ))}
      </motion.div>
    </section>
  );
};

export default Hero;
