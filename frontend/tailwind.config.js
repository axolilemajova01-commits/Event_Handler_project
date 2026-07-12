/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#15161a',
        muted: '#5d6470',
        tut: '#005daa',
        gold: '#f2b705',
        leaf: '#1d8a64',
        coral: '#d95f43'
      },
      boxShadow: {
        panel: '0 18px 45px rgba(21, 22, 26, 0.08)'
      }
    }
  },
  plugins: []
};
