// ═══════════════════════════════════════
// BookingForm Animation Variants — v2
// Framer Motion definitions for Curator redesign
// ═══════════════════════════════════════

import { Variants } from 'framer-motion';

// 🔧 ANIMATION CONFIGURATION
const STEP_DURATION = 0.4;
const STEP_OFFSET = 60;
const INTENT_STAGGER = 0.08;
const CARD_HOVER_SCALE = 1.03;
const BASKET_SLIDE_Y = 80;
const SHEET_DURATION = 0.4;

// ─── Sheet & Modal ───
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
};

export const sheetVariants: Variants = {
  hidden: { y: '100%', opacity: 1 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: SHEET_DURATION,
      ease: [0.22, 1, 0.36, 1], // expoOut
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: SHEET_DURATION * 0.8,
      ease: [0.32, 0, 0.67, 0], // polyIn
    },
  },
};

export const modalVariants: Variants = {
  hidden: { scale: 0.95, opacity: 0, y: 15 },
  visible: {
    scale: 1,
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: {
    scale: 0.97,
    opacity: 0,
    y: 10,
    transition: {
      duration: 0.25,
      ease: 'easeIn',
    },
  },
};

// ─── Step Transitions ───
export const stepSlideVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? STEP_OFFSET : -STEP_OFFSET,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: {
      duration: STEP_DURATION,
      ease: [0.25, 0.1, 0.25, 1],
    },
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -STEP_OFFSET : STEP_OFFSET,
    opacity: 0,
    transition: {
      duration: STEP_DURATION * 0.75,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

// ─── Intent Quiz ───
export const intentContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: INTENT_STAGGER,
      delayChildren: 0.1,
    },
  },
};

export const intentItemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Category Image Cards ───
export const categoryCardVariants: Variants = {
  idle: { scale: 1 },
  hover: {
    scale: CARD_HOVER_SCALE,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
  tap: {
    scale: 0.97,
    transition: { duration: 0.1 },
  },
};

export const categoryContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

export const categoryCardItemVariants: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─── Service Accordion ───
export const accordionVariants: Variants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// ─── Service Rows (stagger within accordion) ───
export const serviceRowContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const serviceRowVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Duration Variant Picker ───
export const durationPickerVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: { duration: 0.25, ease: 'easeOut' },
  },
};

// ─── Floating Basket ───
export const floatingBasketVariants: Variants = {
  hidden: {
    y: BASKET_SLIDE_Y,
    opacity: 0,
    transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
  },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
  },
};

// ─── Count/Price Spring ───
export const countBounceTransition = {
  type: 'spring' as const,
  stiffness: 600,
  damping: 15,
};

// ─── General Section Fade ───
export const sectionFadeVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: (delay: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      delay: delay * 0.1,
      ease: [0.25, 0.1, 0.25, 1],
    },
  }),
};

// ─── Stagger Containers (legacy compat) ───
export const staggerContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

// ─── Success Screen ───
export const successCardVariants: Variants = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.5, ease: [0, 0, 0.2, 1] },
  },
};

export const confettiItemVariants: Variants = {
  hidden: { y: 0, opacity: 1, scale: 1 },
  animate: (i: number) => ({
    y: [0, -60 - (i % 3) * 20, 120],
    x: [0, (i % 5 - 2) * 40],
    opacity: [1, 1, 0],
    scale: [1, 0.8, 0.4],
    rotate: [0, (i % 2 === 0 ? 1 : -1) * 180],
    transition: {
      duration: 1.2 + (i % 4) * 0.2,
      delay: i * 0.06,
      ease: 'easeOut',
    },
  }),
};

// ─── Progress Bar ───
export const progressBarVariants: Variants = {
  initial: { scaleX: 0 },
  animate: (progress: number) => ({
    scaleX: progress,
    transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] },
  }),
};
