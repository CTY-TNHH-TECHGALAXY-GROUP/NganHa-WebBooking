'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, ShoppingBag, Timer, UserRound } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import type { CartItem, Service } from '@/components/Menu/types';
import {
  appendBookingCartItem,
  readBookingCart,
  removeOneBookingCartItem,
} from '@/lib/bookingCartStorage';
import { getPureRelaxationSections } from './pureRelaxationData';
import type {
  PureRelaxationDuration,
  PureRelaxationMedia,
  PureRelaxationPrivilege,
  PureRelaxationSection,
  PureRelaxationService,
  PureRelaxationVariant,
} from './pureRelaxationData';
import styles from './PureRelaxationPage.module.css';

type ActiveItem = {
  name: string;
  subtitle: string;
  media: PureRelaxationMedia;
  durations: PureRelaxationDuration[];
  privilege: PureRelaxationPrivilege;
};

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' đ';

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const hasVariants = (service: PureRelaxationService): service is PureRelaxationService & { variants: PureRelaxationVariant[] } =>
  Array.isArray(service.variants) && service.variants.length > 0;

const getActiveItem = (service: PureRelaxationService, variantIndex: number): ActiveItem => {
  if (hasVariants(service)) {
    const variant = service.variants[Math.min(variantIndex, service.variants.length - 1)];
    return {
      name: variant.name,
      subtitle: variant.subtitle,
      media: variant.media,
      durations: variant.durations,
      privilege: variant.privilege,
    };
  }

  return {
    name: service.name,
    subtitle: service.description,
    media: service.media!,
    durations: service.durations!,
    privilege: service.privilege!,
  };
};

const MediaPreview = ({ media, label }: { media: PureRelaxationMedia; label: string }) => {
  return (
    <div className={styles.mediaFrame}>
      <div className={styles.mediaFade} key={media.src}>
        {media.type === 'video' ? (
          <video
            className={styles.media}
            src={media.src}
            poster={media.poster}
            muted
            autoPlay
            loop
            playsInline
            preload="metadata"
          />
        ) : (
          <img className={styles.media} src={media.src} alt={label} loading="lazy" />
        )}
      </div>
      <div className={styles.mediaOverlay} />
      <span className={styles.mediaCaption}>{media.tag}</span>
    </div>
  );
};

const PreferenceNote = ({ icon, title, copy }: { icon: ReactNode; title: string; copy: string }) => (
  <div className={styles.preferenceNote} aria-label={`${title}: ${copy}`}>
    <span className={styles.preferenceIcon}>{icon}</span>
    <span>
      <strong>{title}</strong>
      <small>{copy}</small>
    </span>
  </div>
);

const ServiceSection = ({ section, contentMedia }: { section: PureRelaxationSection, contentMedia: any }) => {
  const [serviceIndex, setServiceIndex] = useState(0);
  const [variantIndex, setVariantIndex] = useState(0);
  const [durationIndex, setDurationIndex] = useState(0);
  const [notice, setNotice] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const router = useRouter();
  const { currentLang } = useTranslation();

  // Fetch dynamic services and content from admin panel
  const [dbServices, setDbServices] = useState<any[]>([]);
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => setDbServices(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const selectedService = section.services[serviceIndex];
  const active = useMemo(() => getActiveItem(selectedService, variantIndex), [selectedService, variantIndex]);
  
  const displayDurations = useMemo(() => {
    return active.durations.map(duration => {
      const dbService = dbServices.find(s => s.id === duration.id);
      return {
        ...duration,
        price: dbService ? dbService.priceVND : duration.price,
        priceUSD: dbService ? dbService.priceUSD : 0
      };
    });
  }, [active.durations, dbServices]);

  const activeDuration = displayDurations[Math.min(durationIndex, displayDurations.length - 1)];

  const selectedCartServiceId = useMemo(
    () => activeDuration.id || `pure-relaxation-${section.id}-${slugify(active.name)}-${slugify(activeDuration.label)}`,
    [active.name, activeDuration.label, section.id, activeDuration.id]
  );
  const selectedCartQuantity = useMemo(
    () =>
      cartItems
        .filter((item) => item.id === selectedCartServiceId)
        .reduce((total, item) => total + (item.qty || 1), 0),
    [cartItems, selectedCartServiceId]
  );

  const syncCart = useCallback((cart?: CartItem[]) => {
    const next = cart ?? readBookingCart();
    setCartItems(next);
    window.dispatchEvent(new CustomEvent('nganha:cart-updated', { detail: { count: next.length } }));
    return next;
  }, []);

  useEffect(() => {
    setVariantIndex(0);
    setDurationIndex(0);
    setNotice('');
  }, [serviceIndex]);

  useEffect(() => {
    setDurationIndex(0);
    setNotice('');
  }, [variantIndex]);

  // Override media with admin video/image if available
  const displayMedia = useMemo(() => {
    const defaultMedia = active.media;
    if (!defaultMedia) return null;
    
    // Find matching media from contentMedia
    const adminMedia = contentMedia[active.name];

    if (adminMedia && adminMedia.src) {
      return {
        ...defaultMedia,
        type: adminMedia.type as 'image' | 'video',
        src: adminMedia.src,
      };
    }
    return defaultMedia;
  }, [active.media, active.name, contentMedia]);

  useEffect(() => {
    setCartItems(readBookingCart());

    const handleCartUpdate = () => setCartItems(readBookingCart());
    window.addEventListener('nganha:cart-updated', handleCartUpdate);
    window.addEventListener('storage', handleCartUpdate);

    return () => {
      window.removeEventListener('nganha:cart-updated', handleCartUpdate);
      window.removeEventListener('storage', handleCartUpdate);
    };
  }, []);

  const buildServicePayload = useCallback((): Service => {
    const minutes = Number(activeDuration.label.replace(/\D/g, '')) || 0;
    return {
      id: selectedCartServiceId,
      cat: `Pure Relaxation · ${section.title}`,
      names: {
        vi: active.name,
        en: active.name,
        cn: active.name,
        jp: active.name,
        kr: active.name,
      },
      descriptions: {
        vi: active.subtitle,
        en: active.subtitle,
        cn: active.subtitle,
        jp: active.subtitle,
        kr: active.subtitle,
      },
      img: displayMedia?.type === 'image' ? displayMedia.src : displayMedia?.poster || displayMedia?.src || '',
      priceVND: activeDuration.price,
      priceUSD: activeDuration.priceUSD || 0,
      timeValue: minutes,
      timeDisplay: activeDuration.label,
      menuType: 'standard',
    };
  }, [active, activeDuration, section.title, selectedCartServiceId, displayMedia]);

  const addToCart = useCallback(() => {
    const cart = appendBookingCartItem(buildServicePayload(), 1);
    syncCart(cart);
    setNotice('Added to cart');
    window.setTimeout(() => setNotice(''), 2200);
    return cart;
  }, [buildServicePayload, syncCart]);

  const decreaseQuantity = useCallback(() => {
    const cart = removeOneBookingCartItem(selectedCartServiceId);
    syncCart(cart);
    setNotice(cart.some((item) => item.id === selectedCartServiceId) ? 'Updated cart' : 'Removed from cart');
    window.setTimeout(() => setNotice(''), 2200);
    return cart;
  }, [selectedCartServiceId, syncCart]);

  const bookNow = useCallback(() => {
    addToCart();
    router.push(`/${currentLang || 'en'}/new-user/standard/checkout`);
  }, [addToCart, currentLang, router]);

  return (
    <section className={styles.serviceSection} id={section.id}>
      <div className={styles.sectionGrid}>
        <div className={styles.mediaPane}>
          {displayMedia && <MediaPreview media={displayMedia} label={active.name} />}
        </div>

        <div className={styles.sectionContent}>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>Choose service</div>
            <div className={styles.pillGrid}>
              {section.services.map((service, index) => (
                <button
                  className={`${styles.pill} ${serviceIndex === index ? styles.pillActive : ''}`}
                  key={service.name}
                  type="button"
                  onClick={() => setServiceIndex(index)}
                >
                  {service.name}
                </button>
              ))}
            </div>
          </div>

          {hasVariants(selectedService) && (
            <div className={styles.choiceBlock}>
              <div className={styles.choiceLabel}>Choose package</div>
              <div className={styles.variantStack}>
                {selectedService.variants.map((variant, index) => (
                  <button
                    className={`${styles.variantButton} ${variantIndex === index ? styles.variantActive : ''}`}
                    key={variant.name}
                    type="button"
                    onClick={() => setVariantIndex(index)}
                  >
                    <span>{variant.name}</span>
                    <small>{variant.subtitle}</small>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className={styles.selectedPanel}>
            <h3>{active.name}</h3>
            <p>{active.subtitle}</p>
          </div>

          <div className={styles.choiceBlock}>
            <div className={styles.choiceLabel}>Choose duration</div>
            <div className={styles.durationGrid}>
              {active.durations.map((duration, index) => (
                <button
                  className={`${styles.durationButton} ${durationIndex === index ? styles.durationActive : ''}`}
                  key={duration.label}
                  type="button"
                  onClick={() => setDurationIndex(index)}
                >
                  <span>{duration.label}</span>
                  <small>{formatVnd(duration.price)}</small>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.purchaseRow}>
            <div>
              <span className={styles.priceLabel}>Selected price</span>
              <strong>{formatVnd(activeDuration.price)}</strong>
              <div style={{ fontSize: '12px', color: '#7a705e', marginTop: '4px', fontStyle: 'italic', letterSpacing: '0.02em' }}>
                *{{
                  vi: 'Giá đã bao gồm VAT',
                  en: 'Price includes VAT',
                  cn: '价格已含增值税',
                  jp: '付加価値税込み',
                  kr: 'VAT 포함 가격'
                }[currentLang as 'vi'|'en'|'cn'|'jp'|'kr'] || 'Price includes VAT'}
              </div>
            </div>
            <div className={styles.actions}>
              {selectedCartQuantity > 0 ? (
                <div className={styles.quantityStepper} aria-label={`${active.name} quantity in cart`}>
                  <button type="button" onClick={decreaseQuantity} aria-label="Decrease quantity">
                    -
                  </button>
                  <span>{selectedCartQuantity}</span>
                  <button type="button" onClick={addToCart} aria-label="Increase quantity">
                    +
                  </button>
                </div>
              ) : (
                <button className={styles.secondaryButton} type="button" onClick={addToCart}>
                  <ShoppingBag size={17} />
                  Add to cart
                </button>
              )}
              <button className={styles.primaryButton} type="button" onClick={bookNow}>
                Book now
              </button>
            </div>
          </div>

          {notice && <p className={styles.notice}>{notice}</p>}

          {active.privilege && (
            <div className={styles.privilegeCard}>
              <img src={active.privilege.image} alt={active.privilege.title} loading="lazy" />
              <div>
                <span className={styles.choiceLabel}>Privilege Included</span>
                <h4>{active.privilege.title}</h4>
                <p>{active.privilege.copy}</p>
                <small>
                  <Timer size={14} />
                  {active.privilege.time}
                </small>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const bgImages = [
  '/images/services/aroma-oil.png',
  '/images/services/barber.JPG',
  '/images/services/coconut-oil.png',
  '/images/services/earclean.png',
  '/images/services/facial.png',
  '/images/services/foot-massage.png',
  '/images/services/hairwash.png',
  '/images/services/hotstone.png',
  '/images/services/shave.JPG',
  '/images/services/shiatsu.png',
  '/images/services/thai.png'
];

const PureRelaxationPage = () => {
  const navRef = useRef<HTMLDivElement>(null);
  const [bgIndex, setBgIndex] = useState(0);

  const [contentMedia, setContentMedia] = useState<any>({});
  
  useEffect(() => {
    fetch('/api/admin/content')
      .then(res => res.json())
      .then(json => {
        if (json.success) setContentMedia(json.data.pure_relaxation_media || {});
      })
      .catch(console.error);
  }, []);

  const pureRelaxationSections = useMemo(() => getPureRelaxationSections(contentMedia), [contentMedia]);
  
  const [activeSection, setActiveSection] = useState(pureRelaxationSections[0]?.id || 'body-care');

  const displayBgImages = contentMedia.slideshow && contentMedia.slideshow.length > 0 ? contentMedia.slideshow : bgImages;

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % displayBgImages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [displayBgImages.length]);

  useEffect(() => {
    // Scroll nav to center active item on mobile
    const nav = navRef.current;
    const activeButton = nav?.querySelector<HTMLButtonElement>(`[data-section="${activeSection}"]`);
    if (!nav || !activeButton) return;

    const targetLeft = activeButton.offsetLeft - (nav.clientWidth - activeButton.clientWidth) / 2;
    nav.scrollTo({ left: Math.max(0, targetLeft), behavior: 'smooth' });
  }, [activeSection]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    if (navRef.current) {
      const navTop = navRef.current.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > navTop - 100) {
        window.scrollTo({ top: navTop - 100, behavior: 'smooth' });
      }
    }
  };

  return (
    <main className={styles.page}>
      {/* Fixed Background Image Slideshow for Parallax */}
      {displayBgImages.map((src: string, i: number) => (
        <div
          key={src + i}
          className={`${styles.fixedBackground} ${i === bgIndex ? styles.activeBg : ''}`}
          style={{ backgroundImage: `url(${src})` }}
        />
      ))}

      <div className={styles.topPanel}>
        <div className={styles.heroContent}>
          <h1>Pure Relaxation</h1>

          <div className={styles.preferenceWrap}>
            <PreferenceNote icon={<DoorOpen size={18} />} title="Random Room" copy="Assigned by the spa team for the smoothest flow." />
            <PreferenceNote icon={<UserRound size={18} />} title="Random Staff" copy="A suitable therapist will be arranged for your chosen ritual." />
          </div>
        </div>
      </div>

      <div className={styles.imageSpacer} />

      {/* Solid background wrapper for the rest of the content to scroll over the fixed image */}
      <div className={styles.contentWrapper}>

      <nav className={styles.sectionNavShell} aria-label="Pure Relaxation categories">
        <div className={styles.sectionNav} ref={navRef}>
          {pureRelaxationSections.map((section, idx) => (
            <button
              className={`${styles.navButton} ${activeSection === section.id ? styles.navActive : ''}`}
              data-section={section.id}
              key={section.id}
              type="button"
              onClick={() => scrollToSection(section.id)}
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div
                className={styles.categoryIcon}
                style={{
                  maskImage: `url(${section.icon})`,
                  WebkitMaskImage: `url(${section.icon})`
                }}
                aria-hidden="true"
              />
              <span className={styles.categoryTitle}>{section.title}</span>
            </button>
          ))}
        </div>
      </nav>

      <div className={styles.sectionsWrap}>
        {pureRelaxationSections
          .filter((section) => section.id === activeSection)
          .map((section) => (
            <ServiceSection key={section.id} section={section} contentMedia={contentMedia} />
          ))}
      </div>
      </div>
    </main>
  );
};

export default PureRelaxationPage;
