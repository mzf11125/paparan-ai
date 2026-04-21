/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#f8f9fa',
        bg: { elevated: '#ffffff', surface: '#f1f3f5', subtle: '#e9ecef' },
        text: { DEFAULT: '#111827', secondary: '#4b5563', tertiary: '#9ca3af' },
        primary: { DEFAULT: '#1d4ed8', dark: '#1e40af', light: '#dbeafe', lighter: '#eff6ff' },
        accent: { DEFAULT: '#1d4ed8', light: '#2563eb', lighter: '#dbeafe', dark: '#1e40af', subtle: 'rgba(29,78,216,0.1)' },
        classified: { unclassified: '#16a34a', official: '#1d4ed8', confidential: '#d97706', secret: '#dc2626' },
        delta: {
          new: '#1d4ed8', 'new-light': '#dbeafe',
          updated: '#d97706', 'updated-light': '#fef3c7',
          escalated: '#dc2626', 'escalated-light': '#fee2e2',
          deescalated: '#16a34a', 'deescalated-light': '#dcfce7',
        },
        blue: '#1d4ed8', 'blue-light': '#dbeafe', 'blue-lighter': '#eff6ff',
        amber: '#d97706', 'amber-light': '#fef3c7', 'amber-lighter': '#fffbeb',
        red: '#dc2626', 'red-light': '#fee2e2', 'red-lighter': '#fef2f2',
        green: '#16a34a', 'green-light': '#dcfce7', 'green-lighter': '#f0fdf4',
        document: { frame: '#1A1A1A', bg: '#FFFEFA' },
        border: { DEFAULT: '#e5e7eb', strong: '#d1d5db', subtle: '#f3f4f6', accent: '#1d4ed8' },
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
      borderRadius: { card: '12px', button: '9999px', official: '2px' },
      borderWidth: { '3': '3px' },
    },
  },
  plugins: [],
}
