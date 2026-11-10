import type { Consumption } from "./alcohol";

/** Último trago con alcohol: es el que repite el botón rápido del celular. */
export function lastDrink(consumptions: Consumption[]): Consumption | null {
  return consumptions.reduce<Consumption | null>((best, c) => (c.abv > 0 && (!best || c.ts > best.ts) ? c : best), null);
}
