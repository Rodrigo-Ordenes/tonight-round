import { spring } from "@/components/gateway/club3d/flow";
import type { Viewport } from "./proyeccion";

/*
 * MIRAR: con la cámara a la altura de los ojos se puede girar la cabeza hasta 25° hacia cada lado, arrastrando o
 * inclinando el celular, y al soltar la mirada vuelve al frente con un resorte (se pasa apenas y se asienta, como la
 * ola del club). Es un giro que se suma encima del punto de vista; no mueve la cámara de lugar. Puro: el lienzo lo
 * avanza en cada cuadro.
 */

export const LOOK_LIMIT = (25 * Math.PI) / 180;
/** El mismo permiso del giroscopio que pide useParallax en iOS (sessionStorage) */
export const GYRO_KEY = "tonight_gyro";

export interface Look {
  /** Giro actual (rad): yaw positivo mira a la izquierda (rotateY de three), pitch positivo mira hacia arriba */
  yaw: number;
  pitch: number;
  vYaw: number;
  vPitch: number;
  /** Hacia dónde quiere mirar (lo escriben el arrastre y el giroscopio) */
  tYaw: number;
  tPitch: number;
  /** Hay un dedo o el mouse arrastrando */
  held: boolean;
}

export const createLook = (): Look => ({ yaw: 0, pitch: 0, vYaw: 0, vPitch: 0, tYaw: 0, tPitch: 0, held: false });

const clampLook = (a: number) => (Number.isFinite(a) ? Math.max(-LOOK_LIMIT, Math.min(LOOK_LIMIT, a)) : 0);
const unit = (x: number) => (Number.isFinite(x) ? Math.max(-1, Math.min(1, x)) : 0);

/** Arrastre de `dx`, `dy` px: cruzar la pantalla entera equivale al lente (la escena sigue al dedo) */
export function dragLook(l: Look, dx: number, dy: number, vp: Viewport, fovDeg: number) {
  const v = (fovDeg * Math.PI) / 180;
  const h = 2 * Math.atan(Math.tan(v / 2) * (vp.width / Math.max(1, vp.height)));
  l.tYaw = clampLook(l.tYaw + (dx / Math.max(1, vp.width)) * h);
  l.tPitch = clampLook(l.tPitch + (dy / Math.max(1, vp.height)) * v);
  l.held = true;
}

/** Inclinación del celular: ±20° de lado y alrededor de 45° de frente (la postura cómoda de useParallax) */
export function tiltLook(l: Look, gamma: number, beta: number) {
  l.tYaw = unit(-gamma / 20) * LOOK_LIMIT;
  l.tPitch = unit((beta - 45) / 20) * LOOK_LIMIT;
}

/** Se soltó: la mirada vuelve al frente */
export function releaseLook(l: Look) {
  l.held = false;
  l.tYaw = 0;
  l.tPitch = 0;
}

/** Un paso del resorte. Con movimiento reducido vuelve sin pasarse (amortiguamiento crítico) */
export function stepLook(l: Look, dt: number, reduce: boolean) {
  const k = reduce ? 120 : 60;
  const zeta = reduce ? 1 : 0.72;
  [l.yaw, l.vYaw] = spring(l.yaw, l.vYaw, l.tYaw, k, zeta, dt);
  [l.pitch, l.vPitch] = spring(l.pitch, l.vPitch, l.tPitch, k, zeta, dt);
}
