/**
 * Utilidades de alcohol (Widmark dinámico, estrictamente educativo).
 * g de alcohol puro = ml × ABV × 0.8
 * Cada trago se absorbe de forma gradual (30/45/60 min según el estómago) y el cuerpo elimina
 * β = 0.15 g/l por hora. r: 0.68 hombre / 0.55 mujer. Con comida, parte del alcohol no llega a la sangre.
 * Nunca se usa para decir "apto para manejar": la única cifra segura al volante es 0.00.
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
  { key: "cerveza", label: "Cerveza lata", emoji: "🍺", ml: 350, abv: 0.05 },
  { key: "latonazo", label: "Latón 473", emoji: "🍺", ml: 473, abv: 0.05 },
  { key: "artesanal", label: "Cerveza artesanal", emoji: "🍻", ml: 330, abv: 0.065 },
  { key: "vino", label: "Copa de vino", emoji: "🍷", ml: 150, abv: 0.13 },
  { key: "gin", label: "Gin Tonic", emoji: "🍸", ml: 50, abv: 0.4 },
  { key: "ron", label: "Ron / Cuba Libre", emoji: "🍹", ml: 50, abv: 0.375 },
  { key: "vodka", label: "Vodka con jugo", emoji: "🧊", ml: 50, abv: 0.4 },
  { key: "whisky", label: "Whisky / Highball", emoji: "🥃", ml: 50, abv: 0.4 },
  { key: "tequila", label: "Tequila / Paloma", emoji: "🌵", ml: 45, abv: 0.38 },
  { key: "mezcal", label: "Mezcal", emoji: "🔥", ml: 45, abv: 0.4 },
  { key: "fernet", label: "Fernet con cola", emoji: "🌿", ml: 60, abv: 0.39 },
  { key: "espumante", label: "Espumante", emoji: "🥂", ml: 120, abv: 0.12 },
  { key: "spritz", label: "Aperol Spritz", emoji: "🧡", ml: 180, abv: 0.08 },
  { key: "terremoto", label: "Terremoto", emoji: "🍧", ml: 340, abv: 0.09 },
  { key: "sour", label: "Pisco Sour", emoji: "🍋", ml: 170, abv: 0.15 },
  { key: "sake", label: "Sake (ochoko x3)", emoji: "🍶", ml: 90, abv: 0.15 },
  { key: "seltzer", label: "Hard seltzer", emoji: "🫧", ml: 355, abv: 0.05 },
  { key: "shot", label: "Shot puro 40°", emoji: "🔥", ml: 45, abv: 0.4 },
];

export const BETA = 0.15;

export const pureGrams = (ml: number, abv: number) => ml * abv * 0.8;

export const widmarkR = (gender: "M" | "F") => (gender === "M" ? 0.68 : 0.55);

export type StomachState = "empty" | "normal" | "full";

/** Minutos hasta absorber por completo un trago y fracción que llega a la sangre. */
export const ABSORPTION: Record<StomachState, { minutes: number; bioavailability: number; label: string }> = {
  empty: { minutes: 30, bioavailability: 1, label: "Estómago vacío" },
  normal: { minutes: 45, bioavailability: 0.9, label: "Picoteo" },
  full: { minutes: 75, bioavailability: 0.8, label: "Comida completa" },
};

export interface BacResult {
  totalGrams: number;
  bac: number;
  hoursToZero: number;
  zeroAt: number | null; // timestamp
  totalMl: number;
  /** Pico estimado (puede ser en el futuro si aún se está absorbiendo) */
  peakBac: number;
  peakAt: number | null;
  /** Gramos que aún no pasan a la sangre */
  pendingGrams: number;
}

const STEP_MIN = 2;

/**
 * Simulación por pasos de 2 min: absorción lineal de cada trago + eliminación de orden cero.
 * Retorna el valor actual y proyecta el pico y la hora de volver a 0.00.
 */
export function computeBac(
  consumptions: Consumption[],
  gender: "M" | "F",
  weightKg: number,
  now: number = Date.now(),
  stomach: StomachState = "normal"
): BacResult {
  const totalGrams = consumptions.reduce((a, c) => a + pureGrams(c.ml, c.abv), 0);
  const totalMl = consumptions.reduce((a, c) => a + c.ml * c.abv, 0);
  if (consumptions.length === 0)
    return { totalGrams: 0, bac: 0, hoursToZero: 0, zeroAt: null, totalMl: 0, peakBac: 0, peakAt: null, pendingGrams: 0 };

  const { minutes, bioavailability } = ABSORPTION[stomach];
  const volume = widmarkR(gender) * Math.max(30, weightKg); // litros de distribución
  const drinks = consumptions
    .map((c) => ({ ts: c.ts, grams: pureGrams(c.ml, c.abv) * bioavailability }))
    .sort((a, b) => a.ts - b.ts);
  const absorbedBy = (t: number) =>
    drinks.reduce((acc, d) => acc + d.grams * Math.min(1, Math.max(0, (t - d.ts) / (minutes * 60_000))), 0);

  const stepMs = STEP_MIN * 60_000;
  const elimPerStep = (BETA * STEP_MIN) / 60;
  let t = drinks[0].ts;
  let bac = 0;
  let prevAbs = 0;
  let current = 0;
  let peakBac = 0;
  let peakAt: number | null = null;
  let zeroAt: number | null = null;
  const lastAbsorbed = drinks[drinks.length - 1].ts + minutes * 60_000;
  // Simula hasta "ahora" y sigue proyectando hasta llegar a 0 (máx. 36 h)
  const limit = Math.max(now, lastAbsorbed) + 36 * 3_600_000;
  while (t <= limit) {
    const abs = absorbedBy(t);
    bac = Math.max(0, bac + (abs - prevAbs) / volume - elimPerStep);
    prevAbs = abs;
    if (t <= now) current = bac;
    if (bac > peakBac) {
      peakBac = bac;
      peakAt = t;
    }
    if (t > now && t >= lastAbsorbed && bac <= 0) {
      zeroAt = t;
      break;
    }
    t += stepMs;
  }
  if (t > now && current === 0 && now >= lastAbsorbed) zeroAt = null;
  const pendingGrams = Math.max(0, drinks.reduce((a, d) => a + d.grams, 0) - absorbedBy(now));
  const hoursToZero = zeroAt ? Math.max(0, (zeroAt - now) / 3_600_000) : 0;
  return { totalGrams, bac: current, hoursToZero, zeroAt, totalMl, peakBac, peakAt, pendingGrams };
}

/** Atajo para un participante del carrete (usa su peso, sexo y estómago). */
export function bacFor(
  p: { consumptions: Consumption[]; gender: "M" | "F"; weightKg: number; stomach?: StomachState },
  now: number = Date.now()
): BacResult {
  return computeBac(p.consumptions, p.gender, p.weightKg, now, p.stomach ?? "normal");
}

/** Gramos de alcohol por vaso de agua recomendado (~1 vaso cada 15–20 g). */
export const GRAMS_PER_WATER = 18;

export interface Hydration {
  /** Tragos registrados desde el último vaso de agua */
  drinksSinceWater: number;
  /** Vasos de agua recomendados a esta altura */
  recommended: number;
  /** Vasos tomados */
  glasses: number;
  needsWater: boolean;
}

export function hydrationFor(p: { consumptions: Consumption[]; water?: { ts: number }[]; waterCount: number }): Hydration {
  const lastWater = (p.water ?? []).reduce((m, w) => Math.max(m, w.ts), 0);
  const drinksSinceWater = p.consumptions.filter((c) => c.ts > lastWater && c.abv > 0).length;
  const grams = p.consumptions.reduce((a, c) => a + pureGrams(c.ml, c.abv), 0);
  const recommended = Math.floor(grams / GRAMS_PER_WATER);
  return { drinksSinceWater, recommended, glasses: p.waterCount, needsWater: drinksSinceWater >= 2 || p.waterCount < recommended - 1 };
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
