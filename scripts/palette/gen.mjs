// Genera rampas OKLCH (50…950) desde tono + croma pico, y escribe la especificación para palette.mjs.
import fs from "node:fs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
// Luminosidad por paso (oscuro → bajo). Las rampas de color usan su propia escala de L.
const L_COLOR = { 50: 0.97, 100: 0.94, 200: 0.89, 300: 0.83, 400: 0.77, 500: 0.71, 600: 0.6, 700: 0.5, 800: 0.41, 900: 0.3, 950: 0.22 };
// Croma relativo: pico en 400–600, baja hacia los extremos (evita colores chillones casi blancos o casi negros)
const C_SHAPE = { 50: 0.12, 100: 0.25, 200: 0.5, 300: 0.75, 400: 0.92, 500: 1, 600: 0.95, 700: 0.8, 800: 0.62, 900: 0.42, 950: 0.28 };

// Regla del sistema: 500 lleva texto oscuro; 600+ lleva texto blanco (≥ 4,5:1), por eso 600/700 tienen techo de L
const L_CAP = { 50: 0.985, 100: 0.97, 200: 0.95, 600: 0.545, 700: 0.465, 800: 0.385, 900: 0.3, 950: 0.22 };
const ramp = (hue, chroma, dL = 0, hueShift = 0) =>
  Object.fromEntries(STEPS.map((s, i) => [s, [+Math.min(L_CAP[s] ?? 0.985, Math.max(0.12, L_COLOR[s] + dL * (1 - Math.abs(i - 5) / 6))).toFixed(3), +(chroma * C_SHAPE[s]).toFixed(4), +(hue + (hueShift * (i - 5)) / 5).toFixed(1)]]));

const cfg = JSON.parse(process.argv[2] ?? "{}");
const P = {
  canvasHue: 55,
  ...cfg,
};

const ramps = {
  // Superficies: casi negro con un tinte ciruela apenas perceptible (no #000: evita el "smear" OLED)
  // Superficies: carbón cálido (tono ~50, croma mínimo). Elevación por luminosidad, no por sombra.
  night: {
    950: [0.145, 0.008, P.canvasHue],
    900: [0.19, 0.01, P.canvasHue],
    850: [0.225, 0.011, P.canvasHue],
    800: [0.26, 0.012, P.canvasHue],
    700: [0.31, 0.013, P.canvasHue],
    600: [0.37, 0.014, P.canvasHue],
  },
  // Tinta: blancos rotos cálidos (menos halo con astigmatismo); 300 ≈ texto secundario (L 0.78)
  ink: {
    50: [0.945, 0.007, P.canvasHue], 100: [0.91, 0.008, P.canvasHue], 200: [0.86, 0.009, P.canvasHue], 300: [0.8, 0.01, P.canvasHue],
    400: [0.775, 0.011, P.canvasHue], 500: [0.71, 0.012, P.canvasHue], 600: [0.53, 0.012, P.canvasHue], 700: [0.4, 0.012, P.canvasHue],
    800: [0.31, 0.011, P.canvasHue], 900: [0.23, 0.01, P.canvasHue], 950: [0.17, 0.009, P.canvasHue],
  },
  ember: ramp(P.emberHue ?? 48, P.emberC ?? 0.17, P.emberL ?? 0),
  lime: ramp(P.limeHue ?? 165, P.limeC ?? 0.15, P.limeL ?? 0.04),
  gold: ramp(P.goldHue ?? 85, P.goldC ?? 0.16, P.goldL ?? 0.12),
  alert: ramp(P.alertHue ?? 12, P.alertC ?? 0.2, P.alertL ?? -0.07),
  iris: ramp(P.irisHue ?? 295, P.irisC ?? 0.15, P.irisL ?? 0),
  aqua: ramp(P.aquaHue ?? 235, P.aquaC ?? 0.12, P.aquaL ?? 0),
  white: { 0: "#FFFFFF" },
};

const pairs = [
  // texto principal y secundario sobre todas las superficies
  ["ink.50", "night.950", 7, 90], ["ink.50", "night.800", 7, 85],
  ["ink.200", "night.900", 7, 75], ["ink.300", "night.900", 4.5, 60], ["ink.300", "night.800", 4.5, 60],
  ["ink.400", "night.900", 4.5, 60], ["ink.400", "night.850", 4.5, 55],
  // texto de apoyo (12–14 px, peso 500+)
  ["ink.500", "night.950", 4.5, 45], ["ink.500", "night.850", 4.5, 45], ["ink.500", "night.800", 4.5, 45],
  // acentos como texto
  ["ember.300", "night.900", 4.5, 60], ["ember.400", "night.900", 4.5, 55], ["lime.300", "night.900", 4.5, 60], ["gold.300", "night.900", 4.5, 60],
  ["alert.300", "night.900", 4.5, 60], ["iris.300", "night.900", 4.5, 60], ["aqua.300", "night.900", 4.5, 60],
  // texto oscuro sobre botón de marca y blanco sobre su versión profunda
  ["night.950", "ember.500", 4.5, 55], ["night.950", "ember.400", 4.5, 60], ["night.950", "lime.400", 4.5, 60], ["white.0", "ember.700", 4.5, 60],
  ["white.0", "ember.600", 4.5, 60], ["white.0", "lime.600", 4.5, 60], ["white.0", "alert.600", 4.5, 60], ["white.0", "iris.600", 4.5, 60],
  ["white.0", "gold.600", 4.5, 60], ["white.0", "aqua.600", 4.5, 60],
  ["night.950", "lime.500", 4.5, 55], ["night.950", "gold.400", 4.5, 60], ["night.950", "iris.500", 4.5, 54], ["white.0", "alert.500", 3, 60],
];

const distinct = [
  ["ember.500", "alert.500"], ["ember.400", "gold.400"], ["lime.400", "gold.400"], ["lime.400", "alert.500"], ["aqua.400", "lime.400"],
  ["iris.400", "ember.500"], ["gold.400", "alert.500"],
];

fs.writeFileSync(new URL("./candidate.json", import.meta.url), JSON.stringify({ ramps, pairs, distinct }, null, 1));
