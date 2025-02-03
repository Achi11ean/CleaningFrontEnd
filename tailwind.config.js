/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",               // Include root HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Include all JS/TS/React files in the src directory
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200%' },
          '100%': { backgroundPosition: '200%' },
        },
      },
      animation: {
        shimmer: 'shimmer 4s infinite linear',
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar'),
  ],
};
