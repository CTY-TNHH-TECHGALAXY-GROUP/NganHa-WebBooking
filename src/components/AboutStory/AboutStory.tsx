// AboutStory.tsx - Our Story / About Section (Canva-style editorial layout)
'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import {
  sectionVariants,
  titleVariants,
  introVariants,
  cardVariants,
} from './AboutStory.animation';
import { Locale } from '@/lib/constants';

// 🔧 UI CONFIGURATION
const SECTION_MAX_WIDTH = '1400px';
const IMAGE_BORDER_RADIUS = '12px';
const BG_OVERLAY_OPACITY = 0.88;
const VIEWPORT_THRESHOLD = 0.1;

const GALLERY_IMAGES = [
  { src: 'https://i.ibb.co/7tJW9WYR/about-cruise.jpg', caption: 'Buổi tối trên Saigon Princess' },
  { src: 'https://i.ibb.co/W48KXqCY/about-treatment.jpg', caption: 'Bấm huyệt chân tại ORIA SPA' },
  { src: 'https://i.ibb.co/b5ZLkbVt/about-street.jpg', caption: 'Tham quan thành phố dưới Saigon Waterbus' },
  { src: 'https://images.pexels.com/photos/14883151/pexels-photo-14883151.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Ngắm Landmark 81 & Bitexco lung linh' },
  { src: 'https://images.pexels.com/photos/3757942/pexels-photo-3757942.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Thư giãn massage đá nóng chuyên sâu' },
  { src: 'https://images.pexels.com/photos/14438779/pexels-photo-14438779.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Dạo bước qua Nhà thờ Đức Bà cổ kính' },
  { src: 'https://images.pexels.com/photos/3757952/pexels-photo-3757952.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Liệu pháp mùi hương thảo mộc tự nhiên' },
  { src: 'https://images.pexels.com/photos/14006159/pexels-photo-14006159.jpeg?auto=compress&cs=tinysrgb&w=600', caption: 'Nhịp sống bình yên góc phố Sài Gòn' },
];

const AboutStory = () => {
  const { t, currentLang } = useTranslation();
  const { aboutStoryContent, getLocalizedText } = useSystemSettings();

  const galleryList = aboutStoryContent?.gallery || GALLERY_IMAGES;


  return (
    <section id="about" className="about-section">
      {/* Background */}
      <div className="about-bg">
        <div
          className="about-bg-image"
          style={{ backgroundImage: 'url(https://i.ibb.co/27P1VkQQ/about-bg.jpg)' }}
        />
        <div
          className="about-bg-overlay"
          style={
            { '--about-overlay': BG_OVERLAY_OPACITY } as React.CSSProperties
          }
        />
      </div>

      {/* Content */}
      <motion.div
        className="about-content"
        style={{ maxWidth: SECTION_MAX_WIDTH }}
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: VIEWPORT_THRESHOLD }}
      >
        {/* ═══ HEADER: Brand + Our Story ═══ */}
        <motion.div className="about-header" variants={titleVariants}>
          <div className="about-header-brand">
            <span className="about-header-system">{t('about_story', 'system') || 'Hệ thống'}</span>
            <h2 className="about-header-name">
              ORIA SPA
              <br />
              <span className="about-header-sub">Barbershop &amp; Spa</span>
            </h2>
          </div>
          <h2 className="about-header-title">{t('about_story', 'title') || 'Our Story'}</h2>
        </motion.div>

        {/* ═══ MAIN: 2-column editorial ═══ */}
        <div className="about-editorial">
          {/* LEFT COLUMN: Text content */}
          <motion.div className="about-editorial-text" variants={introVariants}>
            <h3 className="about-heading-gold">
              {aboutStoryContent?.section1?.title 
                ? getLocalizedText(aboutStoryContent.section1.title, currentLang as Locale) 
                : (t('about_story', 'heading_1') || 'Vị Trí Vàng và Kết Nối')}
            </h3>

            <div className="about-bullet-group">
              {aboutStoryContent?.section1?.items && aboutStoryContent.section1.items.length > 0 ? (
                aboutStoryContent.section1.items.map((item, idx) => (
                  <div key={idx} className="about-bullet">
                    <span className="about-bullet-dot"></span>
                    <p dangerouslySetInnerHTML={{ __html: getLocalizedText(item, currentLang as Locale) }} />
                  </div>
                ))
              ) : (
                <div 
                  className="about-bullet-content"
                  dangerouslySetInnerHTML={{ 
                    __html: t('about_story', 'desc_1') || `
                      <div class="about-bullet"><span class="about-bullet-dot"></span><p><em class="about-highlight">Tọa lạc</em> ngay bên sông Sài Gòn, khu vực đường Ngô Đức Kế, Quận 1 là một trong những tuyến phố có vị trí đắc địa và mang tính biểu tượng cao tại trung tâm Thành phố Hồ Chí Minh.</p></div>
                      <div class="about-bullet"><span class="about-bullet-dot"></span><p><em class="about-highlight">Vị trí Chiến lược:</em> Đường Ngô Đức Kế nằm trọn vẹn tại Phường Sài Gòn, Quận 1, khu vực trung tâm kinh tế và thương mại của thành phố. Tuyến đường có chiều dài khoảng 403m, lưu thông hai chiều.</p></div>
                      <div class="about-bullet"><span class="about-bullet-dot"></span><p><em class="about-highlight">Kết nối quan trọng:</em> Đường Ngô Đức Kế kéo dài và giao cắt với các trục đường “vàng” khác của Quận 1, tạo nên một tam giác kinh doanh sầm uất:</p></div>
                      <ul class="about-sub-list"><li>Nối từ Công Trường Mê Linh (gần sông Sài Gòn và tượng Trần Hưng Đạo).</li><li>Cắt ngang đường Đồng Khởi (trục đường thương mại xa xỉ).</li><li>Cắt ngang Đường Nguyễn Huệ (Phố đi bộ, trung tâm sự kiện).</li><li>Kết thúc tại đường Hồ Tùng Mậu (trục đường ngân hàng, tài chính).</li></ul>
                    ` 
                  }} 
                />
              )}
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Images */}
          <motion.div className="about-editorial-images" variants={cardVariants}>
            <div
              className="about-image-main"
              style={{ borderRadius: IMAGE_BORDER_RADIUS }}
            >
              <Image
                src={aboutStoryContent?.section1?.image || "https://i.ibb.co/b5ZLkbVt/about-street.jpg"}
                alt="Đường Ngô Đức Kế, Quận 1"
                width={600}
                height={450}
                style={{ objectFit: 'cover', borderRadius: IMAGE_BORDER_RADIUS }}
              />
            </div>
          </motion.div>
        </div>

        {/* ═══ SECOND ROW: Architecture + Atmosphere ═══ */}
        <div className="about-editorial about-editorial--reverse">
          {/* LEFT: Atmosphere */}
          <motion.div className="about-editorial-text" variants={cardVariants}>
            <h3 className="about-heading-gold">
              {aboutStoryContent?.section2?.title
                ? getLocalizedText(aboutStoryContent.section2.title, currentLang as Locale)
                : (t('about_story', 'heading_2') || 'Không khí và phong cách')}
            </h3>

            <div className="about-bullet-group">
              {aboutStoryContent?.section2?.items && aboutStoryContent.section2.items.length > 0 ? (
                aboutStoryContent.section2.items.map((item, idx) => (
                  <div key={idx} className="about-bullet">
                    <span className={`about-bullet-dot ${idx === 0 ? 'about-bullet-dot--morning' : idx === 1 ? 'about-bullet-dot--evening' : ''}`}></span>
                    <p dangerouslySetInnerHTML={{ __html: getLocalizedText(item, currentLang as Locale) }} />
                  </div>
                ))
              ) : (
                <div 
                  className="about-bullet-content"
                  dangerouslySetInnerHTML={{ 
                    __html: t('about_story', 'desc_2') || `
                      <div class="about-bullet"><span class="about-bullet-dot about-bullet-dot--morning"></span><p><em class="about-highlight">Buổi sáng:</em> Nhiều quán cà phê, tiệm bánh, cửa hàng thời trang sang trọng. Rất nhiều dân văn phòng và du khách ghé qua.</p></div>
                      <div class="about-bullet"><span class="about-bullet-dot about-bullet-dot--evening"></span><p><em class="about-highlight">Buổi tối:</em> Đèn đường, ánh sáng từ các quán bar nhỏ, rooftop, và dòng người từ Nguyễn Huệ tạo nên không khí trẻ trung, hiện đại và năng động.</p></div>
                      <div class="about-bullet"><span class="about-bullet-dot"></span><p>Đây cũng là nơi thường xuyên được chọn làm địa điểm check-in do có nhiều góc chụp “Tây” và sang chảnh.</p></div>
                    ` 
                  }} 
                />
              )}
            </div>

            <h3 className="about-heading-gold" style={{ marginTop: '28px' }}>
              {aboutStoryContent?.section3?.title
                ? getLocalizedText(aboutStoryContent.section3.title, currentLang as Locale)
                : (t('about_story', 'heading_3') || 'Đặc Sản Địa Phương')}
            </h3>
            <div className="about-bullet-group">
              {aboutStoryContent?.section3?.detail ? (
                <div className="about-bullet">
                  <span className="about-bullet-dot"></span>
                  <p dangerouslySetInnerHTML={{ __html: getLocalizedText(aboutStoryContent.section3.detail, currentLang as Locale) }} />
                </div>
              ) : (
                <div 
                  className="about-bullet-content"
                  dangerouslySetInnerHTML={{ 
                    __html: t('about_story', 'desc_3') || `
                      <div class="about-bullet"><span class="about-bullet-dot"></span><p>Bên cạnh những trải nghiệm thị giác và ẩm thực du khách không nên bỏ lỡ mà nhất định phải thử qua hoạt động phục hồi cơ thể. Đó chính là <em class="about-highlight">bấm huyệt chân và Aroma toàn thân</em> được thực hiện bằng đôi bàn tay của các nghệ nhân kết hợp với xông hơi khô, nơi mọi giác quan được đánh thức, một tách trà nóng, một âm điệu spa du dương — đó là linh hồn của sự trải nghiệm mà ORIA SPA luôn hướng đến.</p></div>
                    ` 
                  }} 
                />
              )}
            </div>
          </motion.div>

          {/* RIGHT: More images */}
          <motion.div className="about-editorial-images" variants={cardVariants}>
            <div
              className="about-image-main"
              style={{ borderRadius: IMAGE_BORDER_RADIUS }}
            >
              <Image
                src={aboutStoryContent?.section2?.image || "https://i.ibb.co/7tJW9WYR/about-cruise.jpg"}
                alt="Du thuyền sông Sài Gòn"
                width={600}
                height={450}
                style={{ objectFit: 'cover', borderRadius: IMAGE_BORDER_RADIUS }}
              />
            </div>
          </motion.div>
        </div>

        {/* ═══ FILM STRIP GALLERY ═══ */}
        <motion.div className="about-filmstrip" variants={cardVariants}>
          <div className="about-filmstrip-track">
            {[...galleryList, ...galleryList].map((img: any, idx) => (
              <div key={idx} className="about-filmstrip-frame">
                <div className="about-filmstrip-holes about-filmstrip-holes--top">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="about-filmstrip-hole" />
                  ))}
                </div>
                <div className="about-filmstrip-img">
                  <Image
                    src={img.src}
                    alt="Gallery image"
                    width={320}
                    height={200}
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <p className="about-filmstrip-caption">
                  {typeof img.caption === 'string' 
                    ? img.caption 
                    : getLocalizedText(img.caption, currentLang as Locale)}
                </p>
                <div className="about-filmstrip-holes about-filmstrip-holes--bottom">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <span key={i} className="about-filmstrip-hole" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default AboutStory;
