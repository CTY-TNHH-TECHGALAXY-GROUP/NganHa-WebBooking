'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import styles from './SpacePage.module.css';

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
  cta: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?auto=format&fit=crop&w=2200&q=90'
};

export default function SpacePage() {
  const [contentMedia, setContentMedia] = useState<any>({});
  
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
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data.space_media) {
          setContentMedia(json.data.space_media);
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
        <button className={activeSection === 'hero' ? styles.active : ''} onClick={() => scrollTo('hero')} aria-label="Hero"></button>
        <button className={activeSection === 'welcome' ? styles.active : ''} onClick={() => scrollTo('welcome')} aria-label="Welcome Area"></button>
        <button className={activeSection === 'floor1' ? styles.active : ''} onClick={() => scrollTo('floor1')} aria-label="First Floor"></button>
        <button className={activeSection === 'floor2' ? styles.active : ''} onClick={() => scrollTo('floor2')} aria-label="Second Floor"></button>
      </div>

      <section className={styles.hero} id="hero">
        <MediaRenderer mediaObj={getMedia('hero', defaultMedia.hero)} alt="Oria Spa" className={styles.heroMedia} />
        <div className={styles['media-watermark']}></div>
        <div className={styles.heroCopy}>
          <h1>Space,<br/><em>felt slowly.</em></h1>
          <div className={styles.heroSide}>
            <p>Three spaces. One continuous journey through light, touch and quiet.</p>
            <span>Scroll to enter</span>
          </div>
        </div>
      </section>

      <section className={styles.chapter} id="welcome">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>01 / Arrival</div>
          <h2>Welcome Area</h2>
          <p className={styles.chapterSub}>A soft transition from outside movement into the calm rhythm of Oria.</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`welcome.${welcomeTab}`, defaultMedia.welcome[welcomeTab as keyof typeof defaultMedia.welcome])} alt="Welcome area" className={welcomeFading ? styles.fadeOut : ''} onEnded={handleWelcomeEnded} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>Welcome Area / Film 01</div>
            <div className={styles.videoControl}><span>Play film</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>Explore within this space</div>
          <div className={styles.microList}>
            {welcomeTabs.map((tab) => (
              <button key={tab} className={welcomeTab === tab ? styles.active : ''} onClick={() => handleTabChange('welcome', tab)}>
                {getMediaTitle(`welcome.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.interlude}>
        <div className={`${styles.interludeInner} ${styles.reveal}`}>
          <small>From arrival to treatment</small>
          <h2>Nothing should interrupt<br/>the feeling of the space.</h2>
        </div>
      </section>

      <section className={`${styles.chapter} ${styles.dark}`} id="floor1">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>02 / Therapy</div>
          <h2>First Floor</h2>
          <p className={styles.chapterSub}>A more active treatment floor shaped by movement, technique and human touch.</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`floor1.${floor1Tab}`, defaultMedia.floor1[floor1Tab as keyof typeof defaultMedia.floor1])} alt="First floor" className={floor1Fading ? styles.fadeOut : ''} onEnded={handleFloor1Ended} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>First Floor / Film 02</div>
            <div className={styles.videoControl}><span>Play film</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>Explore within this floor</div>
          <div className={styles.microList}>
            {floor1Tabs.map((tab) => (
              <button key={tab} className={floor1Tab === tab ? styles.active : ''} onClick={() => handleTabChange('floor1', tab)}>
                {getMediaTitle(`floor1.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.chapter} id="floor2">
        <div className={`${styles.chapterHead} ${styles.reveal}`}>
          <div className={styles.number}>03 / Retreat</div>
          <h2>Second Floor</h2>
          <p className={styles.chapterSub}>Quieter, more private, and deliberately slower in both space and visual rhythm.</p>
        </div>

        <div className={`${styles.videoFrame} ${styles.reveal}`}>
          <MediaRenderer mediaObj={getMedia(`floor2.${floor2Tab}`, defaultMedia.floor2[floor2Tab as keyof typeof defaultMedia.floor2])} alt="Second floor" className={floor2Fading ? styles.fadeOut : ''} onEnded={handleFloor2Ended} />
          <div className={styles['media-watermark']}></div>
          <div className={styles.videoUi}>
            <div className={styles.videoLabel}>Second Floor / Film 03</div>
            <div className={styles.videoControl}><span>Play film</span><div className={styles.playBtn}></div></div>
          </div>
        </div>

        <div className={`${styles.microNav} ${styles.reveal}`}>
          <div className={styles.microLeft}>Explore within this floor</div>
          <div className={styles.microList}>
            {floor2Tabs.map((tab) => (
              <button key={tab} className={floor2Tab === tab ? styles.active : ''} onClick={() => handleTabChange('floor2', tab)}>
                {getMediaTitle(`floor2.${tab}`, tab.charAt(0).toUpperCase() + tab.slice(1))}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.galleryMin}>
        <div className={`${styles.galleryHead} ${styles.reveal}`}>
          <h2>A few details,<br/>nothing more.</h2>
          <p>Only use still photography after the three main videos. This prevents the page from competing with the film content.</p>
        </div>

        <div className={`${styles.galleryRow} ${styles.reveal}`}>
          <div className={styles.galleryMain}>
            <MediaRenderer mediaObj={getMedia('gallery.main', defaultMedia.gallery.main)} alt="Massage detail"  />
            <div className={styles['media-watermark']}></div>
          </div>
          <div className={styles.gallerySide}>
            <div className={styles.gallerySideImg}>
              <MediaRenderer mediaObj={getMedia('gallery.sideTop', defaultMedia.gallery.sideTop)} alt="Treatment"  />
              <div className={styles['media-watermark']}></div>
            </div>
            <div className={styles.gallerySideImg}>
              <MediaRenderer mediaObj={getMedia('gallery.sideBottom', defaultMedia.gallery.sideBottom)} alt="Spa room"  />
              <div className={styles['media-watermark']}></div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <MediaRenderer mediaObj={getMedia('cta', defaultMedia.cta)} alt="Oria Spa"  />
        <div className={styles['media-watermark']}></div>
        <div className={`${styles.ctaCopy} ${styles.reveal}`}>
          <h2>Come feel<br/>it yourself.</h2>
          <div className={styles.ctaSide}>
            <p>The page ends before it becomes repetitive. Once the guest understands the space, the next action should be simple.</p>
            <div className={styles.buttons}>
              <Link href="/menu" className={styles.btn}>Explore treatments</Link>
              <Link href="/booking" className={styles.btn}>Book your visit</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>OriaSpa — Let us understand you</div>
        <div>Minimal Space Concept / 03</div>
      </footer>
    </div>
  );
}
