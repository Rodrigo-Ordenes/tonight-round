/** @type {import('tailwindcss').Config} */

/*
 * Tonight V12 — paleta «Neón» (ver docs/paleta-v12.md: estudio, fuentes y validación).
 * Azul y morado neón de bar como colores dominantes sobre una penumbra violeta. Generada en OKLCH con
 * scripts/palette (neon.json), validada con WCAG 2.2 + APCA y simulación de daltonismo (Machado 2009).
 *   - El neón vive en piezas chicas (acción principal, líneas, letreros) y brilla solo donde importa; las superficies
 *     quedan casi negras (sin #000: arrastre OLED) y la elevación se marca con luminosidad.
 *   - Las escalas nativas de Tailwind se redefinen, así el código existente adopta la paleta sin tocar clases:
 *     slate/gray → tinta · indigo/blue → azul neón · purple/violet/fuchsia → morado neón (uv)
 *     emerald/green/teal/cyan/sky/lime → menta (en vivo, calma y agua) · amber/yellow/orange → ámbar · rose/red/pink → frambuesa
 */
// Penumbra: superficies casi negras con tinte violeta (950 fondo, 900 tarjeta, 800 elevada)
const night = {
  600: "#3E3F47",
  700: "#2F3037",
  800: "#23232A",
  850: "#1B1B21",
  900: "#131318",
  950: "#090A0D",
};
// Tinta: blancos rotos (sin #FFF: menos halo con astigmatismo). 300–500 = texto secundario
const ink = {
  50: "#ECECF1",
  100: "#E0E1E7",
  200: "#D0D0D7",
  300: "#BCBDC4",
  400: "#B4B5BD",
  500: "#A0A1A9",
  600: "#6A6B73",
  700: "#46474E",
  800: "#2F3036",
  900: "#1C1C22",
  950: "#0F0F13",
};
// AZUL NEÓN (marca y acción): oklch(0.73 0.19 255). Regla: 500 lleva texto oscuro, 600+ texto blanco (≥ 4,5:1)
const neon = {
  50: "#F0F7FF",
  100: "#E2EFFF",
  200: "#C9E0FF",
  300: "#A9CFFF",
  400: "#89BDFF",
  500: "#67AAFF",
  600: "#006ED5",
  700: "#0257AB",
  800: "#0A4380",
  900: "#0D2E55",
  950: "#081B33",
};
// MORADO NEÓN (juegos, destacados y alcoholemia alta, sin regaño): oklch(0.62 0.26 312). Botones: 600 con texto blanco
const uv = {
  50: "#F7EBFF",
  100: "#EFD6FF",
  200: "#E4B8FF",
  300: "#D793FF",
  400: "#CA68FF",
  500: "#B93EF3",
  600: "#981BCD",
  700: "#7712A2",
  800: "#5A147A",
  900: "#380F4C",
  950: "#220A2E",
};
// MENTA (en vivo, listo, calma y agua, siempre con su ícono): oklch(0.85 0.1 165)
const signal = {
  50: "#F3FDF8",
  100: "#E7FBF1",
  200: "#D0FAE6",
  300: "#B7F6D9",
  400: "#9EEECB",
  500: "#8CE3BE",
  600: "#2D8162",
  700: "#24674E",
  800: "#1E4E3B",
  900: "#173528",
  950: "#0D1F17",
};
// ÁMBAR (aviso, "bajar el ritmo"): oklch(0.75 0.14 86); bajo el tono 84 se vuelve naranjo
const amber = {
  50: "#FCF7EB",
  100: "#FAEED6",
  200: "#F6DFAC",
  300: "#EFCB7D",
  400: "#E4B853",
  500: "#D5A62E",
  600: "#8D6A00",
  700: "#715500",
  800: "#564000",
  900: "#3B2B03",
  950: "#231903",
};
// FRAMBUESA (solo conductor que tomó y acciones destructivas): oklch(0.67 0.21 14)
const flare = {
  50: "#FFEEEF",
  100: "#FFDDDF",
  200: "#FFC2C6",
  300: "#FFA0A8",
  400: "#FF798A",
  500: "#FA4C6D",
  600: "#C9214B",
  700: "#A21B3C",
  800: "#7A192E",
  900: "#4D121D",
  950: "#2F0B11",
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
        indigo: neon,
        blue: neon,
        purple: uv,
        violet: uv,
        fuchsia: uv,
        emerald: signal,
        green: signal,
        teal: signal,
        cyan: signal,
        sky: signal,
        lime: signal,
        amber,
        yellow: amber,
        orange: amber,
        rose: flare,
        red: flare,
        pink: flare,
        night,
        neon,
        uv,
        signal,
        flare,
        carrete: {
          primary: neon[500],
          secondary: uv[400],
          accent: signal[400],
          amber: amber[400],
          danger: flare[500],
          water: signal[400],
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        display: ["var(--font-display)", "var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        // Matriz de puntos para el código de sala y las cifras grandes de la TV
        led: ["var(--font-led)", "var(--font-mono)", "ui-monospace", "monospace"],
      },
      fontSize: {
        // Escala 10-foot UI para Smart TV (legible a 3 m)
        "tv-sm": ["clamp(1.5rem, 1.6vw, 2rem)", { lineHeight: "1.25" }],
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
        // Halo de letrero: solo en la acción principal y en piezas de neón
        neon: "0 0 0 1px rgba(103, 170, 255, 0.45), 0 10px 32px -8px rgba(103, 170, 255, 0.55)",
        "neon-uv": "0 0 0 1px rgba(185, 62, 243, 0.5), 0 10px 32px -8px rgba(185, 62, 243, 0.55)",
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
        // Menú: el ícono activo salta al llegar la píldora; el dock sube al cargar
        "nav-pop": { "0%": { transform: "scale(0.72)" }, "60%": { transform: "scale(1.18)" }, "100%": { transform: "scale(1)" } },
        "dock-in": { from: { opacity: "0", transform: "translateY(130%)" }, to: { opacity: "1", transform: "none" } },
        // Revelado de ronda: la barra crece desde cero hasta su valor (el valor final va en el estilo en línea)
        "bar-grow": { from: { transform: "scaleX(0)" } },
        // «+1» que sube al sumar un trago o un vaso de agua
        "float-up": {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.8)" },
          "18%": { opacity: "1", transform: "translateY(0) scale(1.12)" },
          "100%": { opacity: "0", transform: "translateY(-64px) scale(1)" },
        },
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
        "nav-pop": "nav-pop 380ms cubic-bezier(0.34, 1.56, 0.64, 1) both",
        "dock-in": "dock-in 650ms cubic-bezier(0.32, 0.72, 0, 1) 120ms both",
        "float-up": "float-up 900ms cubic-bezier(0.23, 1, 0.32, 1) both",
        "bar-grow": "bar-grow 700ms cubic-bezier(0.23, 1, 0.32, 1) both",
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
