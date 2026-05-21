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
        ink: { 1: '#111111', 2: '#555555', 3: '#999999' },
        cream: { light: '#F5F5F5', DEFAULT: '#E5E5E5', dark: '#CCCCCC' },
        gold: { light: '#FEF9E7', DEFAULT: '#B8960C', dark: '#8B6E09' },
        pos: { light: '#EEFAF0', DEFAULT: '#2D7A3A' },
        neg: { light: '#FEF0EF', DEFAULT: '#C0392B' },
        page: '#FAFAFA',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
