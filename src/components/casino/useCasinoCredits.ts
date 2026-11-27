"use client";

import { useCallback, useEffect, useState } from "react";

/** Créditos del casino en este navegador: solo puntos, nunca plata */
const KEY = "tonight_casino_creditos";

export function useCasinoCredits() {
  const [credits, setCredits] = useState(0);
  useEffect(() => {
    try {
      setCredits(Number(localStorage.getItem(KEY)) || 0);
    } catch {
      /* sin almacenamiento: los créditos parten en cero */
    }
  }, []);
  /** Suma o resta créditos y los guarda */
  const addCredits = useCallback(
    (delta: number) =>
      setCredits((c) => {
        const total = Math.max(0, c + delta);
        try {
          localStorage.setItem(KEY, String(total));
        } catch {
          /* sin almacenamiento */
        }
        return total;
      }),
    [],
  );
  return { credits, addCredits };
}
