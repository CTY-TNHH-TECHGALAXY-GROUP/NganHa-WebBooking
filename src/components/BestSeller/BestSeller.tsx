import { getSupabaseAdmin } from '@/lib/supabase-server';

const formatPrice = (price: number) => new Intl.NumberFormat('vi-VN').format(price) + ' đ';

const BestSeller = async () => {
  let services: any[] = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('Services')
      .select('*')
      .eq('isBestSeller', true)
      .eq('isActive', true)
      .order('id', { ascending: true });

    if (error) {
      console.error('[BestSeller] Fetch error:', error);
    } else {
      services = data || [];
    }
  } catch (err) {
    console.error('[BestSeller] Exception:', err);
  }

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
            const title = service.nameEN || service.nameVN || 'Unknown Service';
            const description = service.description?.en || service.description?.EN || service.description?.vn || service.description?.VN || '';
            const img = service.imageUrl || 'https://placehold.co/300x200?text=No+Image';

            return (
              <article className="best-seller-card" key={service.id}>
                <img src={img} alt={title} className="best-seller-card__image" />
                <div className="best-seller-card__content">
                  <span>{service.category || 'Wellness'}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                  <div className="best-seller-card__meta">
                    <strong>{service.duration || 60} min</strong>
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
