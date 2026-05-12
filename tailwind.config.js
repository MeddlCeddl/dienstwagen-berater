/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1a1a2e',
        surface: '#16213e',
        'surface-2': '#0f3460',
        gold: '#c9a84c',
        'gold-light': '#e8c97e',
        'gold-dim': '#8a6f30',
      },
      fontFamily: {
        playfair: ['"Playfair Display"', 'serif'],
        lato: ['Lato', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.45s ease forwards',
        fadeIn: 'fadeIn 0.35s ease forwards',
        blink: 'blink 1s step-end infinite',
      },
    },
  },
  plugins: [],
}
