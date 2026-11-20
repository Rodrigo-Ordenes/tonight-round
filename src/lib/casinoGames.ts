import { rng, type Card } from "@/lib/partyGames";

/*
 * Juegos de casino de Tonight: solo puntos, nunca dinero ni apuestas reales, y perder nunca obliga a tomar.
 * Todo sale de la semilla de la ronda (y del id de cada jugador), así la TV y cada celular ven lo mismo.
 */

/* ---------------- Tragamonedas ---------------- */

export interface SlotSymbol {
  id: string;
  label: string;
  /** Más peso = sale más seguido */
  weight: number;
}

/** La clásica: el logo de Tonight es el premio mayor */
export const SLOT_CLASSIC: SlotSymbol[] = [
  { id: "logo", label: "TONIGHT", weight: 1 },
  { id: "siete", label: "7", weight: 2 },
  { id: "diamante", label: "◆", weight: 3 },
  { id: "estrella", label: "★", weight: 3 },
  { id: "campana", label: "🔔", weight: 3 },
  { id: "uva", label: "🍇", weight: 4 },
];

/** La del bar: tragos reales en los rodillos y el vaso de agua como comodín (cuenta como cualquiera) */
export const SLOT_BAR: SlotSymbol[] = [
  { id: "piscola", label: "Piscola", weight: 3 },
  { id: "pisco_sour", label: "Pisco sour", weight: 3 },
  { id: "mojito", label: "Mojito", weight: 3 },
  { id: "terremoto", label: "Terremoto", weight: 2 },
  { id: "michelada_cl", label: "Michelada", weight: 3 },
  { id: "agua", label: "Agua", weight: 2 },
];

export type SlotKind = "clasica" | "bar";
const TABLE: Record<SlotKind, { symbols: SlotSymbol[]; jackpot: string; wild: string | null }> = {
  clasica: { symbols: SLOT_CLASSIC, jackpot: "logo", wild: null },
  bar: { symbols: SLOT_BAR, jackpot: "terremoto", wild: "agua" },
};

const hash = (text: string) => [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;

const weighted = (symbols: SlotSymbol[], r: () => number) => {
  const total = symbols.reduce((a, s) => a + s.weight, 0);
  let x = r() * total;
  for (const s of symbols) {
    x -= s.weight;
    if (x < 0) return s;
  }
  return symbols[symbols.length - 1];
};

/** Los tres rodillos de un jugador: dependen de la ronda y de quién tira */
export function slotSpin(seed: number, playerId: string, kind: SlotKind): SlotSymbol[] {
  const r = rng(seed ^ hash(playerId), kind === "bar" ? 41 : 40);
  return [0, 1, 2].map(() => weighted(TABLE[kind].symbols, r));
}

/** Lo que paga una tirada (en puntos) y cómo se cuenta */
export function slotPayout(reels: SlotSymbol[], kind: SlotKind): { points: number; label: string } {
  const { jackpot, wild } = TABLE[kind];
  const ids = reels.map((s) => s.id);
  const wilds = ids.filter((id) => id === wild).length;
  if (wild && wilds === 3) return { points: 40, label: "¡Hidratación total! Tres vasos de agua" };
  const counts = new Map<string, number>();
  ids.filter((id) => id !== wild).forEach((id) => counts.set(id, (counts.get(id) ?? 0) + 1));
  const [best, n] = [...counts.entries()].sort((a, b) => b[1] - a[1] || Number(b[0] === jackpot) - Number(a[0] === jackpot))[0] ?? ["", 0];
  const total = n + wilds;
  const name = reels.find((s) => s.id === best)?.label ?? "";
  if (total >= 3) return best === jackpot ? { points: 50, label: `¡Jackpot! Tres ${name}` } : { points: 20, label: `Tres ${name}` };
  if (total === 2) return { points: 8, label: `Par de ${name}` };
  return { points: 0, label: "Nada esta vez" };
}

/** Jackpot de la sala: tres máquinas, una paga el pozo, otra un premio chico y otra nada */
export function jackpotMachines(seed: number): { machine: string; points: number }[] {
  const r = rng(seed, 43);
  const pays = [25, 10, 0];
  for (let i = pays.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [pays[i], pays[j]] = [pays[j], pays[i]];
  }
  return pays.map((points, i) => ({ machine: String(i + 1), points }));
}

/* ---------------- Ruleta (europea, 0–36) ---------------- */

/** Orden real de los números en el cilindro europeo */
export const WHEEL_ORDER = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
/** Los «rojos» del paño clásico van en morado neón; los «negros», en azul neón; el cero, en menta */
const UV_NUMBERS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export type RouletteColor = "menta" | "morado" | "azul";
export const rouletteColor = (n: number): RouletteColor => (n === 0 ? "menta" : UV_NUMBERS.has(n) ? "morado" : "azul");

export function rouletteNumber(seed: number): number {
  return Math.floor(rng(seed, 44)() * 37);
}

/** Apuestas de fichas (sin plata): cada participante elige una */
export const ROULETTE_BETS = [
  { id: "morado", label: "Morado", pays: 10 },
  { id: "azul", label: "Azul", pays: 10 },
  { id: "par", label: "Par", pays: 10 },
  { id: "impar", label: "Impar", pays: 10 },
  { id: "d1", label: "1ª docena (1–12)", pays: 20 },
  { id: "d2", label: "2ª docena (13–24)", pays: 20 },
  { id: "d3", label: "3ª docena (25–36)", pays: 20 },
  { id: "cero", label: "Cero", pays: 60 },
];

export function rouletteWins(bet: string, n: number): boolean {
  if (bet === "cero") return n === 0;
  if (n === 0) return false;
  if (bet === "morado" || bet === "azul") return rouletteColor(n) === bet;
  if (bet === "par") return n % 2 === 0;
  if (bet === "impar") return n % 2 === 1;
  if (bet === "d1") return n <= 12;
  if (bet === "d2") return n >= 13 && n <= 24;
  if (bet === "d3") return n >= 25;
  return false;
}

/* ---------------- Blackjack contra el host ---------------- */

export const BLACKJACK_PLANS = [
  { id: "15", label: "Me planto en 15 (prudente)" },
  { id: "17", label: "Me planto en 17 (como el host)" },
  { id: "19", label: "Me planto en 19 (arriesgado)" },
];

/** Valor de una mano: el as vale 11 o 1, las figuras 10 */
export function handValue(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    if (c.rank === 14) {
      aces++;
      total += 11;
    } else total += Math.min(10, c.rank);
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

export const isNatural = (cards: Card[]) => cards.length === 2 && handValue(cards) === 21;

/**
 * Reparte un mazo barajado con la semilla: dos cartas a cada jugador (en orden por id) y al host, cada jugador pide
 * hasta su número de plantarse (o hasta pasarse) y el host pide hasta 17.
 */
export function blackjackDeal(seed: number, plans: { id: string; stand: number }[]): { dealer: Card[]; hands: Record<string, Card[]> } {
  const suits: Card["suit"][] = ["♠", "♥", "♦", "♣"];
  const deck = suits.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({ rank: i + 2, suit })));
  const r = rng(seed, 45);
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  let k = 0;
  const draw = () => deck[k++ % deck.length];
  const order = [...plans].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const hands: Record<string, Card[]> = Object.fromEntries(order.map((p) => [p.id, [] as Card[]]));
  const dealer: Card[] = [];
  for (let round = 0; round < 2; round++) {
    order.forEach((p) => hands[p.id].push(draw()));
    dealer.push(draw());
  }
  order.forEach((p) => {
    while (handValue(hands[p.id]) < p.stand) hands[p.id].push(draw());
  });
  while (handValue(dealer) < 17) dealer.push(draw());
  return { dealer, hands };
}

/** Resultado de una mano contra el host, en puntos */
export function blackjackOutcome(hand: Card[], dealer: Card[]): { points: number; label: string; win: boolean; lose: boolean } {
  const me = handValue(hand);
  const host = handValue(dealer);
  if (me > 21) return { points: 0, label: `Se pasó con ${me}`, win: false, lose: true };
  if (isNatural(hand) && !isNatural(dealer)) return { points: 30, label: "¡Blackjack!", win: true, lose: false };
  if (host > 21) return { points: 20, label: `${me}: el host se pasó`, win: true, lose: false };
  if (me > host) return { points: 20, label: `${me} contra ${host}`, win: true, lose: false };
  if (me === host) return { points: 5, label: `Empate en ${me}`, win: false, lose: false };
  return { points: 0, label: `${me} contra ${host}`, win: false, lose: true };
}
