// AIChatBot.animation.ts - Framer Motion variants for chat popup
import type { Variants } from 'framer-motion';

// 🔧 ANIMATION CONFIGURATION
const POPUP_DURATION = 0.4;
const MESSAGE_STAGGER = 0.08;
const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Popup container - slides up from bottom-right
export const popupVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: POPUP_DURATION,
      ease: EASE_OUT_EXPO,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: {
      duration: 0.25,
      ease: 'easeIn' as const,
    },
  },
};

// Overlay backdrop
export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// Individual chat message - fade in from bottom
export const messageVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut' as const,
    },
  },
};

// Stagger children messages
export const messageContainerVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: MESSAGE_STAGGER,
    },
  },
};

// Typing indicator dot - bounce animation (applied inline, not via variants)
export const TYPING_DOT_ANIMATION = {
  y: [0, -6, 0],
};

export const TYPING_DOT_TRANSITION = {
  duration: 0.6,
  repeat: Infinity,
  ease: 'easeInOut' as const,
};

// Chat trigger button - pulse glow when has unread
export const triggerPulseVariants: Variants = {
  idle: { scale: 1 },
  pulse: {
    scale: [1, 1.08, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut' as const,
    },
  },
};
