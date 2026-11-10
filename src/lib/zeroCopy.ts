const CAVEAT = "Estimación: no sirve para decidir si manejar.";

/** Texto del estado de alcohol: quien tomó nunca ve un 0.00 "limpio" sin la advertencia. */
export function zeroCopy({ hadDrinks, zeroAt }: { hadDrinks: boolean; zeroAt: number | null }): { headline: string; caveat: string | null } {
  if (zeroAt) return { headline: "Vuelves a 0.00", caveat: CAVEAT };
  return hadDrinks ? { headline: "Estimación: 0.00", caveat: CAVEAT } : { headline: "Sin alcohol registrado", caveat: null };
}
