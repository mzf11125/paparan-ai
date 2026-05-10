import { FadeIn, SlideIn, ScaleIn } from './variants'

/* ============================================
   ANIMATION SYSTEM — PROFESSIONAL MOTION
   Government-grade refined transitions
   ============================================ */

// Entry Animations
export const fadeIn = FadeIn
export const slideIn = SlideIn
export const scaleIn = ScaleIn

// Reveal Animations
export const reveal = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}

// Stagger Container
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0,
    },
  },
}

// Stagger Item
export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}

// List Item Animation
export const listItem = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
}

// Card Animation
export const card = {
  initial: { opacity: 0, y: 20, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
}

// Modal Animation
export const modal = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
}

// Drawer Animation (Side Panel)
export const drawer = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] },
}

// Tooltip Animation
export const tooltip = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
}

// Shimmer (Skeleton Loading)
export const shimmer = {
  initial: { backgroundPosition: '-200% 0' },
  animate: { backgroundPosition: '200% 0' },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: 'linear',
  },
}

// Pulse (Subtle)
export const pulseSubtle = {
  animate: {
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut',
  },
}

// Loading Spinner
export const spin = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 1,
    repeat: Infinity,
    ease: 'linear',
  },
}

// Progress Bar
export const progress = {
  initial: { width: '0%' },
  animate: (progress: number) => ({ width: `${progress}%` }),
  transition: {
    duration: 0.5,
    ease: [0.16, 1, 0.3, 1],
  },
}

// Typewriter Effect
export const typewriter = {
  initial: { width: '0' },
  animate: (text: string) => ({
    width: text,
  }),
  transition: {
    duration: 0.05,
  },
}

// Counter Animation
export const counter = {
  initial: { scale: 0.5, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  transition: {
    duration: 0.3,
    ease: [0.16, 1, 0.3, 1],
  },
}

// Hover Lift
export const hoverLift = {
  transition: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  },
  whileHover: {
    y: -2,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

// Hover Scale (Very Subtle)
export const hoverScale = {
  transition: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1],
  },
  whileHover: {
    scale: 1.01,
    transition: {
      duration: 0.15,
      ease: [0.16, 1, 0.3, 1],
    },
  },
}

// Page Transition
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
}

// Spring Variants
export const spring = {
  gentle: { type: 'spring', stiffness: 100, damping: 15 },
  default: { type: 'spring', stiffness: 150, damping: 20 },
  bouncy: { type: 'spring', stiffness: 200, damping: 10 },
  snappy: { type: 'spring', stiffness: 300, damping: 15 },
}

// Duration Variants
export const duration = {
  instant: 0.1,
  fast: 0.15,
  base: 0.2,
  slow: 0.35,
  slower: 0.5,
}
