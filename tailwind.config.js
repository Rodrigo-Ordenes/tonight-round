/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        night: {
          950: "#090d16",
          900: "#0d1322",
          850: "#121a2e",
          800: "#18233c",
          700: "#243253",
          600: "#364871",
        },
        carrete: {
          primary: "#6366f1", // Indigo electric
          secondary: "#ec4899", // Neon pink
          accent: "#10b981", // Emerald fresh
          amber: "#f59e0b", // Pisco dorado
          danger: "#ef4444", // Red alert
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 25px -5px rgba(99, 102, 241, 0.35)",
        "glow-accent": "0 0 25px -5px rgba(16, 185, 129, 0.35)",
        "glow-amber": "0 0 25px -5px rgba(245, 158, 11, 0.35)",
      },
    },
  },
  plugins: [],
};
