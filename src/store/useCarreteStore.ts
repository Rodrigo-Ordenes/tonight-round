"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CODE_RE,
  emptyCarrete,
  mergeCarrete,
  randomCode,
  type BasketState,
  type CarreteState,
  type GamesState,
  type Participant,
} from "@/lib/carreteState";
import type { Consumption } from "@/lib/alcohol";

/**
 * useCarreteStore — ÚNICA fuente de verdad de un carrete.
 * - Persistencia local: localStorage `carrete_[CODE]`
 * - Sincronización entre pestañas: BroadcastChannel
 * - Sincronización entre dispositivos: API efímera /api/carrete/[code] (polling + merge LWW)
 * - Código "SOLO": modo planificador, nunca toca el servidor.
 */

export const SOLO = "SOLO";
export const ACTIVE_KEY = "tonight_active_carrete";
const lsKey = (code: string) => `carrete_${code}`;
const meKey = (code: string) => `tonight_me_${code}`;

const uid = () => Math.random().toString(36).slice(2, 10);

export type CarreteStatus = "loading" | "ready" | "missing";

function readLocal(code: string): CarreteState | null {
  try {
    const raw = localStorage.getItem(lsKey(code));
    return raw ? (JSON.parse(raw) as CarreteState) : null;
  } catch {
    return null;
  }
}

function writeLocal(s: CarreteState) {
  try {
    localStorage.setItem(lsKey(s.code), JSON.stringify(s));
  } catch {
    /* cuota llena */
  }
}

export function getActiveCode(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACTIVE_KEY);
}
export function setActiveCode(code: string | null) {
  if (code) localStorage.setItem(ACTIVE_KEY, code);
  else localStorage.removeItem(ACTIVE_KEY);
  window.dispatchEvent(new Event("tonight-active-change"));
}

/** Crea un carrete nuevo en el servidor (regenera el código si hay colisión 409). */
export async function createCarrete(): Promise<string> {
  for (let i = 0; i < 6; i++) {
    const code = randomCode();
    const s = emptyCarrete(code);
    try {
      const res = await fetch(`/api/carrete/${code}`, { method: "POST", body: JSON.stringify(s) });
      if (res.status === 409) continue;
      if (!res.ok) throw new Error("server");
    } catch {
      // sin servidor: igual funciona local
    }
    writeLocal(s);
    setActiveCode(code);
    return code;
  }
  throw new Error("No se pudo generar un código único");
}

/** ¿Existe el carrete? (servidor primero; local como respaldo del host) */
export async function carreteExists(code: string): Promise<boolean> {
  code = code.toUpperCase();
  if (!CODE_RE.test(code)) return false;
  try {
    const res = await fetch(`/api/carrete/${code}`, { cache: "no-store" });
    if (res.ok) {
      const s = (await res.json()) as CarreteState;
      const local = readLocal(code);
      writeLocal(local ? mergeCarrete(local, s) : s);
      return true;
    }
  } catch {
    /* ignore */
  }
  return readLocal(code) !== null;
}

export function useCarreteStore(codeRaw: string) {
  const code = codeRaw.toUpperCase();
  const isSolo = code === SOLO;
  const [state, setState] = useState<CarreteState>(() => emptyCarrete(code));
  const [status, setStatus] = useState<CarreteStatus>("loading");
  const [meId, setMeId] = useState<string | null>(null);
  const stateRef = useRef(state);
  const chanRef = useRef<BroadcastChannel | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const missingRef = useRef(false);

  const commit = useCallback(
    (next: CarreteState, broadcast = true) => {
      stateRef.current = next;
      setState(next);
      writeLocal(next);
      if (broadcast) chanRef.current?.postMessage(next);
    },
    []
  );

  const push = useCallback(async () => {
    if (isSolo || missingRef.current) return;
    try {
      const res = await fetch(`/api/carrete/${code}`, {
        method: "PUT",
        body: JSON.stringify(stateRef.current),
      });
      if (res.status === 404) {
        // servidor reiniciado: el host re-publica su copia local
        await fetch(`/api/carrete/${code}`, { method: "POST", body: JSON.stringify(stateRef.current) });
        return;
      }
      if (res.ok) {
        const merged = (await res.json()) as CarreteState;
        if (JSON.stringify(merged) !== JSON.stringify(stateRef.current)) commit(merged);
      }
    } catch {
      /* offline: se reintenta en el próximo ciclo */
    }
  }, [code, isSolo, commit]);

  const update = useCallback(
    (fn: (s: CarreteState) => CarreteState) => {
      const next = fn(stateRef.current);
      commit({ ...next, updatedAt: Date.now() });
      if (!isSolo) {
        if (pushTimer.current) clearTimeout(pushTimer.current);
        pushTimer.current = setTimeout(push, 150);
      }
    },
    [commit, isSolo, push]
  );

  // Carga inicial
  useEffect(() => {
    let cancelled = false;
    missingRef.current = false;
    setStatus("loading");
    (async () => {
      const local = readLocal(code);
      if (isSolo) {
        const s = local ?? emptyCarrete(SOLO);
        if (!cancelled) {
          commit(s, false);
          setStatus("ready");
        }
        return;
      }
      if (!CODE_RE.test(code)) {
        missingRef.current = true;
        if (!cancelled) setStatus("missing");
        return;
      }
      let server: CarreteState | null = null;
      try {
        const res = await fetch(`/api/carrete/${code}`, { cache: "no-store" });
        if (res.ok) server = (await res.json()) as CarreteState;
      } catch {
        /* ignore */
      }
      if (cancelled) return;
      if (!server && !local) {
        missingRef.current = true;
        setStatus("missing");
        return;
      }
      commit(server && local ? mergeCarrete(local, server) : ((server ?? local) as CarreteState), false);
      setStatus("ready");
      setActiveCode(code);
      setMeId(localStorage.getItem(meKey(code)));
      if (!server) void push();
    })();
    return () => {
      cancelled = true;
    };
  }, [code, isSolo, commit, push]);

  // BroadcastChannel + polling
  useEffect(() => {
    if (status !== "ready") return;
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel(`carrete_${code}`);
      ch.onmessage = (e) => commit(mergeCarrete(stateRef.current, e.data as CarreteState), false);
      chanRef.current = ch;
    }
    const iv = isSolo ? null : setInterval(push, 2000);
    return () => {
      ch?.close();
      chanRef.current = null;
      if (iv) clearInterval(iv);
    };
  }, [status, code, isSolo, commit, push]);

  /* ---------------- Acciones ---------------- */

  const addParticipant = useCallback(
    (p: Partial<Participant> & { name: string }, markAsMe = false): string => {
      const id = uid();
      const now = Date.now();
      const full: Participant = {
        id,
        name: p.name,
        gender: p.gender ?? "M",
        weightKg: p.weightKg ?? 75,
        role: p.role ?? "drinker",
        consumptions: [],
        waterCount: 0,
        status: "party",
        commune: "",
        arrivedAt: null,
        resurrectionLabel: "",
        resurrectionHour: null,
        resurrectionMode: "functional",
        active: true,
        joinedAt: now,
        updatedAt: now,
      };
      update((s) => ({ ...s, participants: [...s.participants, { ...full, ...p, id, joinedAt: now, updatedAt: now }] }));
      if (markAsMe) {
        localStorage.setItem(meKey(code), id);
        setMeId(id);
      }
      return id;
    },
    [update, code]
  );

  const updateParticipant = useCallback(
    (id: string, patch: Partial<Participant>) =>
      update((s) => ({
        ...s,
        participants: s.participants.map((p) => (p.id === id ? { ...p, ...patch, updatedAt: Date.now() } : p)),
      })),
    [update]
  );

  const removeParticipant = useCallback(
    (id: string) => updateParticipant(id, { deleted: true }),
    [updateParticipant]
  );

  const addConsumption = useCallback(
    (id: string, c: Omit<Consumption, "id" | "ts">) =>
      update((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === id
            ? { ...p, consumptions: [...p.consumptions, { ...c, id: uid(), ts: Date.now() }], updatedAt: Date.now() }
            : p
        ),
      })),
    [update]
  );

  const removeLastConsumption = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === id ? { ...p, consumptions: p.consumptions.slice(0, -1), updatedAt: Date.now() } : p
        ),
      })),
    [update]
  );

  const addWater = useCallback(
    (id: string) =>
      update((s) => ({
        ...s,
        participants: s.participants.map((p) =>
          p.id === id ? { ...p, waterCount: p.waterCount + 1, updatedAt: Date.now() } : p
        ),
      })),
    [update]
  );

  const patchBasket = useCallback(
    (patch: Partial<BasketState>) =>
      update((s) => ({ ...s, basket: { ...s.basket, ...patch, updatedAt: Date.now() } })),
    [update]
  );

  const patchGames = useCallback(
    (patch: Partial<GamesState>) =>
      update((s) => ({ ...s, games: { ...s.games, ...patch, updatedAt: Date.now() } })),
    [update]
  );

  const participants = state.participants.filter((p) => !p.deleted);

  return {
    code,
    isSolo,
    status,
    state,
    participants,
    basket: state.basket,
    games: state.games,
    meId,
    setMeId: (id: string) => {
      localStorage.setItem(meKey(code), id);
      setMeId(id);
    },
    addParticipant,
    updateParticipant,
    removeParticipant,
    addConsumption,
    removeLastConsumption,
    addWater,
    patchBasket,
    patchGames,
  };
}

export type CarreteStore = ReturnType<typeof useCarreteStore>;
