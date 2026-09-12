'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { Clock, MapPin, Compass, Phone, ArrowRight, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import {
  DEFAULT_LOCAL_TOUR_CONFIG,
  hydrateLocalTourConfig,
  getPackageBySlugOrId,
  type LocalTourConfig,
  type LocalTourDestination,
  type LocalTourPackage,
} from '@/data/localTourData';
import styles from './LocalTourPackagePage.module.css';

interface LocalTourPackagePageProps {
  packageSlug: string;
  initialConfig?: LocalTourConfig;
  initialLang?: Locale;
}

function HighlightCardItem({
  hl,
  idx,
  getText,
  reduceMotion,
}: {
  hl: {
    image: string;
    images?: string[];
    title: Record<string, string>;
    subtitle: Record<string, string>;
    watermarkEnabled?: boolean;
    watermarkOpacity?: number;
  };
  idx: number;
  getText: (s?: Record<string, string>) => string;
  reduceMotion: boolean | null;
}) {
  const { currentLang: lang } = useTranslation();
  const images = Array.isArray(hl.images) && hl.images.length > 0
    ? hl.images.filter(Boolean)
    : (hl.image ? [hl.image] : []);
  const [activeImgIdx, setActiveImgIdx] = useState(0);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleScroll = () => {
    if (!scrollerRef.current) return;
    const { scrollLeft, clientWidth } = scrollerRef.current;
    if (clientWidth > 0) {
      const newIdx = Math.round(scrollLeft / clientWidth);
      if (newIdx !== activeImgIdx && newIdx >= 0 && newIdx < images.length) {
        setActiveImgIdx(newIdx);
      }
    }
  };

  const scrollToImage = (newIdx: number) => {
    if (!scrollerRef.current || newIdx < 0 || newIdx >= images.length) return;
    const scroller = scrollerRef.current;
    const targetChild = scroller.children[newIdx] as HTMLElement;
    if (targetChild && typeof targetChild.offsetLeft === 'number') {
      scroller.scrollTo({ left: targetChild.offsetLeft, behavior: 'smooth' });
    } else {
      const targetLeft = newIdx * scroller.clientWidth;
      scroller.scrollTo({ left: targetLeft, behavior: 'smooth' });
    }
    setActiveImgIdx(newIdx);
  };

  return (
    <motion.article
      className={styles.highlightCard}
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay: idx * 0.1 }}
    >
      <div className={styles.highlightImgWrap}>
        {images.length > 1 ? (
          <>
            <div
              ref={scrollerRef}
              className={styles.highlightScroller}
              onScroll={handleScroll}
            >
              {images.map((imgUrl, iIdx) => (
                <div 
                  key={'img-' + iIdx} 
                  className={`${styles.highlightSlide} cursor-zoom-in relative group/slide`}
                  onPointerDown={(e) => {
                    pointerStartRef.current = { x: e.clientX, y: e.clientY };
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (pointerStartRef.current) {
                      const dx = Math.abs(e.clientX - pointerStartRef.current.x);
                      const dy = Math.abs(e.clientY - pointerStartRef.current.y);
                      if (dx > 10 || dy > 10) return; // User was dragging/swiping to scroll!
                    }
                    window.dispatchEvent(new CustomEvent('open-media-preview', {
                      detail: {
                        mediaUrl: imgUrl,
                        title: getText(hl.title),
                        description: getText(hl.subtitle)
                      }
                    }));
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`${getText(hl.title)} (${iIdx + 1}/${images.length})`}
                  title={lang === 'vi' ? 'Xem ảnh toàn màn hình' : 'Click to view full screen'}
                >
                  <img
                    src={imgUrl}
                    alt={`${getText(hl.title)} (${iIdx + 1}/${images.length})`}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover/slide:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="w-8 h-8 rounded-full bg-black/75 text-[#C9A96E] border border-[#C9A96E]/40 flex items-center justify-center shadow-md">
                      <ZoomIn size={15} strokeWidth={2.2} />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Photo count badge */}
            <span className={styles.highlightPhotoCount}>
              {activeImgIdx + 1}/{images.length}
            </span>

            {/* Arrow Nav Buttons: centered vertically, always accessible */}
            <button
              type="button"
              className={`${styles.highlightNavBtn} ${styles.highlightNavPrev} ${activeImgIdx === 0 ? styles.highlightNavEdge : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (activeImgIdx > 0) {
                  scrollToImage(activeImgIdx - 1);
                } else {
                  scrollToImage(images.length - 1);
                }
              }}
              aria-label="Previous photo"
              title={lang === 'vi' ? 'Ảnh trước' : 'Previous photo'}
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              className={`${styles.highlightNavBtn} ${styles.highlightNavNext} ${activeImgIdx === images.length - 1 ? styles.highlightNavEdge : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (activeImgIdx < images.length - 1) {
                  scrollToImage(activeImgIdx + 1);
                } else {
                  scrollToImage(0);
                }
              }}
              aria-label="Next photo"
              title={lang === 'vi' ? 'Ảnh tiếp theo' : 'Next photo'}
            >
              <ChevronRight size={20} strokeWidth={2.5} />
            </button>

            {/* Pagination Dots */}
            <div className={styles.highlightDots}>
              {images.map((_, dotIdx) => (
                <button
                  key={'dot-' + dotIdx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    scrollToImage(dotIdx);
                  }}
                  className={`${styles.highlightDot} ${dotIdx === activeImgIdx ? styles.highlightDotActive : ''}`}
                  aria-label={`Go to photo ${dotIdx + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className="w-full h-full cursor-zoom-in relative group/slide"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('open-media-preview', {
                detail: {
                  mediaUrl: images[0] || hl.image,
                  title: getText(hl.title),
                  description: getText(hl.subtitle)
                }
              }));
            }}
            role="button"
            tabIndex={0}
            aria-label={getText(hl.title)}
            title={lang === 'vi' ? 'Xem ảnh toàn màn hình' : 'Click to view full screen'}
          >
            <img 
              src={images[0] || hl.image} 
              alt={getText(hl.title)} 
              loading="lazy" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover/slide:scale-105"
            />
            <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/slide:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-black/75 text-[#C9A96E] border border-[#C9A96E]/40 flex items-center justify-center shadow-md">
                <ZoomIn size={15} strokeWidth={2.2} />
              </div>
            </div>
          </div>
        )}

        {hl.watermarkEnabled !== false && (
          <div
            className="media-watermark"
            aria-hidden="true"
            style={{ opacity: (hl.watermarkOpacity ?? 15) / 100 }}
          />
        )}

        <span className={styles.highlightNumber}>{String(idx + 1).padStart(2, '0')}</span>
      </div>

      <div className={styles.highlightBody}>
        <h3 className={styles.highlightTitle}>{getText(hl.title)}</h3>
        <p className={styles.highlightSubtitle}>{getText(hl.subtitle)}</p>
      </div>
    </motion.article>
  );
}

export default function LocalTourPackagePage({
  packageSlug,
  initialConfig,
  initialLang,
}: LocalTourPackagePageProps) {
  const { currentLang, setCurrentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const [lang, setLang] = useState<Locale>((initialLang || currentLang || 'vi') as Locale);
  const reduceMotion = useReducedMotion();

  const [remoteConfig, setRemoteConfig] = useState<LocalTourConfig | null>(initialConfig || null);

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

  useEffect(() => {
    fetch(`/api/public/site-content?t=${Date.now()}`, { cache: 'no-store' })
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

  const config = remoteConfig || DEFAULT_LOCAL_TOUR_CONFIG;

  const getText = (localized?: Record<string, string>): string => {
    if (!localized) return '';
    return localized[lang] || localized.vi || localized.en || Object.values(localized)[0] || '';
  };

  // Find target package
  const pkg: LocalTourPackage = useMemo(() => {
    const found = getPackageBySlugOrId(packageSlug, config.packages);
    return found || config.packages[0] || DEFAULT_LOCAL_TOUR_CONFIG.packages[0];
  }, [packageSlug, config.packages]);

  // Destination lookup map
  const destinationMap = useMemo(() => {
    const map = new Map<number, LocalTourDestination>();
    config.destinations.forEach((d) => map.set(d.id, d));
    return map;
  }, [config.destinations]);

  // Destinations in this package
  const pkgDestinations = useMemo(() => {
    return pkg.destinationIds
      .map((id) => destinationMap.get(id))
      .filter((d): d is LocalTourDestination => Boolean(d));
  }, [pkg.destinationIds, destinationMap]);

  const hotline = config.ctaHotline?.trim() || systemSettings?.phone || '+84 964 090 277';

  // Helper for localized package link
  const getPackageUrl = (targetPkg: LocalTourPackage) => {
    const slug = targetPkg.slug || targetPkg.id;
    if (lang && lang !== 'vi') {
      return `/${lang}/local-tour/${slug}`;
    }
    return `/local-tour/${slug}`;
  };

  const currentPkgIdx = useMemo(() => {
    return config.packages.findIndex((p) => (p.slug || p.id) === (pkg.slug || pkg.id));
  }, [config.packages, pkg]);

  const nextPkg = useMemo(() => {
    const idx = currentPkgIdx >= 0 ? currentPkgIdx : 0;
    return config.packages[(idx + 1) % config.packages.length] || config.packages[0];
  }, [config.packages, currentPkgIdx]);

  return (
    <div className={styles.packagePage}>
      {/* 1. CINEMATIC HERO (LUNE PRODUCTION STYLE) */}
      <section className={styles.hero}>
        <div className={styles.heroBackdrop}>
          <img
            src={pkg.heroImage || pkgDestinations[0]?.image || 'https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1800&q=85'}
            alt={getText(pkg.title)}
          />
          {pkg.heroWatermarkEnabled !== false && (
            <div
              className="media-watermark"
              aria-hidden="true"
              style={{ opacity: (pkg.heroWatermarkOpacity ?? 15) / 100 }}
            />
          )}
          <div className={styles.heroGradient} />
          <div className={styles.heroVignette} />
        </div>

        <div className={styles.heroContent}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className={styles.heroTitle}>{getText(pkg.title)}</h1>

            {pkg.tagline && (
              <p className={styles.heroTagline}>{getText(pkg.tagline)}</p>
            )}

            {/* Quick Specs Row */}
            <div className={styles.specPillsRow}>
              <div className={styles.specPill}>
                <Clock size={16} className={styles.specPillIcon} />
                <span>{getText(pkg.durationLabel || pkg.time)}</span>
              </div>

              <div className={styles.specPill}>
                <MapPin size={16} className={styles.specPillIcon} />
                <span>
                  {lang === 'vi' ? 'Khởi hành: Oria Spa (Ngô Đức Kế)' : lang === 'cn' ? '起点：Oria Spa (吴德计街)' : lang === 'jp' ? '出発地：Oria Spa（ゴ・ドゥック・ケー）' : lang === 'kr' ? '출발지: Oria Spa (응오득케)' : 'Start: Oria Spa (Ngo Duc Ke)'}
                </span>
              </div>

              <div className={styles.specPill}>
                <Compass size={16} className={styles.specPillIcon} />
                <span>
                  {pkgDestinations.length}{' '}
                  {lang === 'vi' ? 'Trải nghiệm & Điểm dừng' : lang === 'cn' ? '处体验名胜' : lang === 'jp' ? '箇所の体験スポット' : lang === 'kr' ? '개 체험 명소' : 'Stops & Experiences'}
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PACKAGE SWITCHER BAR (SUBNAV) */}
      <nav className={styles.packageSwitcherBar} aria-label="Local Tour Packages">
        <div className={styles.switcherInner}>
          <span className={styles.switcherLabel}>
            {lang === 'vi' ? 'Chọn Gói Tour:' : lang === 'cn' ? '切换套餐：' : lang === 'jp' ? 'プラン選択：' : lang === 'kr' ? '패키지 선택:' : 'Select Tour:'}
          </span>
          <div className={styles.switcherTabs}>
            {config.packages.map((item) => {
              const isCurrent = item.id === pkg.id || item.slug === pkg.slug;
              const cleanTitle = getText(item.title).replace(/^(?:Gói|Package|套餐|패키지|パッケージ)\s*[\d一二三1-3]+[:：]\s*/i, '');
              return (
                <Link
                  key={item.id}
                  href={getPackageUrl(item)}
                  className={`${styles.switcherTab} ${isCurrent ? styles.switcherTabActive : ''}`}
                >
                  <span className={styles.switcherNumber}>{item.orderNumber}.</span>
                  <span>{cleanTitle}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. MAIN CONTENT */}
      <main className={styles.container}>
        {/* EDITORIAL STORY / NARRATIVE WITH PHOTO FRAMES */}
        {pkg.paragraphs && pkg.paragraphs.length > 0 && (
          <section className={styles.storySection}>
            <div className={styles.storyContent}>
              {pkg.paragraphs.map((para, pIdx) => (
                <React.Fragment key={'para-' + pIdx}>
                  <p className={styles.storyParagraph}>
                    {getText(para)}
                  </p>
                  {/* 2 Khung ảnh minh họa câu chuyện hành trình (như hình 2) */}
                  {pIdx === 0 && (pkg.storyPhotos?.[0] || pkg.id === 'pkg-1') && (
                    <div 
                      className={`${styles.storyPhotoFrame} cursor-zoom-in relative group/storyPhoto overflow-hidden`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const photoUrl = pkg.storyPhotos?.[0] || "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80";
                        window.dispatchEvent(new CustomEvent('open-media-preview', {
                          detail: {
                            mediaUrl: photoUrl,
                            title: getText(pkg.title)
                          }
                        }));
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Xem ảnh minh họa hành trình"
                      title={lang === 'vi' ? 'Xem ảnh toàn màn hình' : 'Click to view full screen'}
                    >
                      <img
                        src={pkg.storyPhotos?.[0] || "https://images.unsplash.com/photo-1563492065599-3520f775eeed?auto=format&fit=crop&w=1200&q=80"}
                        alt={lang === 'vi' ? 'Ảnh minh họa hành trình 1' : 'Tour story photo 1'}
                        loading="lazy"
                        className="transition-transform duration-500 group-hover/storyPhoto:scale-105"
                      />
                      {pkg.storyPhotosWatermark?.[0] !== false && (
                        <div
                          className="media-watermark"
                          aria-hidden="true"
                          style={{ opacity: (pkg.storyPhotosWatermarkOpacity?.[0] ?? 15) / 100 }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/storyPhoto:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/75 text-[#C9A96E] border border-[#C9A96E]/40 flex items-center justify-center shadow-md">
                          <ZoomIn size={18} strokeWidth={2.2} />
                        </div>
                      </div>
                    </div>
                  )}
                  {((pkg.paragraphs.length > 2 && pIdx === 2) || (pkg.paragraphs.length <= 2 && pIdx === pkg.paragraphs.length - 1)) && (pkg.storyPhotos?.[1] || (pkg.id === 'pkg-1' && pIdx === 2)) && (
                    <div 
                      className={`${styles.storyPhotoFrame} cursor-zoom-in relative group/storyPhoto overflow-hidden`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const photoUrl = pkg.storyPhotos?.[1] || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80";
                        window.dispatchEvent(new CustomEvent('open-media-preview', {
                          detail: {
                            mediaUrl: photoUrl,
                            title: getText(pkg.title)
                          }
                        }));
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label="Xem ảnh minh họa hành trình"
                      title={lang === 'vi' ? 'Xem ảnh toàn màn hình' : 'Click to view full screen'}
                    >
                      <img
                        src={pkg.storyPhotos?.[1] || "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=1200&q=80"}
                        alt={lang === 'vi' ? 'Ảnh minh họa hành trình 2' : 'Tour story photo 2'}
                        loading="lazy"
                        className="transition-transform duration-500 group-hover/storyPhoto:scale-105"
                      />
                      {pkg.storyPhotosWatermark?.[1] !== false && (
                        <div
                          className="media-watermark"
                          aria-hidden="true"
                          style={{ opacity: (pkg.storyPhotosWatermarkOpacity?.[1] ?? 15) / 100 }}
                        />
                      )}
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/storyPhoto:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                        <div className="w-10 h-10 rounded-full bg-black/75 text-[#C9A96E] border border-[#C9A96E]/40 flex items-center justify-center shadow-md">
                          <ZoomIn size={18} strokeWidth={2.2} />
                        </div>
                      </div>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </section>
        )}

        {/* VISUAL EXPERIENCE HIGHLIGHTS */}
        {pkg.highlights && pkg.highlights.length > 0 && (
          <section className="mb-20">
            <header className={styles.sectionHeader}>
              <span className={styles.sectionPre}>HIGHLIGHTS</span>
              <h2 className={styles.sectionTitle}>
                {lang === 'vi' ? 'Điểm Nhấn Hành Trình' : lang === 'cn' ? '行程亮点' : lang === 'jp' ? '旅の見どころ' : lang === 'kr' ? '여정의 하이라이트' : 'Experience Highlights'}
              </h2>
              <p className={styles.sectionDesc}>
                {lang === 'vi'
                  ? 'Những khoảnh khắc được chắt lọc tinh tế, tái hiện trọn vẹn phong vị và ký ức Sài Gòn.'
                  : lang === 'cn'
                  ? '精心提炼的精华瞬间，完整呈现西贡的底蕴与风情。'
                  : lang === 'jp'
                  ? 'サイゴンの風情と記憶を五感で味わう、厳選された瞬間。'
                  : lang === 'kr'
                  ? '사이공의 정취와 기억을 온전히 느낄 수 있는 엄선된 순간들.'
                  : 'Curated moments capturing the authentic spirit, memory, and grace of Saigon.'}
              </p>
            </header>

            <div className={styles.highlightsGrid}>
              {pkg.highlights.map((hl, idx) => (
                <HighlightCardItem
                  key={'hl-' + idx}
                  hl={hl}
                  idx={idx}
                  getText={getText}
                  reduceMotion={reduceMotion}
                />
              ))}
            </div>
          </section>
        )}

        {/* VISUAL ITINERARY TIMELINE */}
        <section id="itinerary" className={styles.itinerarySection}>
          <header className={styles.sectionHeader}>
            <span className={styles.sectionPre}>TIMELINE</span>
            <h2 className={styles.sectionTitle}>
              {lang === 'vi' ? 'Lịch Trình Chi Tiết' : lang === 'cn' ? '详细行程安排' : lang === 'jp' ? 'タイムスケジュール' : lang === 'kr' ? '상세 일정표' : 'Detailed Itinerary'}
            </h2>
            <p className={styles.sectionDesc}>
              {getText(pkg.time)}
            </p>
          </header>

          <div className={styles.timelineList}>
            {pkg.schedule && pkg.schedule.length > 0 ? (
              pkg.schedule.map((item, sIdx) => {
                const text = getText(item);
                const parts = text.split(/—|–\s*(?=[A-Z\p{L}])/u);
                if (parts.length > 1) {
                  return (
                    <div key={'sched-' + sIdx} className={styles.timelineItem}>
                      <span className={styles.timelineTime}>{parts[0].trim()}</span>
                      <div className={styles.timelineDesc}>{parts.slice(1).join('—').trim()}</div>
                    </div>
                  );
                }
                return (
                  <div key={'sched-' + sIdx} className={styles.timelineItem}>
                    <span className={styles.timelineTime}>
                      {lang === 'vi' ? 'Mốc' : lang === 'cn' ? '行程' : lang === 'jp' ? '行程' : lang === 'kr' ? '일정' : 'Step'} {sIdx + 1}
                    </span>
                    <div className={styles.timelineDesc}>{text}</div>
                  </div>
                );
              })
            ) : null}
          </div>
        </section>

        {/* BEST FOR QUOTE BOX */}
        <section className={styles.bestForBox}>
          <span className={styles.bestForTag}>
            {lang === 'vi' ? 'Hợp Cho Bạn' : lang === 'cn' ? '适合人群' : lang === 'jp' ? 'こんな方におすすめ' : lang === 'kr' ? '추천 대상' : 'Best For'}
          </span>
          <p className={styles.bestForQuote}>
            &ldquo;{getText(pkg.bestFor)}&rdquo;
          </p>
        </section>

        {/* BOTTOM CONCIERGE & BOOKING CARD */}
        <section className={styles.conciergeCard}>
          <h2 className={styles.conciergeHeading}>
            {getText(config.ctaTitle) ||
              (lang === 'vi'
                ? 'Sẵn Sàng Cho Trải Nghiệm Sài Gòn?'
                : lang === 'cn'
                ? '开启您的西贡专属之旅'
                : lang === 'jp'
                ? 'サイゴンの旅へ出かけませんか？'
                : lang === 'kr'
                ? '사이공 여행을 시작해 볼까요?'
                : 'Ready to Experience Saigon?')}
          </h2>
          <p className={styles.conciergeText}>
            {getText(config.docClosing)}
          </p>
          <div className={styles.conciergeActions}>
            <a href={`tel:${hotline.replace(/\s+/g, '')}`} className={styles.conciergeLink}>
              <Phone size={15} />
              <span>Hotline: {hotline}</span>
            </a>
            {(() => {
              const customBtnText = getText(config.ctaButtonText);
              const customBtnLink = config.ctaButtonLink?.trim();
              if (customBtnLink) {
                return (
                  <Link href={customBtnLink} className={styles.conciergeLink}>
                    <span>
                      {customBtnText ||
                        (lang === 'vi'
                          ? 'Khám Phá Tiếp Theo'
                          : lang === 'cn'
                          ? '探索更多'
                          : lang === 'jp'
                          ? '次を見る'
                          : lang === 'kr'
                          ? '더 알아보기'
                          : 'Explore Next')}
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                );
              }
              if (nextPkg) {
                return (
                  <Link href={getPackageUrl(nextPkg)} className={styles.conciergeLink}>
                    <span>
                      {customBtnText ||
                        (lang === 'vi'
                          ? `Khám Phá ${getText(nextPkg.title)}`
                          : lang === 'cn'
                          ? `探索 ${getText(nextPkg.title)}`
                          : lang === 'jp'
                          ? `${getText(nextPkg.title)} を見る`
                          : lang === 'kr'
                          ? `${getText(nextPkg.title)} 보기`
                          : `Explore ${getText(nextPkg.title)}`)}
                    </span>
                    <ArrowRight size={14} />
                  </Link>
                );
              }
              return null;
            })()}
          </div>
          <div className={styles.conciergeAddress}>
            <MapPin size={16} className="text-[#d8b66a]" />
            <span>{getText(config.address || DEFAULT_LOCAL_TOUR_CONFIG.address)}</span>
          </div>
        </section>
      </main>
    </div>
  );
}
