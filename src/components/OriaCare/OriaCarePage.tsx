'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_ORIA_CARE_CONFIG,
  hydrateOriaCareConfig,
  type OriaCareConfig,
} from '@/data/oriaCareData';
import styles from './OriaCarePage.module.css';

interface OriaCarePageProps {
  initialConfig?: OriaCareConfig;
  initialLang?: Locale;
  embedded?: boolean;
  skipIntroduction?: boolean;
}

export default function OriaCarePage({
  initialConfig,
  initialLang,
  embedded = false,
  skipIntroduction = false,
}: OriaCarePageProps = {}) {
  const { currentLang, setCurrentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [lang, setLang] = useState<Locale>((initialLang || currentLang || 'vi') as Locale);
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<OriaCareConfig | null>(initialConfig || null);

  // Synchronize initialLang into translation context if provided
  useEffect(() => {
    if (initialLang && initialLang !== currentLang) {
      setCurrentLang(initialLang);
      setLang(initialLang as Locale);
    }
  }, [initialLang]);

  // Synchronize dynamic language changes from Header dropdown
  useEffect(() => {
    if (currentLang && currentLang !== lang) {
      setLang(currentLang as Locale);
    }
  }, [currentLang]);

  // Fetch updated content from public site-content API
  useEffect(() => {
    fetch(`/api/public/site-content?t=${Date.now()}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const remoteContent = data?.oria_care_content || data?.content?.oria_care_content;
        if (remoteContent) {
          setRemoteConfig(hydrateOriaCareConfig(remoteContent));
        }
      })
      .catch((err) => {
        console.error('Failed to load oria-care site-content:', err);
      });
  }, []);

  const config = remoteConfig || DEFAULT_ORIA_CARE_CONFIG;
  const ArticleContainer = embedded ? 'div' : 'main';
  const Title = embedded ? 'h2' : 'h1';

  const getText = (localized?: Record<string, string>): string => {
    if (!localized) return '';
    return localized[lang] || localized.vi || localized.en || Object.values(localized)[0] || '';
  };

  const hotline = systemSettings?.phone || '+84 964 090 277';
  const ctaHref = config.ctaLink || `tel:${hotline.replace(/\s+/g, '')}`;

  return (
    <section id="oria-care" className={`${styles.pageRoot} ${embedded ? styles.embedded : ''}`}>
      {/* 1. CINEMATIC HERO BANNER */}
      <section className={`${styles.hero} ${embedded && !config.heroImage ? styles.textIntro : ''}`}>
        <div className={styles.heroBackdrop}>
          {Boolean(config.heroImage) && (
            (config.heroMediaType === 'video' || /\.(mp4|mov|webm)(\?.*)?$/i.test(config.heroImage || '')) ? (
              <video
                src={config.heroImage}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                aria-label={getText(config.pageTitle)}
              />
            ) : (
              <img
                src={config.heroImage}
                alt={getText(config.pageTitle)}
              />
            )
          )}
          {config.heroWatermarkEnabled !== false && (
            <div
              className="media-watermark"
              aria-hidden="true"
              style={{ opacity: (config.heroWatermarkOpacity ?? 15) / 100 }}
            />
          )}
        </div>
        <div className={styles.heroGradient} />
        <div className={styles.heroVignette} />

        <motion.div
          className={styles.heroContent}
          initial={reduceMotion ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className={styles.heroPre}>ORIA WELLNESS CARE</span>
          <Title className={styles.heroTitle}>{getText(config.pageTitle)}</Title>
          <p className={styles.heroSubtitle}>{getText(config.pageSubtitle)}</p>
          <div className={styles.heroDivider} />
        </motion.div>
      </section>

      {/* 2. MAIN EDITORIAL ARTICLE */}
      <ArticleContainer className={styles.articleContainer}>
        {/* SECTION 1 */}
        {!skipIntroduction && config.sections[0] && (
          <motion.article
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[0].heading)}</h2>
            {config.sections[0].paragraphs?.map((p, idx) => (
              <React.Fragment key={idx}>
                <p className={styles.paragraph}>{getText(p)}</p>
                {config.sections[0].paragraphImages?.[idx]?.src && (
                  <div className={styles.storyPhotoFrame}>
                    <img src={config.sections[0].paragraphImages![idx]!.src} alt={getText(config.sections[0].heading)} loading="lazy" />
                    {config.sections[0].paragraphImages![idx]!.watermarkEnabled !== false && (
                      <div className="media-watermark" aria-hidden="true" style={{ opacity: config.sections[0].paragraphImages![idx]!.watermarkOpacity / 100 }} />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </motion.article>
        )}

        {/* PHOTO FRAME 01 (Interleaved after Section 1) */}
        {!skipIntroduction && config.storyPhotos?.[0] && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <img
              src={config.storyPhotos[0]}
              alt="Oria Care"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[0] !== false && (
              <div
                className="media-watermark"
                aria-hidden="true"
                style={{ opacity: (config.storyPhotosWatermarkOpacity?.[0] ?? 15) / 100 }}
              />
            )}
          </motion.div>
        )}

        {/* SECTION 2 */}
        {config.sections[1] && (
          <motion.article
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[1].heading)}</h2>
            {config.sections[1].paragraphs?.map((p, idx) => (
              <React.Fragment key={idx}>
                <p className={styles.paragraph}>{getText(p)}</p>
                {config.sections[1].paragraphImages?.[idx]?.src && (
                  <div className={styles.storyPhotoFrame}>
                    <img src={config.sections[1].paragraphImages![idx]!.src} alt={getText(config.sections[1].heading)} loading="lazy" />
                    {config.sections[1].paragraphImages![idx]!.watermarkEnabled !== false && (
                      <div className="media-watermark" aria-hidden="true" style={{ opacity: config.sections[1].paragraphImages![idx]!.watermarkOpacity / 100 }} />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </motion.article>
        )}

        {/* PHOTO FRAME 02 (Interleaved after Section 2) */}
        {config.storyPhotos?.[1] && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <img
              src={config.storyPhotos[1]}
              alt="Oria Care"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[1] !== false && (
              <div
                className="media-watermark"
                aria-hidden="true"
                style={{ opacity: (config.storyPhotosWatermarkOpacity?.[1] ?? 15) / 100 }}
              />
            )}
          </motion.div>
        )}

        {/* SECTION 3 */}
        {config.sections[2] && (
          <motion.article
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[2].heading)}</h2>
            {config.sections[2].paragraphs?.map((p, idx) => (
              <React.Fragment key={idx}>
                <p className={styles.paragraph}>{getText(p)}</p>
                {config.sections[2].paragraphImages?.[idx]?.src && (
                  <div className={styles.storyPhotoFrame}>
                    <img src={config.sections[2].paragraphImages![idx]!.src} alt={getText(config.sections[2].heading)} loading="lazy" />
                    {config.sections[2].paragraphImages![idx]!.watermarkEnabled !== false && (
                      <div className="media-watermark" aria-hidden="true" style={{ opacity: config.sections[2].paragraphImages![idx]!.watermarkOpacity / 100 }} />
                    )}
                  </div>
                )}
              </React.Fragment>
            ))}
          </motion.article>
        )}

        {/* PHOTO FRAME 03 (Interleaved after Section 3) */}
        {config.storyPhotos?.[2] && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            <img
              src={config.storyPhotos[2]}
              alt="Oria Care"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[2] !== false && (
              <div
                className="media-watermark"
                aria-hidden="true"
                style={{ opacity: (config.storyPhotosWatermarkOpacity?.[2] ?? 15) / 100 }}
              />
            )}
          </motion.div>
        )}

        {/* 4. CLOSING STATEMENT */}
        {Boolean(getText(config.closingText)) && (
          <motion.div
            className={styles.closingSection}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <p className={styles.closingText}>
              &ldquo;{getText(config.closingText)}&rdquo;
            </p>
          </motion.div>
        )}

        {/* 5. MINIMAL EDITORIAL CTA */}
        {Boolean(getText(config.ctaText)) && (
          <div className={styles.ctaWrap}>
            {ctaHref.startsWith('/') ? (
              <Link href={ctaHref} className={styles.editorialCtaLink}>
                <span>{getText(config.ctaText)}</span>
                <ArrowUpRight size={18} className={styles.editorialCtaIcon} />
              </Link>
            ) : (
              <a
                href={ctaHref}
                className={styles.editorialCtaLink}
                target={ctaHref.startsWith('http') ? '_blank' : undefined}
                rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span>{getText(config.ctaText)}</span>
                <ArrowUpRight size={18} className={styles.editorialCtaIcon} />
              </a>
            )}
          </div>
        )}
      </ArticleContainer>
    </section>
  );
}
