/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea6a0a',
          700: '#c2540a',
          800: '#9a3412',
          900: '#7c2d12',
        },
        gray: {
          950: '#0c0c0e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderColor: {
        DEFAULT: '#f3f4f6',
      },
      boxShadow: {
        'brand': '0 4px 24px -4px rgba(249, 115, 22, 0.35)',
      },
      borderOpacity: {
        8: '0.08',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        },
        '.border-white\\/8': {
          'border-color': 'rgba(255,255,255,0.08)',
        },
        '.white\\/8': {
          'background-color': 'rgba(255,255,255,0.08)',
        },
      });
    },
  ],
}
