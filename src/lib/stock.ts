import type { CarreteState } from "./carreteState";
import { CATALOG, abvOf, GRAMS_PER_DRINK } from "./basket";
import { pureGrams } from "./alcohol";

export interface StockStatus {
  boughtGrams: number;
  drunkGrams: number;
  /** 0..1 de alcohol que queda de lo comprado */
  left: number;
  drinksLeft: number;
  /** Horas que queda al ritmo de la última hora (null si no hay ritmo aún) */
  hoursLeft: number | null;
}

/** Cruza la canasta de /armar con lo registrado en el Monstruómetro: ¿alcanza el copete? */
export function stockFor(state: CarreteState, now = Date.now()): StockStatus | null {
  const byId = new Map(CATALOG.map((c) => [c.id, c]));
  const boughtGrams = state.basket.items.reduce((a, i) => {
    const c = byId.get(i.id);
    if (!c) return a;
    const vol = "unit_volume_ml" in c && typeof c.unit_volume_ml === "number" ? c.unit_volume_ml : 0;
    return a + i.quantity * vol * abvOf(c) * 0.8;
  }, 0);
  if (boughtGrams <= 0) return null;
  const people = state.participants.filter((p) => !p.deleted);
  const all = people.flatMap((p) => p.consumptions);
  const drunkGrams = all.reduce((a, c) => a + pureGrams(c.ml, c.abv), 0);
  const lastHour = all.filter((c) => now - c.ts < 3_600_000).reduce((a, c) => a + pureGrams(c.ml, c.abv), 0);
  const remaining = Math.max(0, boughtGrams - drunkGrams);
  return {
    boughtGrams,
    drunkGrams,
    left: remaining / boughtGrams,
    drinksLeft: remaining / GRAMS_PER_DRINK,
    hoursLeft: lastHour > 0 ? remaining / lastHour : null,
  };
}
