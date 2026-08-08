// Hero.tsx - Cinematic Fullscreen Hero (Showcase Style)
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { BRANCH_LIST } from '@/data/branches';
import SmartLogo from '@/components/SmartLogo';
import { Locale } from '@/lib/constants';
import {
  heroStagger, fadeInUp, heroTitle, scaleIn, branchEntrance,
} from './Hero.animation';

// 🔧 UI CONFIGURATION
const HERO_PARTICLE_COUNT = 30;

// ═══════════════════════════════════════════
// HERO COMPONENT
// ═══════════════════════════════════════════

const DEFAULT_HOMEPAGE_VIDEOS = [
  { id: 'foot-massage', url: '/videos/0807.mp4', poster: 'https://i.ibb.co/fs2MBD4/hero-spa-bg.jpg' }
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
          // Limit to 1 video on the frontend, even if admin adds more
          setHomepageVideos(remoteVideos.slice(0, 1));
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


        {getLocalizedText(systemSettings?.homepage_content?.hero?.subtitle, currentLang as Locale, '') ? (
          <motion.span className="hero-cinematic-sub" variants={fadeInUp}>
            {getLocalizedText(systemSettings?.homepage_content?.hero?.subtitle, currentLang as Locale, '')}
          </motion.span>
        ) : null}

        {/* Main Block: Logo + Slogan + Company Name */}
        <div className="flex flex-col items-center justify-center -translate-y-12 md:-translate-y-24 gap-4 md:gap-6 z-10 relative">
          {/* Main Title (Oria Spa Logo) */}
          <motion.div className="flex justify-center items-center" variants={heroTitle}>
            <SmartLogo theme="dark" className="w-[300px] md:w-[450px] lg:w-[550px] h-auto object-contain drop-shadow-2xl" />
          </motion.div>

          {/* TechGalaxy Group */}
          <motion.span 
            className="font-sans uppercase tracking-[6px] md:tracking-[8px] font-medium text-xl md:text-3xl lg:text-[2.5rem] mt-2 md:mt-4" 
            variants={fadeInUp}
          >
            {getLocalizedText(systemSettings?.homepage_content?.hero?.companyName, currentLang as Locale, 'TechGalaxy Group')}
          </motion.span>
        </div>


        {getLocalizedText(systemSettings?.homepage_content?.hero?.tagline, currentLang as Locale, '') ? (
          <motion.p className="hero-cinematic-tagline" variants={fadeInUp}>
            {getLocalizedText(systemSettings?.homepage_content?.hero?.tagline, currentLang as Locale, '')}
          </motion.p>
        ) : null}



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


      </motion.div>

    </section>
  );
};

export default Hero;
