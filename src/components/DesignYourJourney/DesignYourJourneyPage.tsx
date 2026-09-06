'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from '@/components/TranslationProvider';
import styles from './DesignYourJourneyPage.module.css';
import { DEFAULT_JOURNEY_CONTENT } from './designJourneyData';

export default function DesignYourJourneyPage() {
  const router = useRouter();
  const { currentLang, setCurrentLang } = useTranslation();
  const [content, setContent] = useState<any>(DEFAULT_JOURNEY_CONTENT);

  useEffect(() => {
    fetch('/api/public/site-content')
      .then(res => res.json())
      .then(json => {
        if (json.content?.design_journey_content) {
          setContent((prev: any) => ({
            ...prev,
            ...json.content.design_journey_content
          }));
        }
      })
      .catch(err => console.error(err));
  }, []);
  
  const getLoc = (key: keyof typeof DEFAULT_JOURNEY_CONTENT) => {
    const entry = content[key] as Record<string, string>;
    if (!entry) return '';
    return entry[currentLang] || entry['en'] || '';
  };

  const handleLangChange = (langCode: string) => {
    setCurrentLang(langCode);
  };

  return (
    <main className={styles.page}>


      <section className={styles.hero}>
        <div className={styles.heroBg}></div>
        <div className={styles.heroInner}>
          <div>
            <div className={styles.eyebrow}>{getLoc('heroEyebrow')}</div>
            <h1 dangerouslySetInnerHTML={{ __html: getLoc('heroTitle') }} />
          </div>
          <div className={styles.heroSide}>
            <p>{getLoc('heroSide')}</p>
          </div>
        </div>
        <div className={styles.scrollCue}>{getLoc('scrollCue')}</div>
      </section>

      <section className={styles.statement}>
        <div className={styles.statementLabel}>{getLoc('statementLabel')}</div>
        <h2>
          {getLoc('statementTitle1')}<br/>
          <em>{getLoc('statementTitle2')}</em>
        </h2>
      </section>

      <section className={styles.split}>
        <div className={styles.splitMedia}>
          <div className={styles.mediaNote}>
            <span>{getLoc('mediaNoteSmall')}</span>
            <strong>{getLoc('mediaNoteStrong')}</strong>
          </div>
        </div>

        <div className={styles.splitCopy}>
          <div>
            <div className={styles.small}>{getLoc('splitSmall1')}</div>
            <h3>{getLoc('splitTitle')}</h3>
            <p>{getLoc('splitP1')}</p>
            <p>{getLoc('splitP2')}</p>

            <div className={styles.consultLine}>
              <strong>{getLoc('consultStrong')}</strong>
              <span>{getLoc('consultSpan')}</span>
            </div>
          </div>
          <div className={styles.small}>{getLoc('splitSmall2')}</div>
        </div>
      </section>

      <section className={styles.journey}>
        <div className={styles.journeyHead}>
          <h4>{getLoc('journeyTitle')}</h4>
          <p>{getLoc('journeyDesc')}</p>
        </div>

        <div className={styles.journeyList}>
          <div className={styles.journeyRow}>
            <div className={styles.num}>01</div>
            <div className={styles.title}>{getLoc('step1Title')}</div>
            <div className={styles.desc}>{getLoc('step1Desc')}</div>
          </div>

          <div className={styles.journeyRow}>
            <div className={styles.num}>02</div>
            <div className={styles.title}>{getLoc('step2Title')}</div>
            <div className={styles.desc}>{getLoc('step2Desc')}</div>
          </div>

          <div className={styles.journeyRow}>
            <div className={styles.num}>03</div>
            <div className={styles.title}>{getLoc('step3Title')}</div>
            <div className={styles.desc}>{getLoc('step3Desc')}</div>
          </div>
        </div>
      </section>

      <section className={styles.final}>
        <div className={styles.finalInner}>
          <div className={styles.finalLabel}>{getLoc('finalLabel')}</div>
          <h5 dangerouslySetInnerHTML={{ __html: getLoc('finalTitle') }} />
          <p>{getLoc('finalDesc')}</p>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link href={`/${currentLang || 'en'}/menu`} className={styles.finalLink}>
              {getLoc('finalLink')}
            </Link>
            <a href="tel:+84" className={styles.finalLink} style={{ color: '#d3c2a8', borderColor: '#d3c2a8' }}>
              {getLoc('ctaContact')} ↗
            </a>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <span>© 2026 TECHGALAXY GROUP</span>
        <span>OriaSpa · Let us understand you.</span>
      </footer>
    </main>
  );
}
