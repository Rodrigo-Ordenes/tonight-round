import type { Vec3, Viewpoint } from "./types";

/*
 * De la escena a la pantalla: dónde cae cada objeto (para poner encima su botón real), qué rectángulo ocupa (para
 * montar ahí la herramienta) y cómo ajustar un punto de vista a una pantalla vertical. Puro y sin crear objetos por
 * cuadro: la matriz es la vista-proyección de three (`Matrix4.elements`, por columnas).
 */

export interface Viewport {
  width: number;
  height: number;
}
/** Lo que tapan el encabezado, el dock y las zonas seguras (px) */
export interface Insets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
export interface ScreenPoint {
  x: number;
  y: number;
  /** Está delante de la cámara */
  front: boolean;
  /** Está delante y dentro de la pantalla */
  inside: boolean;
}
export interface ScreenRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const EPS = 1e-6;

/** Un punto del mundo en píxeles. Detrás de la cámara conserva hacia qué lado está (para asomarlo por ese borde) */
export function projectPoint(m: ArrayLike<number>, p: Vec3, vp: Viewport, out: ScreenPoint = { x: 0, y: 0, front: false, inside: false }): ScreenPoint {
  const [x, y, z] = p;
  const cx = m[0] * x + m[4] * y + m[8] * z + m[12];
  const cy = m[1] * x + m[5] * y + m[9] * z + m[13];
  const cw = m[3] * x + m[7] * y + m[11] * z + m[15];
  const iw = 1 / Math.max(Math.abs(cw), EPS);
  const nx = cx * iw;
  const ny = cy * iw;
  out.x = ((nx + 1) / 2) * vp.width;
  out.y = ((1 - ny) / 2) * vp.height;
  out.front = cw > EPS;
  out.inside = out.front && nx >= -1 && nx <= 1 && ny >= -1 && ny <= 1;
  return out;
}

const corner: ScreenPoint = { x: 0, y: 0, front: false, inside: false };
const at: [number, number, number] = [0, 0, 0];

/** El rectángulo en pantalla de una caja (por sus esquinas delante de la cámara); `null` si está entera detrás */
export function projectBox(m: ArrayLike<number>, center: Vec3, size: Vec3, vp: Viewport): ScreenRect | null {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i < 8; i++) {
    at[0] = center[0] + (i & 1 ? 0.5 : -0.5) * size[0];
    at[1] = center[1] + (i & 2 ? 0.5 : -0.5) * size[1];
    at[2] = center[2] + (i & 4 ? 0.5 : -0.5) * size[2];
    projectPoint(m, at, vp, corner);
    if (!corner.front) continue;
    x0 = Math.min(x0, corner.x);
    y0 = Math.min(y0, corner.y);
    x1 = Math.max(x1, corner.x);
    y1 = Math.max(y1, corner.y);
  }
  return x0 === Infinity ? null : { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Un botón nunca desaparece: si su objeto sale del cuadro (o queda detrás), se asoma por el borde del área útil en esa
 * dirección, con su centro a `margin` px del borde (un objetivo de 56 px entra completo).
 */
export function edgeClamp(pt: ScreenPoint, vp: Viewport, inset: Insets, margin = 28): { x: number; y: number; edge: boolean } {
  const left = inset.left + margin;
  const right = vp.width - inset.right - margin;
  const top = inset.top + margin;
  const bottom = vp.height - inset.bottom - margin;
  if (pt.front && pt.x >= left && pt.x <= right && pt.y >= top && pt.y <= bottom) return { x: pt.x, y: pt.y, edge: false };
  const cx = (left + right) / 2;
  const cy = (top + bottom) / 2;
  const hw = Math.max(0, (right - left) / 2);
  const hh = Math.max(0, (bottom - top) / 2);
  const dx = pt.x - cx;
  const dy = pt.y - cy;
  // Justo detrás: abajo, como quien se da vuelta
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return { x: cx, y: bottom, edge: true };
  const t = Math.min(Math.abs(dx) > EPS ? hw / Math.abs(dx) : Infinity, Math.abs(dy) > EPS ? hh / Math.abs(dy) : Infinity);
  return { x: cx + dx * t, y: cy + dy * t, edge: true };
}

const GUTTER = 12;
const NARROW = 640;
const MIN_W = 560;
const MAX_W = 880;

/**
 * El marco donde se monta la herramienta al llegar a su objeto: en el celular, todo el espacio útil; en escritorio,
 * centrado en el objeto con un ancho entre 560 y 880 px (lo que pide una herramienta para usarse), siempre dentro.
 */
export function toolFrame(obj: ScreenRect | null, vp: Viewport, safe: Insets): ScreenRect {
  const x = safe.left + GUTTER;
  const y = safe.top + GUTTER;
  const w = Math.max(0, vp.width - safe.left - safe.right - 2 * GUTTER);
  const h = Math.max(0, vp.height - safe.top - safe.bottom - 2 * GUTTER);
  if (vp.width < NARROW) return { x, y, width: w, height: h };
  const width = Math.min(Math.max(obj ? obj.width : MIN_W, MIN_W), MAX_W, w);
  const center = obj ? obj.x + obj.width / 2 : vp.width / 2;
  return { x: Math.min(Math.max(center - width / 2, x), x + w - width), y, width, height: h };
}

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/**
 * Un punto de vista pensado para 16:9, ajustado a una pantalla más angosta: primero abre el lente (hasta `maxFov`) y,
 * si no alcanza, aleja la cámara por la misma recta hacia su objetivo (hasta `maxPull` veces), para que quepa lo
 * mismo de ancho. Nunca cierra un lente ni acerca la cámara.
 */
export function fitForAspect(v: Viewpoint, aspect: number, { ref = 16 / 9, maxFov = 72, maxPull = 1.8 }: { ref?: number; maxFov?: number; maxPull?: number } = {}): Viewpoint {
  if (!(aspect > 0) || aspect >= ref) return v;
  const need = ref / aspect;
  const t = Math.tan(rad(v.fov) / 2);
  const t2 = Math.max(t, Math.min(Math.tan(rad(maxFov) / 2), t * need));
  const fov = t2 > t ? deg(2 * Math.atan(t2)) : v.fov;
  const pull = Math.min(maxPull, need / (t2 / t));
  if (pull <= 1 + 1e-9) return { ...v, fov };
  const [tx, ty, tz] = v.target;
  const [px, py, pz] = v.position;
  return { position: [tx + (px - tx) * pull, ty + (py - ty) * pull, tz + (pz - tz) * pull], target: v.target, fov };
}
