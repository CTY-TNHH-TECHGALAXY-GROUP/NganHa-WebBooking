'use client';

const SIGNATURE_SERVICES = [
  {
    title: 'Body Renewal Ritual',
    category: 'Body Massage',
    description: 'A warm oil and pressure-point journey for deep recovery after long travel or work.',
    duration: '90 min',
    price: '690.000 đ',
    image: '/images/services/hotstone.png',
  },
  {
    title: 'Herbal Head Spa',
    category: 'Hair Wash',
    description: 'Scalp cleansing, herbal wash, and slow massage designed for calm sleep and fresh energy.',
    duration: '60 min',
    price: '380.000 đ',
    image: '/images/services/hair-wash.png',
  },
  {
    title: 'Signature Glow Facial',
    category: 'Facial Care',
    description: 'A refined facial ritual for hydration, brightness, and a naturally rested look.',
    duration: '60 min',
    price: '520.000 đ',
    image: '/images/services/facial.png',
  },
];

const SignatureServices = () => (
  <section id="best-seller" className="signature-services">
    <div className="signature-services__inner">
      <div className="signature-services__intro">
        <h2>
          Best-seller of
          <br />
          Oria Retreat
        </h2>
      </div>

      <div className="signature-services__grid">
        {SIGNATURE_SERVICES.map((service) => (
          <article className="signature-card" key={service.title}>
            <img src={service.image} alt={service.title} className="signature-card__image" />
            <div className="signature-card__content">
              <span>{service.category}</span>
              <h3>{service.title}</h3>
              <p>{service.description}</p>
              <div className="signature-card__meta">
                <strong>{service.duration}</strong>
                <strong>{service.price}</strong>
              </div>
            </div>
            <a href="/en/new-user/standard/checkout" className="signature-card__action">
              Book now
            </a>
          </article>
        ))}
      </div>
    </div>
  </section>
);

export default SignatureServices;
