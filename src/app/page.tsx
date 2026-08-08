'use client';

import Hero from '@/components/Hero/Hero';
import BestSeller from '@/components/BestSeller/BestSeller';
import ServiceBook from '@/components/ServiceBook/ServiceBook';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { useTranslation } from '@/components/TranslationProvider';
import { Locale } from '@/lib/constants';

const HomePage = () => {
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const { currentLang } = useTranslation();
  const lang = currentLang as Locale;
  const hpContent = systemSettings?.homepage_content?.services;

  return (
    <main>
      {/* Hero Section - Fullscreen with video/image background */}
      <Hero />

      <BestSeller />

      {/* Service Menu - Book flip */}
      <section id="services" className="section-services">
        <div className="section-services__inner">
          <div className="section-services__intro">
            <span className="section-services__eyebrow">{getLocalizedText(hpContent?.eyebrow, lang, 'Service Menu')}</span>
            <h2 className="section-services__title">
              {getLocalizedText(hpContent?.title, lang, 'Lật từng trang để chọn đúng trải nghiệm bạn muốn')}
            </h2>
            <p className="section-services__subtitle">
              {getLocalizedText(hpContent?.subtitle, lang, 'Hãy chọn cho mình một dịch vụ hoàn hảo và thư giãn.')}
            </p>
          </div>

          <ServiceBook />

          <div className="section-services__hint">
            <p className="section-services__hint-text">
              {getLocalizedText(hpContent?.hintText, lang, 'Bạn có thể nhấp vào nút dưới đây để tiếp tục.')}
            </p>
            <a href={`/${lang}/new-user/standard/checkout`} className="section-services__cta">
              {getLocalizedText(hpContent?.cta, lang, 'Đi tới bước đặt lịch')}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
};

export default HomePage;
