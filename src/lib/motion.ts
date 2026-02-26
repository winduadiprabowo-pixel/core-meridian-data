/**
 * motion.ts — ZERØ MERIDIAN Motion Design System
 * Centralized Framer Motion variants, transitions, and gesture configs.
 * Zero JSX — pure TS constants.
 * Object.freeze() all static data.
 */

import type { Variants, Transition } from 'framer-motion';

// ─── Base Transitions ─────────────────────────────────────────────────────────

export const TRANSITION = Object.freeze({
  fast: Object.freeze({
    type: 'tween',
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  } as Transition),

  normal: Object.freeze({
    type: 'tween',
    duration: 0.25,
    ease: [0.16, 1, 0.3, 1],
  } as Transition),

  slow: Object.freeze({
    type: 'tween',
    duration: 0.4,
    ease: [0.4, 0, 0.2, 1],
  } as Transition),

  spring: Object.freeze({
    type: 'spring',
    stiffness: 400,
    damping: 30,
  } as Transition),

  springBouncy: Object.freeze({
    type: 'spring',
    stiffness: 600,
    damping: 20,
  } as Transition),

  springSmooth: Object.freeze({
    type: 'spring',
    stiffness: 200,
    damping: 40,
  } as Transition),
} as const);

// ─── Page Transition Variants ─────────────────────────────────────────────────

export const VARIANTS = Object.freeze({
  pageSlideUp: Object.freeze({
    initial:  { opacity: 0, y: 12 },
    animate:  { opacity: 1, y: 0  },
    exit:     { opacity: 0, y: -8 },
  } as Variants),

  pageSlideRight: Object.freeze({
    initial:  { opacity: 0, x: -12 },
    animate:  { opacity: 1, x: 0   },
    exit:     { opacity: 0, x: 12  },
  } as Variants),

  pageFade: Object.freeze({
    initial:  { opacity: 0 },
    animate:  { opacity: 1 },
    exit:     { opacity: 0 },
  } as Variants),

  scaleIn: Object.freeze({
    initial:  { opacity: 0, scale: 0.96 },
    animate:  { opacity: 1, scale: 1    },
    exit:     { opacity: 0, scale: 0.97 },
  } as Variants),

  slideInRight: Object.freeze({
    initial:  { opacity: 0, x: 20 },
    animate:  { opacity: 1, x: 0  },
    exit:     { opacity: 0, x: 20 },
  } as Variants),

  // Stagger container — use with staggerChildren
  staggerContainer: Object.freeze({
    initial:  {},
    animate:  { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
  } as Variants),

  staggerItem: Object.freeze({
    initial:  { opacity: 0, y: 10 },
    animate:  { opacity: 1, y: 0  },
  } as Variants),

  // Metric value flip
  numberFlip: Object.freeze({
    initial:  { opacity: 0, y: 8 },
    animate:  { opacity: 1, y: 0 },
    exit:     { opacity: 0, y: -8 },
  } as Variants),
} as const);

// ─── Hover / Tap Gesture Configs ──────────────────────────────────────────────

export const HOVER = Object.freeze({
  lift: Object.freeze({ scale: 1.02, y: -2 }),
  glow: Object.freeze({ scale: 1.01 }),
  subtle: Object.freeze({ scale: 1.005 }),
} as const);

export const TAP = Object.freeze({
  press: Object.freeze({ scale: 0.97 }),
  subtle: Object.freeze({ scale: 0.99 }),
} as const);

// ─── Stagger Helpers ──────────────────────────────────────────────────────────

export function staggerContainer(stagger = 0.07, delay = 0): Variants {
  return {
    initial: {},
    animate: {
      transition: { staggerChildren: stagger, delayChildren: delay },
    },
  };
}

export function staggerItem(yOffset = 10): Variants {
  return {
    initial: { opacity: 0, y: yOffset },
    animate: { opacity: 1, y: 0       },
  };
}

// ─── Page Transition Config (used in PageTransition.tsx) ──────────────────────

export const PAGE_TRANSITION = Object.freeze({
  variants: VARIANTS.pageSlideUp,
  transition: TRANSITION.normal,
  initial: 'initial',
  animate: 'animate',
  exit:    'exit',
} as const);
