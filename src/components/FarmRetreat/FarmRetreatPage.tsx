'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Sparkles, Wind, Bath, Heart, Coffee } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_FARM_RETREAT_CONFIG,
  hydrateFarmRetreatConfig,
  type FarmRetreatConfig,
} from '@/data/farmRetreatData';
import styles from './FarmRetreatPage.module.css';

interface FarmRetreatPageProps {
  initialConfig?: FarmRetreatConfig;
  initialLang?: Locale;
}

export default function FarmRetreatPage({
  initialConfig,
  initialLang,
}: FarmRetreatPageProps = {}) {
  const { currentLang, setCurrentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [lang, setLang] = useState<Locale>((initialLang || currentLang || 'vi') as Locale);
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<FarmRetreatConfig | null>(initialConfig || null);

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
        const remoteContent = data?.farm_retreat_content || data?.content?.farm_retreat_content;
        if (remoteContent) {
          setRemoteConfig(hydrateFarmRetreatConfig(remoteContent));
        }
      })
      .catch((err) => {
        console.error('Failed to load farm-retreat site-content:', err);
      });
  }, []);

  const config = remoteConfig || DEFAULT_FARM_RETREAT_CONFIG;

  const getText = (localized?: Record<string, string>): string => {
    if (!localized) return '';
    return localized[lang] || localized['en'] || localized['vi'] || '';
  };

  const getHighlights = (): string[] => {
    if (!config.highlights) return [];
    return config.highlights[lang] || config.highlights['en'] || config.highlights['vi'] || [];
  };

  const hotline = systemSettings?.phone || '+84 964 090 277';
  const ctaHref = config.ctaLink || `tel:${hotline.replace(/\s+/g, '')}`;

  const isVideoUrl = (url?: string) => {
    if (!url) return false;
    return Boolean(
      config.heroMediaType === 'video' ||
      /\.(mp4|mov|webm)(\?.*)?$/i.test(url)
    );
  };

  // Step labels for Section 2 rhythm cards
  const rhythmStepTitles = useMemo(() => {
    switch (lang) {
      case 'en':
        return [
          { step: 'Step 01', title: 'Steam' },
          { step: 'Step 02', title: 'Warm Bath' },
          { step: 'Step 03', title: 'Body Massage' },
          { step: 'Step 04', title: 'Deep Rest' },
        ];
      case 'cn':
        return [
          { step: '第一步', title: '蒸汽桑拿' },
          { step: '第二步', title: '温水泡浴' },
          { step: '第三步', title: '全身按摩' },
          { step: '第四步', title: '静心休息' },
        ];
      case 'jp':
        return [
          { step: 'STEP 01', title: 'スチーム' },
          { step: 'STEP 02', title: '温浴バス' },
          { step: 'STEP 03', title: '全身マッサージ' },
          { step: 'STEP 04', title: '休息' },
        ];
      case 'kr':
        return [
          { step: 'STEP 01', title: '스팀 세션' },
          { step: 'STEP 02', title: '따뜻한 욕조' },
          { step: 'STEP 03', title: '전신 마사지' },
          { step: 'STEP 04', title: '편안한 휴식' },
        ];
      default:
        return [
          { step: 'Bước 01', title: 'Xông hơi' },
          { step: 'Bước 02', title: 'Tắm bồn' },
          { step: 'Bước 03', title: 'Xoa bóp toàn thân' },
          { step: 'Bước 04', title: 'Nghỉ ngơi' },
        ];
    }
  }, [lang]);

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
        {config.introParagraphs && config.introParagraphs.length > 0 && (
          <motion.div
            className={styles.introBlock}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            {config.introParagraphs.map((para, pIdx) => (
              <p
                key={'intro-p-' + pIdx}
                className={pIdx === 0 ? styles.introLead : styles.introParagraph}
              >
                {getText(para)}
              </p>
            ))}
          </motion.div>
        )}

        {/* Media Frame 0 (Khung Ảnh 01 - Bungalow giữa thiên nhiên) */}
        {Boolean(config.storyPhotos?.[0]) && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={config.storyPhotos?.[0]}
              alt="Oria Farm Retreat Bungalow"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[0] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* SECTION 1: Một bungalow riêng cho ngày của bạn */}
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

        {/* Media Frame 1 (Khung Ảnh 02 - Góc thư giãn trà & sách) */}
        {Boolean(config.storyPhotos?.[1]) && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={config.storyPhotos?.[1]}
              alt="Oria Farm Retreat Living Space"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[1] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* SECTION 2: Xông hơi. Tắm bồn. Xoa bóp toàn thân. Nghỉ ngơi. */}
        {config.sections?.[1] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[1].heading)}</h2>
            
            {/* Paragraph 0 & 1 */}
            {config.sections[1].paragraphs.slice(0, 2).map((para, pIdx) => (
              <p key={'s1-p-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}

            {/* Rhythm 4-step sequence to break reading text fatigue */}
            <div className={styles.rhythmFlow}>
              {rhythmStepTitles.map((item, idx) => (
                <div key={'rhythm-' + idx} className={styles.rhythmItem}>
                  <span className={styles.rhythmStep}>{item.step}</span>
                  <span className={styles.rhythmTitle}>{item.title}</span>
                </div>
              ))}
            </div>

            {/* Remaining paragraphs of Section 2 */}
            {config.sections[1].paragraphs.slice(2).map((para, pIdx) => (
              <p key={'s1-p-rem-' + pIdx} className={styles.paragraph}>
                {getText(para)}
              </p>
            ))}
          </motion.section>
        )}

        {/* Media Frame 2 (Khung Ảnh 03 - Trị liệu & Tắm bồn) */}
        {Boolean(config.storyPhotos?.[2]) && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={config.storyPhotos?.[2]}
              alt="Oria Farm Retreat Body Therapy"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[2] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* SECTION 3: Ăn chậm lại, tận hưởng thời gian của mình */}
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

        {/* Media Frame 3 (Khung Ảnh 04 - Ẩm thực & Trà giữa thiên nhiên) */}
        {Boolean(config.storyPhotos?.[3]) && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={config.storyPhotos?.[3]}
              alt="Oria Farm Retreat Dining"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[3] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* SECTION 4: Không cần đi thật xa để cảm thấy mình đã rời khỏi thành phố */}
        {config.sections?.[3] && (
          <motion.section
            className={styles.editorialSection}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className={styles.sectionHeading}>{getText(config.sections[3].heading)}</h2>
            
            {/* Opening paragraph */}
            {config.sections[3].paragraphs[0] && (
              <p className={styles.paragraph}>{getText(config.sections[3].paragraphs[0])}</p>
            )}

            {/* Audience categories list (paragraphs 1 to 4) */}
            {config.sections[3].paragraphs.length >= 5 && (
              <div className={styles.audienceList}>
                {config.sections[3].paragraphs.slice(1, 5).map((p, idx) => (
                  <div key={'aud-' + idx} className={styles.audienceItem}>
                    <span className={styles.audienceMarker}>—</span>
                    <span className={styles.audienceText}>{getText(p)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Closing flow paragraph */}
            {config.sections[3].paragraphs[5] && (
              <p className={styles.paragraph}>{getText(config.sections[3].paragraphs[5])}</p>
            )}
          </motion.section>
        )}

        {/* Media Frame 4 (Khung Ảnh 05 - Hoàng hôn & Khung cảnh thiên nhiên tĩnh lặng) */}
        {Boolean(config.storyPhotos?.[4]) && (
          <motion.div
            className={styles.storyPhotoFrame}
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7 }}
          >
            <img
              src={config.storyPhotos?.[4]}
              alt="Oria Farm Retreat Sunset"
              loading="lazy"
            />
            {config.storyPhotosWatermark?.[4] !== false && (
              <div className="media-watermark" aria-hidden="true" />
            )}
          </motion.div>
        )}

        {/* 3. SANCTUARY CLOSING */}
        <motion.section
          className={styles.closingSection}
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className={styles.closingTitle}>Oria Farm Retreat</h2>
          <p className={styles.closingTagline}>A day away from the city.</p>

          {/* Highlights Line (Soft Editorial Separators) */}
          <div className={styles.highlightsLine}>
            {getHighlights().map((hl, idx, arr) => (
              <React.Fragment key={'hl-' + idx}>
                <span className={styles.highlightWord}>{hl}</span>
                {idx < arr.length - 1 && (
                  <span className={styles.highlightSep} aria-hidden="true">·</span>
                )}
              </React.Fragment>
            ))}
          </div>

          <p className={styles.closingText}>{getText(config.closingText)}</p>

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
                <span>{getText(config.ctaText) || (lang === 'vi' ? 'Liên hệ Oria Farm Retreat' : 'Discover Oria Farm Retreat')}</span>
                <ArrowUpRight size={19} className={styles.editorialCtaIcon} />
              </a>
            </motion.div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
