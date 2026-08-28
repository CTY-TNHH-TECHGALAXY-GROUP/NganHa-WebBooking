// Header.logic.ts - Header business logic
'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/components/TranslationProvider';

// Cấu hình danh sách ngôn ngữ dùng chung
export const LANGUAGES = [
  { code: 'vi', countryCode: 'vn', label: 'Tiếng Việt' },
  { code: 'en', countryCode: 'gb', label: 'English' },
  { code: 'cn', countryCode: 'cn', label: '中文' },
  { code: 'jp', countryCode: 'jp', label: '日本語' },
  { code: 'kr', countryCode: 'kr', label: '한국어' },
];

export const useHeaderLogic = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentLang: currentLangCode, setCurrentLang: setGlobalLang, t } = useTranslation();
  
  // Find full language object from LANGUAGES array based on currentLangCode
  const currentLang = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];
  
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      setIsScrolled(scrollY > 50);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Handle click outside for language dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target as Node)) {
        setIsLangDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const toggleLangDropdown = () => setIsLangDropdownOpen((prev) => !prev);
  const closeLangDropdown = () => setIsLangDropdownOpen(false);
  
  const handleSelectLanguage = (lang: typeof LANGUAGES[0]) => {
    setGlobalLang(lang.code);
    closeLangDropdown();
  };

  return { 
    isMobileMenuOpen, 
    isScrolled, 
    toggleMobileMenu,
    currentLang,
    isLangDropdownOpen,
    toggleLangDropdown,
    closeLangDropdown,
    handleSelectLanguage,
    langDropdownRef,
    t
  };
};
