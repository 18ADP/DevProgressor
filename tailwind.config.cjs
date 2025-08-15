const defaultTheme = require('tailwindcss/defaultTheme');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Add dark mode support
  darkMode: 'class',

  // Configure file paths to scan for Tailwind classes
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  // Extend the default theme
  theme: {
    extend: {
      fontFamily: {
        // Add the 'Inter' font
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
    },
  },

  // No plugins needed for now
  plugins: [],
}