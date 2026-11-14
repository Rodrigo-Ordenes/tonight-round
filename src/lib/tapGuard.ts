/** Evita sumar dos tragos por un toque doble accidental: dos toques válidos están separados al menos por `windowMs`. */
export function acceptTap(lastAt: number | null, now: number, windowMs = 700): boolean {
  return lastAt === null || now - lastAt >= windowMs;
}
