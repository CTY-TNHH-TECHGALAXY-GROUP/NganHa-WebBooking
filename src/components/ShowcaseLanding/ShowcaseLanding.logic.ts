'use client';

// ═══════════════════════════════════════════
// ShowcaseLanding - Business Logic Hooks
// ═══════════════════════════════════════════

import { useState, useEffect, useCallback, useRef } from 'react';

// 🔧 CONFIGURATION
const CTA_SCROLL_THRESHOLD = 0.6; // Show floating CTA after 60% scroll
const TESTIMONIAL_INTERVAL = 5000; // Auto-rotate every 5s
const COUNTDOWN_HOURS = 24; // Countdown 24h promotion

// ─── useScrollProgress ───
export const useScrollProgress = () => {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showFloatingCta, setShowFloatingCta] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
      setScrollProgress(progress);
      setShowFloatingCta(progress >= CTA_SCROLL_THRESHOLD);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return { scrollProgress, showFloatingCta };
};

// ─── useActiveSection ───
export const useActiveSection = (sectionIds: string[]) => {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sectionIds.forEach((id) => {
      const element = document.getElementById(id);
      if (!element) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(id);
          }
        },
        { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' }
      );

      observer.observe(element);
      observers.push(observer);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [sectionIds]);

  return activeSection;
};

// ─── useCountdown ───
export const useCountdown = () => {
  const getTargetTime = useCallback(() => {
    const stored = typeof window !== 'undefined'
      ? localStorage.getItem('showcase-countdown-target')
      : null;

    if (stored) {
      const target = parseInt(stored, 10);
      if (target > Date.now()) return target;
    }

    const target = Date.now() + COUNTDOWN_HOURS * 60 * 60 * 1000;
    if (typeof window !== 'undefined') {
      localStorage.setItem('showcase-countdown-target', target.toString());
    }
    return target;
  }, []);

  const [targetTime] = useState(getTargetTime);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, targetTime - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeLeft;
};

// ─── useFAQ ───
export const useFAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return { openIndex, toggle };
};

// ─── useTestimonialCarousel ───
export const useTestimonialCarousel = (totalItems: number) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const goTo = useCallback(
    (index: number) => {
      setDirection(index > currentIndex ? 1 : -1);
      setCurrentIndex(index);
    },
    [currentIndex]
  );

  const next = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalItems);
  }, [totalItems]);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalItems) % totalItems);
  }, [totalItems]);

  // Auto-rotate
  useEffect(() => {
    intervalRef.current = setInterval(next, TESTIMONIAL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [next]);

  // Pause on hover
  const pause = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resume = useCallback(() => {
    intervalRef.current = setInterval(next, TESTIMONIAL_INTERVAL);
  }, [next]);

  return { currentIndex, direction, goTo, next, prev, pause, resume };
};

// ─── useStickyNav ───
export const useStickyNav = () => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return isSticky;
};
