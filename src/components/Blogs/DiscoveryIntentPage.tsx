import React, { useEffect, useRef } from 'react';
import styles from './DiscoveryIntentPage.module.css';
import discoveryDataRaw from '../../data/DiscoveryData.json';
import SmartLogo from '@/components/SmartLogo/SmartLogo';

const discoveryData = discoveryDataRaw as any;

export default function DiscoveryIntentPage({ topic, onBack }: { topic: string, onBack: () => void }) {
  const data = discoveryData[topic.replace('.', '').trim()];
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
        containerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [topic]);

  if (!data) return (
    <div style={{ padding: '100px 20px', textAlign: 'center' }}>
      <h2>Intent not found</h2>
      <button onClick={onBack} style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--ink)', color: '#fff', borderRadius: '4px' }}>← Back</button>
    </div>
  );

  return (
    <div className={styles.wrapper} ref={containerRef}>

      <section className={styles.cover}>
        <img src={data.image} alt={data.title} />
        <div className={styles['media-watermark']}></div>
        <div className={styles.coverCopy}>
          <div className={styles.eyebrow}>{data.eyebrow}</div>
          <h1>{data.title}</h1>
          <p>{data.intro}</p>
        </div>
      </section>
      
      <main className={styles.article}>
        <button className={styles.back} onClick={onBack}>
          ← Back to Discovery
        </button>
        
        {data.lede && <p className={styles.lede}>{data.lede}</p>}
        
        {data.sections && data.sections.map((sec: any, idx: number) => (
          <section key={idx} className={styles.section}>
            <div className={styles.sectionLabel}>{sec.label}</div>
            <div>
              <h2>{sec.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: sec.bodyHTML }} />
              
              {sec.cards && sec.cards.length > 0 && (
                <div className={styles.cards}>
                  {sec.cards.map((card: any, cidx: number) => (
                    <div key={cidx} className={styles.card}>
                      <b>{card.title}</b>
                      <p>{card.description}</p>
                      {card.map_url && (
                        <a href={card.map_url} target="_blank" rel="noreferrer" className={styles.maplink}>
                          Open on Google Maps ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        ))}
        
        {data.quote && (
          <blockquote className={styles.quote}>
            {data.quote.text}
            {data.quote.small && <small>{data.quote.small}</small>}
          </blockquote>
        )}
      </main>
    </div>
  );
}
