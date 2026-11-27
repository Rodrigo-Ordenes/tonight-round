/*
 * El host de Tonight dibujado como un letrero de neón: un barman chileno elegante (pelo peinado hacia atrás con su
 * onda, barba corta, chaleco, humita de dos copas que brindan y la coctelera en alto). Cada trazo es un tubo; los
 * trazos se agrupan por parte del cuerpo para animarlo como un letrero cinético (cabeza, brazo de la coctelera y brazo
 * que invita o saluda). Sin dependencias: lo usan la escena 3D (tubos) y cualquier vista 2D (SVG).
 *
 * Coordenadas en centímetros, con el origen arriba al centro (y crece hacia abajo, como en SVG): la cabeza parte en
 * y≈-3 y la cintura llega a y≈92, donde el host nace de su ola de luz.
 */

export type HostPart = "body" | "head" | "armAUp" | "armAFore" | "armBUp" | "armBFore";

export interface NeonStroke {
  part: HostPart;
  /** Puntos de control: la curva pasa por todos (Catmull-Rom centrípeta) */
  pts: [number, number][];
  closed?: boolean;
  /** Detalles chicos en menta (chispas, botones, brillo de la coctelera) */
  tone?: "mint";
  /** Profundidad del tubo (cm hacia la cámara): los brazos van delante del cuerpo */
  z?: number;
}

/** Bisagras de cada parte (cm): alrededor de ellas giran la cabeza, los hombros y los codos */
export const HOST_PIVOTS: Record<HostPart, [number, number]> = {
  body: [0, 92],
  head: [0, 33],
  armAUp: [-24, 47],
  armAFore: [-35, 63],
  armBUp: [24, 47],
  armBFore: [35, 63],
};

/** Jerarquía: el antebrazo cuelga del brazo y ambos del cuerpo */
export const HOST_PARENT: Record<HostPart, HostPart | null> = {
  body: null,
  head: "body",
  armAUp: "body",
  armAFore: "armAUp",
  armBUp: "body",
  armBFore: "armBUp",
};

type P = [number, number];
const mirror = (pts: P[]): P[] => pts.map(([x, y]) => [-x, y] as P).reverse();
const place = (pts: P[], [cx, cy]: P, deg: number, s = 1): P[] => {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const n = Math.sin(a);
  return pts.map(([x, y]) => [cx + (x * c - y * n) * s, cy + (x * n + y * c) * s] as P);
};
const ring = (cx: number, cy: number, r: number, k = 6): P[] => Array.from({ length: k }, (_, i) => [cx + Math.cos((i / k) * Math.PI * 2) * r, cy + Math.sin((i / k) * Math.PI * 2) * r] as P);

// La humita: dos copas de martini de lado, pie con pie (el nudo); en la de la izquierda, una aceituna
const BOW_WING: P[] = [[-8.4, -3.6], [-2.6, 0], [-8.4, 3.6], [-8.9, 0]];
const BOW_STEM: P[] = [[-2.6, 0], [-1.1, 0]];
const BOW_FOOT: P[] = [[-1.1, -2], [-1.1, 2]];

// La coctelera (cobbler) de abajo hacia arriba: cuerpo, tapa con colador y perilla
const SHAKER: P[] = [[-3.7, 0], [-3.1, -14.6], [-2.4, -16.2], [-2, -21.4], [-1.05, -22.2], [-1.05, -24.8], [1.05, -24.8], [1.05, -22.2], [2, -21.4], [2.4, -16.2], [3.1, -14.6], [3.7, 0]];

const head: NeonStroke[] = [
  // El pelo: el contorno y su onda peinada hacia atrás (la ola), más un mechón que cae en la sien
  { part: "head", pts: [[-9.6, 14], [-10.7, 6], [-8.6, 0.4], [-3, -2.9], [3.6, -3.4], [9.1, -1], [11.3, 3.9], [10.5, 9.2], [9.6, 14]] },
  { part: "head", pts: [[-7.4, 4], [-3.9, 0.7], [0.2, 2.8], [3.7, 0.3], [7.6, 1.8]] },
  // La cara: mandíbula con barba corta (más cuadrada), orejas, cejas, ojos que sonríen, nariz, bigote corto y sonrisa
  { part: "head", pts: [[-9.5, 15], [-9.2, 21.4], [-7, 27.4], [-3, 30.8], [0, 31.5], [3, 30.8], [7, 27.4], [9.2, 21.4], [9.5, 15]] },
  { part: "head", pts: [[-9.5, 13.6], [-11.5, 14.7], [-11.2, 18.5], [-9.2, 19.3]] },
  { part: "head", pts: mirror([[-9.5, 13.6], [-11.5, 14.7], [-11.2, 18.5], [-9.2, 19.3]]) },
  { part: "head", pts: [[-6.9, 10.7], [-4.4, 9.4], [-1.9, 10.3]] },
  { part: "head", pts: mirror([[-6.9, 10.7], [-4.4, 9.4], [-1.9, 10.3]]) },
  { part: "head", pts: [[-6.2, 14.7], [-4.3, 12.9], [-2.4, 14.7]] },
  { part: "head", pts: mirror([[-6.2, 14.7], [-4.3, 12.9], [-2.4, 14.7]]) },
  { part: "head", pts: [[0.6, 13.6], [1.5, 18.6], [-0.7, 19.7]] },
  // La barba corta: su borde en las mejillas, de la patilla a la comisura
  { part: "head", pts: [[-9.3, 19.6], [-7.4, 22.4], [-5, 23.6]] },
  { part: "head", pts: mirror([[-9.3, 19.6], [-7.4, 22.4], [-5, 23.6]]) },
  { part: "head", pts: [[-4.3, 23.4], [-1.7, 25.9], [0, 26.3], [1.7, 25.9], [4.3, 23.4]] },
];

const body: NeonStroke[] = [
  // Cuello y cuello de la camisa
  { part: "body", pts: [[-4, 30.4], [-4.4, 37]] },
  { part: "body", pts: [[4, 30.4], [4.4, 37]] },
  // La humita de dos copas (como el logo de Tonight)
  { part: "body", pts: place(BOW_WING, [0, 40.8], 0), closed: true, z: 0.8 },
  { part: "body", pts: place(BOW_STEM, [0, 40.8], 0), z: 0.8 },
  { part: "body", pts: place(mirror(BOW_WING), [0, 40.8], 0), closed: true, z: 0.8 },
  { part: "body", pts: place(mirror(BOW_STEM), [0, 40.8], 0), z: 0.8 },
  { part: "body", pts: place(BOW_FOOT, [0, 40.8], 0), z: 0.8 },
  { part: "body", pts: place(mirror(BOW_FOOT), [0, 40.8], 0), z: 0.8 },
  { part: "body", pts: ring(-6.3, 40.8, 0.75), closed: true, tone: "mint", z: 1 },
  // Hombros y costados
  { part: "body", pts: [[-4.4, 37], [-9, 38.6], [-16, 40.6], [-23, 43.6], [-26.4, 48.4]] },
  { part: "body", pts: mirror([[-4.4, 37], [-9, 38.6], [-16, 40.6], [-23, 43.6], [-26.4, 48.4]]) },
  { part: "body", pts: [[-21, 57.5], [-21.7, 74], [-21, 90]] },
  { part: "body", pts: mirror([[-21, 57.5], [-21.7, 74], [-21, 90]]) },
  // El chaleco: escote en V, puntas, bolsillos y botones
  { part: "body", pts: [[-9.6, 40.4], [-5.2, 53.6], [-0.7, 63.6]] },
  { part: "body", pts: mirror([[-9.6, 40.4], [-5.2, 53.6], [-0.7, 63.6]]) },
  { part: "body", pts: [[0, 84.8], [-5.6, 90.4], [-20.8, 87.6]] },
  { part: "body", pts: mirror([[0, 84.8], [-5.6, 90.4], [-20.8, 87.6]]) },
  { part: "body", pts: [[-15.6, 74], [-9.6, 72.8]] },
  { part: "body", pts: mirror([[-15.6, 74], [-9.6, 72.8]]) },
  { part: "body", pts: ring(0, 69.4, 0.95), closed: true, tone: "mint" },
  { part: "body", pts: ring(0, 75.8, 0.95), closed: true, tone: "mint" },
  { part: "body", pts: ring(0, 82.2, 0.95), closed: true, tone: "mint" },
];

// Brazo A (a la izquierda de la imagen): la coctelera en alto, junto a la cabeza
const armA: NeonStroke[] = [
  { part: "armAUp", pts: [[-26.4, 48.4], [-32.2, 54.6], [-38.8, 60.6]], z: 2 },
  { part: "armAUp", pts: [[-21, 57.5], [-26.2, 59.8], [-31.6, 65.6]], z: 2 },
  { part: "armAUp", pts: [[-40, 59.4], [-35.4, 57.4], [-29.8, 66.8], [-33.6, 68.6]], closed: true, z: 2.4 },
  { part: "armAFore", pts: [[-38.6, 58.2], [-38.8, 48], [-36, 39.4]], z: 3 },
  { part: "armAFore", pts: [[-31, 65], [-30.6, 52.4], [-29.6, 41.8]], z: 3 },
  { part: "armAFore", pts: [[-36.8, 40.4], [-37.6, 35.2], [-34.6, 32.6], [-30.2, 33.2], [-28.4, 37.4], [-29.6, 41.6]], z: 4 },
  { part: "armAFore", pts: place(SHAKER, [-33, 33.4], -6), closed: true, z: 3.6 },
  { part: "armAFore", pts: place([[-3.1, -14.6], [3.1, -14.6]], [-33, 33.4], -6), z: 3.6 },
  { part: "armAFore", pts: place([[1.7, -3.4], [2, -11.6]], [-33, 33.4], -6), tone: "mint", z: 4 },
];

// Brazo B (a la derecha de la imagen): la mano abierta que invita a pasar (y que saluda en la puerta)
const armB: NeonStroke[] = [
  { part: "armBUp", pts: mirror([[-26.4, 48.4], [-32.2, 54.6], [-38.8, 60.6]]), z: 2 },
  { part: "armBUp", pts: mirror([[-21, 57.5], [-26.2, 59.8], [-31.6, 65.6]]), z: 2 },
  { part: "armBUp", pts: mirror([[-40, 59.4], [-35.4, 57.4], [-29.8, 66.8], [-33.6, 68.6]]), closed: true, z: 2.4 },
  { part: "armBFore", pts: [[38.8, 59.4], [46, 57.4], [52.4, 56.2]], z: 3 },
  { part: "armBFore", pts: [[33, 67.8], [42.2, 65.8], [52.2, 62.8]], z: 3 },
  // La palma hacia arriba con los dedos juntos y el pulgar
  { part: "armBFore", pts: [[52.2, 62.8], [57.8, 63.4], [63.2, 62], [65.6, 60.2], [64.4, 58.8], [59, 59.6], [56.4, 59.2]], z: 3.4 },
  { part: "armBFore", pts: [[52.4, 56.2], [55.8, 54.6], [58.4, 55.4], [56.4, 59.2]], z: 3.4 },
];

export const HOST_STROKES: NeonStroke[] = [...body, ...head, ...armA, ...armB];

/** Alto del host en cm (de la coronilla a la cintura) */
export const HOST_HEIGHT = 95;

/** Catmull-Rom centrípeta en 2D (para dibujarlo en SVG sin three.js) */
export function sampleStroke(s: NeonStroke, perSeg = 10): P[] {
  const pts = s.closed ? [...s.pts, s.pts[0]] : s.pts;
  if (pts.length < 3) return pts;
  const get = (i: number): P => {
    if (s.closed) return s.pts[((i % s.pts.length) + s.pts.length) % s.pts.length];
    if (i < 0) return [2 * pts[0][0] - pts[1][0], 2 * pts[0][1] - pts[1][1]];
    if (i >= pts.length) {
      const n = pts.length;
      return [2 * pts[n - 1][0] - pts[n - 2][0], 2 * pts[n - 1][1] - pts[n - 2][1]];
    }
    return pts[i];
  };
  const out: P[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    const t = (a: P, b: P) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-4, 0.5);
    const t0 = 0;
    const t1 = t0 + t(p0, p1);
    const t2 = t1 + t(p1, p2);
    const t3 = t2 + t(p2, p3);
    for (let k = 0; k < perSeg; k++) {
      const u = t1 + ((t2 - t1) * k) / perSeg;
      const lerp = (a: P, b: P, ta: number, tb: number): P => {
        const w = (u - ta) / (tb - ta || 1e-4);
        return [a[0] + (b[0] - a[0]) * w, a[1] + (b[1] - a[1]) * w];
      };
      const a1 = lerp(p0, p1, t0, t1);
      const a2 = lerp(p1, p2, t1, t2);
      const a3 = lerp(p2, p3, t2, t3);
      const b1 = lerp(a1, a2, t0, t2);
      const b2 = lerp(a2, a3, t1, t3);
      out.push(lerp(b1, b2, t1, t2));
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
}
