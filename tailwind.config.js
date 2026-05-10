/** @type {import('tailwindcss').Config} */
const channel = (name) => `rgb(var(--color-${name}-rgb) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Backgrounds ──
        background: channel('bg'),
        bg: {
          DEFAULT:  channel('bg'),
          elevated: channel('bg-elevated'),
          surface:  channel('bg-surface'),
          overlay:  channel('bg-overlay'),
          subtle:   channel('bg-subtle'),
          paper:    channel('bg-paper'),
        },
        // ── Text ──
        text: {
          DEFAULT:   channel('text'),
          secondary: channel('text-secondary'),
          tertiary:  channel('text-tertiary'),
          muted:     channel('text-muted'),
          inverse:   channel('text-inverse'),
        },
        // ── Primary (institutional blue) ──
        primary: {
          DEFAULT: channel('primary'),
          hover:   channel('primary-hover'),
          dim:     channel('primary-dim'),
          // Backwards-compat sub-tokens that were used as bg-primary-light etc.
          light:   'rgb(var(--color-primary-rgb) / 0.10)',
          subtle:  'rgb(var(--color-primary-rgb) / 0.05)',
          glow:    'rgb(var(--color-primary-rgb) / 0.20)',
        },
        // ── Accent (editorial teal) ──
        accent: {
          DEFAULT: channel('accent'),
          hover:   channel('accent-hover'),
          light:   'rgb(var(--color-accent-rgb) / 0.10)',
          subtle:  'rgb(var(--color-accent-rgb) / 0.05)',
        },
        // ── Gold ──
        gold: {
          DEFAULT: channel('gold'),
          hover:   channel('gold-hover'),
          light:   'rgb(var(--color-gold-rgb) / 0.10)',
          subtle:  'rgb(var(--color-gold-rgb) / 0.05)',
        },
        // ── Semantic ──
        success: {
          DEFAULT: channel('success'),
          bright:  channel('success-bright'),
        },
        warning: channel('warning'),
        error:   channel('error'),
        info:    channel('info'),
        // ── Borders (alpha is baked in via CSS var, but provide a flat value here too) ──
        border: {
          DEFAULT: 'var(--color-border)',
          strong:  'var(--color-border-strong)',
          subtle:  'var(--color-border-subtle)',
          teal:    'var(--color-border-teal)',
          gold:    'var(--color-border-gold)',
        },
        // ── Classification ──
        classified: {
          unclassified: channel('unclassified'),
          official:     channel('official'),
          confidential: channel('confidential'),
          secret:       channel('secret'),
        },
        // ── Delta ──
        delta: {
          new:                 channel('delta-new'),
          updated:             channel('delta-updated'),
          escalated:           channel('delta-escalated'),
          deescalated:         channel('delta-deescalated'),
          'new-light':         'rgb(var(--color-delta-new-rgb) / 0.10)',
          'updated-light':     'rgb(var(--color-delta-updated-rgb) / 0.10)',
          'escalated-light':   'rgb(var(--color-delta-escalated-rgb) / 0.10)',
          'deescalated-light': 'rgb(var(--color-delta-deescalated-rgb) / 0.10)',
        },
        // ── Impact ──
        impact: {
          high:           channel('impact-high'),
          medium:         channel('impact-medium'),
          low:            channel('impact-low'),
          'high-light':   'rgb(var(--color-impact-high-rgb) / 0.10)',
          'medium-light': 'rgb(var(--color-impact-medium-rgb) / 0.10)',
          'low-light':    'rgb(var(--color-impact-low-rgb) / 0.10)',
        },
        // ── Confidence ──
        confidence: {
          high:           channel('confidence-high'),
          medium:         channel('confidence-medium'),
          low:            channel('confidence-low'),
          'high-light':   'rgb(var(--color-confidence-high-rgb) / 0.10)',
          'medium-light': 'rgb(var(--color-confidence-medium-rgb) / 0.10)',
          'low-light':    'rgb(var(--color-confidence-low-rgb) / 0.10)',
        },
      },
      fontFamily: {
        // Newsreader (editorial display) + IBM Plex (institutional UI/body/mono)
        display: ['Newsreader', 'Source Serif 4', 'Georgia', 'serif'],
        serif:   ['Newsreader', 'Source Serif 4', 'Georgia', 'serif'],
        body:    ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        ui:      ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        sans:    ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        mono:    ['IBM Plex Mono', 'JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'xs':   ['0.75rem',  { lineHeight: '1.5' }],
        'sm':   ['0.875rem', { lineHeight: '1.5' }],
        'base': ['1rem',     { lineHeight: '1.6' }],
        'lg':   ['1.125rem', { lineHeight: '1.6' }],
        'xl':   ['1.25rem',  { lineHeight: '1.4' }],
        '2xl':  ['1.5rem',   { lineHeight: '1.3' }],
        '3xl':  ['1.875rem', { lineHeight: '1.2' }],
        '4xl':  ['2.25rem',  { lineHeight: '1.15' }],
        '5xl':  ['3rem',     { lineHeight: '1.1' }],

        // Editorial display sizes (Newsreader, semibold/bold)
        'display-xs': ['1.5rem',   { lineHeight: '1.18', letterSpacing: '-0.012em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.15', letterSpacing: '-0.014em', fontWeight: '600' }],
        'display-md': ['2.25rem',  { lineHeight: '1.12', letterSpacing: '-0.016em', fontWeight: '600' }],
        'display-lg': ['3rem',     { lineHeight: '1.08', letterSpacing: '-0.018em', fontWeight: '600' }],
        'display-xl': ['3.75rem',  { lineHeight: '1.04', letterSpacing: '-0.02em',  fontWeight: '600' }],
        'display-2xl':['4.75rem',  { lineHeight: '1',    letterSpacing: '-0.022em', fontWeight: '600' }],

        // Headings (Plex Sans, semibold)
        'heading-sm': ['1rem',     { lineHeight: '1.4', letterSpacing: '-0.005em', fontWeight: '600' }],
        'heading-md': ['1.125rem', { lineHeight: '1.4', letterSpacing: '-0.008em', fontWeight: '600' }],
        'heading-lg': ['1.375rem', { lineHeight: '1.3', letterSpacing: '-0.01em',  fontWeight: '600' }],
        'heading-xl': ['1.75rem',  { lineHeight: '1.25',letterSpacing: '-0.012em', fontWeight: '600' }],

        // Body roles
        'body-xs': ['0.75rem',  { lineHeight: '1.4', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.55', fontWeight: '400' }],
        'body-md': ['1rem',     { lineHeight: '1.6', fontWeight: '400' }],
        'body-lg': ['1.125rem', { lineHeight: '1.65',fontWeight: '400' }],

        // Eyebrow caption
        'caption': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.16em', fontWeight: '600' }],
      },
      borderRadius: {
        sm:   'var(--radius-sm)',
        md:   'var(--radius-md)',
        lg:   'var(--radius-lg)',
        xl:   'var(--radius-xl)',
        '2xl':'var(--radius-2xl)',
        full: 'var(--radius-full)',
        official: '3px',
      },
      boxShadow: {
        xs:   '0 1px 1px rgb(var(--color-text-rgb) / 0.03)',
        sm:   'var(--shadow-sm)',
        md:   'var(--shadow-md)',
        lg:   'var(--shadow-lg)',
        xl:   'var(--shadow-xl)',
        teal: 'var(--shadow-teal)',
        gold: 'var(--shadow-gold)',
        // Glow shadows for 4-tone decorative hover states
        'glow-primary': 'var(--shadow-glow-primary)',
        'glow-accent':  'var(--shadow-glow-accent)',
        'glow-gold':    'var(--shadow-glow-gold)',
        'glow-success': 'var(--shadow-glow-success)',
      },
      backdropBlur: {
        glass: '8px',
      },
      transitionTimingFunction: {
        spring:          'cubic-bezier(0.16, 1, 0.3, 1)',
        'spring-snappy': 'cubic-bezier(0.12, 0.95, 0.28, 1)',
        'spring-bounce': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'spring-gentle': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      transitionDuration: {
        instant: '80ms',
        fast:    '150ms',
        base:    '220ms',
        slow:    '320ms',
        slower:  '480ms',
      },
      animation: {
        'fade-in':       'fadeIn 220ms ease-out both',
        'fade-in-up':    'fadeInUp 320ms cubic-bezier(0.16,1,0.3,1) both',
        'scale-in':      'scaleIn 180ms cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slideInLeft 320ms cubic-bezier(0.16,1,0.3,1) both',
        'shimmer':       'shimmer 1.6s ease-in-out infinite',
        'pulse-slow':    'pulseSlow 3s ease-in-out infinite',
        'ticker':        'ticker 60s linear infinite',
        'spin':          'spin 1s linear infinite',
        'ripple':        'ripple 0.6s ease-out forwards',
        // New purposeful animations (all gated by reduced-motion in globals.css)
        'float':         'float 5s ease-in-out infinite',
        'glow-pulse':    'glowPulse 1.8s ease-in-out infinite',
        'count-up':      'countUp 500ms cubic-bezier(0.2,0.7,0.1,1) both',
        'ribbon-shine':  'ribbonShine 2.6s ease-in-out infinite',
        'tilt-bell':     'tiltBell 1.2s ease-in-out',
        'slide-up':      'slideUp 400ms cubic-bezier(0.2,0.7,0.1,1) both',
      },
      backgroundImage: {
        'gradient-paper': 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-bg-surface) 100%)',
        'gradient-ink':   'linear-gradient(180deg, var(--color-bg-elevated) 0%, var(--color-bg) 100%)',
        'gradient-radial':'radial-gradient(var(--tw-gradient-stops))',
      },
      maxWidth: {
        prose: '68ch',
        article: '72ch',
      },
      spacing: {
        'space-xs':  'var(--space-xs)',
        'space-sm':  'var(--space-sm)',
        'space-md':  'var(--space-md)',
        'space-lg':  'var(--space-lg)',
        'space-xl':  'var(--space-xl)',
        'space-2xl': 'var(--space-2xl)',
        'space-3xl': 'var(--space-3xl)',
        'space-4xl': 'var(--space-4xl)',
        'space-5xl': 'var(--space-5xl)',
      },
    },
  },
  plugins: [],
}
