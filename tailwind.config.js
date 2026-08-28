/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        "serif-display": ["Copernicus", "Tiempos Headline", "Newsreader", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
}
