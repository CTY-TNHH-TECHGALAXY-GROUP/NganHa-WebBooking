'use client';

import { useEffect, useState } from 'react';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

// Giữ lại data cứng để làm fallback render ban đầu. 
// Việc này giúp GSAP và ScrollTrigger tính toán chiều cao chính xác lúc mount, tránh làm vỡ layout các section khác.
const FALLBACK_SERVICES = [
  {
    id: 'mock-1',
    cat: 'Body Massage',
    names: { en: 'Body Renewal Ritual', vi: 'Nghi thức phục hồi cơ thể' },
    descriptions: { en: 'A warm oil and pressure-point journey for deep recovery...', vi: 'Liệu trình massage dầu ấm...' },
    timeDisplay: '90 min',
    priceVND: 690000,
    img: '/images/services/hotstone.png',
  },
  {
    id: 'mock-2',
    cat: 'Hair Wash',
    names: { en: 'Herbal Head Spa', vi: 'Gội đầu thảo dược' },
    descriptions: { en: 'Scalp cleansing, herbal wash...', vi: 'Làm sạch da đầu, gội thảo dược...' },
    timeDisplay: '60 min',
    priceVND: 380000,
    img: '/images/services/hair-wash.png',
  },
  {
    id: 'mock-3',
    cat: 'Facial Care',
    names: { en: 'Signature Glow Facial', vi: 'Chăm sóc da mặt đặc trưng' },
    descriptions: { en: 'A refined facial ritual for hydration...', vi: 'Liệu trình chăm sóc da tinh tế...' },
    timeDisplay: '60 min',
    priceVND: 520000,
    img: '/images/services/facial.png',
  },
  {
    id: 'mock-4',
    cat: 'Foot Care',
    names: { en: 'Deep Foot Recovery', vi: 'Phục hồi chân chuyên sâu' },
    descriptions: { en: 'Warm soak, exfoliation and targeted pressure-point treatment.', vi: 'Ngâm ấm, tẩy tế bào chết và bấm huyệt.' },
    timeDisplay: '60 min',
    priceVND: 475000,
    img: '/images/services/foot-massage.png',
  },
  {
    id: 'mock-5',
    cat: 'Hot Stone',
    names: { en: 'Hot Stone Balance', vi: 'Đá nóng thư giãn' },
    descriptions: { en: 'Heated stone therapy designed to release tension and restore balance.', vi: 'Liệu trình đá nóng giúp thả lỏng và cân bằng.' },
    timeDisplay: '90 min',
    priceVND: 780000,
    img: '/images/services/hotstone.png',
  },
  {
    id: 'mock-6',
    cat: 'Ear Cleaning',
    names: { en: 'Traditional Ear Care', vi: 'Lấy ráy tai thư giãn' },
    descriptions: { en: 'Gentle ear care paired with a calming head and temple massage.', vi: 'Làm sạch tai nhẹ nhàng kết hợp massage thư giãn.' },
    timeDisplay: '45 min',
    priceVND: 370000,
    img: '/images/services/ear-clean.png',
  },
];

const getTitle = (service: any) => service.names?.en || service.names?.vi || service.name || service.NAME || service.id;
const getDescription = (service: any) => service.descriptions?.en || service.descriptions?.vi || service.description || service.DESCRIPTION || '';
const getImage = (service: any) => service.img || service.media_url || service.image_url || service.image || 'https://placehold.co/640x820?text=Oria+Spa';
const getDuration = (service: any) => service.timeDisplay || service.durationDisplay || (service.durationMinutes ? `${service.durationMinutes} min` : '60 min');
const getPrice = (service: any) => Number(service.priceVND || service.price || service.PRICE || 0);
const getCategory = (service: any) => service.cat || service.categoryName || service.category || service.CATEGORY || 'Oria Spa';
const SERVICE_MENU_URL = '/#services';

const BestSeller = () => {
  // Render mảng fallback lúc đầu để giữ nguyên khung giao diện
  const [services, setServices] = useState<any[]>(FALLBACK_SERVICES);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        const bestSellers = (data || []).filter((s: any) => s.BEST_SELLER === true && s.ACTIVE !== false);
        // Chỉ cập nhật nếu API thực sự có dữ liệu
        if (bestSellers.length > 0) {
          setServices(bestSellers);
        }
      })
      .catch((err) => console.error('[BestSeller] Fetch error:', err));
  }, []);

  return (
    <section id="best-seller" className="best-seller-services">
      <div className="best-seller-services__inner">
        <div className="best-seller-services__layout">
          <aside className="best-seller-services__intro">
            <span className="best-seller-services__eyebrow">Most booked this month</span>
            <h2>
              Best-seller of
              <br />
              Oria Spa
            </h2>
            <p>Six guest-favorite treatments, arranged in a compact premium view before opening the full service menu.</p>
            <a href={SERVICE_MENU_URL} className="best-seller-services__all-link">
              Explore all services <span>→</span>
            </a>
          </aside>

          <div className="best-seller-services__grid" aria-label="Best-selling Oria Spa services">
            {services.slice(0, 6).map((service, index) => {
              const title = getTitle(service);
              const description = getDescription(service);
              const img = getImage(service);
              const price = getPrice(service);

              return (
                <article className="best-seller-card" key={service.id}>
                  <div className="best-seller-card__visual">
                    <img src={img} alt={title} className="best-seller-card__image" loading="lazy" />
                  </div>
                  <div className="best-seller-card__badge-row">
                    <span className="best-seller-card__rank">#{index + 1}</span>
                    <span className="best-seller-card__badge">Best Seller</span>
                  </div>
                  <div className="best-seller-card__content">
                    <span className="best-seller-card__category">{getCategory(service)}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <div className="best-seller-card__meta">
                      <span className="best-seller-card__duration">{getDuration(service)}</span>
                      <strong>{price > 0 ? formatPrice(price) : 'Contact'}</strong>
                    </div>
                    <div className="best-seller-card__actions">
                      <button className="best-seller-card__cart" aria-label={`Add ${title} to cart`} type="button">
                        <svg fill="none" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.6L21 7H6" />
                          <circle cx="10" cy="20" r="1" />
                          <circle cx="18" cy="20" r="1" />
                        </svg>
                      </button>
                      <a href="/en/new-user/standard/checkout" className="best-seller-card__action">
                        Book now
                      </a>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
