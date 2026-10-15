"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  CODE_RE,
  applyEvent,
  applyEvents,
  emptyCarrete,
  mergeCarrete,
  normalizeCarrete,
  randomCode,
  type BasketState,
  type CarreteAction,
  type CarreteEvent,
  type CarreteState,
  type GamesState,
  type Participant,
  type ParticipantPatch,
} from "@/lib/carreteState";
import type { Consumption } from "@/lib/alcohol";

/**
 * useCarreteStore — ÚNICA fuente de verdad de un carrete.
 * - Un motor (`CarreteEngine`) por código, compartido por todos los componentes que lo usan
 *   (sala, panel lateral en vivo, TV…): una sola conexión y un solo polling por pestaña.
 * - Cada interacción es una acción delta idempotente (`CarreteEvent`) aplicada al instante en local (optimistic UI).
 * - Las acciones pendientes viven en una cola offline (`carrete_outbox_[CODE]`) hasta que el servidor las confirma.
 * - Sincronización entre pestañas: BroadcastChannel (eventos + estado).
 * - Entre dispositivos: POST { events } + polling GET con backoff exponencial + PUT de anti-entropía.
 * - Código "SOLO": modo planificador, nunca toca el servidor.
 */

export const SOLO = "SOLO";
export const ACTIVE_KEY = "tonight_active_carrete";
const lsKey = (code: string) => `carrete_${code}`;
const outboxKey = (code: string) => `carrete_outbox_${code}`;
const meKey = (code: string) => `tonight_me_${code}`;

export const uid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID().replace(/-/g, "").slice(0, 16)
    : Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

const POLL_BASE_MS = 2000;
const POLL_MAX_MS = 16000;
const ANTI_ENTROPY_MS = 30000;

export type CarreteStatus = "loading" | "ready" | "missing";

type ChannelMsg = { kind: "event"; ev: CarreteEvent } | { kind: "state"; state: CarreteState };

function readLocal(code: string): CarreteState | null {
  try {
    const raw = localStorage.getItem(lsKey(code));
    return raw ? normalizeCarrete(JSON.parse(raw) as CarreteState) : null;
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

function readOutbox(code: string): CarreteEvent[] {
  try {
    const raw = localStorage.getItem(outboxKey(code));
    return raw ? (JSON.parse(raw) as CarreteEvent[]) : [];
  } catch {
    return [];
  }
}

function writeOutbox(code: string, evs: CarreteEvent[]) {
  try {
    if (evs.length === 0) localStorage.removeItem(outboxKey(code));
    else localStorage.setItem(outboxKey(code), JSON.stringify(evs.slice(-500)));
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
      writeLocal(local ? mergeCarrete(local, s) : normalizeCarrete(s));
      return true;
    }
  } catch {
    /* ignore */
  }
  return readLocal(code) !== null;
}

/* ------------------------------------------------------------------ */
/* Motor compartido por código                                         */
/* ------------------------------------------------------------------ */

interface Snapshot {
  state: CarreteState;
  status: CarreteStatus;
  meId: string | null;
  online: boolean;
  /** Acciones guardadas en la cola offline que el servidor aún no confirma */
  pending: number;
}

class CarreteEngine {
  readonly code: string;
  readonly isSolo: boolean;
  private snap: Snapshot;
  private listeners = new Set<() => void>();
  private chan: BroadcastChannel | null = null;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private pollTimer: ReturnType<typeof setTimeout> | null = null;
  private flushing = false;
  private missing = false;
  private running = false;
  private delay = POLL_BASE_MS;
  private lastAntiEntropy = 0;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(code: string) {
    this.code = code;
    this.isSolo = code === SOLO;
    this.snap = { state: emptyCarrete(code), status: "loading", meId: null, online: true, pending: 0 };
  }

  get snapshot() {
    return this.snap;
  }

  get state() {
    return this.snap.state;
  }

  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }
    if (!this.running) this.start();
    return () => {
      this.listeners.delete(fn);
      // Pequeña gracia para navegaciones entre rutas que usan el mismo carrete.
      if (this.listeners.size === 0) this.stopTimer = setTimeout(() => this.stop(), 1500);
    };
  };

  private set(patch: Partial<Snapshot>) {
    this.snap = { ...this.snap, ...patch };
    this.listeners.forEach((l) => l());
  }

  private commit(next: CarreteState, broadcastState = false) {
    if (JSON.stringify(next) === JSON.stringify(this.snap.state)) return;
    writeLocal(next);
    this.set({ state: next });
    if (broadcastState) this.chan?.postMessage({ kind: "state", state: next } satisfies ChannelMsg);
  }

  setMe(id: string) {
    localStorage.setItem(meKey(this.code), id);
    this.set({ meId: id });
  }

  dispatch = (action: CarreteAction) => {
    const ev = { ...action, eventId: uid(), at: Date.now() } as CarreteEvent;
    this.commit(applyEvent(this.snap.state, ev));
    this.chan?.postMessage({ kind: "event", ev } satisfies ChannelMsg);
    if (this.isSolo) return;
    const out = [...readOutbox(this.code), ev];
    writeOutbox(this.code, out);
    this.set({ pending: out.length });
    if (this.flushTimer) clearTimeout(this.flushTimer);
    this.flushTimer = setTimeout(() => void this.flush(), 120);
  };

  /** Estado del servidor + acciones locales aún no confirmadas (rebase). */
  private rebase(server: CarreteState) {
    const pending = readOutbox(this.code);
    const seen = new Set(server.seen ?? []);
    const stillPending = pending.filter((e) => !seen.has(e.eventId));
    if (stillPending.length !== pending.length) writeOutbox(this.code, stillPending);
    if (stillPending.length !== this.snap.pending) this.set({ pending: stillPending.length });
    // El merge conserva lo que este dispositivo tenga y el servidor aún no (p. ej. tras un reinicio del servidor).
    this.commit(applyEvents(mergeCarrete(this.snap.state, server), stillPending));
  }

  /** Re-siembra la sala con la copia local (servidor reiniciado o instancia serverless nueva). */
  private async seed() {
    try {
      const res = await fetch(`/api/carrete/${this.code}`, {
        method: "POST",
        body: JSON.stringify({ seed: this.snap.state }),
      });
      if (res.ok) this.rebase((await res.json()) as CarreteState);
      return res.ok;
    } catch {
      return false;
    }
  }

  /** Envía la cola offline. Idempotente: si varias pestañas mandan el mismo evento, el servidor lo aplica una vez. */
  private async flush() {
    if (this.isSolo || this.missing || this.flushing) return;
    const pending = readOutbox(this.code);
    if (pending.length === 0) return;
    this.flushing = true;
    try {
      const send = () =>
        fetch(`/api/carrete/${this.code}`, { method: "POST", body: JSON.stringify({ events: pending }) });
      let res = await send();
      if (res.status === 404 && (await this.seed())) res = await send();
      if (res.ok) {
        if (!this.snap.online) this.set({ online: true });
        this.rebase((await res.json()) as CarreteState);
      }
    } catch {
      if (this.snap.online) this.set({ online: false }); // sin señal: se reintenta luego
    } finally {
      this.flushing = false;
    }
  }

  private tick = async () => {
    if (!this.running) return;
    try {
      await this.flush();
      const res = await fetch(`/api/carrete/${this.code}`, { cache: "no-store" });
      if (res.status === 404) {
        await this.seed();
      } else if (res.ok) {
        this.rebase((await res.json()) as CarreteState);
        if (Date.now() - this.lastAntiEntropy > ANTI_ENTROPY_MS) {
          this.lastAntiEntropy = Date.now();
          const put = await fetch(`/api/carrete/${this.code}`, {
            method: "PUT",
            body: JSON.stringify(this.snap.state),
          });
          if (put.ok) this.rebase((await put.json()) as CarreteState);
        }
      }
      if (!this.snap.online) this.set({ online: true });
      this.delay = POLL_BASE_MS;
    } catch {
      if (this.snap.online) this.set({ online: false });
      this.delay = Math.min(POLL_MAX_MS, this.delay * 2);
    }
    if (this.running) {
      const wait = document.hidden ? Math.max(this.delay, 8000) : this.delay;
      this.pollTimer = setTimeout(this.tick, wait);
    }
  };

  private onOnline = () => {
    this.delay = POLL_BASE_MS;
    void this.flush();
  };

  private async start() {
    this.running = true;
    engines.set(this.code, this);
    this.missing = false;
    const local = readLocal(this.code);
    const meId = localStorage.getItem(meKey(this.code));

    if (typeof BroadcastChannel !== "undefined") {
      this.chan = new BroadcastChannel(`carrete_${this.code}`);
      this.chan.onmessage = (e: MessageEvent<ChannelMsg>) => {
        const msg = e.data;
        if (msg.kind === "event") this.commit(applyEvent(this.snap.state, msg.ev));
        else this.commit(mergeCarrete(this.snap.state, msg.state));
      };
    }

    if (this.isSolo) {
      this.commit(local ?? emptyCarrete(SOLO));
      this.set({ status: "ready", meId });
      return;
    }
    if (!CODE_RE.test(this.code)) {
      this.missing = true;
      this.set({ status: "missing" });
      return;
    }

    let server: CarreteState | null = null;
    try {
      const res = await fetch(`/api/carrete/${this.code}`, { cache: "no-store" });
      if (res.ok) server = (await res.json()) as CarreteState;
    } catch {
      /* ignore */
    }
    if (!this.running) return;
    if (!server && !local) {
      this.missing = true;
      this.set({ status: "missing" });
      return;
    }
    const base = server && local ? mergeCarrete(local, server) : normalizeCarrete((server ?? local) as CarreteState);
    this.commit(applyEvents(base, readOutbox(this.code)));
    this.set({ status: "ready", meId });
    setActiveCode(this.code);
    if (!server) void this.seed();
    void this.flush();

    this.lastAntiEntropy = Date.now();
    this.pollTimer = setTimeout(this.tick, POLL_BASE_MS);
    window.addEventListener("online", this.onOnline);
  }

  private stop() {
    this.running = false;
    if (this.pollTimer) clearTimeout(this.pollTimer);
    if (this.flushTimer) clearTimeout(this.flushTimer);
    window.removeEventListener("online", this.onOnline);
    this.chan?.close();
    this.chan = null;
    this.snap = { ...this.snap, status: "loading" };
    engines.delete(this.code);
  }
}

const engines = new Map<string, CarreteEngine>();
function getEngine(code: string): CarreteEngine {
  let e = engines.get(code);
  if (!e) {
    e = new CarreteEngine(code);
    engines.set(code, e);
  }
  return e;
}

const SERVER_SNAPSHOT: Snapshot = {
  state: emptyCarrete("SSR"),
  status: "loading",
  meId: null,
  online: true,
  pending: 0,
};

export function useCarreteStore(codeRaw: string) {
  const code = codeRaw.toUpperCase();
  const isSolo = code === SOLO;
  const engine = useMemo(() => getEngine(code), [code]);
  const snap = useSyncExternalStore(engine.subscribe, () => engine.snapshot, () => SERVER_SNAPSHOT);
  const { state, status, meId, online, pending } = snap;
  const dispatch = engine.dispatch;

  /* ---------------- Acciones ---------------- */

  const addParticipant = useCallback(
    (p: Partial<Participant> & { name: string }, markAsMe = false): string => {
      const id = uid();
      const now = Date.now();
      const full: Participant = {
        gender: "M",
        weightKg: 75,
        role: "drinker",
        status: "party",
        commune: "",
        arrivedAt: null,
        resurrectionLabel: "",
        resurrectionHour: null,
        resurrectionMode: "functional",
        active: true,
        ...p,
        id,
        consumptions: [],
        waterCount: 0,
        water: [],
        removedIds: [],
        joinedAt: now,
        updatedAt: now,
      };
      dispatch({ type: "ADD_PARTICIPANT", participant: full });
      if (markAsMe) engine.setMe(id);
      return id;
    },
    [dispatch, engine]
  );

  const updateParticipant = useCallback(
    (id: string, patch: ParticipantPatch) => dispatch({ type: "PATCH_PARTICIPANT", id, patch }),
    [dispatch]
  );

  const removeParticipant = useCallback((id: string) => dispatch({ type: "REMOVE_PARTICIPANT", id }), [dispatch]);

  const addConsumption = useCallback(
    (id: string, c: Omit<Consumption, "id" | "ts">) =>
      dispatch({ type: "LOG_DRINK", participantId: id, consumption: { ...c, id: uid(), ts: Date.now() } }),
    [dispatch]
  );

  const removeLastConsumption = useCallback(
    (id: string) => {
      const p = engine.state.participants.find((x) => x.id === id);
      const last = p?.consumptions[p.consumptions.length - 1];
      if (last) dispatch({ type: "UNDO_DRINK", participantId: id, consumptionId: last.id });
    },
    [dispatch, engine]
  );

  const addWater = useCallback(
    (id: string) => dispatch({ type: "LOG_WATER", participantId: id, water: { id: uid(), ts: Date.now() } }),
    [dispatch]
  );

  const patchBasket = useCallback(
    (patch: Partial<Omit<BasketState, "updatedAt">>) => dispatch({ type: "PATCH_BASKET", patch }),
    [dispatch]
  );

  const patchGames = useCallback(
    (patch: Partial<Omit<GamesState, "updatedAt">>) => dispatch({ type: "PATCH_GAMES", patch }),
    [dispatch]
  );

  const resetAllConsumptions = useCallback(() => dispatch({ type: "RESET_CONSUMPTIONS" }), [dispatch]);

  const resetCarrete = useCallback(
    () => dispatch({ type: "RESET_CARRETE", epoch: Math.max((engine.state.epoch ?? 0) + 1, Date.now()) }),
    [dispatch, engine]
  );

  const setMeId = useCallback((id: string) => engine.setMe(id), [engine]);

  const participants = useMemo(() => state.participants.filter((p) => !p.deleted), [state.participants]);

  return {
    code,
    isSolo,
    status,
    online,
    pending,
    state,
    participants,
    basket: state.basket,
    games: state.games,
    meId,
    setMeId,
    dispatch,
    addParticipant,
    updateParticipant,
    removeParticipant,
    addConsumption,
    removeLastConsumption,
    addWater,
    resetAllConsumptions,
    resetCarrete,
    patchBasket,
    patchGames,
  };
}

export type CarreteStore = ReturnType<typeof useCarreteStore>;
