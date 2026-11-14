/** Geometría pura de la red animada: celulares conectados a la pantalla de la sala. Coordenadas de 0 a 1. */

export const HUB = { x: 0.68, y: 0.42 };
export const MAX_NODES = 24;

const TRAVEL_FRACTION = 0.42;
const DRIFT = 0.008;
const GOLDEN = 2.399963229728653;

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface FieldNode {
  x: number;
  y: number;
  /** Desfase de 0 a 1 para que las señales no viajen a la vez */
  phase: number;
}

/** Reparte los nodos en espiral desde la pantalla central. Agregar personas no mueve a las que ya estaban. */
export function layoutField(count: number, seed: number): FieldNode[] {
  const nodes: FieldNode[] = [];
  const rand = rng(seed);
  const start = rand() * Math.PI * 2;
  for (let i = 0; i < Math.min(count, MAX_NODES); i++) {
    const angle = start + i * GOLDEN;
    const radius = 0.2 + 0.46 * Math.sqrt((i + 1) / MAX_NODES) + rand() * 0.06;
    nodes.push({
      x: Math.min(0.97, Math.max(0.03, HUB.x + Math.cos(angle) * radius)),
      y: Math.min(0.94, Math.max(0.06, HUB.y + Math.sin(angle) * radius)),
      phase: rand(),
    });
  }
  return nodes;
}

/** Deriva leve y continua de cada nodo. */
export function nodeDrift(index: number, t: number): { x: number; y: number } {
  return { x: Math.sin(t / 3100 + index * 1.7) * DRIFT, y: Math.cos(t / 3700 + index * 2.3) * DRIFT };
}

/** Avance de la señal en el enlace (0 a 1, frenando al llegar) o null mientras descansa. */
export function pulseProgress(phase: number, t: number, period: number): number | null {
  const cycle = (((t / period + phase) % 1) + 1) % 1;
  if (cycle >= TRAVEL_FRACTION) return null;
  const k = cycle / TRAVEL_FRACTION;
  return 1 - (1 - k) ** 3;
}

const GLYPHS = "ABCDEFGHJKLMNPQRSTUVWXY23456789";
const LOWER = "abcdefghjkmnpqrstuvwxyz";

/**
 * Fotograma de la decodificación: revela de izquierda a derecha. `progress` va de 0 a 1.
 * Respeta espacios y signos, y usa minúsculas donde el texto final las tiene.
 */
export function scrambleFrame(code: string, progress: number, random: () => number = Math.random): string {
  const chars = Array.from(code);
  const revealed = Math.floor(chars.length * Math.min(1, Math.max(0, progress)));
  return chars
    .map((c, i) => {
      if (i < revealed || !/[A-Za-z0-9]/.test(c)) return c;
      const pool = (/[a-z]/.test(c) ? LOWER : GLYPHS).replace(c, "");
      return pool[Math.floor(random() * pool.length)];
    })
    .join("");
}

/**
 * Celulares que disparan una señal cuando el contador `burst` sube de `prev` a `next`: uno por unidad, en orden.
 * Como la espiral reparte los índices consecutivos por toda la red, las señales salen de lugares distintos.
 */
export function burstTargets(prev: number, next: number, nodeCount: number): number[] {
  if (nodeCount <= 0 || !(next > prev)) return [];
  const out: number[] = [];
  for (let k = prev + 1; k <= next && out.length < nodeCount * 2; k++) out.push(k % nodeCount);
  return out;
}

/** Avance (0 a 1, frenando) de una señal disparada en `start`, o null antes de salir y después de llegar. */
export function shotProgress(start: number, t: number, duration: number): number | null {
  if (t < start || t > start + duration) return null;
  const k = (t - start) / duration;
  return 1 - (1 - k) ** 3;
}

/**
 * Lugares estables en la red de la TV: cada persona conserva el suyo cuando llegan otras; quien se va libera el
 * suyo para la siguiente que llega (el más bajo libre). Más allá de `max` no se asigna lugar.
 */
export function assignSlots(prev: ReadonlyMap<string, number>, ids: string[], max: number): Map<string, number> {
  const present = new Set(ids);
  const next = new Map<string, number>();
  for (const [id, slot] of prev) if (present.has(id) && slot < max) next.set(id, slot);
  const used = new Set(next.values());
  let free = 0;
  for (const id of ids) {
    if (next.has(id)) continue;
    while (used.has(free)) free++;
    if (free >= max) break;
    next.set(id, free);
    used.add(free);
  }
  return next;
}

/** Eventos que todavía no viajaron como señal. */
export function unseenEvents<T extends { key: string }>(seen: ReadonlySet<string>, events: T[]): T[] {
  return events.filter((e) => !seen.has(e.key));
}
