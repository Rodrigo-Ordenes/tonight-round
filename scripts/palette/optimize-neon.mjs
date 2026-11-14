// V12 «Neón»: azul y morado neón de bar como colores dominantes. Maximiza el peor ΔE entre estados (visión normal,
// protanopía, deuteranopía y tritanopía) entre las combinaciones que pasan el contraste de texto y de botones.
// Uso: node scripts/palette/optimize-neon.mjs  → imprime el mejor JSON para gen.mjs
import { oklch, wcag, apca, simulate, dE } from "./palette.mjs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_COLOR = { 50: 0.97, 100: 0.94, 200: 0.89, 300: 0.83, 400: 0.77, 500: 0.71, 600: 0.6, 700: 0.5, 800: 0.41, 900: 0.3, 950: 0.22 };
const C_SHAPE = { 50: 0.12, 100: 0.25, 200: 0.5, 300: 0.75, 400: 0.92, 500: 1, 600: 0.95, 700: 0.8, 800: 0.62, 900: 0.42, 950: 0.28 };
// Fondo casi negro con un leve tinte violeta (penumbra de bar)
const CANVAS = 282;
const night900 = oklch(0.19, 0.01, CANVAS).rgb;
const night950 = oklch(0.145, 0.008, CANVAS).rgb;
const step = (p, s) => {
  const i = STEPS.indexOf(+s);
  return oklch(Math.min(0.985, Math.max(0.12, L_COLOR[s] + p.dL * (1 - Math.abs(i - 5) / 6))), p.c * C_SHAPE[s], p.h).rgb;
};

// Marca (clave "ember" del generador) = azul neón; "iris" = morado neón; "lime" = señal en vivo
const grid = {
  ember: { h: [250, 256, 262], c: [0.17, 0.2], dL: [-0.04, 0, 0.04] },
  iris: { h: [300, 306, 312], c: [0.2, 0.24], dL: [-0.06, -0.02, 0.04, 0.08] },
  lime: { h: [160, 170, 180, 190], c: [0.1, 0.12], dL: [0.06, 0.1, 0.14] },
  gold: { h: [84, 88], c: [0.14], dL: [0.02, 0.06, 0.1] },
  alert: { h: [8, 14, 20], c: [0.2, 0.22], dL: [-0.04, -0.08] },
};
const combos = (g) => g.h.flatMap((h) => g.c.flatMap((c) => g.dL.map((dL) => ({ h, c, dL }))));

// Contraste: acento como texto (300 sobre tarjeta) y botón con texto oscuro donde el sistema lo usa
const okRamp = (name, p) => {
  const t300 = step(p, 300);
  if (wcag(t300, night900) < 4.5 || apca(t300, night900) < 60) return false;
  if ((name === "ember" || name === "lime") && apca(night950, step(p, 500)) < 55) return false;
  if (name === "gold" && apca(night950, step(p, 400)) < 60) return false;
  return true;
};
const cand = Object.fromEntries(Object.entries(grid).map(([k, g]) => [k, combos(g).filter((p) => okRamp(k, p))]));
for (const [k, v] of Object.entries(cand)) console.error(k, v.length, "válidas");

const CVD = ["protan", "deutan", "tritan"];
const worst = (a, b) => Math.min(dE(a, b), ...CVD.map((k) => dE(simulate(a, k), simulate(b, k))));
const color = (p, s) => step(p, s);

let best = { score: -1 };
for (const ember of cand.ember) {
  const e4 = step(ember, 400), e5 = step(ember, 500);
  for (const iris of cand.iris) {
    const i4 = step(iris, 400);
    const s1 = worst(i4, e5);
    if (s1 <= best.score) continue;
    for (const lime of cand.lime) {
      const l4 = step(lime, 400);
      const s2 = Math.min(s1, worst(l4, i4), worst(l4, e4));
      if (s2 <= best.score) continue;
      for (const gold of cand.gold) {
        const g4 = step(gold, 400);
        const s3 = Math.min(s2, worst(e4, g4), worst(l4, g4), worst(g4, i4));
        if (s3 <= best.score) continue;
        for (const alert of cand.alert) {
          const a5 = step(alert, 500);
          const score = Math.min(s3, worst(e5, a5), worst(l4, a5), worst(g4, a5));
          if (score > best.score) best = { score, ember, iris, lime, gold, alert };
        }
      }
    }
  }
}

console.error("peor ΔE ×100:", Math.round(best.score * 100));
const out = {
  canvasHue: CANVAS,
  emberHue: best.ember.h, emberC: best.ember.c, emberL: best.ember.dL,
  limeHue: best.lime.h, limeC: best.lime.c, limeL: best.lime.dL,
  aquaHue: best.lime.h, aquaC: best.lime.c, aquaL: best.lime.dL,
  goldHue: best.gold.h, goldC: best.gold.c, goldL: best.gold.dL,
  alertHue: best.alert.h, alertC: best.alert.c, alertL: best.alert.dL,
  irisHue: best.iris.h, irisC: best.iris.c, irisL: best.iris.dL,
};
console.log(JSON.stringify(out));
