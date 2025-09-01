/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2563eb',
          dark: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', 'Avenir', 'Helvetica', 'Arial'],
      },
    },
  },
  plugins: [],
}
