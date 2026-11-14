// V12 «Señal»: búsqueda en grilla con la marca volt fija. Maximiza el peor ΔE entre estados (visión normal,
// protanopía, deuteranopía y tritanopía) entre las combinaciones que pasan el contraste de texto y de botones.
// Uso: node scripts/palette/optimize-senal.mjs  → imprime el mejor JSON para gen.mjs
import { oklch, wcag, apca, simulate, dE } from "./palette.mjs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_COLOR = { 50: 0.97, 100: 0.94, 200: 0.89, 300: 0.83, 400: 0.77, 500: 0.71, 600: 0.6, 700: 0.5, 800: 0.41, 900: 0.3, 950: 0.22 };
const C_SHAPE = { 50: 0.12, 100: 0.25, 200: 0.5, 300: 0.75, 400: 0.92, 500: 1, 600: 0.95, 700: 0.8, 800: 0.62, 900: 0.42, 950: 0.28 };
const CANVAS = 258;
const night900 = oklch(0.19, 0.01, CANVAS).rgb;
const night950 = oklch(0.145, 0.008, CANVAS).rgb;
const step = (p, s) => {
  const i = STEPS.indexOf(+s);
  return oklch(Math.min(0.985, Math.max(0.12, L_COLOR[s] + p.dL * (1 - Math.abs(i - 5) / 6))), p.c * C_SHAPE[s], p.h).rgb;
};

const volt = { h: 125, c: 0.19, dL: 0.17 };
// Ámbar amarillo (tono ≥ 84: más abajo se vuelve naranjo, lo que la V12 saca) y frambuesa roja (355–15) para que el peligro se lea como tal
const grid = {
  lime: { h: [184, 188, 192], c: [0.09, 0.1, 0.12], dL: [0.12, 0.14, 0.16] },
  gold: { h: [84, 88, 92], c: [0.13, 0.15], dL: [0.04, 0.08, 0.12] },
  alert: { h: [355, 0, 5, 10, 15], c: [0.2, 0.22], dL: [-0.02, -0.06, -0.1] },
  iris: { h: [298, 304, 310, 316], c: [0.15, 0.17], dL: [0.02, 0.05, 0.08] },
};
const combos = (g) => g.h.flatMap((h) => g.c.flatMap((c) => g.dL.map((dL) => ({ h, c, dL }))));

// Contraste: acento como texto (300 sobre tarjeta) y botón con texto oscuro donde el sistema lo usa
const okRamp = (name, p) => {
  const t300 = step(p, 300);
  if (wcag(t300, night900) < 4.5 || apca(t300, night900) < 60) return false;
  if (name === "lime" && apca(night950, step(p, 500)) < 55) return false;
  if (name === "gold" && apca(night950, step(p, 400)) < 60) return false;
  if (name === "iris" && apca(night950, step(p, 500)) < 54) return false;
  return true;
};
const cand = Object.fromEntries(Object.entries(grid).map(([k, g]) => [k, combos(g).filter((p) => okRamp(k, p))]));
for (const [k, v] of Object.entries(cand)) console.error(k, v.length, "válidas");

const CVD = ["protan", "deutan", "tritan"];
const worst = (a, b) => Math.min(dE(a, b), ...CVD.map((k) => dE(simulate(a, k), simulate(b, k))));
const color = (p, s) => step(p, s);

let best = { score: -1 };
const v500 = step(volt, 500), v400 = step(volt, 400);
for (const lime of cand.lime) {
  const l4 = color(lime, 400);
  for (const gold of cand.gold) {
    const g4 = color(gold, 400);
    const base = Math.min(worst(v400, g4), worst(l4, g4));
    if (base <= best.score) continue;
    for (const alert of cand.alert) {
      const a5 = color(alert, 500);
      const s2 = Math.min(base, worst(v500, a5), worst(l4, a5), worst(g4, a5));
      if (s2 <= best.score) continue;
      for (const iris of cand.iris) {
        const i4 = color(iris, 400);
        const score = Math.min(s2, worst(i4, v500), worst(l4, i4), worst(g4, i4));
        if (score > best.score) best = { score, lime, gold, alert, iris };
      }
    }
  }
}

console.error("peor ΔE ×100:", Math.round(best.score * 100));
const out = {
  canvasHue: CANVAS,
  emberHue: volt.h, emberC: volt.c, emberL: volt.dL,
  limeHue: best.lime.h, limeC: best.lime.c, limeL: best.lime.dL,
  aquaHue: best.lime.h, aquaC: best.lime.c, aquaL: best.lime.dL,
  goldHue: best.gold.h, goldC: best.gold.c, goldL: best.gold.dL,
  alertHue: best.alert.h, alertC: best.alert.c, alertL: best.alert.dL,
  irisHue: best.iris.h, irisC: best.iris.c, irisL: best.iris.dL,
};
console.log(JSON.stringify(out));
