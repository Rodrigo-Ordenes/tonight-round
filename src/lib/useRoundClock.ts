"use client";

import { useEffect, useRef, useState } from "react";
import type { LiveRound, Participant } from "./carreteState";
import { roundRemaining, shouldAutoReveal, tally } from "./liveGames";
import { audioEffects } from "./audioEffects";
import type { CarreteAction } from "./carreteState";

export interface RoundClock {
  /** ms restantes (0 al terminar) o null si la ronda no tiene tiempo */
  remainingMs: number | null;
  /** 0..1 del tiempo consumido */
  progress: number;
}

/**
 * Reloj de la ronda abierta. Con `driver` (TV, o el celular que inició la ronda: ver isRoundDriver) revela
 * cuando votaron todos o se acabó el tiempo (acción idempotente); con `sound` suena el tic de los últimos 10 s.
 */
export function useRoundClock(
  round: LiveRound | null | undefined,
  driver?: { participants: Participant[]; dispatch: (a: CarreteAction) => void; sound?: boolean }
): RoundClock {
  const [now, setNow] = useState(() => Date.now());
  const lastTick = useRef(0);
  const open = !!round && !round.revealedAt;

  useEffect(() => {
    if (!open) return;
    setNow(Date.now()); // sin esto, el primer cuadro usa la hora de cuando se montó el componente
    const iv = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(iv);
  }, [open]);

  const remainingMs = round ? roundRemaining(round, now) : null;
  const progress = round?.durationMs && remainingMs !== null ? 1 - remainingMs / round.durationMs : 0;

  useEffect(() => {
    if (!driver || !round || round.revealedAt) return;
    if (shouldAutoReveal(round, driver.participants.length, now)) {
      const t = tally(round, driver.participants);
      driver.dispatch({ type: "REVEAL_ROUND", roundId: round.id, winner: t.spotlightId, guiltyIds: t.loserIds });
      return;
    }
    if (driver.sound && remainingMs !== null && remainingMs > 0 && remainingMs <= 10_000) {
      const sec = Math.ceil(remainingMs / 1000);
      if (sec !== lastTick.current) {
        lastTick.current = sec;
        audioEffects.playUrgentTick(1 - remainingMs / 10_000);
      }
    }
  }, [now, round, driver, remainingMs]);

  return { remainingMs, progress };
}
