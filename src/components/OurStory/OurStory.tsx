'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { Locale } from '@/lib/constants';
import { hydrateOurStoryConfig, OurStoryFilmFrame } from './OurStory.data';
import styles from './OurStory.module.css';

const OurStory: React.FC = () => {
  const { currentLang } = useTranslation();
  const { systemSettings, aboutStoryContent, getLocalizedText } = useSystemSettings();

  const lang = (currentLang || 'vi') as Locale;

  // Hydrate config dynamically from CMS (aboutStoryContent or homepage_content.ourStory)
  const rawData = useMemo(() => {
    return aboutStoryContent || systemSettings?.homepage_content?.ourStory;
  }, [aboutStoryContent, systemSettings]);

  const config = useMemo(() => hydrateOurStoryConfig(rawData), [rawData]);

  const [highlightedFrameId, setHighlightedFrameId] = useState<number | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<OurStoryFilmFrame | null>(null);

  const trackContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Scroll to film frame
  const scrollToFrame = useCallback((frameId: number) => {
    setHighlightedFrameId(frameId);
    const container = trackContainerRef.current;
    if (container) {
      const frameEl = document.getElementById(`film-frame-${frameId}`);
      if (frameEl) {
        const targetScroll = frameEl.offsetLeft - container.offsetWidth / 2 + frameEl.offsetWidth / 2;
        container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
      }
    }
  }, []);

  const stepFilm = (direction: number) => {
    const container = trackContainerRef.current;
    if (container) {
      container.scrollBy({ left: direction * 320, behavior: 'smooth' });
    }
  };

  // Drag-to-scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const container = trackContainerRef.current;
    if (!container) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - container.offsetLeft;
    scrollLeftRef.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    e.preventDefault();
    const container = trackContainerRef.current;
    if (!container) return;
    const x = e.pageX - container.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    container.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  // Keyboard accessibility: Close lightbox on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightbox(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <section className={styles.sectionRoot} id="our-story">
      <div className={styles.container}>
        {/* Header Section */}
        <header className={styles.headerGroup}>
          <div className={styles.headerBadge}>
            <span>✦</span> {getLocalizedText(config.header.badge, lang)} <span>✦</span>
          </div>
          <h2 className={styles.storyTitle}>{getLocalizedText(config.header.title, lang)}</h2>
          <span className={styles.storyScript}>{getLocalizedText(config.header.script, lang)}</span>
          <div className={styles.headerDivider} />
        </header>

        {/* Editorial 2-Column Grid */}
        <div className={styles.editorialGrid}>
          {/* COLUMN 1: Vị Trí Vàng và Kết Nối */}
          <article className={styles.editorialCard}>
            <div>
              <h3 className={styles.sectionHeadline}>
                <span className={styles.headlineIcon}>📍</span>
                {getLocalizedText(config.locationSection.title, lang)}
              </h3>
              <p className={styles.storyText}>
                {getLocalizedText(config.locationSection.text, lang)}
              </p>
              <ul className={styles.bulletList}>
                <li>
                  {getLocalizedText(config.locationSection.strategicPosition, lang)}
                </li>
                <li>
                  {getLocalizedText(config.locationSection.connectionsTitle, lang)}
                  <ul className={styles.subBulletList}>
                    {config.locationSection.connections.map((conn, idx) => (
                      <li key={`conn-${idx}`}>
                        {getLocalizedText(conn, lang)}
                      </li>
                    ))}
                  </ul>
                </li>
              </ul>
            </div>

            {/* Minimized & Optimized Street Sign Image (Editable via Admin) */}
            <div className={styles.streetSignWrap}>
              <img
                src={config.locationSection.streetSignImage}
                alt={getLocalizedText(config.locationSection.imageCaption, lang)}
                className={styles.streetSignImg}
                loading="lazy"
              />
              <div className={styles.imageCaption}>
                {getLocalizedText(config.locationSection.imageCaption, lang)}
              </div>
            </div>
          </article>

          {/* COLUMN 2: Đặc Điểm Kiến Trúc và Thương Mại */}
          <article className={styles.editorialCard}>
            <div>
              <h3 className={styles.sectionHeadline}>
                <span className={styles.headlineIcon}>🏛️</span>
                {getLocalizedText(config.architectureSection.title, lang)}
              </h3>
              <ul className={styles.bulletList}>
                {config.architectureSection.features.map((feat, idx) => (
                  <li key={`feat-${idx}`}>
                    {getLocalizedText(feat, lang)}
                  </li>
                ))}
              </ul>

              {/* Interactive Activities Trigger linking to 35mm Film Strip */}
              <div className={styles.activityGroup}>
                <h4 className={styles.activityTitle}>
                  <span>🎞️</span> {getLocalizedText(config.architectureSection.activityTitle, lang)}
                </h4>
                <p className={styles.activityHint}>
                  {getLocalizedText(config.architectureSection.activityHint, lang)}
                </p>

                <div className={styles.activityList}>
                  {config.architectureSection.activities.map((act) => (
                    <div
                      key={`act-${act.frameId}`}
                      className={`${styles.activityItem} ${highlightedFrameId === act.frameId ? styles.activityItemActive : ''}`}
                      onClick={() => scrollToFrame(act.frameId)}
                    >
                      <span className={styles.activityLabel}>
                        <span style={{ color: '#d4af37' }}>○</span>
                        <span>{getLocalizedText(act.text, lang)}</span>
                      </span>
                      <span className={styles.activityBadge}>
                        {getLocalizedText(act.badge, lang)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* 35mm Vintage Film Strip Reel Section */}
        <section className={styles.filmStripSection} id="film-strip-reel">
          <div className={styles.filmStripHeader}>
            <h3 className={styles.filmStripTitle}>
              <span>🎬</span> {getLocalizedText(config.filmReel.title, lang)} <span>🎞️</span>
            </h3>
            <div className={styles.filmControls}>
              <button
                type="button"
                className={styles.filmNavBtn}
                onClick={() => stepFilm(-1)}
                aria-label="Previous film frame"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                className={styles.filmNavBtn}
                onClick={() => stepFilm(1)}
                aria-label="Next film frame"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Top 35mm Sprocket Ribbon */}
          <div className={styles.sprocketHolesWrap} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <React.Fragment key={`top-${i}`}>
                <div className={styles.sprocketHole} />
                {i % 4 === 0 && <span className={styles.filmStamp}>KODAK 500T</span>}
              </React.Fragment>
            ))}
          </div>

          {/* Film Track Container */}
          <div
            className={styles.filmTrackContainer}
            ref={trackContainerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
          >
            <div className={styles.filmTrack}>
              {config.filmReel.frames.map((frame) => {
                const isHighlighted = highlightedFrameId === frame.id;
                const frameTitleText = getLocalizedText(frame.title, lang);
                const frameBadgeText = getLocalizedText(frame.badge, lang);
                const frameDescText = getLocalizedText(frame.desc, lang);

                return (
                  <div
                    key={frame.id}
                    id={`film-frame-${frame.id}`}
                    className={`${styles.filmFrame} ${isHighlighted ? styles.filmFrameHighlighted : ''}`}
                    onClick={() => setActiveLightbox(frame)}
                  >
                    <div className={styles.filmFrameBar}>
                      <span>SAFETY FILM</span>
                      <span>{frame.frameTag}</span>
                    </div>

                    <div className={styles.filmImageBox}>
                      <img
                        src={frame.image}
                        alt={frameTitleText}
                        className={styles.filmImage}
                        loading="lazy"
                      />
                    </div>

                    <div className={styles.filmCaptionBox}>
                      <div className={styles.frameNumberTag}>
                        Frame {frame.id < 10 ? `0${frame.id}` : frame.id} • {frameBadgeText}
                      </div>
                      <div className={styles.frameTitle}>{frameTitleText}</div>
                      <p className={styles.frameDesc}>{frameDescText}</p>
                    </div>

                    <div className={styles.filmFrameBar}>
                      <span>ORIA SAIGON</span>
                      <span>●● 2026 ●●</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom 35mm Sprocket Ribbon */}
          <div className={styles.sprocketHolesWrap} aria-hidden="true">
            {Array.from({ length: 24 }).map((_, i) => (
              <React.Fragment key={`bot-${i}`}>
                <div className={styles.sprocketHole} />
                {i % 4 === 2 && <span className={styles.filmStamp}>EXPOSURE {i + 1}A</span>}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Atmosphere Section: Không Khí Và Phong Cách */}
        <section className={styles.atmosphereSection}>
          <div className={styles.atmosphereGrid}>
            <div>
              <h3 className={styles.sectionHeadline}>
                <span className={styles.headlineIcon}>✨</span>
                {getLocalizedText(config.atmosphereSection.title, lang)}
              </h3>
              <ul className={styles.bulletList}>
                <li>{getLocalizedText(config.atmosphereSection.morning, lang)}</li>
                <li>{getLocalizedText(config.atmosphereSection.evening, lang)}</li>
                <li>{getLocalizedText(config.atmosphereSection.landmark, lang)}</li>
              </ul>
            </div>

            <div className={styles.nightStreetWrap}>
              <img
                src={config.atmosphereSection.nightStreetImage}
                alt={getLocalizedText(config.atmosphereSection.imageCaption, lang)}
                className={styles.nightStreetImg}
                loading="lazy"
              />
              <div className={styles.imageCaption}>
                {getLocalizedText(config.atmosphereSection.imageCaption, lang)}
              </div>
            </div>
          </div>
        </section>

        {/* Specialty Section: Đặc Sản Địa Phương • Oria Barbershop & Spa */}
        <section className={styles.specialtySection}>
          <div className={styles.specialtyHeader}>
            <span className={styles.specialtyBadge}>
              {getLocalizedText(config.specialtySection.badge, lang)}
            </span>
            <h3 className={styles.specialtyHeadline}>
              {getLocalizedText(config.specialtySection.headline, lang)}
            </h3>
            <p className={styles.specialtyLead}>
              {getLocalizedText(config.specialtySection.lead, lang)}
            </p>
          </div>

          <div className={styles.specialtyGrid}>
            {config.specialtySection.pillars.map((pillar, idx) => (
              <div key={`pillar-${idx}`} className={styles.specialtyCard}>
                <span className={styles.cardIcon}>{pillar.icon}</span>
                <h4 className={styles.cardTitle}>{getLocalizedText(pillar.title, lang)}</h4>
                <p className={styles.cardDesc}>{getLocalizedText(pillar.desc, lang)}</p>
              </div>
            ))}
          </div>

          <div className={styles.ctaFloat}>
            <Link
              href={config.specialtySection.ctaLink || `/${lang}/new-user/standard/checkout`}
              className={styles.btnBookNow}
            >
              <span>{getLocalizedText(config.specialtySection.ctaText, lang)}</span>
              <span>⟶</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Lightbox Modal */}
      {activeLightbox && (
        <div
          className={styles.filmLightbox}
          onClick={() => setActiveLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label={getLocalizedText(activeLightbox.title, lang)}
        >
          <div
            className={styles.lightboxCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.lightboxClose}
              onClick={() => setActiveLightbox(null)}
              aria-label="Close modal"
            >
              <X size={20} />
            </button>
            <div className={styles.lightboxImgWrap}>
              <img
                src={activeLightbox.image}
                alt={getLocalizedText(activeLightbox.title, lang)}
                className={styles.lightboxImg}
              />
            </div>
            <div className={styles.lightboxDetails}>
              <div className={styles.lightboxTag}>
                {activeLightbox.frameTag} • {getLocalizedText(activeLightbox.badge, lang)}
              </div>
              <h4 className={styles.lightboxTitle}>
                {getLocalizedText(activeLightbox.title, lang)}
              </h4>
              <p className={styles.lightboxDesc}>
                {getLocalizedText(activeLightbox.desc, lang)}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OurStory;
