/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy:  { DEFAULT: '#0A1628', light: '#132240', dark: '#060e1a' },
        cream: { DEFAULT: '#F5F0E8', dark: '#ede6d6' },
        beige: { DEFAULT: '#C9B99A', light: '#ddd0bb', dark: '#a89070' },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:  ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'hero': "url('/images/hero-banner.jpg')",
      },
    },
  },
  plugins: [],
};
