/*
 * El motor de la sala: un solo «flujo» continuo que mueve todo (cámara, puerta, host, luces, sonido e interfaz).
 * La interfaz escribe los objetivos (el scroll, el arrastre, las teclas) y un resorte los persigue con inercia, como
 * una ola: nada salta, todo llega, se pasa un poquito y se asienta. Se comparte por referencia (sin re-render).
 */

export const ESTACION = { calle: 0, sala: 1, zona: 2 } as const;
export type Estacion = 0 | 1 | 2;

export interface Flow {
  /** Profundidad buscada: 0 en la calle, 1 adentro con el host, 2 metido en la zona (continua mientras se desliza) */
  depthTarget: number;
  /** Zona buscada (índice sin límite de vueltas; con decimales mientras se arrastra) */
  yawTarget: number;
  depth: number;
  depthVel: number;
  yaw: number;
  yawVel: number;
  /** La puerta entreabierta cuando invita a pasar (0–1), aparte de la profundidad */
  ajar: number;
  /** Ondas en pantalla: x, y (0–1, desde abajo a la izquierda), segundo en que nacen y fuerza */
  waves: [number, number, number, number][];
  /** Pulso de la música (en tiempos de negra, con decimales): luces y neón laten con él */
  beat: number;
  /** El momento (s) en que la sala mostró su zona actual: dispara la ola de luz que la recorre en profundidad */
  zoneAt: number;
  time: number;
  reduce: boolean;
  /** Inclinación del celular (giroscopio), -1 a 1: mueve la cámara como el puntero en escritorio */
  tiltX: number;
  tiltY: number;
}

export const createFlow = (): Flow => ({
  depthTarget: 0,
  yawTarget: 0,
  depth: 0,
  depthVel: 0,
  yaw: 0,
  yawVel: 0,
  ajar: 0,
  waves: [],
  beat: 0,
  zoneAt: -10,
  time: 0,
  reduce: false,
  tiltX: 0,
  tiltY: 0,
});

/**
 * Resorte amortiguado (Euler semi-implícito en pasos de 1/120 s, estable aunque un cuadro tarde): `k` es la rigidez y
 * `zeta` el amortiguamiento (1 = crítico, < 1 se pasa un poco y vuelve, como el agua).
 */
export function spring(x: number, v: number, target: number, k: number, zeta: number, dt: number): [number, number] {
  const c = 2 * Math.sqrt(k) * zeta;
  let t = Math.min(dt, 1 / 20);
  while (t > 0) {
    const h = Math.min(t, 1 / 120);
    v += (k * (target - x) - c * v) * h;
    x += v * h;
    t -= h;
  }
  return [x, v];
}

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Lanza una onda en pantalla (máximo cuatro vivas a la vez) */
export function addWave(f: Flow, x: number, y: number, strength = 1) {
  if (f.reduce) return;
  f.waves = [...f.waves.filter((w) => f.time - w[2] < 1.6).slice(-3), [x, y, f.time, strength]];
}
