/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      colors: {
        dark: '#0f0f0f',
        light: '#f5f5f5',
        accent: '#2b0c7d',
      },
    },
  },
  plugins: [],
}
