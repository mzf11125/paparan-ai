/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Background colors — paper-like foundation
        background: '#FAFAF8',
        bg: {
          elevated: '#FFFFFF',
          surface: '#F5F3F0',
          subtle: '#F0EEE9',
        },
        // Text colors
        text: {
          DEFAULT: '#2D2D2D',
          secondary: '#5A5A5A',
          tertiary: '#8A8A8A',
        },
        // Primary action color — Navy Blue (for buttons, links, actions)
        primary: {
          DEFAULT: '#0369A1',
          dark: '#025380',
          light: '#E0F2FE',
          lighter: '#F0F9FF',
        },
        // Accent color — Gold (for emphasis, highlights only)
        accent: {
          DEFAULT: '#C8A96A',
          light: '#D4B87A',
          lighter: '#E5D4A8',
          dark: '#A88B4A',
          subtle: 'rgba(200, 169, 106, 0.1)',
        },
        // Classification colors — Security level indicators
        classified: {
          unclassified: '#2D7A4D',
          official: '#0369A1',
          confidential: '#B8860B',
          secret: '#A83232',
        },
        // Delta status colors
        delta: {
          new: '#2E5C8A',
          'new-light': '#E8F0F8',
          updated: '#B8860B',
          'updated-light': '#F8F0E0',
          escalated: '#A83232',
          'escalated-light': '#F8E8E8',
          deescalated: '#2D7A4D',
          'deescalated-light': '#E8F0EC',
        },
        // Semantic colors
        blue: '#2E5C8A',
        'blue-light': '#E8F0F8',
        'blue-lighter': '#F0F6FC',
        amber: '#B8860B',
        'amber-light': '#F8F0E0',
        'amber-lighter': '#FCF8F0',
        red: '#A83232',
        'red-light': '#F8E8E8',
        'red-lighter': '#FEF4F4',
        green: '#2D7A4D',
        'green-light': '#E8F0EC',
        'green-lighter': '#F0F8F2',
        // Document colors
        document: {
          frame: '#1A1A1A',
          bg: '#FFFEFA',
        },
        // Border colors
        border: {
          DEFAULT: '#E8E4DC',
          strong: '#D4D0C8',
          subtle: '#F2EFE8',
          accent: '#C8A96A',
        },
      },
      fontFamily: {
        display: ['"Libre Baskerville"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['"DM Sans"', 'system-ui', 'sans-serif'],
        tabular: ['"DM Mono"', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'document-xs': ['0.75rem', { lineHeight: '1.6' }],
        'document-sm': ['0.875rem', { lineHeight: '1.6' }],
        'document-base': ['1rem', { lineHeight: '1.7' }],
        'document-lg': ['1.125rem', { lineHeight: '1.7' }],
      },
      borderRadius: {
        'card': '12px',
        'button': '9999px',
        'official': '2px',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
