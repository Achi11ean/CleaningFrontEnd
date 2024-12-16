/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",               // Include root HTML file
    "./src/**/*.{js,ts,jsx,tsx}", // Include all JS/TS/React files in the src directory
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('tailwind-scrollbar'),

  ],
};
