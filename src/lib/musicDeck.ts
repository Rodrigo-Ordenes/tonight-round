"use client";

import { useSyncExternalStore } from "react";

/**
 * El reproductor que acompaña toda la visita: vive en el armazón de la app (no en una página), así la música que pones
 * en la pista sigue sonando mientras recorres el bar, el casino o la sala. `ambiente` toca lo elegido (tu lista, el
 * ambiente o el DJ automático); `fila` toca, en orden, los pedidos con link de YouTube y avanza solo al terminar cada
 * uno.
 */
export type DeckMode = "ambiente" | "fila";
export interface DeckState {
  on: boolean;
  mode: DeckMode;
  /** Recogido a una píldora (sigue sonando) */
  folded: boolean;
}

const OFF: DeckState = { on: false, mode: "ambiente", folded: false };
let state: DeckState = OFF;
const subs = new Set<() => void>();

export const musicDeck = {
  get: () => state,
  set(patch: Partial<DeckState>) {
    state = { ...state, ...patch };
    subs.forEach((f) => f());
  },
  play(mode: DeckMode) {
    musicDeck.set({ on: true, mode, folded: false });
  },
  stop() {
    musicDeck.set({ on: false });
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};

export function useMusicDeck() {
  return useSyncExternalStore(musicDeck.subscribe, musicDeck.get, () => OFF);
}
