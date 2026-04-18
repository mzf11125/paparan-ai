import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        paparan: {
          deep: '#1A3C34',
          sage: '#2D5A4F',
          amber: '#D4A574',
          cream: '#F5F1E8',
          ink: '#1A1A1A',
          slate: '#6B7280',
        }
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '9999px',
      },
    },
  },
  plugins: [],
}
export default config
