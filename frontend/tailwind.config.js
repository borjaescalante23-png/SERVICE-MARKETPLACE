/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#172554',
        },
        navy: {
          light: '#1e40af',
          DEFAULT: '#0F2557',
          dark: '#0a1830',
          50: '#f0f5ff',
          100: '#dce8ff',
          200: '#b9cffe',
          300: '#86abfb',
          400: '#5080f5',
          500: '#2d5ae0',
          600: '#1d40c0',
          700: '#14309b',
          800: '#0F2557',
          900: '#0a1830',
          950: '#060e1e',
        },
        electric: {
          300: '#7ab8ff',
          400: '#4397ff',
          500: '#1a78ff',
          600: '#0d63ec',
          700: '#0850d0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
