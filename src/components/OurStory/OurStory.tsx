'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import type { Locale } from '@/lib/constants';
import { hydrateOurStoryConfig, hasValidOurStoryContent } from './OurStory.data';
import styles from './OurStory.module.css';

const FilmRibbon = () => (
  <div className={styles.filmRibbon} aria-hidden="true">
    <svg viewBox="0 0 720 150" role="presentation">
      <path
        className={styles.filmRibbonFill}
        d="M22 40 C128 88 211 18 326 55 C442 93 538 29 698 66 L695 105 C541 68 443 132 323 94 C211 58 126 126 19 78 Z"
      />
      <path className={styles.filmRibbonEdge} d="M22 40 C128 88 211 18 326 55 C442 93 538 29 698 66" />
      <path className={styles.filmRibbonEdge} d="M19 78 C126 126 211 58 323 94 C443 132 541 68 695 105" />
      <path className={styles.filmRibbonHoles} d="M24 48 C128 96 211 27 325 63 C442 101 538 37 697 74" />
      <path className={styles.filmRibbonHoles} d="M20 70 C126 118 211 50 324 86 C443 124 541 60 696 97" />
      <g className={styles.filmRibbonFrames}>
        <path d="M112 65 L110 101" />
        <path d="M210 54 L214 89" />
        <path d="M315 54 L313 91" />
        <path d="M424 72 L425 109" />
        <path d="M536 67 L540 103" />
        <path d="M641 61 L644 98" />
      </g>
    </svg>
  </div>
);

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

          <FilmRibbon />

          <div className={styles.imageEditorial}>
            {config.filmReel.frames.map((frame, index) => (
              <figure key={frame.id} className={styles.journeyFigure}>
                <div className={styles.journeyImage}>
                  <img
                    src={frame.image}
                    alt={getLocalizedText(frame.title, lang)}
                    loading="lazy"
                  />
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </div>
                <figcaption>
                  <small>{getLocalizedText(frame.badge, lang)}</small>
                  <strong>{getLocalizedText(frame.title, lang)}</strong>
                  <p>{getLocalizedText(frame.desc, lang)}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className={styles.atmosphereSection}>
          <figure>
            <img
              src={config.atmosphereSection.nightStreetImage}
              alt={getLocalizedText(config.atmosphereSection.imageCaption, lang)}
              loading="lazy"
            />
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
