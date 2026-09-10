'use client';

import React, { useEffect } from 'react';
import { useTranslation, LANGUAGES } from '@/components/TranslationProvider';
import Hero from '@/components/Hero/Hero';
import OurStory from '@/components/OurStory/OurStory';
import History from '@/components/History/History';
import type { HeroVideoConfig } from '@/lib/config/heroVideos';

type LocalizedHomePageClientProps = {
  lang: string;
  initialHeroConfig: HeroVideoConfig;
};

export default function LocalizedHomePageClient({
  lang,
  initialHeroConfig,
}: LocalizedHomePageClientProps) {
  const { setCurrentLang } = useTranslation();

  useEffect(() => {
    if (lang && LANGUAGES.some((language) => language.code === lang)) {
      setCurrentLang(lang);
    }
  }, [lang, setCurrentLang]);

  return (
    <main>
      <Hero initialHeroConfig={initialHeroConfig} />
      <OurStory />
      <History />
    </main>
  );
}
