// Búsqueda en grilla: tonos y luminosidades que pasan contraste (WCAG + APCA) y distinción con daltonismo.
import { oklch, wcag, apca, simulate, dE } from "./palette.mjs";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_COLOR = { 50: 0.97, 100: 0.94, 200: 0.89, 300: 0.83, 400: 0.77, 500: 0.71, 600: 0.6, 700: 0.5, 800: 0.41, 900: 0.3, 950: 0.22 };
const C_SHAPE = { 50: 0.12, 100: 0.25, 200: 0.5, 300: 0.75, 400: 0.92, 500: 1, 600: 0.95, 700: 0.8, 800: 0.62, 900: 0.42, 950: 0.28 };
const step = (hue, c, dL, s) => {
  const i = STEPS.indexOf(+s);
  return oklch(Math.min(0.985, Math.max(0.12, L_COLOR[s] + dL * (1 - Math.abs(i - 5) / 6))), c * C_SHAPE[s], hue).rgb;
};
const night900 = oklch(0.19, 0.01, 55).rgb, night950 = oklch(0.145, 0.008, 55).rgb;

const grid = {
  ember: { h: [45], c: [0.18], dL: [0.03] },
  alert: { h: [0, 5, 10, 355], c: [0.2, 0.22], dL: [-0.04, -0.08, -0.12] },
  gold: { h: [70, 75, 80, 85, 90, 95], c: [0.13, 0.15, 0.17], dL: [0.06, 0.1, 0.13, 0.16] },
  lime: { h: [160, 165, 170, 175], c: [0.12, 0.14, 0.16], dL: [-0.04, -0.02, 0.02] },
  aqua: { h: [225, 235, 245, 255], c: [0.1, 0.12], dL: [0.04, 0.08, 0.12] },
};
const combos = (g) => g.h.flatMap((h) => g.c.flatMap((c) => g.dL.map((dL) => ({ h, c, dL }))));
const CVD = ["protan", "deutan", "tritan"];
const minDE = (a, b) => Math.min(dE(a, b), ...CVD.map((k) => dE(simulate(a, k), simulate(b, k))));

// Restricciones por rampa (texto 300 sobre 900, botón 500 con texto oscuro solo para ember)
const okRamp = (name, p) => {
  const t300 = step(p.h, p.c, p.dL, 300);
  if (wcag(t300, night900) < 4.5 || apca(t300, night900) < 60) return false;
  if (name === "ember") {
    const b5 = step(p.h, p.c, p.dL, 500);
    if (apca(night950, b5) < 55) return false;
  }
  return true;
};
const cand = Object.fromEntries(Object.entries(grid).map(([k, g]) => [k, combos(g).filter((p) => okRamp(k, p))]));
for (const [k, v] of Object.entries(cand)) console.error(k, v.length, "válidas");

// Maximiza el peor ΔE (normal y daltonismos) entre pares semánticos; leve preferencia por el coral h≈45
const memo = new Map();
const rgbOf = (k, p, st) => { const key = k + p.h + p.c + p.dL + st; if (!memo.has(key)) memo.set(key, step(p.h, p.c, p.dL, st)); return memo.get(key); };
const dm = new Map();
const md = (k1, p1, s1, k2, p2, s2) => { const key = [k1,p1.h,p1.c,p1.dL,s1,k2,p2.h,p2.c,p2.dL,s2].join(); if (!dm.has(key)) dm.set(key, minDE(rgbOf(k1,p1,s1), rgbOf(k2,p2,s2))); return dm.get(key); };
let best = null;
for (const e of cand.ember) for (const a of cand.alert) {
  const ea = md("ember", e, 500, "alert", a, 500);
  if (best && ea <= best.worst) continue;
  for (const g of cand.gold) {
    const w1 = Math.min(ea, md("ember", e, 400, "gold", g, 400), md("gold", g, 400, "alert", a, 500));
    if (best && w1 <= best.worst) continue;
    for (const l of cand.lime) {
      const w2 = Math.min(w1, md("lime", l, 400, "gold", g, 400), md("lime", l, 400, "alert", a, 500));
      if (best && w2 <= best.worst) continue;
      for (const q of cand.aqua) {
        const worst = Math.min(w2, md("aqua", q, 400, "lime", l, 400));
        if (!best || worst > best.worst) best = { worst: +worst.toFixed(1), sel: { ember: e, alert: a, gold: g, lime: l, aqua: q } };
      }
    }
  }
}
console.log(JSON.stringify(best));
