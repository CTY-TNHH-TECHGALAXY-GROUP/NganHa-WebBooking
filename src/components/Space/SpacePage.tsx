'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/TranslationProvider';
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


const capacityContent = {
  vi: {
    kicker: "04 / Cùng nhau",
    title: "Một không gian cho mọi người.",
    introPrimary: "Một không gian để mọi người có thể đến cùng nhau và thư giãn theo cách riêng.",
    introSecondary: "OriaSpa đón tiếp khách nam, khách nữ, gia đình, người lớn tuổi và trẻ em với nhiều dịch vụ phù hợp cho từng độ tuổi và nhu cầu.",
    capacityLabel: "Sức chứa cùng lúc",
    capacityTitle: "Đủ không gian cho cả gia đình.",
    capacityDescription: "Với sức chứa lên đến 27 khách cùng lúc, OriaSpa phù hợp cho khách đi một mình, cặp đôi, nhóm bạn, gia đình nhiều thế hệ và đoàn khách. Mỗi người có thể lựa chọn dịch vụ và thời lượng riêng mà không cần tách khỏi lịch trình chung.",
    facilityTitle: "Nhiều nhu cầu. Một không gian đầy đủ.",
    facilityDescription: "OriaSpa được bố trí nhiều khu vực chuyên biệt để các thành viên có thể lựa chọn những dịch vụ khác nhau và được phục vụ trong cùng một thời điểm.",
    facilities: [
      { title: "Ghế chăm sóc chân", description: "Khu vực riêng dành cho thư giãn chân, chăm sóc bàn chân và các liệu trình nhẹ nhàng." },
      { title: "Ghế cắt tóc", description: "Phục vụ cắt tóc nam, cạo râu và các bước chăm sóc cá nhân trong cùng một hành trình thư giãn." },
      { title: "Giường chăm sóc cơ thể", description: "Không gian dành cho trị liệu toàn thân, cổ vai gáy và nhiều liệu trình chăm sóc cơ thể." },
      { title: "Giường gội đầu", description: "Phù hợp cho gội đầu thư giãn, chăm sóc tóc và các combo kết hợp chăm sóc đầu, cổ, vai, gáy." },
      { title: "Khu vực chăm sóc da mặt", description: "Được bố trí cho các bước làm sạch, chăm sóc và thư giãn da mặt." }
    ],
    closingPrimary: "Đến cùng nhau.",
    closingHighlight: "Thư giãn theo cách riêng.",
    groupNote: "Với nhóm đông, vui lòng liên hệ trước để được sắp xếp chu đáo."
  },
  en: {
    kicker: "04 / Together",
    title: "A space for everyone.",
    introPrimary: "A place where everyone can arrive together and relax in their own way.",
    introSecondary: "OriaSpa welcomes men, women, families, older guests and children, with services suited to different ages and needs.",
    capacityLabel: "Capacity at one time",
    capacityTitle: "Room for the whole family.",
    capacityDescription: "With space for up to 27 guests at once, OriaSpa is suitable for individuals, couples, groups of friends, multigenerational families and larger parties. Each guest can choose a different service and duration while staying within the same shared schedule.",
    facilityTitle: "Different needs. One complete space.",
    facilityDescription: "OriaSpa includes several purpose-designed areas, allowing family members to enjoy different services at the same time.",
    facilities: [
      { title: "Foot care chairs", description: "A dedicated area for foot relaxation, detailed foot care and gentle treatments." },
      { title: "Barber chairs", description: "For men’s haircuts, shaving and personal grooming as part of the same relaxing visit." },
      { title: "Body treatment beds", description: "A private setting for full-body care, head, neck and shoulder treatments, and other body rituals." },
      { title: "Hair-wash beds", description: "Designed for relaxing hair washes, hair care and combinations with head, neck and shoulder care." },
      { title: "Facial care area", description: "A dedicated setting for cleansing, facial care and relaxation." }
    ],
    closingPrimary: "Come together.",
    closingHighlight: "Relax your own way.",
    groupNote: "For larger groups, please contact us in advance so we can prepare everything thoughtfully."
  },
  cn: {
    kicker: "04 / 相聚",
    title: "一个适合每一位客人的空间。",
    introPrimary: "让大家可以一同到来，并以各自喜欢的方式放松身心。",
    introSecondary: "OriaSpa 接待男士、女士、家庭、长者与儿童，并根据不同年龄和需求提供合适的服务。",
    capacityLabel: "同时接待人数",
    capacityTitle: "为全家人留出充足空间。",
    capacityDescription: "OriaSpa 可同时接待多达 27 位客人，适合个人、情侣、朋友聚会、多代家庭及团体。每位客人都可以选择不同的服务与时长，同时保留共同的行程安排。",
    facilityTitle: "不同需求。一个完整空间。",
    facilityDescription: "OriaSpa 设有多个专属服务区域，让家人能够在同一时间体验不同的护理项目。",
    facilities: [
      { title: "足部护理椅", description: "专为足部放松、细致护理及轻柔疗程设置的区域。" },
      { title: "理发椅", description: "提供男士理发、剃须与个人仪容护理，让放松体验更加完整。" },
      { title: "身体护理床", description: "适合全身护理、头颈肩放松及多种身体疗程的私密空间。" },
      { title: "洗发床", description: "适用于放松洗发、头发护理，以及结合头部、颈部和肩部护理的套餐。" },
      { title: "面部护理区", description: "专为面部清洁、护理与放松设置的区域。" }
    ],
    closingPrimary: "一同到来。",
    closingHighlight: "以自己的方式放松。",
    groupNote: "如为多人同行，请提前联系我们，以便妥善安排。"
  },
  kr: {
    kicker: "04 / 함께",
    title: "모두를 위한 하나의 공간.",
    introPrimary: "모두 함께 방문해 각자의 방식으로 편안하게 쉴 수 있는 공간입니다.",
    introSecondary: "OriaSpa는 남성, 여성, 가족, 어르신과 어린이를 맞이하며 연령과 필요에 맞는 다양한 서비스를 제공합니다.",
    capacityLabel: "동시 이용 가능 인원",
    capacityTitle: "온 가족을 위한 충분한 공간.",
    capacityDescription: "OriaSpa는 한 번에 최대 27명까지 이용할 수 있어 개인, 커플, 친구 모임, 여러 세대가 함께하는 가족 및 단체 방문에 적합합니다. 같은 일정 안에서도 각자 원하는 서비스와 시간을 선택할 수 있습니다.",
    facilityTitle: "서로 다른 필요. 하나의 완성된 공간.",
    facilityDescription: "OriaSpa는 용도별 공간을 갖추어 가족 구성원이 같은 시간에 서로 다른 서비스를 이용할 수 있습니다.",
    facilities: [
      { title: "풋 케어 체어", description: "발의 휴식과 세심한 풋 케어, 부드러운 관리를 위한 전용 공간입니다." },
      { title: "바버 체어", description: "남성 헤어 커트, 면도 및 개인 그루밍을 한 번의 편안한 방문 안에서 제공합니다." },
      { title: "바디 케어 베드", description: "전신 케어, 머리·목·어깨 관리와 다양한 바디 프로그램을 위한 프라이빗한 공간입니다." },
      { title: "샴푸 베드", description: "편안한 샴푸, 헤어 케어 및 머리·목·어깨 관리를 결합한 프로그램에 적합합니다." },
      { title: "페이셜 케어 공간", description: "세안, 피부 관리와 얼굴 휴식을 위해 마련된 전용 공간입니다." }
    ],
    closingPrimary: "함께 방문하고.",
    closingHighlight: "각자의 방식으로 쉬어가세요.",
    groupNote: "단체 방문 시 원활한 준비를 위해 미리 연락해 주세요."
  },
  jp: {
    kicker: "04 / 一緒に",
    title: "すべての方のためのひとつの空間。",
    introPrimary: "みんなで訪れ、それぞれの過ごし方でくつろげる空間です。",
    introSecondary: "OriaSpaでは、男性、女性、ご家族、ご年配の方、お子様まで、年齢やご希望に合わせたサービスをご用意しています。",
    capacityLabel: "同時利用人数",
    capacityTitle: "ご家族みんなで過ごせる空間。",
    capacityDescription: "OriaSpaは一度に最大27名様までご利用いただけます。お一人、カップル、ご友人同士、多世代のご家族、グループでのご来店に適しています。同じスケジュールの中で、それぞれ異なるサービスや時間をお選びいただけます。",
    facilityTitle: "異なるニーズ。ひとつの充実した空間。",
    facilityDescription: "OriaSpaには目的に合わせた複数の専用エリアがあり、ご家族が同じ時間に異なるサービスを受けられます。",
    facilities: [
      { title: "フットケアチェア", description: "足のリラックス、丁寧なフットケア、やさしい施術のための専用エリアです。" },
      { title: "バーバーチェア", description: "メンズカット、シェービング、身だしなみケアを、ひとつのくつろぎの時間としてご利用いただけます。" },
      { title: "ボディケアベッド", description: "全身ケア、頭・首・肩のケア、さまざまなボディトリートメントに適したプライベート空間です。" },
      { title: "シャンプーベッド", description: "リラックスシャンプー、ヘアケア、頭・首・肩のケアを組み合わせたコースに対応しています。" },
      { title: "フェイシャルケアエリア", description: "クレンジング、フェイシャルケア、顔まわりのリラックスのための専用空間です。" }
    ],
    closingPrimary: "一緒に訪れて。",
    closingHighlight: "自分らしくくつろぐ。",
    groupNote: "大人数でご来店の際は、スムーズにご案内できるよう事前にご連絡ください。"
  }
};

export default function SpacePage() {
  const { currentLang } = useTranslation();
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
    fetch('/api/public/site-content')
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

      <section className={styles.capacitySection}>
        {(() => {
          const t = capacityContent[currentLang as keyof typeof capacityContent] || capacityContent.en;
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

              <div className={`${styles.facilitiesRow} ${styles.reveal}`}>
                <div className={styles.facilitiesIntro}>
                  <h3>{t.facilityTitle}</h3>
                  <p>{t.facilityDescription}</p>
                </div>
                <div className={styles.facilitiesList}>
                  {t.facilities.map((fac, idx) => (
                    <div key={idx} className={styles.facilityItem}>
                      <div className={styles.facNum}>0{idx + 1}</div>
                      <div className={styles.facText}>
                        <h4>{fac.title}</h4>
                        <p>{fac.description}</p>
                      </div>
                    </div>
                  ))}
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
