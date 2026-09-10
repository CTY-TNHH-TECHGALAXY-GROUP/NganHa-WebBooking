'use client';

import React, { useMemo, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, ArrowRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_LOCAL_TOUR_CONFIG,
  hydrateLocalTourConfig,
  type LocalTourConfig,
  type LocalTourDestination,
  type LocalTourPackage,
} from '@/data/localTourData';
import styles from './LocalTourPage.module.css';

interface LocalTourPageProps {
  initialConfig?: LocalTourConfig;
  initialLang?: Locale;
}

export default function LocalTourPage({ initialConfig, initialLang }: LocalTourPageProps = {}) {
  const { currentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const lang = (initialLang || currentLang || 'vi') as Locale;
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<LocalTourConfig | null>(initialConfig || null);

  useEffect(() => {
    fetch('/api/public/site-content')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const remoteTour = data?.local_tour_content || data?.content?.local_tour_content;
        if (remoteTour) {
          setRemoteConfig(hydrateLocalTourConfig(remoteTour));
        }
      })
      .catch((err) => {
        console.error('Failed to load local tour site-content:', err);
      });
  }, []);

  const config = useMemo(() => {
    return remoteConfig || DEFAULT_LOCAL_TOUR_CONFIG;
  }, [remoteConfig]);

  const getText = (obj?: Record<string, string>, fallback = '') => {
    if (!obj) return fallback;
    return obj[lang] || obj['en'] || obj['vi'] || fallback;
  };

  const destinationMap = useMemo(() => {
    const map = new Map<number, LocalTourDestination>();
    config.destinations.forEach((dest) => {
      map.set(dest.id, dest);
    });
    return map;
  }, [config.destinations]);

  const hotline = systemSettings?.phone || '+84 964 090 277';

  return (
    <div className={styles.sectionRoot}>
      <div className={styles.container}>
        
        {/* MASTHEAD CHUẨN THEME OUR STORY */}
        <header className={styles.masthead}>
          <div className={styles.titleComposition}>
            <h1>{getText(config.docTitle)}</h1>
            <p>{getText(config.docScript)}</p>
          </div>
          <div className={styles.mastheadRule}>
            <span>BẾN BẠCH ĐẰNG · ĐỒNG KHỞI · QUẬN 1</span>
            <span>ORIA SPA LOCAL TOUR</span>
          </div>
        </header>

        {/* INTRO DUCTION VERBATIM FROM DOCX */}
        <section className="pb-16 border-b border-[rgba(216,182,106,0.22)]">
          <p className={styles.lead}>
            {getText(config.docIntro)}
          </p>
          <p className={styles.introSub}>
            {getText(config.docIntroSub)}
          </p>
        </section>

        {/* 3 PACKAGE SHOWCASE CARDS (LUNE PRODUCTION STYLE) */}
        <section className="mt-12 mb-20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-[#d8b66a] font-serif text-xs font-bold tracking-[0.24em] uppercase block mb-3">
              {lang === 'vi' ? 'LỰA CHỌN HÀNH TRÌNH' : lang === 'cn' ? '行程选择' : lang === 'jp' ? 'ツアープランの選択' : lang === 'kr' ? '투어 선택' : 'CURATED ITINERARIES'}
            </span>
            <h2 className="text-[#fff6e8] font-serif text-2xl md:text-3xl font-bold tracking-wider">
              {lang === 'vi' ? '3 Tuyến Trải Nghiệm Văn Hoá & Di Sản' : lang === 'cn' ? '3条西贡文化与遗产深度游' : lang === 'jp' ? 'サイゴンの文化と歴史を巡る3つの旅' : lang === 'kr' ? '사이공의 문화와 유산을 만나는 3가지 여정' : '3 Cultural & Heritage Journeys'}
            </h2>
          </div>

          <div className={styles.packageShowcaseGrid}>
            {config.packages.map((pkg, pIdx) => {
              const slug = pkg.slug || pkg.id;
              const pkgUrl = lang && lang !== 'vi' ? `/${lang}/local-tour/${slug}` : `/local-tour/${slug}`;
              const pkgDestinations = pkg.destinationIds
                .map((id) => destinationMap.get(id))
                .filter((d): d is LocalTourDestination => Boolean(d));

              return (
                <motion.article
                  key={pkg.id}
                  className={styles.showcaseCard}
                  initial={reduceMotion ? false : { opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: pIdx * 0.1 }}
                >
                  <Link href={pkgUrl} className="block group">
                    <div className={styles.showcaseImageWrap}>
                      <img
                        src={pkg.heroImage || pkgDestinations[0]?.image}
                        alt={getText(pkg.title)}
                        loading="lazy"
                      />
                      <span className={styles.showcaseOrderBadge}>GÓI {pkg.orderNumber}</span>
                    </div>
                  </Link>

                  <div className={styles.showcaseBody}>
                    <div className={styles.showcaseTimePill}>
                      <Clock size={14} />
                      <span>{getText(pkg.durationLabel || pkg.time)}</span>
                    </div>

                    <Link href={pkgUrl} className="hover:text-[#d8b66a] transition-colors">
                      <h3 className={styles.showcaseTitle}>{getText(pkg.title)}</h3>
                    </Link>

                    <p className={styles.showcaseTagline}>{getText(pkg.tagline || pkg.bestFor)}</p>

                    <div className="pt-4 border-t border-[rgba(216,182,106,0.18)] mt-auto">
                      <div className="flex items-center justify-between text-xs text-[#bcb09f] mb-4">
                        <span>
                          {pkgDestinations.length}{' '}
                          {lang === 'vi' ? 'điểm dừng' : lang === 'cn' ? '个景点' : lang === 'jp' ? 'カ所' : lang === 'kr' ? '개 명소' : 'destinations'}
                        </span>
                        <span className="text-[#d8b66a] text-[11px] uppercase tracking-wider">
                          {getText(pkg.bestFor)?.split(/[,.]/)[0]}
                        </span>
                      </div>

                      <Link href={pkgUrl} className={styles.showcaseCta}>
                        <span>
                          {lang === 'vi'
                            ? 'Khám Phá Chi Tiết'
                            : lang === 'cn'
                            ? '探索行程详情'
                            : lang === 'jp'
                            ? 'ツアープランを見る'
                            : lang === 'kr'
                            ? '투어 상세 보기'
                            : 'Explore Tour'}
                        </span>
                        <ArrowRight size={15} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        {/* DESTINATION SCENIC PREVIEW GALLERY */}
        <section className="pt-10 pb-16 border-t border-[rgba(216,182,106,0.22)]">
          <div className={styles.galleryHeader}>
            <span>
              {lang === 'vi' ? 'Toàn Cảnh 10 Điểm Đến Nổi Tiếng Sài Gòn' : lang === 'cn' ? '西贡10大标志性地标全景' : lang === 'jp' ? 'サイゴンを代表する10の名所ギャラリー' : lang === 'kr' ? '사이공 10대 명소 갤러리' : '10 Iconic Sights of Saigon'}
            </span>
            <span>
              {lang === 'vi' ? 'Cuộn ngang để xem ➔' : lang === 'cn' ? '横向滑动检视 ➔' : lang === 'jp' ? '横スクロール ➔' : lang === 'kr' ? '가로 스크롤 ➔' : 'Scroll horizontally ➔'}
            </span>
          </div>

          <div className={styles.filmScroller}>
            <div className={styles.filmStrip}>
              {config.destinations.map((stop, stopIdx) => {
                const stopNum = String(stopIdx + 1).padStart(2, '0');
                return (
                  <div key={'dest-' + stop.id} className={styles.destinationItem}>
                    <motion.figure
                      className={styles.filmFrame}
                      initial={reduceMotion ? false : { opacity: 0.85, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.4, delay: stopIdx * 0.04 }}
                    >
                      <div className={styles.filmFrameHeader}>
                        <span>ORIA 400</span>
                        <span>EXP {stopNum}</span>
                      </div>
                      <div className={styles.filmFrameImgWrap}>
                        <img
                          src={stop.image}
                          alt={getText(stop.name)}
                          loading="lazy"
                        />
                      </div>
                      <div className={styles.filmFrameFooter}>
                        <span className={styles.frameCode}>▶ {stopNum}A</span>
                        <span className={styles.filmBrand}>SAFETY FILM · 35mm</span>
                      </div>
                    </motion.figure>

                    <div className={styles.itemCaption}>
                      <strong className="text-center block">{getText(stop.name)}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CLOSING SUMMARY VERBATIM FROM DOCX */}
        <section className="pt-20 pb-16 text-center max-w-2xl mx-auto">
          <p className={styles.closingText}>
            {getText(config.docClosing)}
          </p>
          <div className={styles.closingLinks}>
            <a href={`tel:${hotline.replace(/\s+/g, '')}`} className={styles.closingPhone}>
              Hotline: {hotline}
            </a>
            <span className="text-[#422e23]">·</span>
            <span className={styles.closingAddress}>
              {getText(config.address || DEFAULT_LOCAL_TOUR_CONFIG.address)}
            </span>
          </div>
        </section>

      </div>
    </div>
  );
}
