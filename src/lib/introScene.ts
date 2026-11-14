/**
 * Intro «La ronda»: una barra automática sirve cuatro tragos, brindan y cada vaso se vuelve un celular conectado a la
 * tele de la sala. Todo depende del avance del scroll (0 a 1) y se prueba sin navegador; lo que vive en el tiempo
 * (ondas, burbujas, oleaje, señales, gotas) lo agrega el componente. Coordenadas del SVG: 400 × 400, y hacia abajo.
 */
import { pourReadout } from "./pourPhysics";

export type GlassKind = "highball" | "pint" | "wine" | "tumbler";
export type Liquid = "pisco" | "cola" | "beer" | "wine" | "water";

export interface GlassShape {
  /** Del pie al borde */
  height: number;
  /** Medio ancho del borde (para el choque del brindis) */
  rim: number;
  /** Altura local del fondo del líquido y del nivel lleno (origen en el pie, negativa hacia arriba) */
  liquidBottom: number;
  liquidTop: number;
}

export const SHAPES: Record<GlassKind, GlassShape> = {
  highball: { height: 118, rim: 26, liquidBottom: -3, liquidTop: -100 },
  pint: { height: 112, rim: 24, liquidBottom: -3, liquidTop: -90 },
  wine: { height: 118, rim: 24, liquidBottom: -64, liquidTop: -90 },
  tumbler: { height: 86, rim: 28, liquidBottom: -3, liquidTop: -70 },
};

export interface Drink {
  name: string;
  person: string;
  kind: GlassKind;
  ml: number;
  abv: number;
}

/** La ronda: piscola (60 ml de pisco de 35° y 140 de bebida), lata de cerveza, copa de vino y un vaso de agua. */
export const ROUND: Drink[] = [
  { name: "Piscola", person: "Tú", kind: "highball", ml: 200, abv: 0.105 },
  { name: "Cerveza", person: "Cami", kind: "pint", ml: 350, abv: 0.05 },
  { name: "Vino", person: "Benja", kind: "wine", ml: 150, abv: 0.13 },
  { name: "Agua", person: "Fran", kind: "tumbler", ml: 250, abv: 0 },
];

export const COUNTER_Y = 300;
export const RAIL_Y = 20;
export const NOZZLE_Y = 36;
export const HUB_POS = { x: 200, y: 206 };
export const PARK_X = [62, 154, 246, 338];
export const NODE_POS = [
  { x: 84, y: 118 },
  { x: 316, y: 118 },
  { x: 80, y: 298 },
  { x: 320, y: 298 },
];
/** Otros celulares que se suman a la sala (solo aparecen, no se mueven) */
export const EXTRA_NODES = [
  { x: 150, y: 52 },
  { x: 262, y: 44 },
  { x: 30, y: 206 },
  { x: 370, y: 200 },
  { x: 146, y: 362 },
  { x: 262, y: 356 },
];
export const CLINK_AT = 0.71;
export const READY_AT = 0.94;
export const TOAST_RIM_Y = 124;
export const DROPS = 10;

const PISCO_SHARE = 0.3; // 60 de 200 ml
const TOAST_ROT = [8, 3, -3, -8];
const NODE_SCALE = 0.26;
/** Turno de cada vaso: el dispensador llega y empieza a servir */
const TURN = [0.08, 0.28, 0.4, 0.51];
const POURS: { from: number; to: number; glass: number; liquid: Liquid }[] = [
  { from: 0.12, to: 0.17, glass: 0, liquid: "pisco" },
  { from: 0.17, to: 0.24, glass: 0, liquid: "cola" },
  { from: 0.28, to: 0.36, glass: 1, liquid: "beer" },
  { from: 0.4, to: 0.47, glass: 2, liquid: "wine" },
  { from: 0.51, to: 0.555, glass: 3, liquid: "water" },
];
const HEAD_MOVES: [number, number, number, number][] = [
  [0.24, 0.28, 0, 1],
  [0.36, 0.4, 1, 2],
  [0.47, 0.51, 2, 3],
];
const HEAD_OUT: [number, number] = [0.59, 0.625];
const ICE_AT = 0.08;
const LEMON: [number, number] = [0.555, 0.59];
const RAISE: [number, number] = [0.62, CLINK_AT];
const RECOIL: [number, number] = [CLINK_AT, 0.75];
const NET: [number, number] = [0.76, 0.86];
const LABELS: [number, string][] = [
  [0, "Sirve la ronda"],
  [TURN[0], "Piscola"],
  [TURN[1], "Cerveza"],
  [TURN[2], "Vino"],
  [TURN[3], "Agua"],
  [RAISE[0], "¡Salud!"],
  [NET[0], "La noche, en vivo"],
];

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const span = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
const easeOut = (k: number) => 1 - (1 - k) ** 3;
const easeInOut = (k: number) => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);
// Traslados del dispensador: aceleración suave y pareja (en sí mismo es un riel)
const easeSine = (k: number) => 0.5 - 0.5 * Math.cos(Math.PI * k);
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Avance del líquido en un chorro: cae el primer 10 %, llena hasta el 90 % y en el último 10 % se corta. */
const pourFill = (p: number, w: { from: number; to: number }) => span(span(p, w.from, w.to), 0.1, 0.9);

export interface GlassState {
  /** Centro del vaso en el mundo */
  x: number;
  y: number;
  /** Grados, horario */
  rot: number;
  scale: number;
  fill: number;
  /** Piscola: cuánta bebida se mezcló (0 a 1) */
  mix: number;
  /** Opacidad del vaso dibujado y del nodo en que se convierte */
  outline: number;
  node: number;
  /** Opacidad y posición del nombre */
  name: number;
  nameX: number;
  nameY: number;
}

export interface IntroScene {
  glasses: GlassState[];
  head: { x: number; on: number };
  stream: { x: number; top: number; bottom: number; liquid: Liquid; glass: number } | null;
  /** Caída de cada hielo de la piscola y de la rodaja de limón del agua (0 arriba, 1 en el vaso) */
  ice: number[];
  lemon: number;
  /** Barra y reflejo */
  counter: number;
  hub: number;
  lines: number[];
  extras: number;
  bars: number[];
  label: string;
  hint: "scroll" | "network" | null;
  readout: { drink: number; ml: number; abv: number; grams: number } | null;
  clink: boolean;
  ready: boolean;
}

/** Punto del vaso en el mundo (origen en el pie, y negativa hacia arriba), con su giro y escala. */
export function toWorld(g: Pick<GlassState, "x" | "y" | "rot" | "scale">, kind: GlassKind, lx: number, ly: number): { x: number; y: number } {
  const cy = ly + SHAPES[kind].height / 2;
  const c = Math.cos(rad(g.rot));
  const s = Math.sin(rad(g.rot));
  return { x: g.x + g.scale * (lx * c - cy * s), y: g.y + g.scale * (lx * s + cy * c) };
}

/** El mismo cambio de coordenadas como transform de SVG (los dibujos del vaso usan el pie como origen). */
export function glassTransform(g: Pick<GlassState, "x" | "y" | "rot" | "scale">, kind: GlassKind): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  return `translate(${r(g.x)} ${r(g.y)}) rotate(${r(g.rot)}) scale(${Math.round(g.scale * 1000) / 1000}) translate(0 ${SHAPES[kind].height / 2})`;
}

/** Altura local del nivel del líquido según cuánto se llenó. */
export function levelLocal(kind: GlassKind, fill: number): number {
  const s = SHAPES[kind];
  return s.liquidBottom + (s.liquidTop - s.liquidBottom) * fill;
}

/** Brindis: centros calculados para que el borde de cada vaso toque el del vecino (1 de holgura). */
const TOAST = (() => {
  const corner = (i: number, side: 1 | -1) => {
    const kind = ROUND[i].kind;
    return toWorld({ x: 0, y: 0, rot: TOAST_ROT[i], scale: 1 }, kind, side * SHAPES[kind].rim, -SHAPES[kind].height).x;
  };
  const x = [0, 0, 0, 0];
  x[1] = HUB_POS.x - 1 - corner(1, 1);
  x[2] = HUB_POS.x + 1 - corner(2, -1);
  x[0] = x[1] + corner(1, -1) - 1 - corner(0, 1);
  x[3] = x[2] + corner(2, 1) + 1 - corner(3, -1);
  const y = ROUND.map((d, i) => TOAST_RIM_Y + (SHAPES[d.kind].height / 2) * Math.cos(rad(TOAST_ROT[i])));
  return { x, y };
})();

export function sceneAt(progress: number): IntroScene {
  const p = clamp01(progress);
  const fPisco = pourFill(p, POURS[0]);
  const fCola = pourFill(p, POURS[1]);
  const fills = [PISCO_SHARE * fPisco + (1 - PISCO_SHARE) * fCola, pourFill(p, POURS[2]), pourFill(p, POURS[3]), pourFill(p, POURS[4])];
  const raise = easeInOut(span(p, RAISE[0], RAISE[1]));
  const recoil = easeOut(span(p, RECOIL[0], RECOIL[1]));
  const net = easeInOut(span(p, NET[0], NET[1]));
  const become = span(p, 0.8, 0.86);

  const glasses = ROUND.map((d, i): GlassState => {
    const h = SHAPES[d.kind].height;
    // Choque y rebote leve hacia afuera: queda claro que se tocaron
    const toastX = TOAST.x[i] + (i - 1.5) * 5 * recoil;
    const toastRot = TOAST_ROT[i] * (1 - 0.3 * recoil);
    const x = lerp(lerp(PARK_X[i], toastX, raise), NODE_POS[i].x, net);
    const y = lerp(lerp(COUNTER_Y - h / 2, TOAST.y[i], raise), NODE_POS[i].y, net);
    const rot = lerp(toastRot * raise, 0, net);
    const name = Math.max(span(p, TURN[i], TURN[i] + 0.03) * (1 - span(p, RAISE[0], RAISE[0] + 0.03)), span(p, 0.84, 0.88));
    const atNode = p >= 0.8;
    return {
      x,
      y,
      rot,
      scale: lerp(1, NODE_SCALE, net),
      fill: fills[i],
      mix: i === 0 ? fCola : 0,
      outline: 1 - become,
      node: become,
      name,
      nameX: atNode ? NODE_POS[i].x : PARK_X[i],
      nameY: atNode ? NODE_POS[i].y + 24 : COUNTER_Y + 24,
    };
  });

  let headX = PARK_X[0];
  for (const [a, b, from, to] of HEAD_MOVES) if (p >= a) headX = lerp(PARK_X[from], PARK_X[to], easeSine(span(p, a, b)));
  if (p >= HEAD_OUT[0]) headX = lerp(PARK_X[3], 440, easeSine(span(p, HEAD_OUT[0], HEAD_OUT[1])));

  let stream: IntroScene["stream"] = null;
  for (const w of POURS) {
    if (p <= w.from || p >= w.to) continue;
    const k = span(p, w.from, w.to);
    const g = glasses[w.glass];
    const kind = ROUND[w.glass].kind;
    const len = toWorld(g, kind, 0, levelLocal(kind, g.fill)).y - NOZZLE_Y;
    stream = { x: PARK_X[w.glass], top: NOZZLE_Y + len * span(k, 0.9, 1), bottom: NOZZLE_Y + len * span(k, 0, 0.1), liquid: w.liquid, glass: w.glass };
  }

  let readout: IntroScene["readout"] = null;
  if (p >= TURN[0] && p < RAISE[0]) {
    let i = 0;
    TURN.forEach((at, idx) => {
      if (p >= at) i = idx;
    });
    if (i === 0) {
      const r = pourReadout({ pisco: fPisco, cola: fCola });
      readout = { drink: 0, ml: r.piscoMl + r.colaMl, abv: r.abv, grams: r.grams };
    } else {
      const d = ROUND[i];
      const f = fills[i];
      readout = { drink: i, ml: Math.round(d.ml * f), abv: f > 0 ? d.abv : 0, grams: d.ml * d.abv * 0.8 * f };
    }
  }

  let label = LABELS[0][1];
  for (const [at, text] of LABELS) if (p >= at) label = text;

  return {
    glasses,
    head: { x: headX, on: 1 - span(p, 0.605, 0.635) },
    stream,
    // La gravedad acelera la caída
    ice: [0, 1, 2].map((j) => span(p, ICE_AT + j * 0.012, ICE_AT + 0.016 + j * 0.012) ** 2),
    lemon: span(p, LEMON[0], LEMON[1]) ** 2,
    counter: 1 - span(p, RAISE[0], 0.7),
    hub: easeOut(span(p, 0.78, 0.86)),
    lines: NODE_POS.map((_, i) => easeOut(span(p, 0.8 + i * 0.016, 0.86 + i * 0.016))),
    extras: span(p, 0.84, 0.9),
    bars: [0, 1, 2, 3].map((i) => easeOut(span(p, 0.86 + i * 0.014, 0.9 + i * 0.014))),
    label,
    hint: p < TURN[0] ? "scroll" : p >= 0.78 ? "network" : null,
    readout,
    clink: p >= CLINK_AT,
    ready: p >= READY_AT,
  };
}

/** Gota del brindis `i` a los `ms` del choque, relativa al punto de contacto; null cuando ya cayó. */
export function dropletAt(i: number, ms: number): { x: number; y: number; o: number } | null {
  const life = 800;
  if (ms < 0 || ms > life) return null;
  const tau = ms / 1000;
  const angle = rad(-135 + (90 * (i % DROPS)) / (DROPS - 1));
  const speed = 120 + ((i * 7) % 5) * 10;
  return { x: Math.cos(angle) * speed * tau, y: Math.sin(angle) * speed * tau + 0.5 * 520 * tau * tau, o: 1 - ms / life };
}
