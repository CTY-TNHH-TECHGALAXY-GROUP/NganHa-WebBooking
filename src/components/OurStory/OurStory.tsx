'use client';

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import { hydrateOurStoryConfig, hasValidOurStoryContent } from './OurStory.data';
import { resolveConfigUrl } from '@/lib/config/urlSettings';
import {
  deferredMediaErrorAction,
  deferredMediaStateAfterDecode,
  responsiveSourcesForImage,
  type DeferredMediaState,
  type ResponsiveSources,
} from '@/lib/media/responsiveSources';
import styles from './OurStory.module.css';

const getResponsiveSrcSet = (sources?: ResponsiveSources) => Object.entries(sources || {})
  .filter(([width, url]) => /^\d+$/.test(width) && typeof url === 'string' && url.length > 0)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([width, url]) => `${url} ${width}w`)
  .join(', ');

const TRANSPARENT_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

type DeferredStoryImageProps = {
  src: string;
  alt: string;
  sources?: ResponsiveSources;
  responsiveSourceImage?: string;
  sizes?: string;
};

/**
 * Native lazy loading starts fetching a large distance before an image enters
 * the viewport. Keep Our Story's offscreen CMS media out of the request queue
 * until its own reserved slot is near the viewport instead.
 */
const DeferredStoryImage = ({ src, alt, sources, responsiveSourceImage, sizes }: DeferredStoryImageProps) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [loadState, setLoadState] = useState<DeferredMediaState>('deferred');
  const [useResponsiveSource, setUseResponsiveSource] = useState(true);
  const slotRef = useRef<HTMLPictureElement>(null);
  const fallbackAttemptedRef = useRef(false);
  const srcSet = getResponsiveSrcSet(responsiveSourcesForImage(src, sources, responsiveSourceImage));

  useEffect(() => {
    fallbackAttemptedRef.current = false;
    setUseResponsiveSource(true);
    setLoadState(shouldLoad ? 'loading' : 'deferred');
  }, [shouldLoad, src, srcSet]);

  useEffect(() => {
    const slot = slotRef.current;
    if (!slot) return;

    if (!('IntersectionObserver' in window)) {
      setShouldLoad(true);
      setLoadState('loading');
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        setLoadState('loading');
        observer.disconnect();
      },
      { rootMargin: '200px 0px' },
    );

    observer.observe(slot);
    return () => observer.disconnect();
  }, []);

  return (
    <picture ref={slotRef}>
      {shouldLoad && useResponsiveSource && srcSet && <source type="image/webp" srcSet={srcSet} sizes={sizes} />}
      <img
        src={shouldLoad ? src : TRANSPARENT_IMAGE}
        alt={alt}
        decoding="async"
        sizes={sizes}
        aria-busy={loadState === 'deferred' || loadState === 'loading'}
        data-media-state={loadState}
        onLoad={event => {
          if (!shouldLoad) return;
          const image = event.currentTarget;
          const finish = () => setLoadState(deferredMediaStateAfterDecode(image.naturalWidth));
          if (typeof image.decode !== 'function') {
            finish();
            return;
          }
          void image.decode().then(finish, finish);
        }}
        onError={() => {
          const next = deferredMediaErrorAction(useResponsiveSource && Boolean(srcSet), fallbackAttemptedRef.current);
          if (next.retryOriginal) fallbackAttemptedRef.current = true;
          setUseResponsiveSource(next.useResponsiveSource);
          setLoadState(next.state);
        }}
      />
    </picture>
  );
};

const OurStory = () => {
  const { currentLang } = useTranslation();
  const { systemSettings, aboutStoryContent, getLocalizedText } = useSystemSettings();
  const lang = (currentLang || 'vi') as Locale;
  const reduceMotion = useReducedMotion();

  const rawData = useMemo(() => {
    if (hasValidOurStoryContent(aboutStoryContent)) return aboutStoryContent;
    if (hasValidOurStoryContent(systemSettings?.homepage_content?.ourStory)) {
      return systemSettings?.homepage_content?.ourStory;
    }
    return null;
  }, [aboutStoryContent, systemSettings]);
  const config = useMemo(() => hydrateOurStoryConfig(rawData), [rawData]);

  return (
    <section className={styles.sectionRoot} id="our-story">
      <div className={styles.container}>
        <header className={styles.masthead}>
          <p className={styles.eyebrow}>{getLocalizedText(config.header.badge, lang)}</p>
          <div className={styles.titleComposition}>
            <h2>{getLocalizedText(config.header.title, lang)}</h2>
            <p>{getLocalizedText(config.header.script, lang)}</p>
          </div>
          <div className={styles.mastheadRule}>
            <span>{getLocalizedText(config.header.addressLabel, lang)}</span>
            <span>{getLocalizedText(config.header.cityLabel, lang)}</span>
          </div>
        </header>

        <div className={styles.openingGrid}>
          <article className={styles.locationStory}>
            <div className={styles.sectionMarker}>
              <span>01</span>
              <h3>{getLocalizedText(config.locationSection.title, lang)}</h3>
            </div>
            <p className={styles.lead}>{getLocalizedText(config.locationSection.text, lang)}</p>
            <p className={styles.goldPoint}>{getLocalizedText(config.locationSection.strategicPosition, lang)}</p>
            <p className={styles.connectionIntro}>{getLocalizedText(config.locationSection.connectionsTitle, lang)}</p>
            <ul className={styles.connectionList}>
              {config.locationSection.connections.map((connection, index) => (
                <li key={'connection-' + index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{getLocalizedText(connection, lang)}</p>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-6 border-t border-[rgba(216,182,106,0.2)]">
              <Link
                href={lang && lang !== 'vi' ? `/${lang}/local-tour` : '/local-tour'}
                className={styles.textLink}
              >
                <span>
                  {lang === 'vi' ? 'Khám phá Local Tour Sài Gòn theo cách của Oria Spa' :
                   lang === 'cn' ? '探索 Oria Spa 西贡深度漫步体验' :
                   lang === 'jp' ? 'Oria Spa流のサイゴンローカルツアーを見る' :
                   lang === 'kr' ? 'Oria Spa와 함께하는 사이공 로컬 투어 살펴보기' :
                   'Explore Saigon Local Tour the Oria Spa Way'}
                </span>
                <ArrowUpRight aria-hidden="true" size={20} />
              </Link>
            </div>
          </article>

          <div className={styles.visualStory}>
            <figure className={styles.cityFigure}>
              <DeferredStoryImage
                src={config.locationSection.cityImage || '/images/about-street.png'}
                sources={config.locationSection.cityImageResponsiveSources}
                responsiveSourceImage={config.locationSection.cityImageResponsiveSource}
                sizes="(max-width: 760px) 92vw, 52vw"
                alt={getLocalizedText(config.locationSection.title, lang)}
              />
              {config.locationSection.cityImageWatermarkEnabled !== false && (
                <div
                  className="media-watermark"
                  aria-hidden="true"
                  style={{ opacity: (config.locationSection.cityImageWatermarkOpacity ?? 15) / 100 }}
                />
              )}
              <figcaption>
                <span>{getLocalizedText(config.locationSection.cityCaptionLeft, lang)}</span>
                <span>{getLocalizedText(config.locationSection.cityCaptionRight, lang)}</span>
              </figcaption>
            </figure>

            <figure className={styles.offsetFigure}>
              <DeferredStoryImage
                src={config.locationSection.streetSignImage}
                sources={config.locationSection.streetSignImageResponsiveSources}
                responsiveSourceImage={config.locationSection.streetSignImageResponsiveSource}
                sizes="(max-width: 760px) 56vw, 24vw"
                alt={getLocalizedText(config.locationSection.imageCaption, lang)}
              />
              {config.locationSection.streetSignImageWatermarkEnabled !== false && (
                <div
                  className="media-watermark"
                  aria-hidden="true"
                  style={{ opacity: (config.locationSection.streetSignImageWatermarkOpacity ?? 15) / 100 }}
                />
              )}
              <figcaption>{getLocalizedText(config.locationSection.imageCaption, lang)}</figcaption>
            </figure>
          </div>
        </div>

        <section className={styles.architectureSection}>
          <div className={styles.sectionMarker}>
            <span>02</span>
            <h3>{getLocalizedText(config.architectureSection.title, lang)}</h3>
          </div>
          <div className={styles.architectureGrid}>
            <div className={styles.featureList}>
              {config.architectureSection.features.map((feature, index) => (
                <article key={'feature-' + index}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <p>{getLocalizedText(feature, lang)}</p>
                </article>
              ))}
            </div>
            <aside className={styles.nearbyMoments}>
              <p>{getLocalizedText(config.architectureSection.activityTitle, lang)}</p>
              <ol>
                {config.architectureSection.activities.map((activity) => (
                  <li key={'activity-' + activity.frameId}>
                    <span>{String(activity.frameId).padStart(2, '0')}</span>
                    {getLocalizedText(activity.text, lang)}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>

        <section className={styles.journeySection} id="film-strip-reel">
          <div className={styles.journeyHeading}>
            <div className={styles.sectionMarker}>
              <span>03</span>
              <h3>{getLocalizedText(config.filmReel.title, lang)}</h3>
            </div>
          </div>

          <div
            className={styles.journeyScroller}
            role="region"
            tabIndex={0}
            aria-label={getLocalizedText(config.filmReel.title, lang)}
            style={{ '--film-frame-count': Math.max(config.filmReel.frames.length, 1) } as CSSProperties}
          >
            <motion.div
              className={styles.journeyTrack}
              initial={reduceMotion ? false : { opacity: 0.45, x: 54 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.18 }}
              transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className={styles.filmStrip}>
                <div className={styles.filmFrames}>
                  {config.filmReel.frames.map((frame, index) => (
                    <motion.figure
                      key={'film-' + frame.id}
                      className={styles.filmFrame}
                      initial={reduceMotion ? false : { opacity: 0.55, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      whileHover={reduceMotion ? undefined : { y: -5 }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{
                        opacity: { duration: 0.55, delay: index * 0.07 },
                        y: { type: 'spring', stiffness: 150, damping: 22, delay: index * 0.07 },
                      }}
                    >
                      <DeferredStoryImage
                        src={frame.image}
                        sources={frame.responsiveSources}
                        responsiveSourceImage={frame.responsiveSourceImage}
                        alt={getLocalizedText(frame.title, lang)}
                        sizes="(max-width: 760px) 205px, 250px"
                      />
                      {frame.watermarkEnabled !== false && (
                        <div
                          className="media-watermark"
                          aria-hidden="true"
                          style={{ opacity: (frame.watermarkOpacity ?? 15) / 100 }}
                        />
                      )}
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </motion.figure>
                  ))}
                </div>
              </div>

              <div className={styles.filmCaptions}>
                {config.filmReel.frames.map((frame, index) => (
                  <motion.article
                    key={'caption-' + frame.id}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.55, delay: 0.16 + index * 0.07, ease: 'easeOut' }}
                  >
                    <small>{getLocalizedText(frame.badge, lang)}</small>
                    <strong>{getLocalizedText(frame.title, lang)}</strong>
                    <p>{getLocalizedText(frame.desc, lang)}</p>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className={styles.atmosphereSection}>
          <figure>
            <DeferredStoryImage
              src={config.atmosphereSection.nightStreetImage}
              sources={config.atmosphereSection.nightStreetImageResponsiveSources}
              responsiveSourceImage={config.atmosphereSection.nightStreetImageResponsiveSource}
              alt={getLocalizedText(config.atmosphereSection.imageCaption, lang)}
              sizes="(max-width: 760px) calc(100vw - 40px), 48vw"
            />
            {config.atmosphereSection.nightStreetImageWatermarkEnabled !== false && (
              <div
                className="media-watermark"
                aria-hidden="true"
                style={{ opacity: (config.atmosphereSection.nightStreetImageWatermarkOpacity ?? 15) / 100 }}
              />
            )}
            <figcaption>{getLocalizedText(config.atmosphereSection.imageCaption, lang)}</figcaption>
          </figure>
          <div className={styles.atmosphereCopy}>
            <div className={styles.sectionMarker}>
              <span>04</span>
              <h3>{getLocalizedText(config.atmosphereSection.title, lang)}</h3>
            </div>
            <div className={styles.atmosphereNotes}>
              <p>{getLocalizedText(config.atmosphereSection.morning, lang)}</p>
              <p>{getLocalizedText(config.atmosphereSection.evening, lang)}</p>
              <p>{getLocalizedText(config.atmosphereSection.landmark, lang)}</p>
            </div>
          </div>
        </section>

        <section className={styles.specialtySection}>
          <div className={styles.specialtyIntro}>
            <p className={styles.eyebrow}>{getLocalizedText(config.specialtySection.badge, lang)}</p>
            <h3>{getLocalizedText(config.specialtySection.headline, lang)}</h3>
            <p>{getLocalizedText(config.specialtySection.lead, lang)}</p>
          </div>

          <div className={styles.pillarList}>
            {config.specialtySection.pillars.map((pillar, index) => (
              <article key={'pillar-' + index}>
                <figure className={styles.pillarMedia}>
                  <DeferredStoryImage
                    src={pillar.image || '/images/about-treatment.png'}
                    sources={pillar.responsiveSources}
                    responsiveSourceImage={pillar.responsiveSourceImage}
                    alt={getLocalizedText(pillar.title, lang)}
                    sizes="(max-width: 760px) calc(100vw - 40px), 45vw"
                  />
                  {pillar.watermarkEnabled !== false && (
                    <div
                      className="media-watermark"
                      aria-hidden="true"
                      style={{ opacity: (pillar.watermarkOpacity ?? 15) / 100 }}
                    />
                  )}
                </figure>
                <div className={styles.pillarCopy}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h4>{getLocalizedText(pillar.title, lang)}</h4>
                  <p>{getLocalizedText(pillar.desc, lang)}</p>
                </div>
              </article>
            ))}

            {config.specialtySection.menuNiches && config.specialtySection.menuNiches.map((menu, index) => (
              <article key={menu.id || 'menu-niche-' + index}>
                <figure className={styles.pillarMedia}>
                  <DeferredStoryImage
                    src={menu.image || '/images/about-treatment.png'}
                    sources={menu.responsiveSources}
                    responsiveSourceImage={menu.responsiveSourceImage}
                    alt={getLocalizedText(menu.title, lang)}
                    sizes="(max-width: 760px) calc(100vw - 40px), 45vw"
                  />
                  {menu.watermarkEnabled !== false && (
                    <div
                      className="media-watermark"
                      aria-hidden="true"
                      style={{ opacity: (menu.watermarkOpacity ?? 15) / 100 }}
                    />
                  )}
                </figure>
                <div className={styles.pillarCopy}>
                  <span>{menu.order || String(index + 1).padStart(2, '0')}</span>
                  <h4>{getLocalizedText(menu.title, lang)}</h4>
                  {menu.tagline && getLocalizedText(menu.tagline, lang) && (
                    <p className={styles.menuTagline}>{getLocalizedText(menu.tagline, lang)}</p>
                  )}
                  <p>{getLocalizedText(menu.summary, lang)}</p>
                  {(menu.included || menu.bestFor || menu.highlights || menu.note) && (
                    <div className={styles.menuDetails}>
                      {menu.included && getLocalizedText(menu.included, lang) && (
                        <p>
                          <strong>
                            {lang === 'vi' ? 'Bao gồm: ' : lang === 'cn' ? '包含服务：' : lang === 'kr' ? '포함 서비스: ' : lang === 'jp' ? '含まれるサービス: ' : 'Included: '}
                          </strong>
                          {getLocalizedText(menu.included, lang)}
                        </p>
                      )}
                      {menu.bestFor && getLocalizedText(menu.bestFor, lang) && (
                        <p>
                          <strong>
                            {lang === 'vi' ? 'Phù hợp với: ' : lang === 'cn' ? '适合人群：' : lang === 'kr' ? '추천 대상: ' : lang === 'jp' ? 'おすすめの方: ' : 'Best for: '}
                          </strong>
                          {getLocalizedText(menu.bestFor, lang)}
                        </p>
                      )}
                      {menu.highlights && getLocalizedText(menu.highlights, lang) && (
                        <p>
                          <strong>
                            {lang === 'vi' ? 'Điểm khác biệt: ' : lang === 'cn' ? '特色亮点：' : lang === 'kr' ? '차별점: ' : lang === 'jp' ? '特徴: ' : 'Highlights: '}
                          </strong>
                          {getLocalizedText(menu.highlights, lang)}
                        </p>
                      )}
                      {menu.note && getLocalizedText(menu.note, lang) && (
                        <p className={styles.menuNote}>
                          <em>{getLocalizedText(menu.note, lang)}</em>
                        </p>
                      )}
                    </div>
                  )}
                  {menu.ctaText && getLocalizedText(menu.ctaText, lang) && (
                    <Link
                      href={resolveConfigUrl(menu.ctaLink, lang, `/${lang}/new-user/standard/checkout`)}
                      className={styles.textLink}
                    >
                      {getLocalizedText(menu.ctaText, lang)}
                      <ArrowUpRight aria-hidden="true" size={20} />
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <Link
            href={resolveConfigUrl(config.specialtySection.ctaLink, lang, `/${lang}/new-user/standard/checkout`)}
            className={styles.textLink}
          >
            {getLocalizedText(config.specialtySection.ctaText, lang)}
            <ArrowUpRight aria-hidden="true" size={20} />
          </Link>
        </section>
      </div>
    </section>
  );
};

export default OurStory;
