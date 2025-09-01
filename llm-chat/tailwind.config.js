/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
    screens: {
      xs: '480px', // Screen type: Mobile devices
      sm: '640px', // Screen type: Tablets
      md: '768px', // Screen type: Small laptops
      lg: '1024px', // Screen type: Desktops
      xl: '1280px', // Screen type: Large desktops
      '2xl': '1536px', // Screen type: Extra large desktops
    },
  },
  plugins: [],
}
