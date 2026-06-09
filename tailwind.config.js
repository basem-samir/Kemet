/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdfbf2',
          100: '#faf4df',
          200: '#f2e4b3',
          300: '#ead487',
          400: '#e2c45b',
          500: '#C9A84C', // core gold
          600: '#b08e3d',
          700: '#8e7030',
          800: '#6c5324',
          900: '#4d3919',
        },
        navy: {
          50: '#f2f4f7',
          100: '#e1e5ee',
          200: '#c0c8db',
          300: '#929fc1',
          400: '#6072a3',
          500: '#0D1B2A', // core deep navy
          600: '#0b1622',
          700: '#09101a',
          800: '#060a11',
          900: '#030509',
        },
        sand: {
          50: '#fcfbf8',
          100: '#f9f6ef',
          200: '#f5E6C8', // core sand
          300: '#edd8ac',
          400: '#e3c68a',
          500: '#d7b065',
          600: '#c59a4c',
          700: '#a37a37',
          800: '#805d28',
          900: '#5c401c',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'serif'],
      }
    },
  },
  plugins: [],
}
