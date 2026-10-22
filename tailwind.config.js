/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: { marca: { 50: '#eef6ff', 100: '#d9eaff', 600: '#1d5fb8', 700: '#164a92', 900: '#0f2f5e' } },
    },
  },
  plugins: [],
};
