/** Física de la intro del trago: suavizado del scroll, superficie del líquido y lecturas reales del vaso. */

/** Acerca `current` a `target` con decaimiento exponencial (independiente de los cuadros por segundo). */
export function approach(current: number, target: number, dtMs: number, halfLifeMs = 90): number {
  if (dtMs <= 0) return current;
  const next = target + (current - target) * Math.pow(0.5, dtMs / halfLifeMs);
  return Math.abs(next - target) < 0.0005 ? target : next;
}

const STEPS = 12;

/**
 * Contorno del líquido: una onda en la superficie (`levelY`) que baja hasta el fondo.
 * `amp` en unidades del SVG; la onda combina dos senos para no verse mecánica. `tilt` es la pendiente de la
 * superficie (oleaje): gira alrededor del centro, así el nivel en el eje del vaso no cambia.
 */
export function surfacePath(left: number, width: number, levelY: number, bottomY: number, t: number, amp: number, tilt = 0): string {
  const r = (n: number) => Math.round(n * 100) / 100;
  let d = `M ${r(left)} ${r(bottomY)}`;
  for (let i = 0; i <= STEPS; i++) {
    const x = left + (width * i) / STEPS;
    const k = i / STEPS;
    const wave = amp === 0 ? 0 : amp * (0.7 * Math.sin(k * Math.PI * 2 + t / 380) + 0.3 * Math.sin(k * Math.PI * 5 - t / 230));
    d += ` L ${r(x)} ${r(levelY + wave + (x - left - width / 2) * tilt)}`;
  }
  return `${d} L ${r(left + width)} ${r(bottomY)} Z`;
}

/**
 * Un paso de resorte amortiguado (oleaje del líquido, balanceo). Sub-pasos de 8 ms y tope de 100 ms por llamada:
 * estable aunque la pestaña vuelva tras un rato en segundo plano.
 */
export function springStep(s: { x: number; v: number }, target: number, dtMs: number, freqHz = 1.6, damping = 0.22): { x: number; v: number } {
  if (dtMs <= 0) return s;
  const w = 2 * Math.PI * freqHz;
  let { x, v } = s;
  let left = Math.min(dtMs, 100) / 1000;
  while (left > 1e-9) {
    const h = Math.min(left, 0.008);
    v += (-w * w * (x - target) - 2 * damping * w * v) * h;
    x += v * h;
    left -= h;
  }
  return { x, v };
}

/** Receta de la intro: piscola 30/70 (60 ml de pisco de 35° y 140 ml de bebida). */
export const PISCOLA = { piscoMl: 60, piscoAbv: 0.35, colaMl: 140 };

/** Lo que hay en el vaso según el avance de cada ingrediente (0 a 1). El hielo no suma volumen. */
export function pourReadout(s: { pisco: number; cola: number }): { piscoMl: number; colaMl: number; abv: number; grams: number } {
  const piscoMl = Math.round(PISCOLA.piscoMl * s.pisco);
  const colaMl = Math.round(PISCOLA.colaMl * s.cola);
  const total = piscoMl + colaMl;
  const alcoholMl = piscoMl * PISCOLA.piscoAbv;
  return { piscoMl, colaMl, abv: total ? alcoholMl / total : 0, grams: alcoholMl * 0.8 };
}
