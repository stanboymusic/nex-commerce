/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Primary
        oxford: "#0B1D3A", // Olive-Navy Blue
        navy: "#0A2540",   // Deep Navy
        purple: "#5B2D8B", // Royal Purple

        // Accents / Neutrals
        almond: "#EDE1D1", // Almond Cream
        white: "#FFFFFF",
        muted: "#F5F7FA",  // Muted Gray (Background)
        border: "#E2E8F0", // Border Gray

        // Text
        "text-dark": "#0A2540",
        "text-medium": "#4A5568",
        "text-light": "#A0AEC0",

        // Indication
        success: "#38A169",
        warning: "#DD6B20",
        error: "#E53E3E",
        info: "#3182CE"
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
