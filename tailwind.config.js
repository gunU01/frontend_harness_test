/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DDE9FD',
          200: '#B6D1FB',
          300: '#81AFF8',
          400: '#5190F6',
          500: '#3182F6',
          600: '#1B64DA',
          700: '#0A4DB8',
          800: '#073A8D',
          900: '#05265C',
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
