import type { Consumption } from "./alcohol";

export type Gender = "M" | "F";
export type Role = "drinker" | "driver";
export type BasketProfile = "ahorro" | "clasica" | "mocktail";
export type PriceBase = "lider" | "jumbo" | "botilleria";

export interface Participant {
  id: string;
  name: string;
  gender: Gender;
  weightKg: number;
  role: Role;
  consumptions: Consumption[];
  waterCount: number;
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

export interface CarreteState {
  code: string;
  createdAt: number;
  updatedAt: number;
  participants: Participant[];
  basket: BasketState;
  games: GamesState;
}

export const DEFAULT_BASKET: BasketState = {
  attendees: 8,
  durationHours: 5,
  budget: 50000,
  profile: "clasica",
  priceBase: "lider",
  items: [],
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

export function emptyCarrete(code: string): CarreteState {
  const now = Date.now();
  return {
    code,
    createdAt: now,
    updatedAt: now,
    participants: [],
    basket: { ...DEFAULT_BASKET },
    games: { ...DEFAULT_GAMES },
  };
}

/** Merge LWW: participantes por ítem (updatedAt, con tombstones), secciones por updatedAt. */
export function mergeCarrete(a: CarreteState, b: CarreteState): CarreteState {
  const map = new Map<string, Participant>();
  [...a.participants, ...b.participants].forEach((p) => {
    const prev = map.get(p.id);
    if (!prev || p.updatedAt > prev.updatedAt) map.set(p.id, p);
  });
  return {
    code: a.code,
    createdAt: Math.min(a.createdAt, b.createdAt),
    updatedAt: Math.max(a.updatedAt, b.updatedAt),
    participants: Array.from(map.values()).sort((x, y) => x.joinedAt - y.joinedAt),
    basket: b.basket.updatedAt > a.basket.updatedAt ? b.basket : a.basket,
    games: b.games.updatedAt > a.games.updatedAt ? b.games : a.games,
  };
}

export const CODE_RE = /^[A-Z0-9]{4}$/;

export function randomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
