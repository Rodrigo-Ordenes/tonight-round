// Validador de paleta: OKLCH -> sRGB hex, contraste WCAG 2 y APCA (Lc), y simulación de daltonismo (Machado 2009, severidad 1).
// Uso: node palette.mjs palette.json
import fs from "node:fs";

const toLin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toGam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

export function oklch(L, C, H) {
  // Mapeo de gamut: baja el croma (mismo tono y luminosidad) hasta que cabe en sRGB
  let lo = 0, hi = C, best = raw(L, 0, H);
  if (raw(L, C, H).inGamut) return raw(L, C, H);
  for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; const r = raw(L, mid, H); if (r.inGamut) { lo = mid; best = r; } else hi = mid; }
  return { ...best, inGamut: C - lo < 0.02, mapped: +lo.toFixed(3) };
}
function raw(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  let bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const inGamut = [r, g, bl].every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  const clamp = (v) => Math.min(1, Math.max(0, v));
  return { rgb: [r, g, bl].map((v) => clamp(toGam(clamp(v)))), inGamut };
}

const hex = (rgb) => "#" + rgb.map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
const fromHex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
const lum = (rgb) => { const [r, g, b] = rgb.map(toLin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const wcag = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };

// APCA-W3 0.0.98G (simplificado). Devuelve |Lc|.
export function apca(txt, bg) {
  const Y = (rgb) => { const [r, g, b] = rgb.map((c) => c ** 2.4); return 0.2126729 * r + 0.7151522 * g + 0.072175 * b; };
  const clampY = (y) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const yt = clampY(Y(txt)), yb = clampY(Y(bg));
  let lc;
  if (yb > yt) lc = (yb ** 0.56 - yt ** 0.57) * 1.14;
  else lc = (yb ** 0.65 - yt ** 0.62) * 1.14;
  if (Math.abs(lc) < 0.1) return 0;
  return Math.abs((lc > 0 ? lc - 0.027 : lc + 0.027) * 100);
}

// Machado et al. 2009, severidad 1.0 (espacio lineal)
const CVD = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};
export function simulate(rgb, kind) {
  const lin = rgb.map(toLin);
  const m = CVD[kind];
  return m.map((row) => Math.min(1, Math.max(0, toGam(Math.min(1, Math.max(0, row[0] * lin[0] + row[1] * lin[1] + row[2] * lin[2]))))));
}

// Diferencia perceptual simple (OKLab euclídea)
function oklab(rgb) {
  const [r, g, b] = rgb.map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
}
export const dE = (a, b) => { const p = oklab(a), q = oklab(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) * 100; };

if (process.argv[1]?.endsWith("palette.mjs") && process.argv[2]) {
  const spec = JSON.parse(fs.readFileSync(process.argv[2], "utf8"));
  const out = {};
  const report = [];
  for (const [ramp, steps] of Object.entries(spec.ramps)) {
    out[ramp] = {};
    for (const [k, v] of Object.entries(steps)) {
      if (typeof v === "string") { out[ramp][k] = v.toUpperCase(); continue; }
      const { rgb, inGamut } = oklch(...v);
      out[ramp][k] = hex(rgb);
      if (!inGamut) report.push(`fuera de gamut: ${ramp}.${k} oklch(${v.join(" ")}) → recortado ${hex(rgb)}`);
    }
  }
  const get = (ref) => { const [r, k] = ref.split("."); return out[r][k]; };
  console.log(JSON.stringify(out, null, 2));
  console.log("\n# Contraste (texto sobre fondo): WCAG | APCA Lc | mínimo pedido");
  let fails = 0;
  for (const [fg, bg, min, apcaMin] of spec.pairs) {
    const a = fromHex(get(fg)), b = fromHex(get(bg));
    const w = wcag(a, b), l = apca(a, b);
    const ok = w >= min && (!apcaMin || l >= apcaMin);
    if (!ok) fails++;
    console.log(`${ok ? "ok  " : "FALLA"} ${fg.padEnd(14)} sobre ${bg.padEnd(12)} ${w.toFixed(2).padStart(5)}:1  Lc ${l.toFixed(0).padStart(3)}  (≥${min}${apcaMin ? ` / Lc ${apcaMin}` : ""})`);
  }
  console.log("\n# Pares semánticos que deben distinguirse (ΔE OKLab ×100, normal / protan / deutan / tritan; mínimo 12)");
  for (const [x, y] of spec.distinct) {
    const a = fromHex(get(x)), b = fromHex(get(y));
    const d = [dE(a, b), ...["protan", "deutan", "tritan"].map((k) => dE(simulate(a, k), simulate(b, k)))];
    const ok = Math.min(...d) >= 12;
    if (!ok) fails++;
    console.log(`${ok ? "ok  " : "FALLA"} ${x} vs ${y}: ${d.map((n) => n.toFixed(0)).join(" / ")}`);
  }
  if (report.length) console.log("\n" + report.join("\n"));
  console.log(`\n${fails} fallas`);
  process.exitCode = fails ? 1 : 0;
}
