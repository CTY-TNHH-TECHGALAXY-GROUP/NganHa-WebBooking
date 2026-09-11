'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_HOME_SPA_CONFIG,
  hydrateHomeSpaConfig,
  type HomeSpaConfig,
} from '@/data/homeSpaData';
import styles from './HomeSpaPage.module.css';

interface HomeSpaPageProps {
  initialConfig?: HomeSpaConfig;
  initialLang?: Locale;
}

export default function HomeSpaPage({
  initialConfig,
  initialLang,
}: HomeSpaPageProps = {}) {
  const { currentLang, setCurrentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [lang, setLang] = useState<Locale>((initialLang || currentLang || 'vi') as Locale);
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<HomeSpaConfig | null>(initialConfig || null);

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
        const remoteContent = data?.home_spa_content || data?.content?.home_spa_content;
        if (remoteContent) {
          setRemoteConfig(hydrateHomeSpaConfig(remoteContent));
        }
      })
      .catch((err) => {
        console.error('Failed to load home-spa site-content:', err);
      });
  }, []);

  const config = remoteConfig || DEFAULT_HOME_SPA_CONFIG;

  const getText = (localized?: Record<string, string>): string => {
    if (!localized) return '';
    return localized[lang] || localized.vi || localized.en || Object.values(localized)[0] || '';
  };

  const hotline = systemSettings?.phone || '+84 964 090 277';
  const ctaHref = config.ctaLink || `tel:${hotline.replace(/\s+/g, '')}`;

  return (
    <div className={styles.pageRoot}>
      {/* 1. CINEMATIC HERO BANNER */}
      <section className={styles.hero}>
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
            <div className="media-watermark" aria-hidden="true" />
          )}
          <div className={styles.heroGradient} />
          <div className={styles.heroVignette} />
        </div>

        <div className={styles.heroContent}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className={styles.heroTitle}>{getText(config.pageTitle)}</h1>
            <p className={styles.heroSubtitle}>{getText(config.pageSubtitle)}</p>
            <div className={styles.heroDivider} />
          </motion.div>
        </div>
      </section>

      {/* 2. EDITORIAL ARTICLE CONTAINER */}
      <main className={styles.articleContainer}>
        {config.sections.map((section, sIdx) => (
          <React.Fragment key={section.id || 'sec-' + sIdx}>
            <motion.section
              className={styles.editorialSection}
              initial={reduceMotion ? false : { opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className={styles.sectionHeading}>{getText(section.heading)}</h2>

              {section.paragraphs.map((para, pIdx) => (
                <p key={'p-' + sIdx + '-' + pIdx} className={styles.paragraph}>
                  {getText(para)}
                </p>
              ))}
            </motion.section>

            {/* Story Photo 1 after Section 1 */}
            {sIdx === 0 && config.storyPhotos?.[0] && (
              <motion.div
                className={styles.storyPhotoFrame}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <img
                  src={config.storyPhotos[0]}
                  alt="Oria Home Spa"
                  loading="lazy"
                />
                {config.storyPhotosWatermark?.[0] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </motion.div>
            )}

            {/* Story Photo 2 after Section 2 */}
            {sIdx === 1 && config.storyPhotos?.[1] && (
              <motion.div
                className={styles.storyPhotoFrame}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <img
                  src={config.storyPhotos[1]}
                  alt="Oria Home Spa"
                  loading="lazy"
                />
                {config.storyPhotosWatermark?.[1] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </motion.div>
            )}

            {/* Story Photo 3 after Section 3 */}
            {sIdx === 2 && config.storyPhotos?.[2] && (
              <motion.div
                className={styles.storyPhotoFrame}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.7 }}
              >
                <img
                  src={config.storyPhotos[2]}
                  alt="Oria Home Spa"
                  loading="lazy"
                />
                {config.storyPhotosWatermark?.[2] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </motion.div>
            )}
          </React.Fragment>
        ))}

        {/* 3. CLOSING THOUGHT */}
        {config.closingText && (
          <motion.section
            className={styles.closingSection}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className={styles.closingText}>{getText(config.closingText)}</p>
          </motion.section>
        )}

        {/* 4. SOFT EDITORIAL CTA (LINK ONLY, NO AGGRESSIVE BUTTON) */}
        {config.ctaText && (
          <motion.div
            className={styles.ctaWrap}
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Link href={ctaHref} className={styles.editorialCtaLink}>
              <span>{getText(config.ctaText)}</span>
              <ArrowUpRight size={19} className={styles.editorialCtaIcon} />
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  );
}
