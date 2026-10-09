'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import OurStory from '@/components/OurStory/OurStory';
import { useTranslation } from '@/components/TranslationProvider';
import { useSystemSettings } from '@/components/SystemSettingsProvider';
import { SPA_TABS, spaTabFromHash, renamedTherapyLabel, type SpaTabId } from '@/lib/oriaNavigation';
import type { Locale } from '@/lib/constants';
import { DEFAULT_SPA_SERVICE_CONTENT, fillLocalizedDefaults } from '@/data/oriaSpaContent';
import styles from './OriaSpaTabs.module.css';

const Space = dynamic(() => import('@/components/Space/SpacePage'));
const History = dynamic(() => import('@/components/History/History'));
const Blogs = dynamic(() => import('@/components/Blogs/BlogsPage'));
const LostAndFound = dynamic(() => import('@/components/LostAndFound/LostAndFoundPage'));
const Privileges = dynamic(() => import('@/components/ComingSoon/ComingSoon'));

const SERVICE_CHOICES = [
  { key: 'designJourney', href: '/design-your-journey', badgeKey: 'designJourneyBadge', badge: '50%', labels: { vi: 'Thiết kế hành trình', en: 'Design Your Journey', cn: '定制您的专属旅程', jp: 'ジャーニーをデザイン', kr: '나만의 여정 디자인' } },
  { key: 'pureRelaxation', href: '/pure-relaxation', badgeKey: 'pureRelaxationBadge', badge: '30%', labels: { vi: 'Thư giãn thuần túy', en: 'Pure Relaxation', cn: '纯粹放松', jp: 'ピュアリラクゼーション', kr: '순수한 휴식' } },
  { key: 'therapy', href: '/therapy', badgeKey: 'therapyBadge', badge: '20%', labels: { vi: 'Deep Body Treament', en: 'Deep Body Treament', cn: 'Deep Body Treament', jp: 'Deep Body Treament', kr: 'Deep Body Treament' } },
] as const;

export default function OriaSpaTabs() {
  const { currentLang } = useTranslation();
  const { systemSettings, getLocalizedText } = useSystemSettings();
  const lang = currentLang as Locale;
  const serviceContent = fillLocalizedDefaults(DEFAULT_SPA_SERVICE_CONTENT, systemSettings?.homepage_content?.spaServiceContent);
  const serviceCopy = Object.fromEntries(Object.keys(DEFAULT_SPA_SERVICE_CONTENT).map(key => [key, serviceContent[key][lang] ?? serviceContent[key].en]));
  const navigation = systemSettings?.homepage_content?.navigation;
  const [activeTab, setActiveTab] = useState<SpaTabId>('our-story');
  const [hasOpenedLostAndFound, setHasOpenedLostAndFound] = useState(false);
  const tabListRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<SpaTabId>('our-story');

  const activate = (id: SpaTabId) => {
    activeTabRef.current = id;
    setActiveTab(id);
    if (id === 'lost-and-found') setHasOpenedLostAndFound(true);
  };

  useEffect(() => {
    const readHash = (initial = false) => {
      const tab = spaTabFromHash(window.location.hash);
      if (!tab) return;
      if (!initial && tab === activeTabRef.current) return;
      activate(tab);
      // The tab strip exists before lazy content, so old anchors can open their panel reliably.
      tabListRef.current?.scrollIntoView({ block: 'start' });
    };
    const onHashChange = () => readHash();
    readHash(true);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const selectTab = (id: SpaTabId) => {
    activate(id);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${id}`);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number;
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % SPA_TABS.length;
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + SPA_TABS.length) % SPA_TABS.length;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = SPA_TABS.length - 1;
    else return;
    event.preventDefault();
    selectTab(SPA_TABS[nextIndex].id);
    const next = tabListRef.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]')[nextIndex];
    next?.focus({ preventScroll: true });
    next?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  return (
    <section className={styles.root} aria-label="Oria Spa">
      <div ref={tabListRef} className={styles.tabs} role="tablist" aria-label="Oria Spa">
        {SPA_TABS.map((tab, index) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`oria-tab-${tab.id}`}
            aria-selected={activeTab === tab.id}
            aria-controls={`oria-panel-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            className={styles.tab}
            onClick={() => selectTab(tab.id)}
            onKeyDown={event => handleKeyDown(event, index)}
          >
            {getLocalizedText(navigation?.[tab.contentKey], lang, tab.labels[lang] || tab.labels.en)}
          </button>
        ))}
      </div>

      {SPA_TABS.map(tab => (
        <div
          key={tab.id}
          id={`oria-panel-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`oria-tab-${tab.id}`}
          hidden={activeTab !== tab.id}
          tabIndex={0}
          className={styles.panel}
        >
          {activeTab === tab.id && tab.id === 'space' && <Space embedded />}
          {activeTab === tab.id && tab.id === 'service' && (
            <section className={styles.services}>
              <h2>{getLocalizedText(navigation?.services, lang, SPA_TABS[1].labels[lang] || 'Service')}</h2>
              <p className={styles.serviceIntro}>{serviceCopy.intro}</p>
              {SERVICE_CHOICES.map(service => (
                <Link
                  key={service.key}
                  href={service.key === 'pureRelaxation' && lang !== 'vi' ? `/${lang}${service.href}` : service.href}
                  className={styles.serviceLink}
                >
                  <span className={styles.serviceContent}>
                    <span className={styles.serviceTitle}>{service.key === 'therapy' ? renamedTherapyLabel(getLocalizedText(navigation?.therapy, lang, service.labels[lang] || service.labels.en)) : getLocalizedText(navigation?.[service.key], lang, service.labels[lang] || service.labels.en)}</span>
                    <span className={styles.serviceDescription}>{serviceCopy[service.key]}</span>
                    <span className={styles.serviceAction}>{service.key === 'therapy' ? serviceCopy.soon : serviceCopy.explore}</span>
                  </span>
                  <span className={styles.badge}>{navigation?.[service.badgeKey] || service.badge}</span>
                  <span className={styles.serviceArrow} aria-hidden="true">↗</span>
                </Link>
              ))}
            </section>
          )}
          {hasOpenedLostAndFound && tab.id === 'lost-and-found' && <LostAndFound embedded />}
          {activeTab === tab.id && tab.id === 'our-story' && <OurStory />}
          {activeTab === tab.id && tab.id === 'history' && <History embedded />}
          {activeTab === tab.id && tab.id === 'blogs' && <Blogs embedded />}
          {activeTab === tab.id && tab.id === 'privileges' && <Privileges embedded />}
        </div>
      ))}
    </section>
  );
}
