"use client";

import { useEffect, useRef } from "react";
import type { LiveRound } from "./carreteState";

/**
 * Llama a `onReveal` solo cuando este dispositivo vio la ronda abierta y luego revelada.
 * Así, abrir una página con una ronda ya revelada no repite el confeti, y no depende de los relojes de cada equipo.
 */
export function useRevealMoment(round: LiveRound | null | undefined, onReveal: (round: LiveRound) => void) {
  const openId = useRef<string | null>(null);
  const cb = useRef(onReveal);
  cb.current = onReveal;
  useEffect(() => {
    if (!round) return;
    if (!round.revealedAt) {
      openId.current = round.id;
      return;
    }
    if (openId.current === round.id) {
      openId.current = null;
      cb.current(round);
    }
  }, [round]);
}
