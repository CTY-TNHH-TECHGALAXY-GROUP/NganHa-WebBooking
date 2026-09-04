'use client';

import React, { createContext, useContext } from 'react';
import { Locale } from '@/lib/constants';

// Interfaces
export interface SystemSettings {
  address?: Record<string, string>;
  googleMaps?: string;
  hours?: string;
  phone?: string;
  zalo?: string;
  facebook?: string;
  whatsapp?: string;
  wechat?: string;
  kakaotalk?: string;
  homepage_content?: any;
}

export interface AboutStoryGalleryItem {
  id: string;
  src: string;
  caption: Record<string, string>;
}

export interface AboutStoryContent {
  section1?: {
    image: string;
    title: Record<string, string>;
    items: Record<string, string>[];
  };
  section2?: {
    image: string;
    title: Record<string, string>;
    items: Record<string, string>[];
  };
  section3?: {
    title: Record<string, string>;
    detail: Record<string, string>;
  };
  gallery?: AboutStoryGalleryItem[];
}

export interface BrandHistoryScene {
  id: string;
  title: Record<string, string>;
  label: Record<string, string>;
  body: Record<string, string>;
  image: string;
  alt: Record<string, string>;
  imageFit?: any;
  imagePosition?: any;
}

export interface BrandHistoryChapter {
  id: string;
  year: string;
  eyebrow: Record<string, string>;
  title: Record<string, string>;
  body: Record<string, string>;
  meta: Record<string, string[]>;
  scenes: BrandHistoryScene[];
}

export interface BrandHistoryConfig {
  hero?: {
    image: string;
    eyebrow: Record<string, string>;
    title1: Record<string, string>;
    title2: Record<string, string>;
    body: Record<string, string>;
  };
  finale?: {
    eyebrow: Record<string, string>;
    title: Record<string, string>;
    body: Record<string, string>;
  };
  chapters: BrandHistoryChapter[];
}

interface SystemSettingsContextType {
  systemSettings: SystemSettings;
  aboutStoryContent: AboutStoryContent;
  brandHistory: BrandHistoryConfig | null;
  footerContent: any;
  getLocalizedText: (textObj: Record<string, string> | undefined, locale: Locale, fallback?: string) => string;
}

const SystemSettingsContext = createContext<SystemSettingsContextType>({
  systemSettings: {},
  aboutStoryContent: {},
  brandHistory: null,
  footerContent: {},
  getLocalizedText: () => '',
});

export const useSystemSettings = () => useContext(SystemSettingsContext);

export const SystemSettingsProvider = ({
  children,
  systemSettings = {},
  aboutStoryContent = {},
  brandHistory = null,
  footerContent = {},
}: {
  children: React.ReactNode;
  systemSettings?: any;
  aboutStoryContent?: any;
  brandHistory?: any;
  footerContent?: any;
}) => {
  
  const getLocalizedText = (textObj: Record<string, string> | undefined, locale: Locale, fallback = '') => {
    if (!textObj) return fallback;
    return textObj[locale] || textObj['en'] || textObj['vi'] || fallback;
  };

  return (
    <SystemSettingsContext.Provider
      value={{
        systemSettings,
        aboutStoryContent,
        brandHistory,
        footerContent,
        getLocalizedText
      }}
    >
      {children}
    </SystemSettingsContext.Provider>
  );
};
