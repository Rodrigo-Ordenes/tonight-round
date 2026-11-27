import { rng } from "@/lib/partyGames";

/*
 * La Frutillita de Tonight: la maquinita de frutas de los locales, en 5 rodillos × 3 filas con 9 líneas de pago.
 * Solo puntos, nunca plata. El logo de las dos copas es comodín (reemplaza a cualquier fruta) y la frutilla es la
 * dispersa: con tres o más en cualquier lugar se juega «La vuelta»: la mini-máquina del centro y la luz que corre por el
 * anillo de frutas hasta caer en SALIDA.
 * Todo sale de la semilla y del jugador, así la TV y cada celular ven la misma tirada.
 */

export type FrutaId = "cereza" | "limon" | "uva" | "durazno" | "sandia" | "campana" | "siete" | "logo" | "frutilla";

export interface Fruta {
  id: FrutaId;
  label: string;
  /** Más peso = sale más seguido en el rodillo */
  weight: number;
  /** Pago por línea según cuántas seguidas desde la izquierda (índice = cantidad) */
  pays: number[];
}

export const FRUTAS: Fruta[] = [
  { id: "cereza", label: "🍒", weight: 10, pays: [0, 0, 2, 5, 20, 60] },
  { id: "limon", label: "🍋", weight: 9, pays: [0, 0, 0, 8, 25, 80] },
  { id: "uva", label: "🍇", weight: 9, pays: [0, 0, 0, 8, 25, 80] },
  { id: "durazno", label: "🍑", weight: 8, pays: [0, 0, 0, 10, 30, 100] },
  { id: "sandia", label: "🍉", weight: 6, pays: [0, 0, 0, 15, 50, 150] },
  { id: "campana", label: "🔔", weight: 5, pays: [0, 0, 0, 25, 80, 250] },
  { id: "siete", label: "7", weight: 3, pays: [0, 0, 0, 40, 150, 500] },
  { id: "logo", label: "TONIGHT", weight: 2, pays: [0, 0, 0, 60, 300, 1000] },
  { id: "frutilla", label: "🍓", weight: 4, pays: [0, 0, 0, 0, 0, 0] },
];
export const FRUTA_BY_ID = new Map(FRUTAS.map((f) => [f.id, f]));

/** Las 9 líneas: la fila (0 arriba, 2 abajo) en cada uno de los 5 rodillos */
export const LINEAS: number[][] = [
  [1, 1, 1, 1, 1],
  [0, 0, 0, 0, 0],
  [2, 2, 2, 2, 2],
  [0, 1, 2, 1, 0],
  [2, 1, 0, 1, 2],
  [0, 0, 1, 2, 2],
  [2, 2, 1, 0, 0],
  [1, 0, 0, 0, 1],
  [1, 2, 2, 2, 1],
];
export const LINE_OPTIONS = [1, 3, 5, 7, 9] as const;
export const BET_OPTIONS = [1, 2, 3, 5] as const;

/**
 * El anillo de «La vuelta»: 24 casillas alrededor de una mini-máquina de 4 rodillos. Si la luz se detiene en una fruta
 * que salió en los rodillos del centro, paga su valor por cada vez que salió; si cae en SALIDA, se acaba el bonus.
 */
export type Casilla = FrutaId | "salida";
export const ANILLO: Casilla[] = [
  "siete", "cereza", "limon", "salida", "uva", "durazno", "sandia", "cereza", "campana", "limon", "salida", "uva",
  "logo", "cereza", "durazno", "limon", "salida", "sandia", "uva", "campana", "cereza", "durazno", "salida", "limon",
];
/** Lo que paga cada fruta en La vuelta, por cada coincidencia con los rodillos del centro */
export const VALOR_VUELTA: Record<FrutaId, number> = { cereza: 5, limon: 8, uva: 8, durazno: 10, sandia: 15, campana: 25, siete: 50, logo: 100, frutilla: 0 };
const INNER: FrutaId[] = ["cereza", "limon", "uva", "durazno", "sandia", "campana", "siete", "logo"];

export interface LineWin {
  line: number;
  fruta: FrutaId;
  count: number;
  pay: number;
  /** Las celdas que pagan: [rodillo, fila] */
  cells: [number, number][];
}

export interface Vuelta {
  /** Los 4 rodillos chicos del centro */
  inner: FrutaId[];
  /** Dónde se detuvo la luz */
  index: number;
  casilla: Casilla;
  /** Lo que pagó esta vuelta (ya por la apuesta) */
  pay: number;
  /** Ronda de bonus a la que pertenece (3 frutillas = 1 ronda, 4 = 2, 5 o más = 3) */
  ronda: number;
}

export interface FrutillitaResult {
  /** 5 rodillos de 3 símbolos (arriba a abajo) */
  grid: FrutaId[][];
  lines: number;
  bet: number;
  wins: LineWin[];
  frutillas: number;
  vueltas: Vuelta[];
  bonus: number;
  win: number;
  label: string;
}

const hash = (text: string) => [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

const pick = (r: () => number) => {
  const total = FRUTAS.reduce((a, f) => a + f.weight, 0);
  let x = r() * total;
  for (const f of FRUTAS) {
    x -= f.weight;
    if (x < 0) return f.id;
  }
  return FRUTAS[0].id;
};

/** Cuánto paga una línea: frutas iguales seguidas desde el rodillo 1; el logo reemplaza a cualquiera (no a la frutilla) */
export function lineWin(syms: FrutaId[]): { fruta: FrutaId; count: number; pay: number } | null {
  const target = syms.find((s) => s !== "logo") ?? "logo";
  if (target === "frutilla") return null;
  let count = 0;
  for (const s of syms) {
    if (s === target || s === "logo") count++;
    else break;
  }
  // Si la línea es puro logo al principio, también puede pagar como logo
  let logos = 0;
  for (const s of syms) {
    if (s === "logo") logos++;
    else break;
  }
  const asTarget = FRUTA_BY_ID.get(target)!.pays[count] ?? 0;
  const asLogo = FRUTA_BY_ID.get("logo")!.pays[logos] ?? 0;
  if (asLogo > asTarget) return { fruta: "logo", count: logos, pay: asLogo };
  return asTarget > 0 ? { fruta: target, count, pay: asTarget } : null;
}

/**
 * Una tirada completa. `lines` líneas activas (las primeras de LINEAS) y `bet` puntos por línea: los premios de línea y
 * de La vuelta se multiplican por la apuesta por línea.
 */
export function frutillitaSpin(seed: number, playerId: string, lines = 9, bet = 1): FrutillitaResult {
  const r = rng(seed ^ hash(playerId), 48);
  const grid: FrutaId[][] = Array.from({ length: 5 }, () => [pick(r), pick(r), pick(r)]);
  const wins: LineWin[] = [];
  LINEAS.slice(0, lines).forEach((rows, li) => {
    const syms = rows.map((row, reel) => grid[reel][row]);
    const w = lineWin(syms);
    if (w) wins.push({ line: li, fruta: w.fruta, count: w.count, pay: w.pay * bet, cells: rows.slice(0, w.count).map((row, reel) => [reel, row]) });
  });
  const frutillas = grid.flat().filter((s) => s === "frutilla").length;

  // La vuelta: cada ronda gira la mini-máquina y la luz hasta que cae en SALIDA (máximo 8 vueltas por ronda)
  const vueltas: Vuelta[] = [];
  if (frutillas >= 3) {
    const rb = rng(seed ^ hash(playerId), 49);
    const rondas = Math.min(3, frutillas - 2);
    for (let ronda = 1; ronda <= rondas; ronda++) {
      for (let k = 0; k < 8; k++) {
        const inner = [0, 1, 2, 3].map(() => INNER[Math.floor(rb() * INNER.length)]);
        const index = Math.floor(rb() * ANILLO.length);
        const casilla = ANILLO[index];
        const pay = casilla === "salida" ? 0 : inner.filter((f) => f === casilla).length * VALOR_VUELTA[casilla] * bet;
        vueltas.push({ inner, index, casilla, pay, ronda });
        if (casilla === "salida") break;
      }
    }
  }
  const bonus = vueltas.reduce((a, v) => a + v.pay, 0);
  const lineTotal = wins.reduce((a, w) => a + w.pay, 0);
  const win = lineTotal + bonus;
  const best = [...wins].sort((a, b) => b.pay - a.pay)[0];
  const label = [
    best ? `${best.count} ${FRUTA_BY_ID.get(best.fruta)!.label}${wins.length > 1 ? ` y ${wins.length - 1} ${wins.length === 2 ? "línea más" : "líneas más"}` : ""}` : null,
    vueltas.length ? `La vuelta: +${bonus}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return { grid, lines, bet, wins, frutillas, vueltas, bonus, win, label: label || "Nada esta vez" };
}
