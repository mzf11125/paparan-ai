import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Legacy Paparan Colors (for backward compatibility)
        paparan: {
          deep: '#1A3C34',
          sage: '#2D5A4F',
          amber: '#D4A574',
          cream: '#F5F1E8',
          ink: '#1A1A1A',
          slate: '#6B7280',
        },

        // Design System Colors from CSS variables
        background: 'var(--color-bg)',
        'bg-elevated': 'var(--color-bg-elevated)',
        'bg-surface': 'var(--color-bg-surface)',
        text: 'var(--color-text)',
        'text-secondary': 'var(--color-text-secondary)',
        'text-tertiary': 'var(--color-text-tertiary)',
        'text-inverse': 'var(--color-text-inverse)',
        accent: 'var(--color-accent)',
        'accent-light': 'var(--color-accent-light)',
        'accent-lighter': 'var(--color-accent-lighter)',
        'accent-dark': 'var(--color-accent-dark)',
        border: 'var(--color-border)',
        'border-strong': 'var(--color-border-strong)',

        // Semantic Colors
        blue: {
          DEFAULT: 'var(--color-blue)',
          light: 'var(--color-blue-light)',
          lighter: 'var(--color-blue-lighter)',
        },
        amber: {
          DEFAULT: 'var(--color-amber)',
          light: 'var(--color-amber-light)',
          lighter: 'var(--color-amber-lighter)',
        },
        red: {
          DEFAULT: 'var(--color-red)',
          light: 'var(--color-red-light)',
          lighter: 'var(--color-red-lighter)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
          light: 'var(--color-green-light)',
          lighter: 'var(--color-green-lighter)',
        },
      },

      fontFamily: {
        // Design System Font Families
        display: ['Libre Baskerville', 'Georgia', 'serif'],
        serif: ['Source Serif 4', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],

        // Legacy font names (mapped to design system)
        'font-ui': ['DM Sans', 'system-ui', 'sans-serif'],
        'font-body': ['Source Serif 4', 'Georgia', 'serif'],
      },

      fontSize: {
        // Enhanced Typography Scale with Dramatic Options
        'display-2xl': ['8rem', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '700' }],
        'display-xl': ['6rem', { lineHeight: '0.95', letterSpacing: '-0.03em', fontWeight: '700' }],
        'display-lg': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '700' }],
        'display-md': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xs': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],

        'heading-xl': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
        'heading-lg': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
        'heading-md': ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '600' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],

        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'body-xs': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],

        'caption': ['0.625rem', { lineHeight: '1.3', letterSpacing: '0.05em', fontWeight: '500' }],

        // Legacy font size mappings
        'display-xl': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['2rem', { lineHeight: '1.3', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },

      borderRadius: {
        // Design System Border Radius
        'radius-sm': 'var(--radius-sm)',
        'radius-md': 'var(--radius-md)',
        'radius-lg': 'var(--radius-lg)',
        'radius-xl': 'var(--radius-xl)',
        'radius-2xl': 'var(--radius-2xl)',
        'radius-full': 'var(--radius-full)',

        // Legacy border radius values (mapped)
        card: 'var(--radius-xl)',
        button: 'var(--radius-full)',
      },

      boxShadow: {
        // Enhanced Shadow System with Layered Effects
        'shadow-xs': '0 1px 2px rgba(45, 45, 45, 0.04)',
        'shadow-sm': 'var(--shadow-sm)',
        'shadow-md': 'var(--shadow-md)',
        'shadow-lg': 'var(--shadow-lg)',
        'shadow-xl': 'var(--shadow-xl)',
        'shadow-2xl': '0 24px 64px rgba(45, 45, 45, 0.14)',

        // Layered shadows for depth
        'shadow-layered-sm': '0 1px 3px rgba(45, 45, 45, 0.06), 0 4px 12px rgba(45, 45, 45, 0.04)',
        'shadow-layered-md': '0 2px 6px rgba(45, 45, 45, 0.08), 0 8px 24px rgba(45, 45, 45, 0.06)',
        'shadow-layered-lg': '0 4px 12px rgba(45, 45, 45, 0.10), 0 16px 32px rgba(45, 45, 45, 0.08)',
        'shadow-layered-xl': '0 8px 24px rgba(45, 45, 45, 0.12), 0 32px 64px rgba(45, 45, 45, 0.10)',

        // Glow effects
        'glow-sm': '0 0 8px rgba(200, 169, 106, 0.2)',
        'glow-md': '0 0 16px rgba(200, 169, 106, 0.3)',
        'glow-lg': '0 0 24px rgba(200, 169, 106, 0.4)',
        'glow-xl': '0 0 32px rgba(200, 169, 106, 0.5)',

        // Inner shadows
        'shadow-inner-sm': 'inset 0 1px 2px rgba(45, 45, 45, 0.04)',
        'shadow-inner-md': 'inset 0 2px 4px rgba(45, 45, 45, 0.06)',

        // Legacy shadow names (mapped)
        subtle: 'var(--shadow-sm)',
      },

      backdropBlur: {
        'glass-sm': '4px',
        'glass-md': '8px',
        'glass-lg': '12px',
        'glass-xl': '16px',
      },

      transitionDuration: {
        'instant': '100ms',
        'transition-fast': '150ms',
        'transition-base': '200ms',
        'transition-slow': '300ms',
        'transition-slower': '400ms',
        'transition-slowest': '500ms',
      },

      transitionTimingFunction: {
        // Spring physics approximations
        'spring-gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
        'spring-default': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-bouncy': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-snappy': 'cubic-bezier(0.12, 0.95, 0.28, 1)',

        // Refined easing
        'ease-out-refined': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease-in-refined': 'cubic-bezier(0.4, 0, 1, 1)',
        'ease-in-out-refined': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      animation: {
        // Entry animations
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out',
        'fade-in-down': 'fadeInDown 0.4s ease-out',
        'fade-in-left': 'fadeInLeft 0.4s ease-out',
        'fade-in-right': 'fadeInRight 0.4s ease-out',
        'fade-out': 'fadeOut 0.2s ease-in',

        // Scale animations
        'scale-in': 'scaleIn 0.3s ease-out',
        'scale-out': 'scaleOut 0.2s ease-in',

        // Slide animations
        'slide-in': 'slideIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',

        // Complex animations
        'reveal': 'reveal 0.5s ease-out',
        'text-reveal': 'textReveal 0.6s ease-out',
        'border-reveal': 'borderReveal 0.4s ease-out',

        // Loading states
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Attention
        'bounce': 'bounce 1s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'spin': 'spin 1s linear infinite',
        'spin-slow': 'spin 3s linear infinite',

        // Decorative
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'progress': 'progress 1s ease-out forwards',
        'blink': 'blink 1s step-end infinite',

        // Micro-interactions
        'press': 'press 0.15s ease-out',
        'hover-lift': 'hoverLift 0.2s ease-out',
      },

      keyframes: {
        // Fade animations
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        fadeInRight: {
          '0%': { opacity: '0', transform: 'translateX(20px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },

        // Scale animations
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        scaleOut: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.95)' },
        },

        // Slide animations
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },

        // Complex animations
        reveal: {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(0.98)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)', filter: 'blur(0)' },
        },
        textReveal: {
          '0%': { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        borderReveal: {
          '0%': { clipPath: 'inset(0 100% 0 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },

        // Loading states
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },

        // Attention
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)', animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)' },
          '50%': { transform: 'translateY(-10px)', animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)' },
        },
        spin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },

        // Decorative
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(200, 169, 106, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(200, 169, 106, 0.6)' },
        },
        progress: {
          '0%': { width: '0%' },
        },
        blink: {
          '0%, 50%': { opacity: '1' },
          '51%, 100%': { opacity: '0' },
        },

        // Micro-interactions
        press: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(0.98)' },
          '100%': { transform: 'scale(1)' },
        },
        hoverLift: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-2px)' },
        },
      },

      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
        '3xl': 'var(--space-3xl)',
        '4xl': 'var(--space-4xl)',
        '5xl': 'var(--space-5xl)',
      },

      backgroundImage: {
        // Gradient utilities
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-gold': 'linear-gradient(135deg, #C8A96A 0%, #D4B87A 50%, #C8A96A 100%)',
        'gradient-gold-subtle': 'linear-gradient(135deg, rgba(200, 169, 106, 0.1) 0%, rgba(212, 184, 122, 0.05) 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FAFAF8 0%, #F5F3F0 100%)',
        'gradient-mesh': 'radial-gradient(at 40% 20%, rgba(200, 169, 106, 0.1) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(45, 122, 77, 0.05) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(46, 92, 138, 0.05) 0px, transparent 50%)',

        // Texture utilities
        'texture-noise': 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22 opacity=%220.04%22/%3E%3C/svg%3E")',
        'texture-grain': 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22grain%22%3E%3CfeTurbulence type=%22turbulence%22 baseFrequency=%220.8%22 numOctaves=%224%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23grain)%22 opacity=%220.08%22/%3E%3C/svg%3E")',
        'texture-paper': 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22paper%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.04%22 numOctaves=%225%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23paper)%22 opacity=%220.03%22/%3E%3C/svg%3E")',
      },

      backgroundSize: {
        'texture': '200px 200px',
      },
    },
  },
  plugins: [],
}
export default config
