/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: "#001F3F",
        oxford: "#3B3B98",
        purple: "#6F42C1",
        muted: "#F5F5F5",
        almond: "#F7E7CE"
      },
    },
  },
  plugins: [],
}
