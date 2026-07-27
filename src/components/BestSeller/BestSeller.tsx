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
];

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
        <div className="best-seller-services__intro">
          <h2>
            Best-seller of
            <br />
            Oria Spa
          </h2>
        </div>

        <div className="best-seller-services__grid">
          {services.map((service) => {
            const title = service.names?.en || service.names?.vi || service.id;
            const description = service.descriptions?.en || service.descriptions?.vi || '';
            const img = service.img || service.media_url || 'https://placehold.co/300x200?text=No+Image';

            return (
              <article className="best-seller-card" key={service.id}>
                <img src={img} alt={title} className="best-seller-card__image" />
                <div className="best-seller-card__content">
                  <span>{service.cat || 'Wellness'}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="best-seller-card__meta">
                    <strong>{service.timeDisplay || '60 mins'}</strong>
                    <strong>{formatPrice(service.priceVND || 0)}</strong>
                  </div>
                </div>
                <a href="/en/new-user/standard/checkout" className="best-seller-card__action">
                  Book now
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default BestSeller;
