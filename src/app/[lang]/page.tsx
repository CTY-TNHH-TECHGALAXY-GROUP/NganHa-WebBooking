'use client';

import React, { use, useEffect } from 'react';
import { notFound } from 'next/navigation';
import { useTranslation, LANGUAGES } from '@/components/TranslationProvider';
import Hero from '@/components/Hero/Hero';
import OurStory from '@/components/OurStory/OurStory';
import History from '@/components/History/History';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default function LocalizedHomePage({ params }: PageProps) {
  const resolvedParams = use(params);
  const lang = resolvedParams?.lang;

  if (!LANGUAGES.some((l) => l.code === lang)) {
    notFound();
  }

  const { setCurrentLang } = useTranslation();

  useEffect(() => {
    if (lang && LANGUAGES.some((l) => l.code === lang)) {
      setCurrentLang(lang);
    }
  }, [lang, setCurrentLang]);

  return (
    <main>
      <Hero />
      <OurStory />
      <History />
    </main>
  );
}
