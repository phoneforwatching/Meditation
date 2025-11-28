/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,svelte,ts}'],
  theme: {
    extend: {
      colors: {
        sage: '#4A7C59',
        earth: '#C4A484',
        cream: '#F9F7F2',
        slate: '#2C3E50',
        peach: '#E6B89C'
      },
      fontFamily: {
        sans: ['"Sukhumvit Set"', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
