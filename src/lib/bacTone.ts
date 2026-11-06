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
export const TONE_CLASS: Record<BacTone, { bar: string; text: string; panel: string }> = {
  calm: { bar: "bg-cyan-400", text: "text-cyan-200", panel: "border-cyan-300/30 bg-cyan-400/[0.07] text-cyan-50" },
  warm: { bar: "bg-amber-300", text: "text-amber-200", panel: "border-amber-300/30 bg-amber-300/[0.07] text-amber-50" },
  high: { bar: "bg-amber-500", text: "text-amber-300", panel: "border-amber-500/40 bg-amber-500/10 text-amber-50" },
  "driver-ok": { bar: "bg-amber-300/40", text: "text-amber-200", panel: "border-amber-300/30 bg-amber-300/[0.06] text-amber-50" },
  "driver-breach": { bar: "bg-rose-500", text: "text-rose-300", panel: "border-rose-500/50 bg-rose-500/10 text-rose-50" },
};
