/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#C9E2FF',
          200: '#90C2FF',
          300: '#64A8FF',
          400: '#4593FC',
          500: '#3182F6',
          600: '#2272EB',
          700: '#1B64DA',
          800: '#1957C2',
          900: '#194AA6',
        },
      },
      fontFamily: {
        sans: [
          'Pretendard Variable',
          'Pretendard',
          '-apple-system',
          'BlinkMacSystemFont',
          'system-ui',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
