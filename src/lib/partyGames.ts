import type { LiveGame, LiveRound, Participant } from "./carreteState";
import { BLACKJACK_PLANS, ROULETTE_BETS, blackjackDeal, blackjackOutcome, handValue, jackpotMachines, rouletteColor, rouletteNumber, rouletteWins, slotPayout, slotSpin, type SlotKind } from "@/lib/casinoGames";
import { INFILTRADO, MAYORIA, MENTIROSO, PORCENTAJE, ULTIMO_COLORES, ULTIMO_FIGURAS } from "@/data/party_games";

/**
 * Party Games: motor común de juegos de azar, predicción, psicología y reflejos.
 *
 * Cada juego es una ronda en vivo como las demás (TV = escenario, celulares = control) y comparte el flujo
 * ESPERA → ELECCIÓN (secreta, desde cada celular) → BLOQUEO → ANIMACIÓN (TV) → RESULTADO → SIGUIENTE RONDA.
 * El azar sale de una semilla guardada en la ronda: la TV y cada celular calculan el mismo resultado, aunque revele
 * cualquiera. Los puntos de cada ronda quedan en el historial y forman el ranking de la noche.
 *
 * Reducción de daños: perder da puntos negativos o un reto con alternativas (agua, verdad, pasar); nunca obliga a
 * tomar y no escala por perder varias rondas.
 */

export type PartyCategory = "Azar" | "Predicción" | "Psicología" | "Deducción" | "Reflejos" | "Desafíos" | "Casino";

export interface PartyGameDef {
  id: LiveGame;
  name: string;
  emoji: string;
  category: PartyCategory;
  blurb: string;
  minPlayers: number;
  /** Texto para el catálogo, por ejemplo «1 min» */
  duration: string;
  /** Segundos para elegir */
  seconds: number;
}

export const PARTY_GAMES: PartyGameDef[] = [
  { id: "proximidad", name: "Ruleta de proximidad", emoji: "🎯", category: "Azar", blurb: "Elige un número del 0 al 100. La ruleta gira y gana quien quede más cerca.", minPlayers: 1, duration: "1 min", seconds: 30 },
  { id: "cronometro", name: "La bomba de tiempo", emoji: "⏱️", category: "Reflejos", blurb: "Detén la bomba en el segundo secreto. Gana quien quede más cerca.", minPlayers: 1, duration: "1 min", seconds: 40 },
  { id: "mayoria", name: "La mayoría gana", emoji: "🗳️", category: "Predicción", blurb: "Predice qué elegirá la mayoría y después responde tú. Acertar da puntos.", minPlayers: 1, duration: "1 min", seconds: 45 },
  { id: "cajas", name: "Las cajas", emoji: "🎁", category: "Azar", blurb: "Seis cajas cerradas: premios, un comodín y una que resta. Se abren todas juntas.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "mentiroso", name: "El mentiroso", emoji: "🤥", category: "Deducción", blurb: "Todos cuentan algo verdadero menos uno, que inventa. Voten quién miente.", minPlayers: 1, duration: "2 min", seconds: 90 },
  { id: "dados", name: "Dado misterioso", emoji: "🎲", category: "Azar", blurb: "¿La suma de dos dados será baja, media, alta o doble? Los dobles pagan más.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "mayormenor", name: "Mayor o menor", emoji: "🃏", category: "Predicción", blurb: "Hay una carta a la vista. ¿La siguiente será mayor o menor?", minPlayers: 1, duration: "30 s", seconds: 20 },
  { id: "casilla", name: "La casilla maldita", emoji: "💀", category: "Azar", blurb: "Nueve casillas y una maldita. Elige la tuya y cruza los dedos.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "probable", name: "¿Quién es más probable?", emoji: "👉", category: "Psicología", blurb: "Todos votan a alguien de la sala. Quien vota con la mayoría suma puntos.", minPlayers: 1, duration: "45 s", seconds: 30 },
  { id: "infiltrado", name: "El infiltrado", emoji: "🕶️", category: "Deducción", blurb: "Todos tienen la misma palabra menos uno. Den pistas y descubran al infiltrado.", minPlayers: 1, duration: "3 min", seconds: 150 },
  { id: "porcentaje", name: "Predice el porcentaje", emoji: "📊", category: "Predicción", blurb: "¿Qué porcentaje de la sala dirá que sí? Predice y responde.", minPlayers: 1, duration: "1 min", seconds: 40 },
  { id: "reflejos", name: "No te adelantes", emoji: "⚡", category: "Reflejos", blurb: "Espera la señal y toca lo más rápido que puedas. Quien se adelanta, queda fuera.", minPlayers: 1, duration: "30 s", seconds: 30 },
  { id: "ultimo", name: "Último en pie", emoji: "🏁", category: "Desafíos", blurb: "Instrucciones cada vez más rápidas. Gana quien llegue más lejos sin fallar.", minPlayers: 1, duration: "1 min", seconds: 60 },
  // Casino de puntos: nadie apuesta plata y perder no obliga a tomar
  { id: "tragamonedas", name: "Tragamonedas Tonight", emoji: "🎰", category: "Casino", blurb: "Cada uno tira su palanca. Tres logos de Tonight pagan el premio mayor.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "tragabar", name: "Tragamonedas del bar", emoji: "🍹", category: "Casino", blurb: "Tragos reales en los rodillos y el vaso de agua como comodín.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "jackpot", name: "Jackpot de la sala", emoji: "💎", category: "Casino", blurb: "Tres máquinas y una paga el pozo. Elige la tuya.", minPlayers: 1, duration: "30 s", seconds: 25 },
  { id: "ruleta", name: "Ruleta del casino", emoji: "🎡", category: "Casino", blurb: "Pon tus fichas (sin plata) a color, par o impar, docena o al cero. Gira la ruleta.", minPlayers: 1, duration: "45 s", seconds: 40 },
  { id: "blackjack", name: "Blackjack contra el host", emoji: "🃏", category: "Casino", blurb: "Elige hasta dónde pides cartas. El host reparte y se planta en 17.", minPlayers: 1, duration: "45 s", seconds: 40 },
];

export const PARTY_CATEGORIES: PartyCategory[] = ["Casino", "Azar", "Predicción", "Psicología", "Deducción", "Reflejos", "Desafíos"];

/** Juegos con lógica propia de Party Games (¿Quién es más probable? usa la del juego en vivo y suma puntos aparte) */
const PARTY_IDS = new Set<LiveGame>(PARTY_GAMES.map((g) => g.id).filter((id) => id !== "probable"));
export const isPartyGame = (game: LiveGame) => PARTY_IDS.has(game);
export const PARTY_BY_ID = new Map(PARTY_GAMES.map((g) => [g.id, g]));

/* ---------------- Azar con semilla ---------------- */

/** mulberry32: rápido, determinista y suficiente para un juego */
export function rng(seed: number, salt = 0): () => number {
  let a = (seed ^ (salt * 0x9e3779b9)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const int = (r: () => number, min: number, max: number) => min + Math.floor(r() * (max - min + 1));
const shuffle = <T,>(xs: readonly T[], r: () => number): T[] => {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/* ---------------- Cartas ---------------- */

export interface Card {
  rank: number; // 2..14 (14 = A)
  suit: "♥" | "♦" | "♣" | "♠";
}
const SUITS: Card["suit"][] = ["♥", "♦", "♣", "♠"];
const RANK_LABEL: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
export const cardLabel = (c: Card) => `${RANK_LABEL[c.rank] ?? c.rank}${c.suit}`;

/** Carta inicial (a la vista desde el comienzo) y la siguiente (se revela) */
export function mayorMenorCards(seed: number): { first: Card; next: Card } {
  const deck = shuffle(
    SUITS.flatMap((suit) => Array.from({ length: 13 }, (_, i) => ({ rank: i + 2, suit }))),
    rng(seed, 3)
  );
  // La inicial nunca es un extremo (2 o A): con un 2 o un A la respuesta sería obvia
  const first = deck.find((c) => c.rank > 2 && c.rank < 14)!;
  const next = deck.find((c) => c !== first)!;
  return { first, next };
}

/* ---------------- Resultados de cada juego (deterministas) ---------------- */

export const proximidadNumber = (seed: number) => int(rng(seed, 1), 0, 100);
export const dados = (seed: number): [number, number] => {
  const r = rng(seed, 2);
  return [int(r, 1, 6), int(r, 1, 6)];
};
/** Segundo secreto de la bomba de tiempo, en ms (5,0 a 12,0 s en pasos de 0,5) */
export const cronometroTarget = (seed: number) => 5000 + int(rng(seed, 4), 0, 14) * 500;
export const casillaMaldita = (seed: number) => int(rng(seed, 5), 1, 9);

export type CajaPremio = { label: string; points: number; wild?: boolean };
const CAJAS: CajaPremio[] = [
  { label: "+20", points: 20 },
  { label: "+5", points: 5 },
  { label: "Comodín", points: 15, wild: true },
  { label: "+10", points: 10 },
  { label: "−5", points: -5 },
  { label: "+30", points: 30 },
];
/** Contenido de las cajas 1..6 */
export const cajas = (seed: number): CajaPremio[] => shuffle(CAJAS, rng(seed, 6));

/** Espera antes de la señal en «No te adelantes», en ms */
export const reflejosDelay = (seed: number) => 1500 + int(rng(seed, 7), 0, 3500);

export interface UltimoPaso {
  text: string;
  /** Opciones del paso: la correcta es `answer` */
  options: { id: string; label: string; color?: string }[];
  answer: string;
  /** Tiempo para responder: se acorta en cada paso */
  ms: number;
}
/** Secuencia de «Último en pie»: 12 pasos, cada vez con menos tiempo */
export function ultimoPasos(seed: number): UltimoPaso[] {
  const r = rng(seed, 8);
  return Array.from({ length: 12 }, (_, i) => {
    const ms = Math.max(1100, 3200 - i * 190);
    const kind = int(r, 0, 2);
    if (kind === 0) {
      const opts = shuffle(ULTIMO_COLORES, r);
      const t = opts[int(r, 0, 3)];
      return { text: `Toca el ${t.label}`, options: opts.map((c) => ({ id: c.id, label: "", color: c.css })), answer: t.id, ms };
    }
    if (kind === 1) {
      const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9], r).slice(0, 4);
      const t = nums[int(r, 0, 3)];
      return { text: `Toca el ${t}`, options: nums.map((n) => ({ id: String(n), label: String(n) })), answer: String(t), ms };
    }
    const shapes = shuffle(ULTIMO_FIGURAS, r);
    const t = shapes[int(r, 0, 3)];
    return { text: `Toca el ${t}`, options: shapes.map((f) => ({ id: f, label: f })), answer: t, ms };
  });
}

/* ---------------- Construcción de rondas ---------------- */

const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(Math.random() * xs.length)];

export const DADOS_OPCIONES = [
  { id: "low", label: "Suma 2 a 5" },
  { id: "mid", label: "Suma 6 a 8" },
  { id: "high", label: "Suma 9 a 12" },
  { id: "double", label: "Doble" },
];

/** Datos de la ronda para un juego de Party Games. `base` trae id, juego, inicio y duración. */
export function buildPartyRound(
  game: LiveGame,
  base: { id: string; game: LiveGame; startedAt: number; durationMs: number },
  people: Participant[],
  fresh: <T>(xs: T[], key: (x: T) => string) => T
): Omit<LiveRound, "votes" | "revealedAt" | "endedAt"> {
  const seed = (Math.random() * 2 ** 32) >>> 0;
  const r = { ...base, seed };
  const peopleOptions = people.map((p) => ({ id: p.id, label: p.name }));
  switch (game) {
    case "proximidad":
      return { ...r, prompt: "Elige un número del 0 al 100. La ruleta gira y gana quien quede más cerca.", options: [] };
    case "dados":
      return { ...r, prompt: "¿Cómo saldrán los dos dados? Los dobles pagan triple.", options: DADOS_OPCIONES };
    case "mayormenor": {
      const { first } = mayorMenorCards(seed);
      return { ...r, prompt: `La carta es ${cardLabel(first)}. ¿La siguiente será mayor o menor?`, options: [{ id: "mayor", label: "⬆️ Mayor" }, { id: "menor", label: "⬇️ Menor" }] };
    }
    case "cronometro":
      return { ...r, prompt: "La bomba explota en un segundo secreto entre 5 y 12. Detenla lo más cerca posible.", options: [] };
    case "casilla":
      return { ...r, prompt: "Una de estas nueve casillas está maldita. Elige la tuya.", options: Array.from({ length: 9 }, (_, i) => ({ id: String(i + 1), label: String(i + 1) })) };
    case "tragamonedas":
    case "tragabar":
      return { ...r, prompt: "Tira tu palanca: los rodillos giran en la TV.", options: [{ id: "tirar", label: "🎰 Tirar la palanca" }] };
    case "jackpot":
      return { ...r, prompt: "Una de las tres máquinas paga el pozo. Elige la tuya.", options: [1, 2, 3].map((n) => ({ id: String(n), label: `Máquina ${n}` })) };
    case "ruleta":
      return { ...r, prompt: "Pon tus fichas: no hay plata en juego, solo puntos.", options: ROULETTE_BETS.map((b) => ({ id: b.id, label: `${b.label} · paga ${b.pays}` })) };
    case "blackjack":
      return { ...r, prompt: "El host reparte. ¿Hasta dónde pides cartas?", options: BLACKJACK_PLANS };
    case "cajas":
      return { ...r, prompt: "Elige una caja. Se abren todas a la vez.", options: Array.from({ length: 6 }, (_, i) => ({ id: String(i + 1), label: `Caja ${i + 1}` })) };
    case "mentiroso": {
      const liar = pick(people);
      return {
        ...r,
        prompt: `${fresh(MENTIROSO, (x) => x)} Por turnos, cada uno responde en voz alta. Uno está inventando: voten quién.`,
        options: peopleOptions,
        answer: liar.id,
      };
    }
    case "infiltrado": {
      const [word, alt] = fresh(INFILTRADO, (x) => x.join("|"));
      const spy = pick(people);
      return {
        ...r,
        prompt: "Den dos rondas de pistas sobre su palabra, sin decirla. Después voten al infiltrado.",
        options: peopleOptions,
        answer: spy.id,
        secret: word,
        secretAlt: alt,
      };
    }
    case "mayoria": {
      const q = fresh(MAYORIA, (x) => x.q);
      return { ...r, prompt: q.q, options: q.options.map((label, i) => ({ id: "abcd"[i], label })) };
    }
    case "porcentaje":
      return { ...r, prompt: fresh(PORCENTAJE, (x) => x), options: [] };
    case "reflejos":
      return { ...r, prompt: "Toca «Estoy listo» y espera la señal. Si tocas antes, quedas fuera.", options: [] };
    case "ultimo":
      return { ...r, prompt: "Sigue las instrucciones lo más rápido que puedas. Al primer error, quedas fuera.", options: [] };
    default:
      return { ...r, prompt: "", options: [] };
  }
}

/* ---------------- Resolución ---------------- */

export interface PartyRow {
  id: string;
  name: string;
  /** Lo que eligió, en palabras */
  pick: string;
  /** Detalle del resultado (diferencia, premio, tiempo) */
  detail: string;
  points: number;
  win: boolean;
  lose: boolean;
}

export interface PartyResult {
  headline: string;
  /** Resultado en palabras: el número, los dados, la carta, la casilla… */
  outcome: string;
  rows: PartyRow[];
  winnerIds: string[];
  loserIds: string[];
  points: Record<string, number>;
  spotlightId?: string;
}

const pctOf = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const secs = (ms: number) => `${(ms / 1000).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s`;

/** Gana quien queda más cerca (menor diferencia); pierde quien queda más lejos. Empates comparten. */
function closest(
  entries: { id: string; value: number }[],
  target: number,
  winPoints: number,
  fmt: (d: number) => string
): { rows: Map<string, { detail: string; points: number; win: boolean; lose: boolean }>; winnerIds: string[]; loserIds: string[] } {
  const diffs = entries.map((e) => ({ ...e, d: Math.abs(e.value - target) }));
  const best = Math.min(...diffs.map((d) => d.d));
  const worst = Math.max(...diffs.map((d) => d.d));
  const rows = new Map<string, { detail: string; points: number; win: boolean; lose: boolean }>();
  const winnerIds: string[] = [];
  const loserIds: string[] = [];
  diffs.forEach((e) => {
    const win = e.d === best;
    const lose = !win && e.d === worst && diffs.length > 1;
    if (win) winnerIds.push(e.id);
    if (lose) loserIds.push(e.id);
    rows.set(e.id, { detail: e.d === 0 ? "¡Exacto!" : `${fmt(e.d)} de diferencia`, points: win ? (e.d === 0 ? winPoints * 2 : winPoints) : 0, win, lose });
  });
  return { rows, winnerIds, loserIds };
}

/**
 * Resultado de una ronda de Party Games: quién ganó, quién cumple y cuántos puntos se lleva cada uno.
 * Pura y determinista (misma ronda y votos → mismo resultado) para que la TV y los celulares coincidan.
 */
export function resolveParty(round: LiveRound, participants: Participant[]): PartyResult {
  const people = participants.filter((p) => !p.deleted);
  const name = (id?: string) => people.find((p) => p.id === id)?.name ?? "alguien";
  const voters = people.filter((p) => round.votes[p.id]);
  const vote = (id: string) => round.votes[id]?.value ?? "";
  const seed = round.seed ?? 0;
  const points: Record<string, number> = {};
  const rows: PartyRow[] = [];
  const winnerIds: string[] = [];
  const loserIds: string[] = [];
  const push = (id: string, pick: string, detail: string, pts: number, win: boolean, lose: boolean) => {
    rows.push({ id, name: name(id), pick, detail, points: pts, win, lose });
    if (pts) points[id] = pts;
    if (win) winnerIds.push(id);
    if (lose) loserIds.push(id);
  };
  const names = (ids: string[]) => ids.map(name).join(" y ");
  const done = (headline: string, outcome: string, spotlightId?: string): PartyResult => ({
    headline,
    outcome,
    rows: rows.sort((a, b) => b.points - a.points || Number(a.lose) - Number(b.lose)),
    winnerIds,
    loserIds,
    points,
    spotlightId,
  });

  switch (round.game) {
    case "proximidad": {
      const n = proximidadNumber(seed);
      const entries = voters.map((p) => ({ id: p.id, value: Math.max(0, Math.min(100, Number(vote(p.id)) || 0)) }));
      const c = closest(entries, n, 20, (d) => String(d));
      entries.forEach((e) => {
        const x = c.rows.get(e.id)!;
        push(e.id, String(e.value), x.detail, x.points, x.win, x.lose);
      });
      return done(winnerIds.length ? `La ruleta cayó en ${n}. ${winnerIds.length > 1 ? "Ganan" : "Gana"} ${names(winnerIds)}.` : `La ruleta cayó en ${n}.`, String(n));
    }
    case "dados": {
      const [a, b] = dados(seed);
      const sum = a + b;
      const hit = new Set<string>([sum <= 5 ? "low" : sum <= 8 ? "mid" : "high"]);
      if (a === b) hit.add("double");
      voters.forEach((p) => {
        const v = vote(p.id);
        const ok = hit.has(v);
        const label = DADOS_OPCIONES.find((o) => o.id === v)?.label ?? v;
        push(p.id, label, ok ? "Acertó" : "Falló", ok ? (v === "double" ? 30 : 10) : 0, ok, !ok);
      });
      return done(`Salió ${a} y ${b}: suma ${sum}${a === b ? ", ¡doble!" : ""}.`, `${a} · ${b}`);
    }
    case "mayormenor": {
      const { first, next } = mayorMenorCards(seed);
      const tie = first.rank === next.rank;
      const right = next.rank > first.rank ? "mayor" : "menor";
      voters.forEach((p) => {
        const v = vote(p.id);
        const ok = !tie && v === right;
        push(p.id, v === "mayor" ? "Mayor" : "Menor", tie ? "Empate" : ok ? "Acertó" : "Falló", ok ? 10 : 0, ok, !tie && !ok);
      });
      return done(tie ? `Salió ${cardLabel(next)}: igual que ${cardLabel(first)}. Nadie pierde.` : `Salió ${cardLabel(next)}: era ${right}.`, `${cardLabel(first)} → ${cardLabel(next)}`);
    }
    case "cronometro": {
      const target = cronometroTarget(seed);
      const entries = voters.map((p) => ({ id: p.id, value: Math.max(0, Math.min(60_000, Number(vote(p.id)) || 0)) }));
      const c = closest(entries, target, 20, secs);
      entries.forEach((e) => {
        const x = c.rows.get(e.id)!;
        push(e.id, secs(e.value), x.detail, x.points, x.win, x.lose);
      });
      return done(winnerIds.length ? `El segundo secreto era ${secs(target)}. ${winnerIds.length > 1 ? "Ganan" : "Gana"} ${names(winnerIds)}.` : `El segundo secreto era ${secs(target)}.`, secs(target));
    }
    case "casilla": {
      const cursed = casillaMaldita(seed);
      voters.forEach((p) => {
        const v = Number(vote(p.id));
        const bad = v === cursed;
        push(p.id, `Casilla ${v}`, bad ? "¡Maldita!" : "A salvo", bad ? -5 : 10, !bad, bad);
      });
      return done(loserIds.length ? `La casilla maldita era la ${cursed}: ${names(loserIds)} ${loserIds.length > 1 ? "cayeron" : "cayó"}.` : `La casilla maldita era la ${cursed}. ¡Nadie cayó!`, String(cursed));
    }
    case "tragamonedas":
    case "tragabar": {
      const kind: SlotKind = round.game === "tragabar" ? "bar" : "clasica";
      voters.forEach((p) => {
        const reels = slotSpin(seed, p.id, kind);
        const pay = slotPayout(reels, kind);
        push(p.id, reels.map((x) => x.label).join(" · "), pay.label, pay.points, pay.points >= 20, false);
      });
      const top = rows.reduce((m, x) => Math.max(m, x.points), 0);
      const small = rows.filter((x) => x.points > 0 && !x.win).map((x) => x.id);
      return done(
        winnerIds.length ? `${top >= 50 ? "¡Jackpot!" : "Pagó la máquina:"} ${names(winnerIds)}.` : small.length ? `Premios chicos para ${names(small)}.` : "Los rodillos no pagaron esta vez.",
        "",
        winnerIds[0] ?? small[0]
      );
    }
    case "jackpot": {
      const machines = jackpotMachines(seed);
      const pot = machines.find((m) => m.points === 25)!.machine;
      voters.forEach((p) => {
        const m = machines.find((x) => x.machine === vote(p.id)) ?? machines[0];
        push(p.id, `Máquina ${m.machine}`, m.points === 25 ? "¡Pagó el pozo!" : m.points ? "Premio chico" : "Sin premio", m.points, m.points === 25, false);
      });
      return done(`Pagó la máquina ${pot}${winnerIds.length ? `: ${names(winnerIds)}` : ". Nadie la eligió"}.`, pot);
    }
    case "ruleta": {
      const n = rouletteNumber(seed);
      voters.forEach((p) => {
        const bet = ROULETTE_BETS.find((b) => b.id === vote(p.id)) ?? ROULETTE_BETS[0];
        const won = rouletteWins(bet.id, n);
        // En el casino perder nunca genera reto (ni sorbo): solo no suma
        push(p.id, bet.label, won ? `Ganó ${bet.pays} fichas` : "La banca se queda las fichas", won ? bet.pays : 0, won, false);
      });
      return done(`Salió el ${n} ${rouletteColor(n)}. ${winnerIds.length ? `${winnerIds.length > 1 ? "Ganan" : "Gana"} ${names(winnerIds)}.` : "Nadie acertó."}`, String(n));
    }
    case "blackjack": {
      const plans = voters.map((p) => ({ id: p.id, stand: Number(vote(p.id)) || 17 }));
      const { dealer, hands } = blackjackDeal(seed, plans);
      plans.forEach(({ id }) => {
        const o = blackjackOutcome(hands[id], dealer);
        push(id, hands[id].map(cardLabel).join(" "), o.label, o.points, o.win, false);
      });
      return done(`El host hizo ${handValue(dealer)}${handValue(dealer) > 21 ? " y se pasó" : ""}. ${winnerIds.length ? `${winnerIds.length > 1 ? "Le ganan" : "Le gana"} ${names(winnerIds)}.` : "Gana la casa."}`, dealer.map(cardLabel).join(" "));
    }
    case "cajas": {
      const prizes = cajas(seed);
      voters.forEach((p) => {
        const i = Math.max(1, Math.min(6, Number(vote(p.id)) || 1));
        const prize = prizes[i - 1];
        push(p.id, `Caja ${i}`, prize.wild ? "Comodín: elige quién cumple el próximo reto" : prize.label, prize.points, prize.points >= 20 || !!prize.wild, prize.points < 0);
      });
      return done(`Se abrieron las cajas. ${loserIds.length ? `${names(loserIds)} sacó la que resta.` : "Nadie sacó la que resta."}`, prizes.map((p) => p.label).join(" · "));
    }
    case "mentiroso":
    case "infiltrado": {
      const target = round.answer ?? "";
      const counts = new Map<string, number>();
      voters.forEach((p) => counts.set(vote(p.id), (counts.get(vote(p.id)) ?? 0) + 1));
      const max = Math.max(0, ...counts.values());
      const top = [...counts.entries()].filter(([, c]) => c === max).map(([id]) => id);
      const caught = top.length === 1 && top[0] === target;
      people.forEach((p) => {
        const v = vote(p.id);
        if (p.id === target) {
          push(p.id, v ? `Votó a ${name(v)}` : "—", round.game === "mentiroso" ? "Era quien mentía" : `Era el infiltrado (${round.secretAlt})`, caught ? 0 : 30, !caught, caught);
        } else if (v) {
          const right = v === target;
          push(p.id, `Votó a ${name(v)}`, right ? "Lo descubrió" : "Se equivocó", right ? 10 : 0, right && caught, !caught);
        }
      });
      const who = name(target);
      const headline =
        round.game === "mentiroso"
          ? caught
            ? `¡Descubrieron a ${who}! Era quien mentía.`
            : `${who} mintió y nadie lo pilló.`
          : caught
            ? `¡Atraparon a ${who}! Su palabra era «${round.secretAlt}» y la de todos, «${round.secret}».`
            : `${who} se infiltró: su palabra era «${round.secretAlt}» y la de todos, «${round.secret}».`;
      return done(headline, who, target);
    }
    case "mayoria": {
      const answers = new Map<string, number>();
      voters.forEach((p) => {
        const ans = vote(p.id).split("|")[1];
        if (ans) answers.set(ans, (answers.get(ans) ?? 0) + 1);
      });
      const max = Math.max(0, ...answers.values());
      const top = new Set([...answers.entries()].filter(([, c]) => c === max && max > 0).map(([id]) => id));
      const label = (id?: string) => round.options.find((o) => o.id === id)?.label ?? "—";
      voters.forEach((p) => {
        const [pred, ans] = vote(p.id).split("|");
        const ok = top.has(pred);
        push(p.id, `Predijo ${label(pred)} · respondió ${label(ans)}`, ok ? "Acertó a la mayoría" : "Falló", ok ? 10 : 0, ok, !ok);
      });
      const tops = [...top].map(label);
      return done(tops.length ? `Ganó ${tops.join(" y ")} con ${max} ${max === 1 ? "voto" : "votos"}.` : "Nadie respondió.", tops.join(" · "));
    }
    case "porcentaje": {
      const yes = voters.filter((p) => vote(p.id).split("|")[1] === "si").length;
      const real = pctOf(yes, voters.length);
      const entries = voters.map((p) => ({ id: p.id, value: Math.max(0, Math.min(100, Number(vote(p.id).split("|")[0]) || 0)) }));
      const c = closest(entries, real, 20, (d) => `${d} %`);
      entries.forEach((e) => {
        const x = c.rows.get(e.id)!;
        push(e.id, `${e.value} %`, x.detail, x.points, x.win, x.lose);
      });
      return done(`El ${real} % de la sala dijo que sí. ${winnerIds.length ? `${winnerIds.length > 1 ? "Ganan" : "Gana"} ${names(winnerIds)}.` : ""}`.trim(), `${real} %`);
    }
    case "reflejos": {
      const early = voters.filter((p) => vote(p.id) === "early");
      const timed = voters.filter((p) => vote(p.id) !== "early").map((p) => ({ id: p.id, ms: Math.max(0, Number(vote(p.id)) || 0) }));
      const best = timed.length ? Math.min(...timed.map((t) => t.ms)) : 0;
      const worst = timed.length ? Math.max(...timed.map((t) => t.ms)) : 0;
      timed.forEach((t) => {
        const win = t.ms === best;
        const lose = !early.length && !win && t.ms === worst && timed.length > 1;
        push(t.id, `${t.ms} ms`, win ? "El más rápido" : "", win ? 20 : 0, win, lose);
      });
      early.forEach((p) => push(p.id, "Se adelantó", "Descalificado", -5, false, true));
      return done(winnerIds.length ? `${names(winnerIds)}: ${best} ms. ${early.length ? `${names(early.map((p) => p.id))} se adelantó.` : ""}`.trim() : "Todos se adelantaron.", winnerIds.length ? `${best} ms` : "—");
    }
    case "ultimo": {
      const entries = voters.map((p) => ({ id: p.id, n: Math.max(0, Math.min(12, Number(vote(p.id)) || 0)) }));
      const best = entries.length ? Math.max(...entries.map((e) => e.n)) : 0;
      const worst = entries.length ? Math.min(...entries.map((e) => e.n)) : 0;
      entries.forEach((e) => {
        const win = e.n === best && best > 0;
        const lose = e.n === worst && !win && entries.length > 1;
        push(e.id, `${e.n} de 12`, e.n === 12 ? "¡Sin fallar!" : `Cayó en la ${e.n + 1}`, win ? 25 : 0, win, lose);
      });
      return done(winnerIds.length ? `${winnerIds.length > 1 ? "Quedan en pie" : "Queda en pie"} ${names(winnerIds)} con ${best} de 12.` : "Nadie pasó la primera.", `${best} de 12`);
    }
    default:
      return done("", "");
  }
}

/** Puntos de «¿Quién es más probable?»: quien votó por el más votado suma 5 */
export function probablePoints(round: LiveRound, topIds: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  if (topIds.length === 0) return out;
  Object.entries(round.votes).forEach(([pid, v]) => {
    if (topIds.includes(v.value)) out[pid] = 5;
  });
  return out;
}

/** Ranking de la noche: suma de los puntos de todas las rondas, de mayor a menor */
export function leaderboard(history: { points?: Record<string, number> }[], participants: Participant[]): { id: string; name: string; points: number }[] {
  const totals = new Map<string, number>();
  history.forEach((h) => Object.entries(h.points ?? {}).forEach(([id, v]) => totals.set(id, (totals.get(id) ?? 0) + v)));
  return participants
    .filter((p) => !p.deleted && totals.has(p.id))
    .map((p) => ({ id: p.id, name: p.name, points: totals.get(p.id) ?? 0 }))
    .sort((a, b) => b.points - a.points);
}

/** Valor del voto para los juegos que guardan dos respuestas (predicción y respuesta propia) */
export const pairVote = (a: string, b: string) => `${a}|${b}`;
