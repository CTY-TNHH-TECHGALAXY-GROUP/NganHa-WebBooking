'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Shared languages configuration
export const LANGUAGES = [
  { code: 'vi', countryCode: 'vn', label: 'Tiếng Việt' },
  { code: 'en', countryCode: 'gb', label: 'English' },
  { code: 'cn', countryCode: 'cn', label: '中文' },
  { code: 'jp', countryCode: 'jp', label: '日本語' },
  { code: 'kr', countryCode: 'kr', label: '한국어' },
];

type TranslationContextType = {
  currentLang: string;
  setCurrentLang: (lang: string) => void;
  translations: Record<string, any>;
  t: (section: string, field: string) => string;
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export const TranslationProvider = ({ 
  children, 
  initialTranslations 
}: { 
  children: React.ReactNode;
  initialTranslations: Record<string, any>;
}) => {
  const [currentLang, setCurrentLangState] = useState('vi');

  // Load saved language from localStorage on mount
  useEffect(() => {
    const savedLang = localStorage.getItem('user_lang');
    if (savedLang && LANGUAGES.some(l => l.code === savedLang)) {
      setCurrentLangState(savedLang);
    }
  }, []);

  const setCurrentLang = (lang: string) => {
    setCurrentLangState(lang);
    localStorage.setItem('user_lang', lang);
  };

  // Translation helper function
  const t = (section: string, field: string) => {
    return initialTranslations[section]?.[currentLang]?.[field] || '';
  };

  return (
    <TranslationContext.Provider value={{ currentLang, setCurrentLang, translations: initialTranslations, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
