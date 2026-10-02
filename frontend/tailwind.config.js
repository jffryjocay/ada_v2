/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          500: '#2736d1',
          600: '#1d2ab8',
          700: '#1a1747',
          800: '#131138',
          900: '#0e0c29',
        }
      }
    },
  },
  plugins: [],
}
