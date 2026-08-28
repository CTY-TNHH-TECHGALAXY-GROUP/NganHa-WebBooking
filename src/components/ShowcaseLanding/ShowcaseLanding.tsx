'use client';

// ═══════════════════════════════════════════
// ShowcaseLanding - Main UI Component
// ═══════════════════════════════════════════

import { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, HeartCrack, Clock, CalendarCheck, Award, Globe,
  Sparkles, CreditCard, MapPin, Star, ChevronDown, ChevronLeft,
  ChevronRight, Shield, RotateCcw, Lock, ArrowRight, Phone,
  Mail, BookOpen, Timer, Check, Gem, Crown, Zap,
  type LucideIcon,
} from 'lucide-react';
import { t } from './ShowcaseLanding.i18n';
import {
  useScrollProgress, useActiveSection, useCountdown,
  useFAQ, useTestimonialCarousel, useStickyNav,
} from './ShowcaseLanding.logic';
import {
  fadeInUp, fadeInDown, scaleIn, slideFromLeft, slideFromRight,
  staggerContainer, staggerContainerFast, heroTitle, cardHover,
  serviceReveal, pricingCard, accordionContent, blogCard,
  floatingCta, testimonialSlide, counterNumber,
} from './ShowcaseLanding.animation';

// 🔧 UI CONFIGURATION
const SECTION_IDS = ['hero', 'painpoint', 'features', 'testimonials', 'services', 'pricing', 'faq', 'blog', 'contact'];

// ─── Icon Map ───
const iconMap: Record<string, LucideIcon> = {
  Brain, HeartCrack, Clock, CalendarCheck, Award, Globe,
  Sparkles, CreditCard, MapPin, Shield, RotateCcw, Lock,
};

// ═══════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════

const ShowcaseLanding = () => {
  const { showFloatingCta } = useScrollProgress();
  const activeSection = useActiveSection(SECTION_IDS);
  const isSticky = useStickyNav();
  const countdown = useCountdown();
  const { openIndex, toggle } = useFAQ();
  const testimonialCarousel = useTestimonialCarousel(t.testimonials.items.length);

  // Hide global header & floating widgets on this page
  useEffect(() => {
    document.body.classList.add('showcase-page');
    return () => {
      document.body.classList.remove('showcase-page');
    };
  }, []);

  // Memoize particles to avoid hydration mismatch
  const particles = useMemo(() =>
    Array.from({ length: 30 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.33) % 100}%`,
      top: `${(i * 7.77) % 100}%`,
      delay: `${(i * 0.2) % 6}s`,
      duration: `${4 + (i * 0.13) % 4}s`,
    })),
  []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="sc-landing">
      {/* ═══ STICKY NAV ═══ */}
      <nav className={`sc-nav ${isSticky ? 'sc-nav--sticky' : ''}`}>
        <div className="sc-nav__inner">
          <div className="sc-nav__logo" onClick={() => scrollToSection('hero')}>
            <Gem size={20} />
            <span>NGÂN HÀ</span>
          </div>
          <ul className="sc-nav__links">
            {t.nav.items.map((item) => (
              <li key={item.id}>
                <button
                  className={`sc-nav__link ${activeSection === item.id ? 'sc-nav__link--active' : ''}`}
                  onClick={() => scrollToSection(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
          <button className="sc-nav__cta" onClick={() => scrollToSection('contact')}>
            {t.nav.cta}
          </button>
        </div>
      </nav>

      {/* ═══ SECTION 1: HERO CINEMATIC ═══ */}
      <section id="hero" className="sc-hero">
        <div className="sc-hero__particles">
          {particles.map((p) => (
            <div key={p.id} className="sc-particle" style={{
              left: p.left,
              top: p.top,
              animationDelay: p.delay,
              animationDuration: p.duration,
            }} />
          ))}
        </div>
        <div className="sc-hero__gradient" />
        <motion.div
          className="sc-hero__content"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div className="sc-hero__badge" variants={fadeInDown}>
            {t.hero.badge}
          </motion.div>
          <motion.span className="sc-hero__sub" variants={fadeInUp}>
            {t.hero.subtitle}
          </motion.span>
          <motion.h1 className="sc-hero__title" variants={heroTitle}>
            {t.hero.title}
          </motion.h1>
          <motion.span className="sc-hero__sub2" variants={fadeInUp}>
            {t.hero.subTitle2}
          </motion.span>
          <motion.div className="sc-hero__divider" variants={scaleIn} />
          <motion.p className="sc-hero__tagline" variants={fadeInUp}>
            {t.hero.tagline}
          </motion.p>

          {/* Countdown */}
          <motion.div className="sc-countdown" variants={fadeInUp}>
            <span className="sc-countdown__label">{t.countdown.title}</span>
            <div className="sc-countdown__boxes">
              {[
                { value: countdown.days, label: t.countdown.days },
                { value: countdown.hours, label: t.countdown.hours },
                { value: countdown.minutes, label: t.countdown.minutes },
                { value: countdown.seconds, label: t.countdown.seconds },
              ].map((unit) => (
                <div key={unit.label} className="sc-countdown__unit">
                  <span className="sc-countdown__num">{String(unit.value).padStart(2, '0')}</span>
                  <span className="sc-countdown__text">{unit.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div className="sc-hero__ctas" variants={fadeInUp}>
            <button className="sc-btn sc-btn--primary" onClick={() => scrollToSection('services')}>
              {t.hero.cta1}
            </button>
            <button className="sc-btn sc-btn--secondary" onClick={() => scrollToSection('contact')}>
              {t.hero.cta2}
            </button>
          </motion.div>

          <motion.div className="sc-hero__scroll-hint" variants={fadeInUp}>
            <ChevronDown size={20} className="sc-hero__scroll-icon" />
            <span>{t.hero.scrollHint}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 2: PAIN-POINT HOOK ═══ */}
      <section id="painpoint" className="sc-section sc-painpoint">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.painpoint.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.painpoint.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>
          <motion.p className="sc-subtitle" variants={fadeInUp}>{t.painpoint.subtitle}</motion.p>

          <motion.div className="sc-painpoint__grid" variants={staggerContainer}>
            {t.painpoint.pains.map((pain, i) => {
              const Icon = iconMap[pain.icon] || Brain;
              return (
                <motion.div key={i} className="sc-painpoint__card" variants={fadeInUp}>
                  <div className="sc-painpoint__icon"><Icon size={28} /></div>
                  <h3>{pain.title}</h3>
                  <p>{pain.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div className="sc-painpoint__solution" variants={scaleIn}>
            <Sparkles size={32} className="sc-painpoint__sol-icon" />
            <h3>{t.painpoint.solution.title}</h3>
            <p>{t.painpoint.solution.desc}</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 3: FEATURE GRID ═══ */}
      <section id="features" className="sc-section sc-features">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.features.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.features.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>
          <motion.div className="sc-features__grid" variants={staggerContainerFast}>
            {t.features.items.map((feat, i) => {
              const Icon = iconMap[feat.icon] || Sparkles;
              return (
                <motion.div key={i} className="sc-feature-card" variants={fadeInUp} whileHover={{ y: -8, transition: { duration: 0.3 } }}>
                  <div className="sc-feature-card__icon"><Icon size={28} /></div>
                  <h3>{feat.title}</h3>
                  <p>{feat.desc}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 4: TESTIMONIALS ═══ */}
      <section id="testimonials" className="sc-section sc-testimonials">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.testimonials.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.testimonials.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>

          <motion.div
            className="sc-testimonials__carousel"
            variants={fadeInUp}
            onMouseEnter={testimonialCarousel.pause}
            onMouseLeave={testimonialCarousel.resume}
          >
            <button className="sc-carousel-btn sc-carousel-btn--prev" onClick={testimonialCarousel.prev}>
              <ChevronLeft size={20} />
            </button>

            <div className="sc-testimonials__viewport">
              <AnimatePresence initial={false} custom={testimonialCarousel.direction} mode="wait">
                <motion.div
                  key={testimonialCarousel.currentIndex}
                  className="sc-testimonial-card"
                  custom={testimonialCarousel.direction}
                  variants={testimonialSlide}
                  initial="enter"
                  animate="center"
                  exit="exit"
                >
                  <div className="sc-testimonial-card__stars">
                    {Array.from({ length: t.testimonials.items[testimonialCarousel.currentIndex].rating }).map((_, i) => (
                      <Star key={i} size={16} fill="var(--gold-400)" color="var(--gold-400)" />
                    ))}
                  </div>
                  <p className="sc-testimonial-card__text">
                    &ldquo;{t.testimonials.items[testimonialCarousel.currentIndex].text}&rdquo;
                  </p>
                  <div className="sc-testimonial-card__author">
                    <span className="sc-testimonial-card__avatar">
                      {t.testimonials.items[testimonialCarousel.currentIndex].avatar}
                    </span>
                    <div>
                      <strong>{t.testimonials.items[testimonialCarousel.currentIndex].name}</strong>
                      <span>{t.testimonials.items[testimonialCarousel.currentIndex].role}</span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <button className="sc-carousel-btn sc-carousel-btn--next" onClick={testimonialCarousel.next}>
              <ChevronRight size={20} />
            </button>
          </motion.div>

          <div className="sc-testimonials__dots">
            {t.testimonials.items.map((_, i) => (
              <button
                key={i}
                className={`sc-dot ${i === testimonialCarousel.currentIndex ? 'sc-dot--active' : ''}`}
                onClick={() => testimonialCarousel.goTo(i)}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* ═══ SECTION 5: CASE STUDIES (SERVICES) ═══ */}
      <section id="services" className="sc-section sc-services">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.services.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.services.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>

          <motion.div className="sc-services__grid" variants={staggerContainerFast}>
            {t.services.items.map((svc, i) => (
              <motion.div
                key={i}
                className="sc-service-card"
                variants={fadeInUp}
                whileHover="hover"
                initial="rest"
              >
                <div className="sc-service-card__tag">{svc.tag}</div>
                <div className="sc-service-card__header">
                  <h3>{svc.name}</h3>
                  <span className="sc-service-card__name-en">{svc.nameEn}</span>
                </div>
                <div className="sc-service-card__meta">
                  <span><Timer size={14} /> {svc.duration}</span>
                  <span className="sc-service-card__price">{svc.price} <small>({svc.priceUsd})</small></span>
                </div>
                <motion.p className="sc-service-card__desc" variants={serviceReveal}>
                  {svc.desc}
                </motion.p>
                <button className="sc-btn sc-btn--outline sc-btn--sm" onClick={() => scrollToSection('contact')}>
                  {t.services.cta} <ArrowRight size={14} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 6: PRICING TABLE ═══ */}
      <section id="pricing" className="sc-section sc-pricing">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.pricing.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.pricing.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>

          <motion.div className="sc-pricing__grid" variants={staggerContainerFast}>
            {t.pricing.plans.map((plan, i) => (
              <motion.div
                key={i}
                className={`sc-price-card ${plan.popular ? 'sc-price-card--popular' : ''}`}
                variants={pricingCard}
              >
                {plan.popular && <div className="sc-price-card__badge">Phổ biến nhất</div>}
                <div className="sc-price-card__icon">
                  {i === 0 && <Zap size={28} />}
                  {i === 1 && <Crown size={28} />}
                  {i === 2 && <Gem size={28} />}
                </div>
                <h3 className="sc-price-card__name">{plan.name}</h3>
                <span className="sc-price-card__name-en">{plan.nameEn}</span>
                <div className="sc-price-card__price">
                  <span className="sc-price-card__amount">{plan.price}</span>
                  <span className="sc-price-card__period">{plan.period}</span>
                </div>
                <p className="sc-price-card__desc">{plan.desc}</p>
                <ul className="sc-price-card__features">
                  {plan.features.map((f, j) => (
                    <li key={j}><Check size={16} /> {f}</li>
                  ))}
                </ul>
                <button
                  className={`sc-btn ${plan.popular ? 'sc-btn--primary' : 'sc-btn--outline'} sc-btn--full`}
                  onClick={() => scrollToSection('contact')}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="sc-pricing__badges" variants={fadeInUp}>
            {t.pricing.trustBadges.map((badge, i) => {
              const Icon = iconMap[badge.icon] || Shield;
              return (
                <div key={i} className="sc-trust-badge">
                  <Icon size={18} />
                  <span>{badge.text}</span>
                </div>
              );
            })}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 7: FAQ ACCORDION ═══ */}
      <section id="faq" className="sc-section sc-faq">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.faq.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.faq.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>

          <motion.div className="sc-faq__list" variants={staggerContainerFast}>
            {t.faq.items.map((item, i) => (
              <motion.div
                key={i}
                className={`sc-faq-item ${openIndex === i ? 'sc-faq-item--open' : ''}`}
                variants={fadeInUp}
              >
                <button className="sc-faq-item__header" onClick={() => toggle(i)}>
                  <span>{item.q}</span>
                  <ChevronDown size={20} className={`sc-faq-item__chevron ${openIndex === i ? 'sc-faq-item__chevron--open' : ''}`} />
                </button>
                <AnimatePresence>
                  {openIndex === i && (
                    <motion.div
                      className="sc-faq-item__body"
                      initial="closed"
                      animate="open"
                      exit="closed"
                      variants={accordionContent}
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ SECTION 8: BLOG PREVIEW ═══ */}
      <section id="blog" className="sc-section sc-blog">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.blog.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>{t.blog.title}</motion.h2>

          <motion.div className="sc-blog__grid" variants={staggerContainerFast}>
            {t.blog.items.map((post, i) => (
              <motion.article key={i} className="sc-blog-card" variants={blogCard} whileHover={{ y: -6, transition: { duration: 0.3 } }}>
                <div className="sc-blog-card__img">
                  <BookOpen size={32} />
                </div>
                <div className="sc-blog-card__content">
                  <div className="sc-blog-card__meta">
                    <span className="sc-blog-card__category">{post.category}</span>
                    <span className="sc-blog-card__time">{post.readTime}</span>
                  </div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <span className="sc-blog-card__date">{post.date}</span>
                </div>
              </motion.article>
            ))}
          </motion.div>

          <motion.a className="sc-blog__viewall" variants={fadeInUp} href="#">
            {t.blog.viewAll}
          </motion.a>
        </motion.div>
      </section>

      {/* ═══ SECTION 9: CONTACT & CTA ═══ */}
      <section id="contact" className="sc-section sc-contact">
        <motion.div
          className="sc-container"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={staggerContainer}
        >
          <motion.div className="sc-badge" variants={fadeInUp}>{t.contact.badge}</motion.div>
          <motion.h2 className="sc-title" variants={fadeInUp}>
            {t.contact.title.split('\n').map((line, i) => (
              <span key={i}>{line}<br /></span>
            ))}
          </motion.h2>
          <motion.p className="sc-subtitle" variants={fadeInUp}>{t.contact.subtitle}</motion.p>

          <motion.div className="sc-contact__branches" variants={staggerContainerFast}>
            {t.contact.branches.map((branch, i) => (
              <motion.div key={i} className="sc-contact-card" variants={fadeInUp}>
                <h3><MapPin size={18} /> {branch.name}</h3>
                <p>{branch.address}</p>
                <p><Clock size={14} /> {branch.hours}</p>
                <p><Phone size={14} /> {branch.phone}</p>
                <a href={branch.mapUrl} target="_blank" rel="noopener noreferrer" className="sc-btn sc-btn--outline sc-btn--sm">
                  Xem trên Google Maps <ArrowRight size={14} />
                </a>
              </motion.div>
            ))}
          </motion.div>

          <motion.div className="sc-contact__cta-box" variants={scaleIn}>
            <h3>{t.contact.cta}</h3>
            <p>{t.contact.ctaSub}</p>
            <a href="/" className="sc-btn sc-btn--primary sc-btn--lg">
              Đặt Lịch Ngay <ArrowRight size={18} />
            </a>
          </motion.div>
        </motion.div>
      </section>

      {/* ═══ FLOATING CTA ═══ */}
      <AnimatePresence>
        {showFloatingCta && (
          <motion.button
            className="sc-floating-cta"
            variants={floatingCta}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={() => scrollToSection('contact')}
          >
            <CalendarCheck size={18} />
            {t.floatingCta}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ShowcaseLanding;
