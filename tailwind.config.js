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
        ink: { 1: '#1C1917', 2: '#6B6560', 3: '#A8A29E' },
        cream: { light: '#FAF7F2', DEFAULT: '#E8E2D9', dark: '#C4B49A' },
        gold: { light: '#F7EFC8', DEFAULT: '#B8960C', dark: '#8B6E09' },
        pos: { light: '#EAF0E9', DEFAULT: '#4A5C47' },
        neg: { light: '#F5EDEC', DEFAULT: '#7A4A42' },
        page: '#F5F2EC',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};
