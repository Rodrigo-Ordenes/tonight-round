import type { Consumption } from "./alcohol";
/**
 * Tono visual de la alcoholemia con criterio de reducción de daños:
 * colores suaves (teal → ámbar) en vez de alarmas; el rojo queda solo para el conductor que tomó.
 */
export type BacTone = "calm" | "warm" | "high" | "driver-ok" | "driver-breach";

/** ¿Registró algo con alcohol? Una cerveza 0.0 o un mezclador no cuentan (el conductor sigue en verde). */
export function hasAlcohol(consumptions: Consumption[]): boolean {
  return consumptions.some((c) => c.abv > 0 && c.ml > 0);
}

export function bacTone(bac: number, isDriver: boolean, hasDrinks: boolean): BacTone {
  if (isDriver) return hasDrinks ? "driver-breach" : "driver-ok";
  if (bac >= 0.8) return "high";
  if (bac > 0.001) return "warm";
  return "calm";
}

/** Clases de barra y texto por tono. */
// Escala de reducción de daños (estudio V11): menta → ámbar → terracota; nunca rojo por tomar.
// El rojo frambuesa queda solo para el conductor designado que tomó (tolerancia cero legal).
export const TONE_CLASS: Record<BacTone, { bar: string; text: string; panel: string }> = {
  calm: { bar: "bg-emerald-400", text: "text-emerald-200", panel: "border-emerald-300/30 bg-emerald-400/[0.07] text-emerald-50" },
  warm: { bar: "bg-amber-400", text: "text-amber-200", panel: "border-amber-300/30 bg-amber-300/[0.07] text-amber-50" },
  high: { bar: "bg-orange-400", text: "text-orange-300", panel: "border-orange-400/40 bg-orange-400/10 text-orange-50" },
  "driver-ok": { bar: "bg-emerald-300/50", text: "text-emerald-200", panel: "border-emerald-300/30 bg-emerald-300/[0.06] text-emerald-50" },
  "driver-breach": { bar: "bg-rose-500", text: "text-rose-300", panel: "border-rose-500/50 bg-rose-500/10 text-rose-50" },
};
