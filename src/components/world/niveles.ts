import type { WorldLevel } from "./types";

/*
 * Los tres niveles del mundo: 2 = 3D completo, 1 = la foto real con su relieve y paralaje, 0 = el SectionStage de hoy.
 * Todo parte en 0 (así carga como hoy y ninguna función depende del 3D); el 3D entra cuando su escena está lista y
 * PerformanceMonitor baja o sube según los cuadros que de verdad se logran.
 */

/** Nivel pedido a mano en este navegador (pruebas E2E y, más adelante, el modo tranquilo) */
export const LEVEL_KEY = "tonight_mundo_nivel";

export interface DeviceCaps {
  webgl: boolean;
  saveData: boolean;
  /** navigator.deviceMemory (GB), si el navegador lo dice */
  deviceMemory?: number;
  /** navigator.hardwareConcurrency */
  cores?: number;
  override: WorldLevel | null;
}

export function parseLevel(raw: string | null | undefined): WorldLevel | null {
  return raw === "0" ? 0 : raw === "1" ? 1 : raw === "2" ? 2 : null;
}

/** El nivel más alto que intenta este equipo */
export function levelCeiling(caps: DeviceCaps): WorldLevel {
  if (!caps.webgl) return 0;
  if (caps.override !== null) return caps.override;
  if (caps.saveData) return 0;
  if ((caps.deviceMemory !== undefined && caps.deviceMemory <= 2) || (caps.cores !== undefined && caps.cores <= 2)) return 1;
  return 2;
}

export type PerfEvent = "decline" | "incline" | "fallback";

/** El nivel después de un aviso de PerformanceMonitor (en 0 ya no hay lienzo que lo mida) */
export function levelAfter(level: WorldLevel, e: PerfEvent, ceiling: WorldLevel): WorldLevel {
  if (level === 0) return 0;
  if (e === "decline") return (level - 1) as WorldLevel;
  if (e === "incline") return Math.min(ceiling, level + 1) as WorldLevel;
  return Math.min(level, 1) as WorldLevel;
}

/** El 3D reemplaza al SectionStage solo con la escena lista y si la persona no lo está usando (o en un cambio de vista) */
export function shouldUpgrade(s: { ready: boolean; interacted: boolean; viewChanged: boolean }): boolean {
  return s.ready && (!s.interacted || s.viewChanged);
}
