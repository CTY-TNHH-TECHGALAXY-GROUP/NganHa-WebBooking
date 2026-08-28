// ═══════════════════════════════════════════
// ShowcaseLanding - Framer Motion Variants
// ═══════════════════════════════════════════

import type { Variants } from 'framer-motion';

// 🔧 ANIMATION CONFIGURATION
const STAGGER_DELAY = 0.12;
const DURATION_FAST = 0.4;
const DURATION_NORMAL = 0.6;
const DURATION_SLOW = 0.8;

// ─── Fade In Up ───
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: 'easeOut' },
  },
};

// ─── Fade In Down ───
export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: 'easeOut' },
  },
};

// ─── Fade In Scale ───
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: DURATION_NORMAL, ease: 'easeOut' },
  },
};

// ─── Slide From Left ───
export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION_SLOW, ease: 'easeOut' },
  },
};

// ─── Slide From Right ───
export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 60 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION_SLOW, ease: 'easeOut' },
  },
};

// ─── Stagger Container ───
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: STAGGER_DELAY,
      delayChildren: 0.1,
    },
  },
};

// ─── Stagger Container (Faster) ───
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

// ─── Hero Title Variant ───
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

// ─── Card Hover ───
export const cardHover = {
  rest: {
    scale: 1,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
  },
  hover: {
    scale: 1.03,
    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Service Card Reveal ───
export const serviceReveal: Variants = {
  rest: { opacity: 0, y: 20 },
  hover: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Pricing Card ───
export const pricingCard: Variants = {
  hidden: { opacity: 0, y: 40, rotateX: 5 },
  visible: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: { duration: DURATION_SLOW, ease: 'easeOut' },
  },
};

// ─── FAQ Accordion ───
export const accordionContent: Variants = {
  open: {
    height: 'auto',
    opacity: 1,
    transition: { duration: DURATION_FAST, ease: 'easeOut' },
  },
  closed: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ─── Blog Card ───
export const blogCard: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION_NORMAL, ease: 'easeOut' },
  },
};

// ─── Floating CTA ───
export const floatingCta: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: 30,
    scale: 0.9,
    transition: { duration: 0.3, ease: 'easeIn' },
  },
};

// ─── Glow Pulse (for decorative elements) ───
export const glowPulse: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(212, 175, 55, 0.1)',
      '0 0 40px rgba(212, 175, 55, 0.3)',
      '0 0 20px rgba(212, 175, 55, 0.1)',
    ],
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
};

// ─── Testimonial Slide ───
export const testimonialSlide: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
    transition: { duration: 0.4, ease: 'easeIn' },
  }),
};

// ─── Counter Number Animation ───
export const counterNumber: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'backOut' },
  },
};
