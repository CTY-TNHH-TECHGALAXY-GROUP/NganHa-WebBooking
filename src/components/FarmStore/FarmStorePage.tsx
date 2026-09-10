'use client';

import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_FARM_STORE_CONFIG,
  hydrateFarmStoreConfig,
  isVideoUrl,
  type FarmStoreConfig,
} from '@/data/farmStoreData';
import styles from './FarmStorePage.module.css';

interface FarmStorePageProps {
  initialConfig?: FarmStoreConfig;
  initialLang?: Locale;
}

export default function FarmStorePage({
  initialConfig,
  initialLang,
}: FarmStorePageProps = {}) {
  const { currentLang, setCurrentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [lang, setLang] = useState<Locale>((initialLang || currentLang || 'vi') as Locale);
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<FarmStoreConfig | null>(initialConfig || null);

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
        const remoteContent = data?.farm_store_content || data?.content?.farm_store_content;
        if (remoteContent) {
          setRemoteConfig(hydrateFarmStoreConfig(remoteContent));
        }
      })
      .catch((err) => {
        console.error('Failed to load farm-store site-content:', err);
      });
  }, []);

  const config = remoteConfig || DEFAULT_FARM_STORE_CONFIG;

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
            isVideoUrl(config.heroImage) ? (
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
        {/* INTRO BLOCK */}
        <motion.div
          className={styles.introBlock}
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
        >
          {config.introLead && (
            <p className={styles.introLead}>{getText(config.introLead)}</p>
          )}
          {config.introParagraphs && config.introParagraphs.map((para, pIdx) => (
            <p key={'intro-' + pIdx} className={styles.introParagraph}>
              {getText(para)}
            </p>
          ))}
        </motion.div>

        {/* Khung Ảnh 01 (Toàn cảnh khu vườn Oria Farm - Single Landscape Frame) */}
        {Boolean(config.storyPhotos?.[0]) && (
          <motion.div
            className={styles.singlePhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {isVideoUrl(config.storyPhotos?.[0]) ? (
              <video
                src={config.storyPhotos?.[0]}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={config.storyPhotos?.[0]}
                alt="Oria Farm Garden Origin"
                loading="lazy"
              />
            )}
            {config.storyPhotosWatermark?.[0] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* SECTION 0: Ra đời từ chính khu vườn của ORIAFARM */}
        {config.sections?.[0] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[0].heading)}</h2>
            {config.sections[0].paragraphs.map((para, pIdx) => (
              <p key={'s0-p-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}
          </motion.section>
        )}

        {/* Cặp Khung Ảnh 02 & 03 (Diptych Pair - Thu hoạch & Nguyên liệu sạch) */}
        {(Boolean(config.storyPhotos?.[1]) || Boolean(config.storyPhotos?.[2])) && (
          <motion.div
            className={Boolean(config.storyPhotos?.[1]) && Boolean(config.storyPhotos?.[2]) ? styles.diptychGrid : styles.singlePhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {Boolean(config.storyPhotos?.[1]) && (
              <div className={styles.diptychFrame}>
                {isVideoUrl(config.storyPhotos?.[1]) ? (
                  <video src={config.storyPhotos?.[1]} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <img src={config.storyPhotos?.[1]} alt="Oria Farm Harvest 1" loading="lazy" />
                )}
                {config.storyPhotosWatermark?.[1] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </div>
            )}
            {Boolean(config.storyPhotos?.[2]) && (
              <div className={styles.diptychFrame}>
                {isVideoUrl(config.storyPhotos?.[2]) ? (
                  <video src={config.storyPhotos?.[2]} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <img src={config.storyPhotos?.[2]} alt="Oria Farm Harvest 2" loading="lazy" />
                )}
                {config.storyPhotosWatermark?.[2] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 1: Nguồn dinh dưỡng xanh, sạch và tự nhiên */}
        {config.sections?.[1] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[1].heading)}</h2>
            {config.sections[1].paragraphs.map((para, pIdx) => (
              <p key={'s1-p-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}

            {/* 3 Pillars Flow */}
            {config.pillars && config.pillars.length === 3 && (
              <div className={styles.pillarsGrid}>
                {config.pillars.map((pillar, idx) => (
                  <div key={'pillar-' + idx} className={styles.pillarCard}>
                    <span className={styles.pillarNumber}>0{idx + 1}</span>
                    <h3 className={styles.pillarTitle}>{getText(pillar.title)}</h3>
                    <p className={styles.pillarDesc}>{getText(pillar.desc)}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* SECTION 2: Mỗi công thức là một nguồn năng lượng cho ngày dài */}
        {config.sections?.[2] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[2].heading)}</h2>
            {config.sections[2].paragraphs.map((para, pIdx) => (
              <p key={'s2-p-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}
          </motion.section>
        )}

        {/* Cặp Khung Ảnh 04 & 05 (Diptych Pair - Thức uống năng lượng & Trái cây tự nhiên) */}
        {(Boolean(config.storyPhotos?.[3]) || Boolean(config.storyPhotos?.[4])) && (
          <motion.div
            className={Boolean(config.storyPhotos?.[3]) && Boolean(config.storyPhotos?.[4]) ? styles.diptychGrid : styles.singlePhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {Boolean(config.storyPhotos?.[3]) && (
              <div className={styles.diptychFrame}>
                {isVideoUrl(config.storyPhotos?.[3]) ? (
                  <video src={config.storyPhotos?.[3]} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <img src={config.storyPhotos?.[3]} alt="Oria Farm Beverage 1" loading="lazy" />
                )}
                {config.storyPhotosWatermark?.[3] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </div>
            )}
            {Boolean(config.storyPhotos?.[4]) && (
              <div className={styles.diptychFrame}>
                {isVideoUrl(config.storyPhotos?.[4]) ? (
                  <video src={config.storyPhotos?.[4]} autoPlay muted loop playsInline preload="metadata" />
                ) : (
                  <img src={config.storyPhotos?.[4]} alt="Oria Farm Beverage 2" loading="lazy" />
                )}
                {config.storyPhotosWatermark?.[4] !== false && (
                  <div className="media-watermark" aria-hidden="true" />
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* SECTION 3: Từ khu vườn Oria Farm đến ly nước bạn cầm trên tay */}
        {config.sections?.[3] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[3].heading)}</h2>
            {config.sections[3].paragraphs.map((para, pIdx) => (
              <p key={'s3-p-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}
          </motion.section>
        )}

        {/* Khung Ảnh 06 (Nghệ thuật F&B - Single Landscape/Artistic Frame) */}
        {Boolean(config.storyPhotos?.[5]) && (
          <motion.div
            className={styles.singlePhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            {isVideoUrl(config.storyPhotos?.[5]) ? (
              <video
                src={config.storyPhotos?.[5]}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <img
                src={config.storyPhotos?.[5]}
                alt="Oria Farm Store Final Ambiance"
                loading="lazy"
              />
            )}
            {config.storyPhotosWatermark?.[5] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* 3. SANCTUARY CLOSING & EDITORIAL CTA */}
        <motion.section
          className={styles.closingSection}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={styles.closingTitle}>{getText(config.pageTitle)}</h2>
          <p className={styles.closingTagline}>{getText(config.tagline)}</p>

          {config.motto && (
            <p className={styles.closingMotto}>{getText(config.motto)}</p>
          )}

          {config.hashtags && (
            <p className={styles.hashtagsLine}>{config.hashtags}</p>
          )}

          <p className={styles.closingText}>{getText(config.closingText)}</p>

          {config.address && getText(config.address) && (
            <div className={styles.addressBlock}>
              <MapPin size={15} className={styles.addressIcon} aria-hidden="true" />
              <span className={styles.addressText}>{getText(config.address)}</span>
            </div>
          )}

          {/* 4. SOFT EDITORIAL CTA (LINK ONLY, NO BUTTON FEELING) */}
          {config.ctaText && (
            <motion.div
              className={styles.ctaWrap}
              initial={reduceMotion ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <a
                href={ctaHref}
                className={styles.editorialCtaLink}
                target={ctaHref.startsWith('http') ? '_blank' : undefined}
                rel={ctaHref.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <span>{getText(config.ctaText)}</span>
                <ArrowUpRight size={19} className={styles.editorialCtaIcon} />
              </a>
            </motion.div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
