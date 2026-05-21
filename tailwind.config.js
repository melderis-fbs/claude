/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ink: { 1: '#111111', 2: '#555555', 3: '#9CA3AF' },
        cream: { light: '#F9FAFB', DEFAULT: '#E5E7EB', dark: '#D1D5DB' },
        gold: { light: '#F0F9FF', DEFAULT: '#0284C7', dark: '#0369A1' },
        pos: { light: '#F0FDF4', DEFAULT: '#16A34A' },
        neg: { light: '#FEF2F2', DEFAULT: '#DC2626' },
        page: '#F5F2EE',
      },
      fontFamily: {
        sans: ['var(--font-inter)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
