/** @type {import('tailwindcss').Config} */

/*
 * Tonight V10 — Sistema de color "Neón de Medianoche".
 * Las escalas nativas de Tailwind se redefinen para que todo el código existente adopte la paleta nueva:
 *   slate   → neutros tinta (levemente cálidos, legibles en OLED)
 *   night   → superficies (fondo #07060A, sin el azul marino genérico)
 *   indigo  → EMBER, el acento de marca (coral neón)
 *   emerald → LIME, "en vivo / ok / aprobado"
 *   purple  → IRIS, secundario (juegos, bar)
 *   amber   → GOLD, pisco / advertencias suaves
 *   cyan    → AQUA, agua e hidratación
 *   rose/red→ ALERTA (rojo puro, distinto del coral de marca)
 */
const ink = {
  50: "#F7F5F3",
  100: "#EDEAE6",
  200: "#D9D5D0",
  300: "#BAB4C2",
  400: "#A69FB3",
  // ≥ 4,5:1 sobre todas las superficies (antes #6E6780 daba 3,6:1)
  500: "#8E879D",
  600: "#5A5468",
  700: "#383344",
  800: "#24202D",
  900: "#16131C",
  950: "#0B0A0F",
};

const ember = {
  50: "#FFF3EE",
  100: "#FFE3D8",
  200: "#FFC4AE",
  300: "#FF9E80",
  400: "#FF7D59",
  500: "#FF5E36",
  // texto blanco ≥ 5:1 (antes #F0461D daba 3,8:1)
  600: "#CC3711",
  700: "#A82D0E",
  800: "#9C2C14",
  // 900/950 casi neutros: se usan como fondos de paneles teñidos
  900: "#3A1D15",
  950: "#1C1311",
};

const lime = {
  50: "#F3FFE9",
  100: "#E1FFCC",
  200: "#C5FBA1",
  300: "#A4F273",
  400: "#86E64C",
  500: "#66CF2C",
  600: "#4CA71E",
  700: "#3A801A",
  800: "#30651A",
  900: "#295419",
  950: "#112E07",
};

const iris = {
  50: "#F4F1FF",
  100: "#EAE5FF",
  200: "#D6CDFF",
  300: "#B9A8FF",
  400: "#9C82FF",
  500: "#835BFF",
  600: "#7140F5",
  700: "#5F2FD9",
  800: "#4E28B0",
  900: "#41258E",
  950: "#271361",
};

const gold = {
  50: "#FFFAEB",
  100: "#FFF1C6",
  200: "#FFE288",
  300: "#FFCF4A",
  400: "#FFBC20",
  500: "#F99B07",
  600: "#DD7302",
  700: "#B75006",
  800: "#943D0C",
  900: "#7A330D",
  950: "#461902",
};

const alert = {
  50: "#FFF1F2",
  100: "#FFE0E3",
  200: "#FFC6CC",
  300: "#FF9BA6",
  400: "#FF6175",
  500: "#FA2D4A",
  600: "#E70D35",
  700: "#C3062C",
  800: "#A3092C",
  900: "#8B0C2C",
  950: "#4E0113",
};

module.exports = {
  darkMode: "class",
  // Los :hover solo aplican en dispositivos con puntero real (evita hovers pegados en el celular)
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: ink,
        gray: ink,
        indigo: ember,
        blue: ember,
        emerald: lime,
        green: lime,
        purple: iris,
        violet: iris,
        fuchsia: iris,
        amber: gold,
        yellow: gold,
        rose: alert,
        red: alert,
        pink: {
          ...alert,
          300: "#FF9EC4",
          400: "#FF6FA8",
          500: "#FF3D8B",
          600: "#E81E70",
        },
        night: {
          950: "#07060A",
          900: "#0E0C13",
          850: "#14111A",
          800: "#1B1723",
          700: "#272231",
          600: "#363043",
        },
        carrete: {
          primary: ember[500],
          secondary: iris[400],
          accent: lime[400],
          amber: gold[400],
          danger: alert[500],
          water: "#3EE0FF",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        // Escala 10-foot UI para Smart TV (legible a 3 m)
        "tv-sm": ["clamp(1.25rem, 1.6vw, 2rem)", { lineHeight: "1.25" }],
        "tv-md": ["clamp(1.75rem, 2.4vw, 3rem)", { lineHeight: "1.15" }],
        "tv-lg": ["clamp(2.5rem, 4vw, 5rem)", { lineHeight: "1.05" }],
        "tv-hero": ["clamp(3.5rem, 7vw, 9rem)", { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-xl": ["clamp(2.75rem, 8vw, 6rem)", { lineHeight: "0.94", letterSpacing: "-0.035em" }],
        "display-lg": ["clamp(2rem, 5vw, 3.75rem)", { lineHeight: "0.98", letterSpacing: "-0.03em" }],
      },
      // Elevación neutra: sin halos de color (huella de UI genérica)
      boxShadow: {
        glow: "0 10px 28px -14px rgba(0, 0, 0, 0.75)",
        "glow-accent": "0 10px 28px -14px rgba(0, 0, 0, 0.75)",
        "glow-amber": "0 10px 28px -14px rgba(0, 0, 0, 0.75)",
        "glow-purple": "0 10px 28px -14px rgba(0, 0, 0, 0.75)",
        "glow-water": "0 10px 28px -14px rgba(0, 0, 0, 0.75)",
        lift: "0 18px 40px -24px rgba(0, 0, 0, 0.85)",
      },
      // Tarjetas a 16 px como máximo; las píldoras siguen siendo "full"
      borderRadius: {
        "3xl": "1rem",
        "4xl": "1.25rem",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.23, 1, 0.32, 1)",
        "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
        drawer: "cubic-bezier(0.32, 0.72, 0, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "none" } },
        "rise-in": { from: { opacity: "0", transform: "translateY(18px) scale(0.98)" }, to: { opacity: "1", transform: "none" } },
        "liquid-wave": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "canister-bubble": {
          "0%": { transform: "translateY(0) scale(0.6)", opacity: "0" },
          "15%": { opacity: "0.9" },
          "100%": { transform: "translateY(-120px) scale(1.1)", opacity: "0" },
        },
        "bomb-pulse": {
          "0%, 100%": { transform: "scale(1)", filter: "drop-shadow(0 0 0 rgba(250,45,74,0))" },
          "50%": { transform: "scale(1.06)", filter: "drop-shadow(0 0 24px rgba(250,45,74,0.8))" },
        },
        "neon-breathe": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" },
        },
        "aurora-drift": {
          "0%": { transform: "translate3d(-10%, -6%, 0) rotate(0deg) scale(1)" },
          "50%": { transform: "translate3d(8%, 6%, 0) rotate(160deg) scale(1.15)" },
          "100%": { transform: "translate3d(-10%, -6%, 0) rotate(360deg) scale(1)" },
        },
        "marquee": { from: { transform: "translateX(0)" }, to: { transform: "translateX(-50%)" } },
        "eq-bar": {
          "0%, 100%": { transform: "scaleY(0.3)" },
          "50%": { transform: "scaleY(1)" },
        },
        "shield-pulse": {
          "0%": { boxShadow: "0 0 0 0 rgba(62,224,255,0.6)" },
          "100%": { boxShadow: "0 0 0 16px rgba(62,224,255,0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s cubic-bezier(.2,.8,.2,1) both",
        "rise-in": "rise-in 0.5s cubic-bezier(.2,.8,.2,1) both",
        "liquid-wave": "liquid-wave 3.2s linear infinite",
        "canister-bubble": "canister-bubble 2.4s ease-in infinite",
        "bomb-pulse": "bomb-pulse 0.9s ease-in-out infinite",
        "neon-breathe": "neon-breathe 2.8s ease-in-out infinite",
        "aurora-drift": "aurora-drift 28s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        "eq-bar": "eq-bar 0.9s ease-in-out infinite",
        "shield-pulse": "shield-pulse 1.2s ease-out 2",
      },
    },
  },
  plugins: [],
};
