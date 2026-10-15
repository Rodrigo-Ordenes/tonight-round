import type { Consumption } from "./alcohol";

export type Gender = "M" | "F";
export type Role = "drinker" | "driver";
export type BasketProfile = "ahorro" | "clasica" | "mocktail";
export type PriceBase = "lider" | "jumbo" | "botilleria";

export interface WaterLog {
  id: string;
  ts: number;
}

export type Stomach = "empty" | "normal" | "full";

export interface Participant {
  id: string;
  name: string;
  gender: Gender;
  weightKg: number;
  role: Role;
  consumptions: Consumption[];
  waterCount: number; // derivado de `water` (se mantiene por compatibilidad de lectura)
  water?: WaterLog[];
  removedIds?: string[]; // tombstones de tragos/agua borrados (para que un merge no los resucite)
  /** Afecta la absorción en la estimación de Widmark (vacío = pico antes y más alto). */
  stomach?: Stomach;
  status: "party" | "transit" | "safe";
  commune: string;
  arrivedAt: number | null;
  resurrectionLabel: string;
  resurrectionHour: number | null; // timestamp objetivo (hora meta)
  resurrectionMode: "strict" | "functional";
  active: boolean; // participa en ruleta
  joinedAt: number;
  updatedAt: number;
  deleted?: boolean;
}

/** Campos escalares que se pueden parchar. Los logs (tragos/agua) solo cambian vía acciones propias. */
export type ParticipantPatch = Partial<
  Omit<Participant, "id" | "consumptions" | "waterCount" | "water" | "removedIds" | "joinedAt" | "updatedAt">
>;

export interface BasketItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  prices: { lider: number; jumbo: number; botilleria_ref: number };
  customPrice?: number;
  custom?: boolean;
}

export interface BasketState {
  attendees: number;
  durationHours: number;
  budget: number;
  profile: BasketProfile;
  priceBase: PriceBase;
  items: BasketItem[];
  targetDrink?: string; // "mix" | "pisco" | "cerveza" | "vino" | "gin" | "vodka" | "whisky" | "ron" | "tequila" | "mocktail"
  updatedAt: number;
}

export interface GamesState {
  neverDeck: string[]; // frases ya barajadas (Fisher-Yates)
  neverIdx: number;
  bombRounds: number;
  bombLast: string;
  rouletteCustom: Record<string, string[]>; // frases propias por categoría
  rouletteDisabled: string[];
  updatedAt: number;
}

export interface MusicState {
  /** Ambiente elegido (ver src/lib/music.ts) o "custom" si alguien pegó su propia playlist. */
  vibeId: string;
  /** DJ automático: cada dispositivo calcula el mismo ambiente sugerido según la hora y el ánimo de la sala. */
  auto: boolean;
  customUrl?: string;
  setBy?: string;
  /** Pedidos de canciones desde los celulares (cola para quien pone la música) */
  requests?: SongRequest[];
  updatedAt: number;
}

export interface SongRequest {
  id: string;
  by: string;
  text: string;
  at: number;
  played?: boolean;
}

/* ---------------- Rondas en vivo (TV = escenario, celulares = control) ---------------- */

export type LiveGame = "yonunca" | "probable" | "mito" | "confesion" | "prefieres" | "impostor";

export interface LiveVote {
  value: string;
  at: number;
}

export interface LiveRound {
  id: string;
  game: LiveGame;
  prompt: string;
  /** Opciones de voto. Para "probable" y "confesion" son ids de participantes. */
  options: { id: string; label: string }[];
  /** Respuesta correcta (mito) o autor (confesión). Se muestra solo al revelar. */
  answer?: string;
  /** Explicación al revelar (mitos). */
  explain?: string;
  /** Palabra secreta (El Impostor): todos la ven menos quien es `answer`. */
  secret?: string;
  startedAt: number;
  revealedAt?: number;
  endedAt?: number;
  votes: Record<string, LiveVote>;
}

export interface Confession {
  id: string;
  authorId: string;
  text: string;
  at: number;
  used?: boolean;
}

export interface LiveState {
  round: LiveRound | null;
  /** Historial corto para el Wrapped (sin votos individuales). */
  history: { id: string; game: LiveGame; prompt: string; winner?: string; guiltyIds?: string[]; at: number }[];
  confessions: Confession[];
  /** Último "¡Salud!" lanzado: la TV y los celulares muestran la animación unos segundos */
  cheers?: { id: string; by: string; at: number } | null;
  updatedAt: number;
}

export const DEFAULT_LIVE: LiveState = { round: null, history: [], confessions: [], updatedAt: 0 };

/* ---------------- Cuentas compartidas (multi-pagador) ---------------- */

export type ExpenseCategory = "alcohol" | "comun";
export type SplitMode = "iguales" | "justo" | "consumo";

export interface Expense {
  id: string;
  payerId: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  at: number;
}

export interface SplitState {
  expenses: Expense[];
  /** tombstones de gastos borrados */
  removed: string[];
  mode: SplitMode;
  /** Personas que no toman alcohol aunque no sean conductores */
  soberIds: string[];
  updatedAt: number;
}

export const DEFAULT_SPLIT: SplitState = { expenses: [], removed: [], mode: "justo", soberIds: [], updatedAt: 0 };

export const DEFAULT_MUSIC: MusicState = { vibeId: "top-pais", auto: true, updatedAt: 0 };

export interface CarreteState {
  code: string;
  createdAt: number;
  updatedAt: number;
  /** Se incrementa con "Reiniciar carrete": un estado de época mayor reemplaza completo al de época menor. */
  epoch?: number;
  /** IDs de eventos ya aplicados (idempotencia). Acotado a SEEN_LIMIT. */
  seen?: string[];
  participants: Participant[];
  basket: BasketState;
  games: GamesState;
  music?: MusicState;
  live?: LiveState;
  split?: SplitState;
}

export const DEFAULT_BASKET: BasketState = {
  attendees: 8,
  durationHours: 5,
  budget: 50000,
  profile: "clasica",
  priceBase: "lider",
  items: [],
  targetDrink: "mix",
  updatedAt: 0,
};

export const DEFAULT_GAMES: GamesState = {
  neverDeck: [],
  neverIdx: 0,
  bombRounds: 0,
  bombLast: "",
  rouletteCustom: {},
  rouletteDisabled: [],
  updatedAt: 0,
};

export function emptyCarrete(code: string, epoch = 0): CarreteState {
  const now = Date.now();
  return {
    code,
    createdAt: now,
    updatedAt: now,
    epoch,
    seen: [],
    participants: [],
    basket: { ...DEFAULT_BASKET },
    games: { ...DEFAULT_GAMES },
    music: { ...DEFAULT_MUSIC },
    live: { ...DEFAULT_LIVE },
    split: { ...DEFAULT_SPLIT },
  };
}

/* ------------------------------------------------------------------ */
/* Acciones delta                                                      */
/* ------------------------------------------------------------------ */

/**
 * Cada interacción viaja como una acción pequeña e idempotente (eventId único) en vez del estado completo.
 * El servidor las aplica en orden de llegada con el mismo reductor que el cliente, así dos "+1 Trago"
 * simultáneos desde celulares distintos nunca se pisan.
 */
export type CarreteAction =
  | { type: "ADD_PARTICIPANT"; participant: Participant }
  | { type: "PATCH_PARTICIPANT"; id: string; patch: ParticipantPatch }
  | { type: "REMOVE_PARTICIPANT"; id: string }
  | { type: "LOG_DRINK"; participantId: string; consumption: Consumption }
  | { type: "UNDO_DRINK"; participantId: string; consumptionId: string }
  | { type: "LOG_WATER"; participantId: string; water: WaterLog }
  | { type: "RESET_CONSUMPTIONS" }
  | { type: "PATCH_BASKET"; patch: Partial<Omit<BasketState, "updatedAt">> }
  | { type: "PATCH_GAMES"; patch: Partial<Omit<GamesState, "updatedAt">> }
  | { type: "SET_MUSIC"; patch: Partial<Omit<MusicState, "updatedAt">> }
  | { type: "START_ROUND"; round: Omit<LiveRound, "votes" | "revealedAt" | "endedAt"> }
  | { type: "VOTE"; roundId: string; participantId: string; value: string }
  | { type: "REVEAL_ROUND"; roundId: string; winner?: string; guiltyIds?: string[] }
  | { type: "END_ROUND"; roundId: string }
  | { type: "SUBMIT_CONFESSION"; confession: Confession }
  | { type: "CHEERS"; id: string; by: string }
  | { type: "SONG_REQUEST"; request: SongRequest }
  | { type: "SONG_PLAYED"; id: string }
  | { type: "ADD_EXPENSE"; expense: Expense }
  | { type: "REMOVE_EXPENSE"; id: string }
  | { type: "PATCH_SPLIT"; patch: Partial<Pick<SplitState, "mode" | "soberIds">> }
  | { type: "RESET_CARRETE"; epoch: number };

export type CarreteEvent = CarreteAction & { eventId: string; at: number };

export const SEEN_LIMIT = 500;

const uniqBy = <T>(xs: T[], key: (x: T) => string): T[] => {
  const m = new Map<string, T>();
  xs.forEach((x) => m.set(key(x), x));
  return Array.from(m.values());
};

/** Completa campos de versiones anteriores (V9 guardaba solo `waterCount`). */
export function normalizeParticipant(p: Participant): Participant {
  const water =
    p.water ?? Array.from({ length: p.waterCount ?? 0 }, (_, i) => ({ id: `legacy_${p.id}_${i}`, ts: p.joinedAt + i }));
  const removed = new Set(p.removedIds ?? []);
  const live = water.filter((w) => !removed.has(w.id));
  return {
    ...p,
    consumptions: (p.consumptions ?? []).filter((c) => !removed.has(c.id)),
    water: live,
    waterCount: live.length,
    removedIds: p.removedIds ?? [],
  };
}

export function normalizeCarrete(s: CarreteState): CarreteState {
  return {
    ...s,
    epoch: s.epoch ?? 0,
    seen: s.seen ?? [],
    participants: (s.participants ?? []).map(normalizeParticipant),
    basket: { ...DEFAULT_BASKET, ...s.basket },
    games: { ...DEFAULT_GAMES, ...s.games },
    music: { ...DEFAULT_MUSIC, ...s.music },
    live: { ...DEFAULT_LIVE, ...s.live },
    split: { ...DEFAULT_SPLIT, ...s.split },
  };
}

const mapParticipant = (s: CarreteState, id: string, fn: (p: Participant) => Participant): CarreteState => ({
  ...s,
  participants: s.participants.map((p) => (p.id === id ? normalizeParticipant(fn(p)) : p)),
});

function reduce(s: CarreteState, a: CarreteAction, at: number): CarreteState {
  switch (a.type) {
    case "ADD_PARTICIPANT":
      if (s.participants.some((p) => p.id === a.participant.id)) return s;
      return {
        ...s,
        participants: [...s.participants, normalizeParticipant(a.participant)].sort((x, y) => x.joinedAt - y.joinedAt),
      };
    case "PATCH_PARTICIPANT":
      return mapParticipant(s, a.id, (p) => ({ ...p, ...a.patch, updatedAt: Math.max(p.updatedAt, at) }));
    case "REMOVE_PARTICIPANT":
      return mapParticipant(s, a.id, (p) => ({ ...p, deleted: true, updatedAt: Math.max(p.updatedAt, at) }));
    case "LOG_DRINK":
      return mapParticipant(s, a.participantId, (p) =>
        p.consumptions.some((c) => c.id === a.consumption.id) ? p : { ...p, consumptions: [...p.consumptions, a.consumption] }
      );
    case "UNDO_DRINK":
      return mapParticipant(s, a.participantId, (p) => ({
        ...p,
        removedIds: Array.from(new Set([...(p.removedIds ?? []), a.consumptionId])),
      }));
    case "LOG_WATER":
      return mapParticipant(s, a.participantId, (p) =>
        (p.water ?? []).some((w) => w.id === a.water.id) ? p : { ...p, water: [...(p.water ?? []), a.water] }
      );
    case "RESET_CONSUMPTIONS":
      return {
        ...s,
        participants: s.participants.map((p) =>
          normalizeParticipant({
            ...p,
            removedIds: Array.from(
              new Set([...(p.removedIds ?? []), ...p.consumptions.map((c) => c.id), ...(p.water ?? []).map((w) => w.id)])
            ),
          })
        ),
      };
    case "PATCH_BASKET":
      return { ...s, basket: { ...s.basket, ...a.patch, updatedAt: Math.max(s.basket.updatedAt, at) } };
    case "PATCH_GAMES":
      return { ...s, games: { ...s.games, ...a.patch, updatedAt: Math.max(s.games.updatedAt, at) } };
    case "SET_MUSIC": {
      const cur = s.music ?? DEFAULT_MUSIC;
      return { ...s, music: { ...cur, ...a.patch, updatedAt: Math.max(cur.updatedAt, at) } };
    }
    case "START_ROUND": {
      const live = s.live ?? DEFAULT_LIVE;
      if (live.round?.id === a.round.id) return s;
      return {
        ...s,
        live: {
          ...live,
          round: { ...a.round, votes: {} },
          confessions:
            a.round.game === "confesion"
              ? live.confessions.map((c) => (c.text === a.round.prompt ? { ...c, used: true } : c))
              : live.confessions,
          updatedAt: Math.max(live.updatedAt, at),
        },
      };
    }
    case "VOTE": {
      const live = s.live ?? DEFAULT_LIVE;
      const r = live.round;
      if (!r || r.id !== a.roundId || r.revealedAt) return s;
      return {
        ...s,
        live: { ...live, round: { ...r, votes: { ...r.votes, [a.participantId]: { value: a.value, at } } }, updatedAt: Math.max(live.updatedAt, at) },
      };
    }
    case "REVEAL_ROUND": {
      const live = s.live ?? DEFAULT_LIVE;
      const r = live.round;
      if (!r || r.id !== a.roundId || r.revealedAt) return s;
      return {
        ...s,
        live: {
          ...live,
          round: { ...r, revealedAt: at },
          history: [...live.history, { id: r.id, game: r.game, prompt: r.prompt, winner: a.winner, guiltyIds: a.guiltyIds, at }].slice(-60),
          updatedAt: Math.max(live.updatedAt, at),
        },
      };
    }
    case "END_ROUND": {
      const live = s.live ?? DEFAULT_LIVE;
      if (!live.round || live.round.id !== a.roundId) return s;
      return { ...s, live: { ...live, round: null, updatedAt: Math.max(live.updatedAt, at) } };
    }
    case "SUBMIT_CONFESSION": {
      const live = s.live ?? DEFAULT_LIVE;
      if (live.confessions.some((c) => c.id === a.confession.id)) return s;
      return { ...s, live: { ...live, confessions: [...live.confessions, a.confession].slice(-40), updatedAt: Math.max(live.updatedAt, at) } };
    }
    case "CHEERS": {
      const live = s.live ?? DEFAULT_LIVE;
      if (live.cheers?.id === a.id) return s;
      return { ...s, live: { ...live, cheers: { id: a.id, by: a.by, at }, updatedAt: Math.max(live.updatedAt, at) } };
    }
    case "SONG_REQUEST": {
      const m = s.music ?? DEFAULT_MUSIC;
      if ((m.requests ?? []).some((r) => r.id === a.request.id)) return s;
      return { ...s, music: { ...m, requests: [...(m.requests ?? []), a.request].slice(-30), updatedAt: Math.max(m.updatedAt, at) } };
    }
    case "SONG_PLAYED": {
      const m = s.music ?? DEFAULT_MUSIC;
      return {
        ...s,
        music: { ...m, requests: (m.requests ?? []).map((r) => (r.id === a.id ? { ...r, played: true } : r)), updatedAt: Math.max(m.updatedAt, at) },
      };
    }
    case "ADD_EXPENSE": {
      const sp = s.split ?? DEFAULT_SPLIT;
      if (sp.expenses.some((e) => e.id === a.expense.id)) return s;
      return { ...s, split: { ...sp, expenses: [...sp.expenses, a.expense], updatedAt: Math.max(sp.updatedAt, at) } };
    }
    case "REMOVE_EXPENSE": {
      const sp = s.split ?? DEFAULT_SPLIT;
      return {
        ...s,
        split: { ...sp, expenses: sp.expenses.filter((e) => e.id !== a.id), removed: Array.from(new Set([...sp.removed, a.id])), updatedAt: Math.max(sp.updatedAt, at) },
      };
    }
    case "PATCH_SPLIT": {
      const sp = s.split ?? DEFAULT_SPLIT;
      return { ...s, split: { ...sp, ...a.patch, updatedAt: Math.max(sp.updatedAt, at) } };
    }
    case "RESET_CARRETE":
      if (a.epoch <= (s.epoch ?? 0)) return s;
      // Se conservan los eventIds vistos para que una cola vieja no resucite participantes de la época anterior.
      return { ...emptyCarrete(s.code, a.epoch), createdAt: s.createdAt, seen: s.seen };
  }
}

/** Aplica un evento una sola vez (si su eventId ya fue visto, no hace nada). Función pura. */
export function applyEvent(state: CarreteState, ev: CarreteEvent): CarreteState {
  const s = normalizeCarrete(state);
  if (s.seen!.includes(ev.eventId)) return s;
  const next = reduce(s, ev, ev.at);
  const seen = [...(next.seen ?? []), ev.eventId];
  return {
    ...next,
    seen: seen.length > SEEN_LIMIT ? seen.slice(-SEEN_LIMIT) : seen,
    updatedAt: Math.max(s.updatedAt, ev.at),
  };
}

export const applyEvents = (state: CarreteState, evs: CarreteEvent[]): CarreteState => evs.reduce(applyEvent, state);

/* ------------------------------------------------------------------ */
/* Merge de estados completos (anti-entropía / reparación)             */
/* ------------------------------------------------------------------ */

function mergeParticipant(a: Participant, b: Participant): Participant {
  const na = normalizeParticipant(a);
  const nb = normalizeParticipant(b);
  const base = nb.updatedAt > na.updatedAt ? nb : na;
  const removedIds = Array.from(new Set([...(na.removedIds ?? []), ...(nb.removedIds ?? [])]));
  return normalizeParticipant({
    ...base,
    deleted: na.deleted || nb.deleted || undefined,
    removedIds,
    consumptions: uniqBy([...na.consumptions, ...nb.consumptions], (c) => c.id).sort((x, y) => x.ts - y.ts),
    water: uniqBy([...(na.water ?? []), ...(nb.water ?? [])], (w) => w.id).sort((x, y) => x.ts - y.ts),
    updatedAt: Math.max(na.updatedAt, nb.updatedAt),
  });
}

/**
 * Merge de estados completos. Los tragos y vasos de agua se unen por id (con tombstones), así que
 * ningún registro se pierde; los campos escalares usan LWW por participante/sección.
 */
export function mergeCarrete(aRaw: CarreteState, bRaw: CarreteState): CarreteState {
  const a = normalizeCarrete(aRaw);
  const b = normalizeCarrete(bRaw);
  if ((a.epoch ?? 0) !== (b.epoch ?? 0)) {
    const winner = (a.epoch ?? 0) > (b.epoch ?? 0) ? a : b;
    return { ...winner, code: a.code };
  }
  const map = new Map<string, Participant>();
  [...a.participants, ...b.participants].forEach((p) => {
    const prev = map.get(p.id);
    map.set(p.id, prev ? mergeParticipant(prev, p) : p);
  });
  const seen = Array.from(new Set([...(a.seen ?? []), ...(b.seen ?? [])]));
  return {
    code: a.code,
    createdAt: Math.min(a.createdAt, b.createdAt),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    epoch: a.epoch,
    seen: seen.length > SEEN_LIMIT ? seen.slice(-SEEN_LIMIT) : seen,
    participants: Array.from(map.values()).sort((x, y) => x.joinedAt - y.joinedAt),
    basket: b.basket.updatedAt > a.basket.updatedAt ? b.basket : a.basket,
    games: b.games.updatedAt > a.games.updatedAt ? b.games : a.games,
    music: mergeMusic(a.music, b.music),
    live: mergeLive(a.live ?? DEFAULT_LIVE, b.live ?? DEFAULT_LIVE),
    split: mergeSplit(a.split ?? DEFAULT_SPLIT, b.split ?? DEFAULT_SPLIT),
  };
}

/** Gastos: unión por id menos tombstones; modo y abstemios por LWW. */
function mergeSplit(a: SplitState, b: SplitState): SplitState {
  const removed = Array.from(new Set([...a.removed, ...b.removed]));
  const gone = new Set(removed);
  const expenses = uniqBy([...a.expenses, ...b.expenses], (e) => e.id)
    .filter((e) => !gone.has(e.id))
    .sort((x, y) => x.at - y.at);
  const newer = b.updatedAt > a.updatedAt ? b : a;
  return { expenses, removed, mode: newer.mode, soberIds: newer.soberIds, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

/** Rondas: gana la ronda más nueva; si es la misma, se unen los votos (uno por participante, el más reciente). */
function mergeLive(a: LiveState, b: LiveState): LiveState {
  let round: LiveRound | null;
  const ra = a.round;
  const rb = b.round;
  if (ra && rb && ra.id === rb.id) {
    const votes: Record<string, LiveVote> = { ...ra.votes };
    Object.entries(rb.votes).forEach(([pid, v]) => {
      if (!votes[pid] || v.at > votes[pid].at) votes[pid] = v;
    });
    round = { ...ra, votes, revealedAt: ra.revealedAt ?? rb.revealedAt, endedAt: ra.endedAt ?? rb.endedAt };
  } else {
    const newest = a.updatedAt >= b.updatedAt ? a : b;
    round = newest.round;
  }
  const history = uniqBy([...a.history, ...b.history], (h) => h.id).sort((x, y) => x.at - y.at).slice(-60);
  const confessions = uniqBy([...a.confessions, ...b.confessions], (c) => c.id).map((c) => {
    const other = [...a.confessions, ...b.confessions].filter((x) => x.id === c.id);
    return { ...c, used: other.some((x) => x.used) };
  });
  const cheers = (a.cheers?.at ?? 0) >= (b.cheers?.at ?? 0) ? a.cheers ?? null : b.cheers ?? null;
  return { round, history, confessions, cheers, updatedAt: Math.max(a.updatedAt, b.updatedAt) };
}

/** Música: ambiente por LWW; los pedidos de canciones se unen por id (un "ya sonó" no se pierde). */
function mergeMusic(a?: MusicState, b?: MusicState): MusicState | undefined {
  if (!a || !b) return a ?? b;
  const newer = b.updatedAt > a.updatedAt ? b : a;
  const all = [...(a.requests ?? []), ...(b.requests ?? [])];
  const requests = uniqBy(all, (r) => r.id)
    .map((r) => ({ ...r, played: all.some((x) => x.id === r.id && x.played) || undefined }))
    .sort((x, y) => x.at - y.at)
    .slice(-30);
  return { ...newer, requests };
}

export const CODE_RE = /^[A-Z0-9]{4}$/;

export function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
