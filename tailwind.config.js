/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FAFAF8',
        text: {
          DEFAULT: '#2D2D2D',
          secondary: '#5A5A5A',
          tertiary: '#8A8A8A',
        },
        accent: {
          DEFAULT: '#C8A96A',
          light: '#D4B87A',
          dark: '#A88B4A',
        },
        delta: {
          new: '#2E5C8A',
          'new-light': '#E8F0F8',
          updated: '#B8860B',
          'updated-light': '#F8F0E0',
          escalated: '#A83232',
          'escalated-light': '#F8E8E8',
          'deescalated': '#2D7A4D',
          'deescalated-light': '#E8F0EC',
        },
      },
      fontFamily: {
        display: ['"Libre Baskerville"', 'Georgia', 'serif'],
        body: ['"Source Serif 4"', 'Georgia', 'serif'],
        ui: ['"DM Sans"', 'system-ui', 'sans-serif'],
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
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
