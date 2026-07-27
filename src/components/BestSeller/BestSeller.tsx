'use client';

import { useEffect, useState } from 'react';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

const BestSeller = () => {
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => res.json())
      .then((data) => {
        const bestSellers = (data || []).filter((s: any) => s.BEST_SELLER === true && s.ACTIVE !== false);
        setServices(bestSellers);
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
            Oria Retreat
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
