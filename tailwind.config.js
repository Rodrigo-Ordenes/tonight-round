/** @type {import('tailwindcss').Config} */

/*
 * Tonight V11 — paleta "Brasa" (ver docs/paleta-v11.md: estudio, fuentes y validación).
 * Generada en OKLCH y validada con WCAG 2.2 + APCA y simulación de daltonismo (Machado 2009).
 *   - Superficies de carbón cálido (tono 55, croma 0,01): de noche, menos luz azul que un negro azulado,
 *     y sin #000 para evitar el arrastre en pantallas OLED. La elevación se marca con luminosidad, no con sombras.
 *   - Las escalas nativas de Tailwind se redefinen, así el código existente adopta la paleta sin tocar clases:
 *     slate/gray → tinta · indigo/blue/orange → brasa · emerald/green/teal → menta · amber/yellow → ámbar
 *     rose/red/pink → frambuesa · purple/violet/fuchsia → iris · cyan/sky → agua
 */
const night = {
  600: "#463E39",
  700: "#362F2A",
  800: "#29231F",
  850: "#201A17",
  900: "#171310",
  950: "#0D0907",
};

// Tinta: blancos rotos cálidos (sin #FFF: menos halo con astigmatismo). 300–500 = texto secundario (APCA Lc ≥ 45–60)
const ink = {
  50: "#F1ECE8",
  100: "#E6E0DC",
  200: "#D6D0CB",
  300: "#C3BCB8",
  400: "#BCB4AF",
  500: "#A8A09B",
  600: "#726A65",
  700: "#4D4642",
  800: "#352F2B",
  900: "#211C19",
  950: "#130E0C",
};

// BRASA (marca y acción): coral cálido oklch(0.74 0.18 45). Regla: 500 lleva texto oscuro, 600+ texto blanco (≥ 4,5:1)
const ember = {
  50: "#FFF4F0",
  100: "#FFE9E0",
  200: "#FFD5C3",
  300: "#FFBC9E",
  400: "#FFA176",
  500: "#FF8346",
  600: "#B64A00",
  700: "#933A00",
  800: "#712B00",
  900: "#4C1F08",
  950: "#2D1205",
};

// MENTA (en vivo, listo, alcoholemia en calma): oklch(0.79 0.12 172), turquesa apagado y no verde chillón
const lime = {
  50: "#ECFAF5",
  100: "#D9F5EB",
  200: "#B3EDD9",
  300: "#85E1C4",
  400: "#59D2B1",
  500: "#31C29E",
  600: "#008469",
  700: "#006954",
  800: "#00503F",
  900: "#05362B",
  950: "#052019",
};

// ÁMBAR PISCO (avisos suaves, "bajar el ritmo"): oklch(0.86 0.13 85)
const gold = {
  50: "#FFFAEE",
  100: "#FFF4DE",
  200: "#FFEDC7",
  300: "#FFE2A6",
  400: "#FFD375",
  500: "#F8C655",
  600: "#8E6A00",
  700: "#725400",
  800: "#574000",
  900: "#3B2B03",
  950: "#231903",
};

// FRAMBUESA (solo conductor que tomó y acciones destructivas): oklch(0.68 0.21 10)
const alert = {
  50: "#FFEEF0",
  100: "#FFDDE1",
  200: "#FFC1C9",
  300: "#FF9FAE",
  400: "#FF7892",
  500: "#FD4576",
  600: "#CB1554",
  700: "#A31242",
  800: "#7B1433",
  900: "#4E1020",
  950: "#2F0A12",
};

// IRIS (juegos, secundario)
const iris = {
  50: "#F6F4FF",
  100: "#EEEAFF",
  200: "#E0D8FF",
  300: "#CFC1FF",
  400: "#BFAAFF",
  500: "#AF93FB",
  600: "#775BB9",
  700: "#5F4995",
  800: "#483870",
  900: "#30274A",
  950: "#1C162C",
};

// AGUA (hidratación): azul cielo apagado, siempre con ícono de gota
const aqua = {
  50: "#F5FAFF",
  100: "#EBF6FF",
  200: "#D3ECFF",
  300: "#B5DEFF",
  400: "#95D1FF",
  500: "#72C3FF",
  600: "#2377AC",
  700: "#1C5F8A",
  800: "#184868",
  900: "#143145",
  950: "#0B1C29",
};

module.exports = {
  darkMode: "class",
  // Los :hover solo aplican en dispositivos con puntero real (evita hovers pegados en el celular)
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Las clases de tono (bacTone) y de ambientes musicales viven en src/lib
    "./src/lib/**/*.{js,ts,jsx,tsx}",
    "./src/data/**/*.{js,ts}",
  ],
  theme: {
    extend: {
      colors: {
        slate: ink,
        gray: ink,
        indigo: ember,
        blue: ember,
        orange: ember,
        emerald: lime,
        green: lime,
        teal: lime,
        purple: iris,
        violet: iris,
        fuchsia: iris,
        amber: gold,
        yellow: gold,
        rose: alert,
        red: alert,
        pink: alert,
        cyan: aqua,
        sky: aqua,
        night,
        carrete: {
          primary: ember[500],
          secondary: iris[400],
          accent: lime[400],
          amber: gold[400],
          danger: alert[500],
          water: aqua[400],
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
        // Solo opacidad: un transform en el envoltorio de página reposiciona los overlays fijos mientras dura
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "rise-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
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
        // Entradas: ease-out fuerte, bajo 300 ms (se ven decenas de veces por noche)
        "fade-in": "fade-in 200ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "rise-in": "rise-in 280ms cubic-bezier(0.23, 1, 0.32, 1) both",
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
