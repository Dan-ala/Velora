/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          black: '#0B0B0B',
          ivory: '#F7F3EB',
          gold: '#C8A96A',
          charcoal: '#222222',
          stone: '#8A857D',
          olive: '#34372F',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
};
