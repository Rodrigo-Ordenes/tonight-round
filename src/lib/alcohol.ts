/**
 * Utilidades de alcohol (Widmark simplificado).
 * g de alcohol puro = ml × ABV × 0.8
 * BAC (g/l) = g / (r × kg) − β × horas   (r: 0.68 hombre / 0.55 mujer, β = 0.15 g/l/h)
 */

export interface Consumption {
  id: string;
  label: string;
  ml: number;
  abv: number; // 0..1
  ts: number;
}

export interface DrinkPreset {
  key: string;
  label: string;
  emoji: string;
  ml: number;
  abv: number;
}

export const DRINK_PRESETS: DrinkPreset[] = [
  { key: "piscola", label: "Piscola 35°", emoji: "🥃", ml: 60, abv: 0.35 },
  { key: "gin", label: "Gin Tonic 40°", emoji: "🍸", ml: 50, abv: 0.4 },
  { key: "cerveza", label: "Cerveza", emoji: "🍺", ml: 350, abv: 0.05 },
  { key: "vodka", label: "Vodka / Energy 40°", emoji: "🧊", ml: 50, abv: 0.4 },
  { key: "tequila", label: "Tequila / Shot 38°", emoji: "🌵", ml: 45, abv: 0.38 },
  { key: "whisky", label: "Whisky / Highball 40°", emoji: "🥃", ml: 50, abv: 0.4 },
  { key: "ron", label: "Ron / Cuba Libre 38°", emoji: "🍹", ml: 50, abv: 0.38 },
  { key: "fernet", label: "Fernet 39°", emoji: "🌿", ml: 50, abv: 0.39 },
  { key: "vino", label: "Copa de vino", emoji: "🍷", ml: 150, abv: 0.12 },
  { key: "espumante", label: "Espumante", emoji: "🥂", ml: 120, abv: 0.115 },
  { key: "terremoto", label: "Terremoto", emoji: "🍧", ml: 250, abv: 0.12 },
  { key: "shot", label: "Shot puro 40°", emoji: "🔥", ml: 45, abv: 0.4 },
];

export const BETA = 0.15;

export const pureGrams = (ml: number, abv: number) => ml * abv * 0.8;

export const widmarkR = (gender: "M" | "F") => (gender === "M" ? 0.68 : 0.55);

export interface BacResult {
  totalGrams: number;
  bac: number;
  hoursToZero: number;
  zeroAt: number | null; // timestamp
  totalMl: number;
}

export function computeBac(
  consumptions: Consumption[],
  gender: "M" | "F",
  weightKg: number,
  now: number = Date.now()
): BacResult {
  const totalGrams = consumptions.reduce((a, c) => a + pureGrams(c.ml, c.abv), 0);
  const totalMl = consumptions.reduce((a, c) => a + c.ml * c.abv, 0);
  if (consumptions.length === 0) return { totalGrams: 0, bac: 0, hoursToZero: 0, zeroAt: null, totalMl: 0 };
  const first = Math.min(...consumptions.map((c) => c.ts));
  const hours = Math.max(0, (now - first) / 3_600_000);
  const peak = totalGrams / (widmarkR(gender) * Math.max(30, weightKg));
  const bac = Math.max(0, peak - BETA * hours);
  const hoursToZero = bac / BETA;
  return { totalGrams, bac, hoursToZero, zeroAt: bac > 0 ? now + hoursToZero * 3_600_000 : null, totalMl };
}

export type Light = "green" | "yellow" | "red";

export function lightFor(bac: number): Light {
  if (bac <= 0.001) return "green";
  if (bac < 0.3) return "yellow";
  return "red";
}

export const fmtTime = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false });

export const fmtDuration = (h: number) => {
  if (h <= 0) return "0 min";
  const hh = Math.floor(h);
  const mm = Math.round((h - hh) * 60);
  return hh > 0 ? `${hh} h ${mm} min` : `${mm} min`;
};

/** Texto del detalle: "3x Piscola 35° (60ml c/u) = 180 ml destilado" */
export function groupConsumptions(consumptions: Consumption[]) {
  const map = new Map<string, { label: string; ml: number; abv: number; count: number }>();
  consumptions.forEach((c) => {
    const k = `${c.label}|${c.ml}|${c.abv}`;
    const prev = map.get(k);
    if (prev) prev.count += 1;
    else map.set(k, { label: c.label, ml: c.ml, abv: c.abv, count: 1 });
  });
  return Array.from(map.values()).map((g) => ({
    ...g,
    text: `${g.count}x ${g.label} (${g.ml}ml c/u) = ${g.count * g.ml} ml ${g.abv >= 0.3 ? "destilado" : "de bebida"}`,
  }));
}
