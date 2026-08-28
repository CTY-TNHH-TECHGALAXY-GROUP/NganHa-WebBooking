// ═══════════════════════════════════════════
// Hero - Framer Motion Animations (Showcase Style)
// ═══════════════════════════════════════════

import type { Variants } from 'framer-motion';

// ─── Stagger Container ───
export const heroStagger: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

// ─── Fade In Up ───
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// ─── Fade In Down ───
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// ─── Hero Title (Big entrance) ───
export const heroTitle: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ─── Scale In ───
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
};

// ─── Branch card entrance ───
export const branchEntrance: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { delay: 0.9, duration: 0.7, ease: 'easeOut' },
  },
};

// Legacy export for backward compatibility
export const heroAnimations = {
  container: { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 1 } },
  title: { initial: { y: 40, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.3, duration: 0.8 } },
  cta: { initial: { y: 20, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { delay: 0.6, duration: 0.6 } },
};
