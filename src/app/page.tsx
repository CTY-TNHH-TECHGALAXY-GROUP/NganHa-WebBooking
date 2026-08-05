'use client';

import Hero from '@/components/Hero/Hero';
import BestSeller from '@/components/BestSeller/BestSeller';
import ServiceBook from '@/components/ServiceBook/ServiceBook';

const HomePage = () => {
  // Bỏ toàn bộ logic khóa cuộn để trình duyệt tự do xử lý lăn chuột

  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero />

      <BestSeller />

      {/* Service Menu - Book flip */}
      <section id="services" className="section-services">
        <div className="section-services__inner">
          <div className="section-services__intro">
            <span className="section-services__eyebrow">Service Menu</span>
            <h2 className="section-services__title">
              Lật từng trang để chọn đúng trải nghiệm bạn muốn
            </h2>
            <p className="section-services__subtitle">
              Hãy chọn cho mình một dịch vụ hoàn hảo và thư giãn.
            </p>
          </div>

          <ServiceBook />

          <div className="section-services__hint">
            <p className="section-services__hint-text">
              Bạn có thể nhấp vào nút dưới đây để tiếp tục.
            </p>
            <a href="/vi/new-user/standard/checkout" className="section-services__cta">
              Đi tới bước đặt lịch
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
