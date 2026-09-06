'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import styles from './OurStory.module.css';

interface FilmFrameItem {
  id: number;
  frameTag: string;
  badge: string;
  title: string;
  desc: string;
  image: string;
}

const FILM_FRAMES: FilmFrameItem[] = [
  {
    id: 1,
    frameTag: 'KODAK 500T • 11A ▶',
    badge: 'City Tour',
    title: 'Khung Hình 01 • Nhìn toàn cảnh thành phố trên xe buýt 2 tầng',
    desc: 'Lướt qua các công trình kiến trúc biểu tượng của Sài Gòn trên tuyến xe buýt thoáng nóc, thu trọn vẻ đẹp giao thoa giữa lịch sử và hiện đại.',
    image: '/images/story/photo-bus.jpg',
  },
  {
    id: 2,
    frameTag: 'KODAK 500T • 12 ▶',
    badge: 'River Cruise',
    title: 'Khung Hình 02 • Buổi tối trên tàu Saigon Princess',
    desc: 'Bữa tối thượng lưu bồng bềnh trên dòng sông Sài Gòn, ngắm nhìn skyline hoa lệ của thành phố về đêm trong tiếng nhạc du dương.',
    image: '/images/story/photo-cruise.jpg',
  },
  {
    id: 3,
    frameTag: 'KODAK 500T • 13 ▶',
    badge: 'Oria Wellness',
    title: 'Khung Hình 03 • Bấm huyệt chân tại Oria Barbershop & Spa',
    desc: 'Trạm dừng thư giãn hoàn hảo ngay trung tâm Ngô Đức Kế. Kỹ thuật bấm huyệt cổ truyền và thảo dược giúp giải tỏa mọi mệt mỏi sau chuyến du ngoạn.',
    image: '/images/story/photo-foot.jpg',
  },
  {
    id: 4,
    frameTag: 'KODAK 500T • 14 ▶',
    badge: 'Waterbus Experience',
    title: 'Khung Hình 04 • Tham quan thành phố dưới Saigon Waterbus',
    desc: 'Tận hưởng làn gió mát lành và ngắm nhìn nhịp sống sôi động của hai bờ sông Sài Gòn từ góc nhìn sông nước độc đáo.',
    image: '/images/story/photo-waterbus.jpg',
  },
];

const OurStory: React.FC = () => {
  const { currentLang } = useTranslation();
  const [highlightedFrameId, setHighlightedFrameId] = useState<number | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<FilmFrameItem | null>(null);

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
            <span>✦</span> Heritage &amp; Destination <span>✦</span>
          </div>
          <h2 className={styles.storyTitle}>Hệ Thống Oria Barbershop &amp; Spa</h2>
          <span className={styles.storyScript}>Our story</span>
          <div className={styles.headerDivider} />
        </header>

        {/* Editorial 2-Column Grid */}
        <div className={styles.editorialGrid}>
          {/* COLUMN 1: Vị Trí Vàng và Kết Nối */}
          <article className={styles.editorialCard}>
            <div>
              <h3 className={styles.sectionHeadline}>
                <span className={styles.headlineIcon}>📍</span>
                Vị Trí Vàng và Kết Nối
              </h3>
              <p className={styles.storyText}>
                Tọa lạc ngay bên sông Sài Gòn, khu vực đường <strong>Ngô Đức Kế, Quận 1</strong> là một trong những tuyến phố có vị trí đắc địa và mang tính biểu tượng cao tại trung tâm Thành phố Hồ Chí Minh.
              </p>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Vị trí chiến lược:</strong> Đường Ngô Đức Kế nằm trọn vẹn tại Phường Sài Gòn, Quận 1, khu vực trung tâm kinh tế và thương mại của thành phố. Tuyến đường có chiều dài khoảng 403m, lưu thông hai chiều thuận tiện.
                </li>
                <li>
                  <strong>Kết nối quan trọng:</strong> Đường Ngô Đức Kế kéo dài và giao cắt với các trục đường “vàng” khác của Quận 1, tạo nên một tam giác kinh doanh sầm uất bậc nhất:
                  <ul className={styles.subBulletList}>
                    <li>Nối từ <strong>Công Trường Mê Linh</strong> (gần sông Sài Gòn và tượng Trần Hưng Đạo).</li>
                    <li>Cắt ngang đường <strong>Đồng Khởi</strong> (trục đường thương mại xa xỉ bậc nhất).</li>
                    <li>Giao cắt đường <strong>Nguyễn Huệ</strong> (phố đi bộ và quảng trường sự kiện).</li>
                    <li>Kết thúc tại đoạn giao cắt với <strong>Hồ Tùng Mậu &amp; Hải Triều</strong> (sát cạnh tòa tháp Bitexco Financial Tower).</li>
                  </ul>
                </li>
              </ul>
            </div>

            {/* Minimized & Optimized Street Sign Image */}
            <div className={styles.streetSignWrap}>
              <img
                src="/images/story/street-sign.jpg"
                alt="Đường Ngô Đức Kế giao lộ Đồng Khởi"
                className={styles.streetSignImg}
                loading="lazy"
              />
              <div className={styles.imageCaption}>
                Trục đường Ngô Đức Kế giao cắt đường Đồng Khởi • Trung tâm Quận 1
              </div>
            </div>
          </article>

          {/* COLUMN 2: Đặc Điểm Kiến Trúc và Thương Mại */}
          <article className={styles.editorialCard}>
            <div>
              <h3 className={styles.sectionHeadline}>
                <span className={styles.headlineIcon}>🏛️</span>
                Đặc Điểm Kiến Trúc &amp; Thương Mại
              </h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Tập trung cao ốc văn phòng hạng A:</strong> Khu vực quy tụ các tòa cao ốc tài chính lớn như <strong>Melinh Point Tower</strong>, cùng hàng loạt trụ sở tập đoàn đa quốc gia và tổ chức tài chính hàng đầu.
                </li>
                <li>
                  <strong>Thương mại và dịch vụ cao cấp:</strong> Thừa hưởng sự sầm uất liền kề Đồng Khởi &amp; Nguyễn Huệ với các khách sạn 5 sao quốc tế, nhà hàng sang trọng và thương hiệu thời trang xa xỉ.
                </li>
              </ul>

              {/* Interactive Activities Trigger linking to 35mm Film Strip */}
              <div className={styles.activityGroup}>
                <h4 className={styles.activityTitle}>
                  <span>🎞️</span> Các hoạt động du lịch hấp dẫn:
                </h4>
                <p className={styles.activityHint}>
                  (Nhấp vào từng hoạt động để cuộn đến thước phim tương ứng)
                </p>

                <div className={styles.activityList}>
                  <div
                    className={`${styles.activityItem} ${highlightedFrameId === 1 ? styles.activityItemActive : ''}`}
                    onClick={() => scrollToFrame(1)}
                  >
                    <span className={styles.activityLabel}>
                      <span style={{ color: '#d4af37' }}>○</span>
                      <span>Nhìn toàn cảnh thành phố trên xe buýt 2 tầng</span>
                    </span>
                    <span className={styles.activityBadge}>Xem phim #1 ▷</span>
                  </div>

                  <div
                    className={`${styles.activityItem} ${highlightedFrameId === 4 ? styles.activityItemActive : ''}`}
                    onClick={() => scrollToFrame(4)}
                  >
                    <span className={styles.activityLabel}>
                      <span style={{ color: '#d4af37' }}>○</span>
                      <span>Tham quan thành phố dưới Saigon Waterbus</span>
                    </span>
                    <span className={styles.activityBadge}>Xem phim #4 ▷</span>
                  </div>

                  <div
                    className={`${styles.activityItem} ${highlightedFrameId === 2 ? styles.activityItemActive : ''}`}
                    onClick={() => scrollToFrame(2)}
                  >
                    <span className={styles.activityLabel}>
                      <span style={{ color: '#d4af37' }}>○</span>
                      <span>Buổi tối trên tàu Saigon Princess (ngắm skyline ven sông)</span>
                    </span>
                    <span className={styles.activityBadge}>Xem phim #2 ▷</span>
                  </div>

                  <div
                    className={`${styles.activityItem} ${highlightedFrameId === 3 ? styles.activityItemActive : ''}`}
                    onClick={() => scrollToFrame(3)}
                  >
                    <span className={styles.activityLabel}>
                      <span style={{ color: '#d4af37' }}>○</span>
                      <span>Bấm huyệt chân tại Oria sau một ngày dài trải nghiệm</span>
                    </span>
                    <span className={styles.activityBadge}>Xem phim #3 ▷</span>
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>

        {/* 35mm Vintage Film Strip Reel Section */}
        <section className={styles.filmStripSection} id="film-strip-reel">
          <div className={styles.filmStripHeader}>
            <h3 className={styles.filmStripTitle}>
              <span>🎬</span> Thước Phim: Trải Nghiệm Sài Gòn &amp; Oria <span>🎞️</span>
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
              {FILM_FRAMES.map((frame) => {
                const isHighlighted = highlightedFrameId === frame.id;
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
                        alt={frame.title}
                        className={styles.filmImage}
                        loading="lazy"
                      />
                    </div>

                    <div className={styles.filmCaptionBox}>
                      <div className={styles.frameNumberTag}>
                        Frame {frame.id < 10 ? `0${frame.id}` : frame.id} • {frame.badge}
                      </div>
                      <div className={styles.frameTitle}>{frame.title}</div>
                      <p className={styles.frameDesc}>{frame.desc}</p>
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
                Không Khí Và Phong Cách
              </h3>
              <ul className={styles.bulletList}>
                <li>
                  <strong>Buổi sáng năng động:</strong> Hương thơm cà phê nồng nàn, các tiệm bánh thanh lịch và cửa hàng thời trang cao cấp đón chào nhịp sống năng động của giới văn phòng và du khách quốc tế.
                </li>
                <li>
                  <strong>Buổi tối hoa lệ:</strong> Ánh đèn lộng lẫy từ các quán rooftop bar, không khí trẻ trung, phóng khoáng kết nối trực tiếp từ phố đi bộ Nguyễn Huệ tạo nên một trải nghiệm đêm đậm chất Sài Gòn.
                </li>
                <li>
                  <strong>Điểm đến biểu tượng:</strong> Nơi giao thoa hoàn hảo giữa nét cổ điển hoa lệ của di sản Sài Gòn và kiến trúc hiện đại, thu hút nhiều góc check-in sang trọng.
                </li>
              </ul>
            </div>

            <div className={styles.nightStreetWrap}>
              <img
                src="/images/story/night-street.jpg"
                alt="Không khí lung linh về đêm tại trung tâm Quận 1"
                className={styles.nightStreetImg}
                loading="lazy"
              />
              <div className={styles.imageCaption}>
                Đêm Sài Gòn lung linh ánh đèn nhìn về phía Nhà Hát Thành Phố &amp; Đồng Khởi
              </div>
            </div>
          </div>
        </section>

        {/* Specialty Section: Đặc Sản Địa Phương • Oria Barbershop & Spa */}
        <section className={styles.specialtySection}>
          <div className={styles.specialtyHeader}>
            <span className={styles.specialtyBadge}>Đích Đến Của Sự Phục Hồi</span>
            <h3 className={styles.specialtyHeadline}>
              Đặc Sản Địa Phương • Oria Barbershop &amp; Spa
            </h3>
            <p className={styles.specialtyLead}>
              Nằm tại vị trí kim cương của trung tâm Sài Gòn, Oria không chỉ là một tiệm chăm sóc mà là một điểm chạm văn hóa phục hồi toàn diện, nơi mỗi bước chân mệt mỏi được tái tạo nguồn sinh khí mới.
            </p>
          </div>

          <div className={styles.specialtyGrid}>
            <div className={styles.specialtyCard}>
              <span className={styles.cardIcon}>👥</span>
              <h4 className={styles.cardTitle}>Công Suất 27 Khách</h4>
              <p className={styles.cardDesc}>
                Phục vụ đồng thời chu đáo cho cá nhân, cặp đôi và nhóm khách du lịch trong không gian sang trọng, riêng tư.
              </p>
            </div>

            <div className={styles.specialtyCard}>
              <span className={styles.cardIcon}>🚪</span>
              <h4 className={styles.cardTitle}>Không Gian Linh Hoạt</h4>
              <p className={styles.cardDesc}>
                Bố trí phòng đôi ấm cúng, phòng riêng biệt lập và phòng nhóm gia đình với hương thơm tinh dầu tự nhiên.
              </p>
            </div>

            <div className={styles.specialtyCard}>
              <span className={styles.cardIcon}>🌿</span>
              <h4 className={styles.cardTitle}>Menu Chuẩn &amp; Nâng Cao</h4>
              <p className={styles.cardDesc}>
                Từ bấm huyệt chân cổ truyền, massage thảo dược giải mỏi đến các liệu trình gội đầu dưỡng sinh chuyên sâu.
              </p>
            </div>

            <div className={styles.specialtyCard}>
              <span className={styles.cardIcon}>🔥</span>
              <h4 className={styles.cardTitle}>Xông Hơi Khô Tinh Dầu</h4>
              <p className={styles.cardDesc}>
                Hệ thống Dry Sauna gỗ tuyết tùng giúp thải độc, kích thích tuần hoàn máu và hồi phục cơ thể tức thì.
              </p>
            </div>
          </div>

          <div className={styles.ctaFloat}>
            <Link
              href={`/${currentLang || 'vi'}/new-user/standard/checkout`}
              className={styles.btnBookNow}
            >
              <span>Đặt Lịch Trải Nghiệm Ngay</span>
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
          aria-label={activeLightbox.title}
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
                alt={activeLightbox.title}
                className={styles.lightboxImg}
              />
            </div>
            <div className={styles.lightboxDetails}>
              <div className={styles.lightboxTag}>
                {activeLightbox.frameTag} • {activeLightbox.badge}
              </div>
              <h4 className={styles.lightboxTitle}>{activeLightbox.title}</h4>
              <p className={styles.lightboxDesc}>{activeLightbox.desc}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default OurStory;
