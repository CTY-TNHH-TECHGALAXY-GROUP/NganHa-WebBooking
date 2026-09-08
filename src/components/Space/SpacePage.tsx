'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { resolveCtaUrl } from '@/lib/config/urlSettings';
import styles from './SpacePage.module.css';
import { getSpaceContent } from './SpacePage.localization';

// Default mock data, these can be overridden by admin content
const defaultMedia = {
  hero: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2200&q=90',
  welcome: {
    reception: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1900&q=88',
    lounge: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1900&q=88',
    ritual: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1900&q=88'
  },
  floor1: {
    body: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=1900&q=88',
    foot: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1900&q=88',
    private: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1900&q=88'
  },
  floor2: {
    suite: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=1900&q=88',
    headSpa: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1900&q=88',
    quiet: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1900&q=88'
  },
  gallery: {
    main: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=88',
    sideTop: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=86',
    sideBottom: 'https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=86'
  },
  cta: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2200&q=90',
  capacity: {
    middle: '/images/about-spa.png',
    footChair: '/images/heel-care.png',
    haircutChair: '/images/barbershop.png',
    bodyBed: '/images/body-treatment-full.png',
    shampooBed: '/images/hair-wash.png',
    facialArea: '/images/facial.png',
  },
};

const facilityMediaKeys = [
  'capacity.footChair',
  'capacity.haircutChair',
  'capacity.bodyBed',
  'capacity.shampooBed',
  'capacity.facialArea',
] as const;

export default function SpacePage({ initialMedia }: { initialMedia?: any } = {}) {
  const { currentLang } = useTranslation();
  const { systemSettings } = useSystemSettings();
  const space = useMemo(() => getSpaceContent(currentLang), [currentLang]);
  const [contentMedia, setContentMedia] = useState<any>(initialMedia || {});
  
  const getTabsForSection = (section: 'welcome' | 'floor1' | 'floor2') => {
    const customData = contentMedia[section];
    if (customData && typeof customData === 'object' && Object.keys(customData).length > 0) {
      return Object.keys(customData);
    }
    return Object.keys(defaultMedia[section]);
  };

  const welcomeTabs = getTabsForSection('welcome');
  const floor1Tabs = getTabsForSection('floor1');
  const floor2Tabs = getTabsForSection('floor2');

  const [welcomeTab, setWelcomeTab] = useState<string>('reception');
  const [floor1Tab, setFloor1Tab] = useState<string>('body');
  const [floor2Tab, setFloor2Tab] = useState<string>('suite');

  useEffect(() => {
    if (!welcomeTabs.includes(welcomeTab)) setWelcomeTab(welcomeTabs[0]);
    if (!floor1Tabs.includes(floor1Tab)) setFloor1Tab(floor1Tabs[0]);
    if (!floor2Tabs.includes(floor2Tab)) setFloor2Tab(floor2Tabs[0]);
  }, [contentMedia, welcomeTabs, floor1Tabs, floor2Tabs, welcomeTab, floor1Tab, floor2Tab]);

  const [welcomeFading, setWelcomeFading] = useState(false);
  const [floor1Fading, setFloor1Fading] = useState(false);
  const [floor2Fading, setFloor2Fading] = useState(false);

  const [activeSection, setActiveSection] = useState('hero');
  const [isDarkNav, setIsDarkNav] = useState(false);

  useEffect(() => {
    fetch('/api/public/site-content?t=' + Date.now(), { cache: 'no-store' })
      .then(res => res.json())
      .then(json => {
        if (json.content?.space_media) {
          setContentMedia(json.content.space_media);
        }
      })
      .catch(console.error);
  }, []);

  const getMedia = (keyPath: string, fallback: string) => {
    const parts = keyPath.split('.');
    let val = contentMedia;
    for (const p of parts) {
      if (!val) break;
      val = val[p];
    }
    const actualVal = val?.src || val || fallback;
    const isVideo = typeof actualVal === 'string' && (actualVal.endsWith('.mp4') || actualVal.endsWith('.webm'));
    return { 
      src: actualVal, 
      type: val?.type || (isVideo ? 'video' : 'image'),
      objectPosition: val?.objectPosition || 'center'
    };
  };

  const getMediaTitle = (keyPath: string, defaultTitle: string) => {
    const parts = keyPath.split('.');
    let val = contentMedia;
    for (const p of parts) {
      if (!val) break;
      val = val[p];
    }
    return val?.title || defaultTitle;
  };

  const galleryData = useMemo(() => {
    const customGallery = contentMedia?.gallery;
    if (customGallery && typeof customGallery === 'object' && Object.keys(customGallery).length > 0) {
      const keys = Object.keys(customGallery);
      const mainKey = keys.find(k => k.toLowerCase() === 'main') || keys[0];
      const mainMedia = getMedia(`gallery.${mainKey}`, defaultMedia.gallery.main);
      const sideKeys = keys.filter(k => k !== mainKey);

      sideKeys.sort((a, b) => {
        const la = a.toLowerCase();
        const lb = b.toLowerCase();
        if (la.includes('top') && lb.includes('bottom')) return -1;
        if (la.includes('bottom') && lb.includes('top')) return 1;
        return 0;
      });

      const sideMediaList = sideKeys.map(k => ({
        key: k,
        media: getMedia(`gallery.${k}`, ''),
        title: getMediaTitle(`gallery.${k}`, (space.gallery as any)[k] || k)
      })).filter(item => Boolean(item.media.src));

      if (sideMediaList.length === 0) {
        return {
          main: mainMedia,
          mainTitle: getMediaTitle(`gallery.${mainKey}`, space.gallery.mainTitle),
          sideList: [
            { key: 'sideTop', media: getMedia('gallery.sideTop', defaultMedia.gallery.sideTop), title: space.gallery.sideTop },
            { key: 'sideBottom', media: getMedia('gallery.sideBottom', defaultMedia.gallery.sideBottom), title: space.gallery.sideBottom }
          ]
        };
      }

      return {
        main: mainMedia,
        mainTitle: getMediaTitle(`gallery.${mainKey}`, space.gallery.mainTitle),
        sideList: sideMediaList
      };
    }

    return {
      main: getMedia('gallery.main', defaultMedia.gallery.main),
      mainTitle: space.gallery.mainTitle,
      sideList: [
        { key: 'sideTop', media: getMedia('gallery.sideTop', defaultMedia.gallery.sideTop), title: space.gallery.sideTop },
        { key: 'sideBottom', media: getMedia('gallery.sideBottom', defaultMedia.gallery.sideBottom), title: space.gallery.sideBottom }
      ]
    };
  }, [contentMedia, space.gallery]);

// Move MediaRenderer outside to prevent remounts on every SpacePage render
const MediaRenderer = ({ mediaObj, className, alt, onEnded }: { mediaObj: {src: string, type: string, objectPosition?: string}, className?: string, alt?: string, onEnded?: () => void }) => {
  useEffect(() => {
    if (mediaObj.type !== 'video' && onEnded) {
      const timer = setTimeout(() => {
        onEnded();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [mediaObj.src, mediaObj.type, onEnded]);

  if (mediaObj.type === 'video') {
    return (
      <video 
        key={mediaObj.src} // Ensure video element updates properly when src changes
        src={mediaObj.src} 
        className={className} 
        autoPlay 
        muted 
        loop={!onEnded} 
        playsInline 
        onEnded={onEnded}
        preload="auto"
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: mediaObj.objectPosition || 'center', display: 'block' }}
      />
    );
  }
  return <img key={mediaObj.src} src={mediaObj.src} alt={alt || ""} className={className} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: mediaObj.objectPosition || 'center', display: 'block' }} />;
};

  useEffect(() => {
    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.revealOn);
          revealObs.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });

    const reveals = document.querySelectorAll(`.${styles.reveal}`);
    reveals.forEach(el => revealObs.observe(el));

    const activeObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          setActiveSection(e.target.id);
          const isChapter = e.target.classList.contains(styles.chapter);
          const isDarkChapter = e.target.classList.contains(styles.dark);
          const shouldBeDark = (isChapter && !isDarkChapter) || e.target.id === 'welcome' || e.target.id === 'floor2';
          setIsDarkNav(shouldBeDark);
        }
      });
    }, { rootMargin: '-35% 0px -45% 0px' });

    const sections = ['hero', 'welcome', 'floor1', 'floor2'];
    sections.forEach(id => {
      const el = document.getElementById(id);
      if (el) activeObs.observe(el);
    });

    return () => {
      revealObs.disconnect();
      activeObs.disconnect();
    };
  }, []);

  const handleTabChange = (section: 'welcome' | 'floor1' | 'floor2', tab: string) => {
    if (section === 'welcome') {
      setWelcomeFading(true);
      setWelcomeTab(tab);
      setTimeout(() => setWelcomeFading(false), 170);
    } else if (section === 'floor1') {
      setFloor1Fading(true);
      setFloor1Tab(tab);
      setTimeout(() => setFloor1Fading(false), 170);
    } else if (section === 'floor2') {
      setFloor2Fading(true);
      setFloor2Tab(tab);
      setTimeout(() => setFloor2Fading(false), 170);
    }
  };

  const handleWelcomeEnded = () => {
    const nextIdx = (welcomeTabs.indexOf(welcomeTab) + 1) % welcomeTabs.length;
    handleTabChange('welcome', welcomeTabs[nextIdx]);
  };

  const handleFloor1Ended = () => {
    const nextIdx = (floor1Tabs.indexOf(floor1Tab) + 1) % floor1Tabs.length;
    handleTabChange('floor1', floor1Tabs[nextIdx]);
  };

  const handleFloor2Ended = () => {
    const nextIdx = (floor2Tabs.indexOf(floor2Tab) + 1) % floor2Tabs.length;
    handleTabChange('floor2', floor2Tabs[nextIdx]);
  };

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className={styles.container}>

      <div className={`${styles.stickyIndex} ${isDarkNav ? styles.dark : ''}`}>
        <button className={activeSection === 'hero' ? styles.active : ''} onClick={() => scrollTo('hero')} aria-label={space.nav.hero}></button>
        <button className={activeSection === 'welcome' ? styles.active : ''} onClick={() => scrollTo('welcome')} aria-label={space.nav.welcome}></button>
        <button className={activeSection === 'floor1' ? styles.active : ''} onClick={() => scrollTo('floor1')} aria-label={space.nav.floor1}></button>
        <button className={activeSection === 'floor2' ? styles.active : ''} onClick={() => scrollTo('floor2')} aria-label={space.nav.floor2}></button>
      </div>

      <section className={styles.hero} id="hero">
        <MediaRenderer mediaObj={getMedia('hero', defaultMedia.hero)} alt="Oria Spa" className={styles.heroMedia} />
        <div className={styles['media-watermark']}></div>
        <div className={styles.heroCopy}>
          <h1>{space.hero.title}<br/><em>{space.hero.titleEm}</em></h1>
          <div className={styles.heroSide}>
            <p>{space.hero.subtitle}</p>
            <span>{space.hero.scrollPrompt}</span>
          </div>
        </div>
      </section>

      <section className={styles.chapter} id="welcome">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>{space.chapter1.number}</div>
          <h2>{space.chapter1.title}</h2>
          <p className={styles.chapterSub}>{space.chapter1.subtitle}</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`welcome.${welcomeTab}`, defaultMedia.welcome[welcomeTab as keyof typeof defaultMedia.welcome])} alt="Welcome area" className={welcomeFading ? styles.fadeOut : ''} onEnded={handleWelcomeEnded} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>{space.chapter1.videoLabel}</div>
            <div className={styles.videoControl}><span>{space.chapter1.playFilm}</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>{space.chapter1.explore}</div>
          <div className={styles.microList}>
            {welcomeTabs.map((tab) => (
              <button key={tab} className={welcomeTab === tab ? styles.active : ''} onClick={() => handleTabChange('welcome', tab)}>
                {getMediaTitle(`welcome.${tab}`, space.chapter1.tabs[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1)))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.interlude}>
        <div className={`${styles.interludeInner} ${styles.reveal}`}>
          <small>{space.interlude.small}</small>
          <h2>{space.interlude.quote1}<br/>{space.interlude.quote2}</h2>
        </div>
      </section>

      <section className={`${styles.chapter} ${styles.dark}`} id="floor1">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>{space.chapter2.number}</div>
          <h2>{space.chapter2.title}</h2>
          <p className={styles.chapterSub}>{space.chapter2.subtitle}</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`floor1.${floor1Tab}`, defaultMedia.floor1[floor1Tab as keyof typeof defaultMedia.floor1])} alt="First floor" className={floor1Fading ? styles.fadeOut : ''} onEnded={handleFloor1Ended} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>{space.chapter2.videoLabel}</div>
            <div className={styles.videoControl}><span>{space.chapter2.playFilm}</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>{space.chapter2.explore}</div>
          <div className={styles.microList}>
            {floor1Tabs.map((tab) => (
              <button key={tab} className={floor1Tab === tab ? styles.active : ''} onClick={() => handleTabChange('floor1', tab)}>
                {getMediaTitle(`floor1.${tab}`, space.chapter2.tabs[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1)))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.chapter} id="floor2">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>{space.chapter3.number}</div>
          <h2>{space.chapter3.title}</h2>
          <p className={styles.chapterSub}>{space.chapter3.subtitle}</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`floor2.${floor2Tab}`, defaultMedia.floor2[floor2Tab as keyof typeof defaultMedia.floor2])} alt="Second floor" className={floor2Fading ? styles.fadeOut : ''} onEnded={handleFloor2Ended} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>{space.chapter3.videoLabel}</div>
            <div className={styles.videoControl}><span>{space.chapter3.playFilm}</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>{space.chapter3.explore}</div>
          <div className={styles.microList}>
            {floor2Tabs.map((tab) => (
              <button key={tab} className={floor2Tab === tab ? styles.active : ''} onClick={() => handleTabChange('floor2', tab)}>
                {getMediaTitle(`floor2.${tab}`, space.chapter3.tabs[tab] || (tab.charAt(0).toUpperCase() + tab.slice(1)))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.galleryMin}>
        <div className={`${styles.galleryHead} ${styles.reveal}`}>
          <h2>{space.gallery.title1}<br/>{space.gallery.title2}</h2>
          <p>{space.gallery.desc}</p>
        </div>

        <div className={`${styles.galleryRow} ${styles.reveal}`}>
          <div className={styles.galleryMain}>
            <MediaRenderer mediaObj={galleryData.main} alt={galleryData.mainTitle} />
            <div className={styles['media-watermark']}></div>
          </div>
          <div 
            className={styles.gallerySide}
            style={galleryData.sideList.length ? { gridTemplateRows: `repeat(${galleryData.sideList.length}, 1fr)` } : undefined}
          >
            {galleryData.sideList.map((item) => (
              <div key={item.key} className={styles.gallerySideImg}>
                <MediaRenderer mediaObj={item.media} alt={item.title} />
                <div className={styles['media-watermark']}></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.capacitySection}>
        {(() => {
          const t = space.capacity;
          return (
            <div className={styles.capacityInner}>
              <div className={`${styles.capacityHeader} ${styles.reveal}`}>
                <div className={styles.capacityHeaderLeft}>
                  <div className={styles.kicker}>{t.kicker}</div>
                  <h2>{t.title}</h2>
                </div>
                <div className={styles.capacityHeaderRight}>
                  <p className={styles.introPrimary}>{t.introPrimary}</p>
                  <p className={styles.introSecondary}>{t.introSecondary}</p>
                </div>
              </div>

              <div className={`${styles.capacityNumberRow} ${styles.reveal}`}>
                <div className={styles.numberWrap}>
                  <span className={styles.hugeNumber}>27</span>
                  <span className={styles.capacityLabel}>{t.capacityLabel}</span>
                </div>
                <div className={styles.capacityContent}>
                  <h3>{t.capacityTitle}</h3>
                  <p>{t.capacityDescription}</p>
                </div>
              </div>

              {/* Khung ảnh ở giữa 2 đoạn: Sức chứa & Nhiều nhu cầu */}
              <div className={`${styles.capacityMiddleBanner} ${styles.reveal}`}>
                <div className={styles.capacityMiddleImageFrame}>
                  <MediaRenderer
                    mediaObj={getMedia('capacity.middle', defaultMedia.capacity.middle)}
                    alt={t.capacityTitle}
                  />
                  <div className={styles['media-watermark']}></div>
                </div>
              </div>

              <div className={`${styles.facilitiesRow} ${styles.reveal}`}>
                <div className={styles.facilitiesIntro}>
                  <h3>{t.facilityTitle}</h3>
                  <p>{t.facilityDescription}</p>
                </div>
                <div className={styles.facilitiesList}>
                  {t.facilities.map((fac, idx) => {
                    const mediaKey = facilityMediaKeys[idx] || `capacity.facility${idx}`;
                    const defaultSrc = (defaultMedia.capacity as any)[mediaKey.replace('capacity.', '')] || defaultMedia.capacity.middle;
                    const mediaObj = getMedia(mediaKey, defaultSrc);
                    return (
                      <div key={idx} className={styles.facilityItem}>
                        <div className={styles.facNum}>0{idx + 1}</div>
                        <div className={styles.facText}>
                          <h4>{fac.title}</h4>
                          <p>{fac.description}</p>
                        </div>
                        <div className={styles.facilityImageWrap}>
                          <div className={styles.facilityImageFrame}>
                            <MediaRenderer mediaObj={mediaObj} alt={fac.title} />
                            <div className={styles['media-watermark']}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className={`${styles.capacityFooter} ${styles.reveal}`}>
                <h2>
                  {t.closingPrimary}
                  <span className={styles.closingHighlight}>{t.closingHighlight}</span>
                </h2>
                <p>{t.groupNote}</p>
              </div>
            </div>
          );
        })()}
      </section>

      <section className={styles.cta}>
        <MediaRenderer mediaObj={getMedia('cta', defaultMedia.cta)} alt="Oria Spa"  />
        <div className={styles['media-watermark']}></div>
        <div className={`${styles.ctaCopy} ${styles.reveal}`}>
          <h2>{space.cta.title1}<br/>{space.cta.title2}</h2>
          <div className={styles.ctaSide}>
            <p>{space.cta.desc}</p>
            <div className={styles.buttons}>
              <Link href={resolveCtaUrl(systemSettings.ctaLinks?.spaceExplore, 'spaceExplore', currentLang)} className={styles.btn}>{space.cta.exploreBtn}</Link>
              <Link href={resolveCtaUrl(systemSettings.ctaLinks?.spaceBook, 'spaceBook', currentLang)} className={styles.btn}>{space.cta.bookBtn}</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>{space.footer.tagline}</div>
        <div>{space.footer.concept}</div>
      </footer>
    </div>
  );
}
