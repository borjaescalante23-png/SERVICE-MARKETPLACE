/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#0F1F5C',
        accent: '#3B6FE8',
        'bg-card': '#F2F4F8',
        'text-secondary': '#6B7A99',
        'green-available': '#16A34A',
        'gold-rating': '#D97706',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
