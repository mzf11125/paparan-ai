/**
 * Centralized Animation System for Paparan Brief
 *
 * This file contains all animation configurations, keyframes, and utilities
 * for consistent, refined motion throughout the application.
 */

// ============================================
// SPRING PHYSICS CONFIGURATIONS
// ============================================

export const springPresets = {
  gentle: {
    stiffness: 300,
    damping: 25,
    mass: 0.5,
  },
  default: {
    stiffness: 400,
    damping: 30,
    mass: 0.5,
  },
  bouncy: {
    stiffness: 500,
    damping: 20,
    mass: 0.5,
  },
  snappy: {
    stiffness: 600,
    damping: 35,
    mass: 0.5,
  },
}

// Convert spring to CSS bezier approximation
export const springToBezier = (preset: keyof typeof springPresets): string => {
  const bezierMap: Record<keyof typeof springPresets, string> = {
    gentle: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    default: 'cubic-bezier(0.16, 1, 0.3, 1)',
    bouncy: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    snappy: 'cubic-bezier(0.12, 0.95, 0.28, 1)',
  }
  return bezierMap[preset]
}

// ============================================
// DURATION PRESETS
// ============================================

export const duration = {
  instant: 100,
  fast: 150,
  base: 200,
  moderate: 300,
  slow: 400,
  slower: 500,
  glacial: 600,
}

// ============================================
// STAGGER DELAYS
// ============================================

export const staggerDelays = {
  dense: 50,
  default: 75,
  relaxed: 100,
  spacious: 150,
}

// Generate stagger delays for an array of items
export const getStaggerDelay = (index: number, stagger = staggerDelays.default): number => {
  return index * stagger
}

// ============================================
// ANIMATION DELAY UTILITIES
// ============================================

export const animationDelays = Array.from({ length: 20 }, (_, i) => ({
  value: i * 100,
  className: `animation-delay-${i}`,
}))

// ============================================
// CSS KEYFRAMES DEFINITIONS
// ============================================

export const keyframes = {
  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },
  fadeInUp: {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeInDown: {
    from: { opacity: 0, transform: 'translateY(-20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
  },
  fadeInLeft: {
    from: { opacity: 0, transform: 'translateX(-20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },
  fadeInRight: {
    from: { opacity: 0, transform: 'translateX(20px)' },
    to: { opacity: 1, transform: 'translateX(0)' },
  },

  // Scale animations
  scaleIn: {
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
  },
  scaleOut: {
    from: { opacity: 1, transform: 'scale(1)' },
    to: { opacity: 0, transform: 'scale(0.9)' },
  },
  scaleUp: {
    from: { transform: 'scale(1)' },
    to: { transform: 'scale(1.02)' },
  },

  // Slide animations
  slideInUp: {
    from: { transform: 'translateY(100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideInDown: {
    from: { transform: 'translateY(-100%)' },
    to: { transform: 'translateY(0)' },
  },
  slideInLeft: {
    from: { transform: 'translateX(-100%)' },
    to: { transform: 'translateX(0)' },
  },
  slideInRight: {
    from: { transform: 'translateX(100%)' },
    to: { transform: 'translateX(0)' },
  },

  // Complex animations
  reveal: {
    from: {
      opacity: 0,
      transform: 'translateY(10px) scale(0.98)',
      filter: 'blur(4px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0) scale(1)',
      filter: 'blur(0)',
    },
  },

  // Text reveal
  textReveal: {
    from: {
      opacity: 0,
      transform: 'translateY(100%)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  // Border reveal
  borderReveal: {
    from: { clipPath: 'inset(0 100% 0 0)' },
    to: { clipPath: 'inset(0 0 0 0)' },
  },

  // Shimmer / Skeleton loading
  shimmer: {
    from: { backgroundPosition: '-200% 0' },
    to: { backgroundPosition: '200% 0' },
  },

  // Pulse
  pulse: {
    from: { opacity: 1 },
    to: { opacity: 0.5 },
  },
  pulseSubtle: {
    from: { opacity: 1 },
    to: { opacity: 0.8 },
  },

  // Spin
  spin: {
    from: { transform: 'rotate(0deg)' },
    to: { transform: 'rotate(360deg)' },
  },

  // Bounce
  bounce: {
    '0%, 100%': {
      transform: 'translateY(0)',
      animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
    },
    '50%': {
      transform: 'translateY(-10px)',
      animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },

  // Glow
  glow: {
    from: { boxShadow: '0 0 5px rgba(200, 169, 106, 0.2)' },
    to: { boxShadow: '0 0 20px rgba(200, 169, 106, 0.6)' },
  },

  // Progress
  progress: {
    from: { width: '0%' },
  },

  // Float
  float: {
    '0%, 100%': { transform: 'translateY(0)' },
    '50%': { transform: 'translateY(-10px)' },
  },

  // Typing cursor
  blink: {
    from: { opacity: '1' },
    '50%': { opacity: '0' },
    to: { opacity: '1' },
  },
}

// ============================================
// ANIMATION PRESET CLASSES
// ============================================

export const animationPresets = {
  // Entry animations
  entry: {
    className: 'animate-fade-in-up',
    duration: duration.moderate,
    easing: springToBezier('default'),
  },
  entrySlow: {
    className: 'animate-fade-in-up',
    duration: duration.slow,
    easing: springToBezier('gentle'),
  },
  scaleEntry: {
    className: 'animate-scale-in',
    duration: duration.base,
    easing: springToBezier('bouncy'),
  },

  // Exit animations
  exit: {
    className: 'animate-fade-out',
    duration: duration.fast,
    easing: 'ease-in',
  },

  // Hover effects
  hoverLift: {
    className: 'hover:scale-[1.02] hover:-translate-y-0.5',
    duration: duration.fast,
  },
  hoverGlow: {
    className: 'hover:shadow-glow',
    duration: duration.base,
  },

  // Loading states
  loading: {
    className: 'animate-pulse-subtle',
    duration: 1500,
  },
  shimmer: {
    className: 'animate-shimmer',
    duration: 1500,
  },

  // Attention
  attention: {
    className: 'animate-bounce',
    duration: 1000,
  },
  pulse: {
    className: 'animate-pulse-subtle',
    duration: 2000,
  },
}

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitionPresets = {
  default: {
    duration: duration.base,
    easing: springToBezier('default'),
  },
  fast: {
    duration: duration.fast,
    easing: springToBezier('snappy'),
  },
  gentle: {
    duration: duration.moderate,
    easing: springToBezier('gentle'),
  },
  slow: {
    duration: duration.slow,
    easing: springToBezier('gentle'),
  },
}

// ============================================
// PAGE TRANSITION CONFIGURATIONS
// ============================================

export const pageTransition = {
  duration: duration.moderate,
  easing: springToBezier('default'),
  stagger: staggerDelays.default,
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Get animation styles for inline use
export const getAnimationStyles = (
  preset: keyof typeof animationPresets
): React.CSSProperties => {
  const config = animationPresets[preset]
  return {
    animationDuration: `${config.duration}ms`,
    animationTimingFunction: config.easing,
  }
}

// Get transition styles for inline use
export const getTransitionStyles = (
  properties: string[],
  preset: keyof typeof transitionPresets = 'default'
): React.CSSProperties => {
  const config = transitionPresets[preset]
  return {
    transitionProperty: properties.join(', '),
    transitionDuration: `${config.duration}ms`,
    transitionTimingFunction: config.easing,
  }
}

// Generate CSS custom properties for animations
export const getAnimationCSS = () => {
  return `
    :root {
      /* Spring Physics */
      --spring-gentle: ${springToBezier('gentle')};
      --spring-default: ${springToBezier('default')};
      --spring-bouncy: ${springToBezier('bouncy')};
      --spring-snappy: ${springToBezier('snappy')};

      /* Durations */
      --duration-instant: ${duration.instant}ms;
      --duration-fast: ${duration.fast}ms;
      --duration-base: ${duration.base}ms;
      --duration-moderate: ${duration.moderate}ms;
      --duration-slow: ${duration.slow}ms;
      --duration-slower: ${duration.slower}ms;

      /* Stagger Delays */
      --stagger-dense: ${staggerDelays.dense}ms;
      --stagger-default: ${staggerDelays.default}ms;
      --stagger-relaxed: ${staggerDelays.relaxed}ms;
      --stagger-spacious: ${staggerDelays.spacious}ms;
    }
  `
}
