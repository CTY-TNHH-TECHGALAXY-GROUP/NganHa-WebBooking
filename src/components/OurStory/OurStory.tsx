'use client';

import { useMemo, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import { hydrateOurStoryConfig, hasValidOurStoryContent } from './OurStory.data';
import styles from './OurStory.module.css';

const OurStory = () => {
  const { currentLang } = useTranslation();
  const { systemSettings, aboutStoryContent, getLocalizedText } = useSystemSettings();
  const lang = (currentLang || 'vi') as Locale;

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

          </article>

          <div className={styles.visualStory}>
            <figure className={styles.cityFigure}>
              <img
                src={config.locationSection.cityImage || '/images/about-street.png'}
                alt={getLocalizedText(config.locationSection.title, lang)}
              />
              {config.locationSection.cityImageWatermarkEnabled !== false && (
                <div className="media-watermark" aria-hidden="true" />
              )}
              <figcaption>
                <span>{getLocalizedText(config.locationSection.cityCaptionLeft, lang)}</span>
                <span>{getLocalizedText(config.locationSection.cityCaptionRight, lang)}</span>
              </figcaption>
            </figure>

            <figure className={styles.offsetFigure}>
              <img
                src={config.locationSection.streetSignImage}
                alt={getLocalizedText(config.locationSection.imageCaption, lang)}
                loading="lazy"
              />
              {config.locationSection.streetSignImageWatermarkEnabled !== false && (
                <div className="media-watermark" aria-hidden="true" />
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
            <p>{getLocalizedText(config.architectureSection.activityHint, lang)}</p>
          </div>

          <div
            className={styles.journeyScroller}
            style={{ '--film-frame-count': Math.max(config.filmReel.frames.length, 1) } as CSSProperties}
          >
            <div className={styles.journeyTrack}>
              <div className={styles.filmStrip}>
                <div className={styles.filmFrames}>
                  {config.filmReel.frames.map((frame, index) => (
                    <figure key={'film-' + frame.id} className={styles.filmFrame}>
                      <img
                        src={frame.image}
                        alt={getLocalizedText(frame.title, lang)}
                        loading="lazy"
                      />
                      {frame.watermarkEnabled !== false && (
                        <div className="media-watermark" aria-hidden="true" />
                      )}
                      <span>{String(index + 1).padStart(2, '0')}</span>
                    </figure>
                  ))}
                </div>
              </div>

              <div className={styles.filmCaptions}>
                {config.filmReel.frames.map((frame, index) => (
                  <article key={'caption-' + frame.id}>
                    <small>{getLocalizedText(frame.badge, lang)}</small>
                    <strong>{getLocalizedText(frame.title, lang)}</strong>
                    <p>{getLocalizedText(frame.desc, lang)}</p>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.atmosphereSection}>
          <figure>
            <img
              src={config.atmosphereSection.nightStreetImage}
              alt={getLocalizedText(config.atmosphereSection.imageCaption, lang)}
              loading="lazy"
            />
            {config.atmosphereSection.nightStreetImageWatermarkEnabled !== false && (
              <div className="media-watermark" aria-hidden="true" />
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
                  <img
                    src={pillar.image || '/images/about-treatment.png'}
                    alt={getLocalizedText(pillar.title, lang)}
                    loading="lazy"
                  />
                  {pillar.watermarkEnabled !== false && (
                    <div className="media-watermark" aria-hidden="true" />
                  )}
                </figure>
                <div className={styles.pillarCopy}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <h4>{getLocalizedText(pillar.title, lang)}</h4>
                  <p>{getLocalizedText(pillar.desc, lang)}</p>
                </div>
              </article>
            ))}
          </div>

          <Link
            href={config.specialtySection.ctaLink || '/' + lang + '/new-user/standard/checkout'}
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
