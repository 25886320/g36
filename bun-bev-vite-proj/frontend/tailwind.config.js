/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primaryLight: "#eaf9ff",
        primaryDark: "#2a4052",
        dark: "#000500",
        light: "#ededed",
        accentBlue: "#637c99",
        darkBlue: "#637c996c",
      },
    },
  },
  plugins: [],
}

