import type { LiveRound } from "./carreteState";

const BASE_MS = 2000;
const LIVE_MS = 700;
const MAX_MS = 16000;
const HIDDEN_MIN_MS = 8000;
/** Margen tras el tiempo de la ronda (revelado en camino) y ventana para rondas sin duración. */
const GRACE_MS = 10_000;
const UNTIMED_FAST_MS = 60_000;

/**
 * Espera entre sincronizaciones: más rápido mientras hay una votación abierta (los votos se sienten
 * al instante), backoff exponencial con fallos y mínimo de 8 s con la pestaña oculta.
 */
export function pollDelay(round: LiveRound | null | undefined, failures: number, hidden: boolean, now = Date.now()): number {
  const until = round ? round.startedAt + (round.durationMs ? round.durationMs + GRACE_MS : UNTIMED_FAST_MS) : 0;
  const base = round && !round.revealedAt && now < until ? LIVE_MS : BASE_MS;
  const withBackoff = failures > 0 ? Math.min(MAX_MS, BASE_MS * 2 ** failures) : base;
  return hidden ? Math.max(withBackoff, HIDDEN_MIN_MS) : withBackoff;
}
