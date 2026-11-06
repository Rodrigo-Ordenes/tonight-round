/** Generador pseudoaleatorio con semilla (mulberry32): mismo sorteo en todos los dispositivos. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Baraja (Fisher–Yates con semilla) y reparte en grupos de `size`, repartiendo el resto para que
 * los tamaños difieran a lo más en 1. Con `size` ≥ cantidad, un solo grupo.
 */
export function makeGroups(ids: string[], size: number, seed: number): string[][] {
  const rand = rng(seed);
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  if (a.length === 0) return [];
  const groups = Math.max(1, Math.floor(a.length / Math.max(1, size)));
  const out: string[][] = Array.from({ length: groups }, () => []);
  a.forEach((id, i) => out[i % groups].push(id));
  return out;
}
