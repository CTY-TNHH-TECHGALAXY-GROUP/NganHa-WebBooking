import Image from 'next/image';
import Link from 'next/link';
import { ContentRenderer } from '@/components/ContentRenderer';
import {
  SAIGON_COFFEE_PILOT_DOCUMENT,
  SAIGON_COFFEE_PILOT_HEADER,
  SAIGON_COFFEE_PILOT_LOCALES,
  SAIGON_COFFEE_PILOT_MEDIA,
  resolveSaigonCoffeePilotMedia,
} from '@/content/saigonCoffeePilot';
import { resolveLocalizedValue, resolveSupportedLocale } from '@/lib/content/resolveLocalizedValue';
import styles from './SaigonCoffeePilot.module.css';

const localeLabel = { vi: 'VI', en: 'EN', cn: 'CN', jp: 'JP', kr: 'KR' } as const;

export async function SaigonCoffeePilot({ locale: requestedLocale }: { locale: string }) {
  const locale = resolveSupportedLocale(requestedLocale);
  const localized = <T,>(value: Partial<Record<typeof locale, T>>) =>
    resolveLocalizedValue(value, locale).value;
  const hero = SAIGON_COFFEE_PILOT_MEDIA['media-saigon-coffee-hero'];
  const heroAlt = localized(hero.alt_i18n) || hero.title;

  return (
    <div className={styles.wrapper}>
      <header className={styles.hero}>
        <Image
          src={hero.url}
          alt={heroAlt}
          fill
          priority
          sizes="100vw"
          className={styles.heroImage}
        />
        <div className={styles.heroShade} />
        <nav className={styles.pilotNav} aria-label="Pilot language">
          <Link href="/blogs">{locale === 'vi' ? '← Quay lại Blogs' : '← Back to Blogs'}</Link>
          <div className={styles.locales}>
            {SAIGON_COFFEE_PILOT_LOCALES.map((item) => (
              <Link
                key={item}
                href={`/content-pilot/saigon-coffee/${item}`}
                aria-current={item === locale ? 'page' : undefined}
              >
                {localeLabel[item]}
              </Link>
            ))}
          </div>
        </nav>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.kicker}>{localized(SAIGON_COFFEE_PILOT_HEADER.kicker)}</p>
            <h1>{localized(SAIGON_COFFEE_PILOT_HEADER.title)}</h1>
            <p className={styles.subtitle}>{localized(SAIGON_COFFEE_PILOT_HEADER.subtitle)}</p>
            <div className={styles.meta}>
              <span>{localized(SAIGON_COFFEE_PILOT_HEADER.author)}</span>
              <span>{localized(SAIGON_COFFEE_PILOT_HEADER.cultureTag)}</span>
              <span>{localized(SAIGON_COFFEE_PILOT_HEADER.paceTag)}</span>
              <span>{localized(SAIGON_COFFEE_PILOT_HEADER.readTime)}</span>
            </div>
          </div>
          <aside className={styles.heroSide}>
            <p className={styles.sideLabel}>{localized(SAIGON_COFFEE_PILOT_HEADER.sideLabel)}</p>
            <h2>{localized(SAIGON_COFFEE_PILOT_HEADER.sideTitle)}</h2>
            <p>{localized(SAIGON_COFFEE_PILOT_HEADER.sideBody)}</p>
            <strong>{localized(SAIGON_COFFEE_PILOT_HEADER.bestFor)}</strong>
          </aside>
        </div>
      </header>

      <main className={styles.page}>
        <article className={styles.renderer}>
          <ContentRenderer
            document={SAIGON_COFFEE_PILOT_DOCUMENT}
            locale={locale}
            resolveMedia={resolveSaigonCoffeePilotMedia}
          />
        </article>
      </main>

      <footer className={styles.pilotFooter}>
        Fixture-backed Phase 2 renderer pilot · Content Contract V1.0.0
      </footer>
    </div>
  );
}
