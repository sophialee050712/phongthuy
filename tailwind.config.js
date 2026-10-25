/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#7B1E1E',
        primaryDark: '#5C050B',
        gold: '#C9A227',
        brass: '#E5C158',
        cream: '#FAF6EF',
        creamDark: '#F3ECE1',
        ink: '#2C1810',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        sans: ['"Be Vietnam Pro"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
