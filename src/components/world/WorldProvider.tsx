"use client";

import React, { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { WorldLevel, WorldRoom } from "./types";
import { parentOf, planNav, resolveView, trackHistory, type NavCause } from "./vista";
import { LEVEL_KEY, levelAfter, levelCeiling, parseLevel, shouldUpgrade, type DeviceCaps, type PerfEvent } from "./niveles";
import { createLook, type Look } from "./mirar";
import type { Insets } from "./proyeccion";

/*
 * El mundo de un apartado: vive en su layout (el lienzo no se corta al pasar de /casino a /casino/blackjack), lee el
 * punto de vista de la URL y decide el nivel. Todo parte en el nivel 0, el SectionStage de hoy: el lienzo 3D se carga
 * aparte (import dinámico), oculto, y solo reemplaza a la vista de hoy cuando su escena está lista. Pasar entre el
 * nivel 0 y el 3D cambia el árbol de la vista, así que solo ocurre en el centro del apartado o justo en un cambio de
 * vista: nunca bajo la mano de quien está usando una herramienta.
 */

const WorldCanvas = dynamic(() => import("./WorldCanvas"), { ssr: false, loading: () => null });

/** Lo que comparten el lienzo y la capa DOM sin pasar por React (se lee y escribe en cada cuadro) */
export interface WorldBus {
  /** El botón real de cada objeto, por id de opción */
  anchors: Map<string, HTMLElement>;
  /** La herramienta abierta: su marco y la opción a la que pertenece */
  tool: { el: HTMLElement | null; id: string | null; open: boolean };
  look: Look;
  /** Lo que tapan el encabezado, la tira de herramientas, la bandeja y el dock */
  insets: Insets;
  measure(): void;
  /** El lienzo avisa que la cámara llegó a una vista */
  arrive(view: string): void;
  /** La escena terminó de cargar */
  ready(): void;
  perf(e: PerfEvent): void;
}

export interface WorldApi {
  room: WorldRoom;
  /** Lo que se ve: 0 = el SectionStage de hoy */
  level: WorldLevel;
  /** Lo que dibuja el lienzo (0 = sin lienzo); puede ir adelantado mientras la escena carga oculta */
  sceneLevel: WorldLevel;
  view: string | null;
  /** La cámara llegó a la vista actual (sin 3D, siempre) */
  arrived: boolean;
  reduce: boolean;
  small: boolean;
  /** ELEGIR → ACERCARSE: escribe la vista en la URL (apila, reemplaza o vuelve según `planNav`) */
  go(view: string): void;
  /** VOLVER: a la vista padre */
  back(): void;
  bus: WorldBus;
}

const WorldContext = createContext<WorldApi | null>(null);

/** El mundo del apartado; `null` fuera de uno (las vistas siguen como hoy) */
export const useWorld = () => useContext(WorldContext);

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl2") || c.getContext("webgl")) as WebGLRenderingContext | null;
    // Solo era para preguntar: se suelta el contexto (el navegador permite pocos a la vez)
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

function readCaps(): DeviceCaps {
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  let override: WorldLevel | null = null;
  try {
    override = parseLevel(localStorage.getItem(LEVEL_KEY));
  } catch {
    /* sin almacenamiento: decide el equipo */
  }
  return { webgl: hasWebGL(), saveData: !!nav.connection?.saveData, deviceMemory: nav.deviceMemory, cores: nav.hardwareConcurrency || undefined, override };
}

/** Lo que tapan las piezas fijas: el encabezado y la tira de herramientas arriba, la bandeja y el dock abajo */
function measureInsets(): Insets {
  const bottomOf = (sel: string) => document.querySelector<HTMLElement>(sel)?.getBoundingClientRect().bottom ?? 0;
  const topOf = (sel: string) => {
    const el = document.querySelector<HTMLElement>(sel);
    return el ? el.getBoundingClientRect().top : window.innerHeight;
  };
  const top = Math.max(0, bottomOf("header.sticky"), bottomOf("[data-world-strip]"));
  const bottom = Math.max(0, window.innerHeight - Math.min(topOf('nav[aria-label="Navegación principal"]'), topOf("[data-world-tray]")));
  return { top, right: 0, bottom, left: 0 };
}

/** Lee la URL dentro de su propio Suspense: así `useSearchParams` no deja la página en blanco en el HTML estático */
function ViewSync({ onView }: { onView: (pathname: string, search: string) => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => onView(pathname, search), [pathname, search, onView]);
  return null;
}

export function WorldProvider({ room, Scene, debug = false, children }: { room: WorldRoom; Scene: React.ComponentType; debug?: boolean; children: React.ReactNode }) {
  const router = useRouter();
  const [view, setView] = useState<string | null>(null);
  const [arrived, setArrived] = useState(true);
  const [ceiling, setCeiling] = useState<WorldLevel>(0);
  const [sceneLevel, setSceneLevel] = useState<WorldLevel>(0);
  const [ready, setReady] = useState(false);
  const [shown, setShown] = useState(false);
  /** Cambios de vista desde que la escena quedó lista (para entrar al 3D en el próximo, si ya se estaba usando la vista) */
  const [changes, setChanges] = useState(0);
  const [reduce, setReduce] = useState(false);
  const [small, setSmall] = useState(false);
  const [hidden, setHidden] = useState(false);

  const viewRef = useRef<string | null>(null);
  const locRef = useRef({ pathname: "", search: "" });
  const stack = useRef<string[]>([]);
  const pending = useRef<{ to: string; cause: NavCause } | null>(null);
  const interacted = useRef(false);
  const forced = useRef(false);
  const focusBack = useRef<string | null>(null);
  const focusFromTool = useRef(false);
  /** Una bajada al nivel 0 que espera a que se cierre la herramienta */
  const deferredZero = useRef(false);
  const ceilingRef = useRef<WorldLevel>(0);
  ceilingRef.current = ceiling;
  /** Nivel pedido a mano (pruebas, modo tranquilo): PerformanceMonitor no lo cambia */
  const pinned = useRef(false);

  const level: WorldLevel = shown && ready ? sceneLevel : 0;
  const levelRef = useRef<WorldLevel>(0);
  levelRef.current = level;

  /** Bajar a 0 desmonta el 3D y vuelve al SectionStage: en el centro, ya; con una herramienta abierta, al cerrarla */
  const applyLevel = useCallback(
    (next: WorldLevel) => {
      const v = viewRef.current;
      if (next === 0 && levelRef.current > 0 && v !== null && v !== room.home) {
        deferredZero.current = true;
        return;
      }
      deferredZero.current = false;
      setSceneLevel(next);
    },
    [room.home],
  );

  const perfRef = useRef<(e: PerfEvent) => void>(() => undefined);
  perfRef.current = (e) => {
    if (pinned.current) return;
    const next = levelAfter(sceneLevel, e, ceilingRef.current);
    if (next !== sceneLevel) applyLevel(next);
  };

  const busRef = useRef<WorldBus | null>(null);
  if (!busRef.current) {
    const b: WorldBus = {
      anchors: new Map(),
      tool: { el: null, id: null, open: false },
      look: createLook(),
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
      measure() {
        b.insets = measureInsets();
      },
      arrive(v) {
        if (v === viewRef.current) setArrived(true);
      },
      ready() {
        setReady(true);
      },
      perf(e) {
        perfRef.current(e);
      },
    };
    busRef.current = b;
  }
  const bus = busRef.current;

  // Preparación: preferencias del sistema, nivel del equipo y si la persona ya tocó algo
  useEffect(() => {
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqSmall = window.matchMedia("(max-width: 700px)");
    const sync = () => {
      setReduce(mqReduce.matches);
      setSmall(mqSmall.matches);
    };
    sync();
    mqReduce.addEventListener("change", sync);
    mqSmall.addEventListener("change", sync);
    const caps = readCaps();
    const c = levelCeiling(caps);
    pinned.current = caps.override !== null;
    setCeiling(c);
    setSceneLevel(c);
    const touched = () => {
      interacted.current = true;
    };
    window.addEventListener("pointerdown", touched, { capture: true });
    window.addEventListener("keydown", touched, { capture: true });
    const vis = () => setHidden(document.visibilityState !== "visible");
    vis();
    document.addEventListener("visibilitychange", vis);
    const onResize = () => bus.measure();
    onResize();
    window.addEventListener("resize", onResize);
    return () => {
      mqReduce.removeEventListener("change", sync);
      mqSmall.removeEventListener("change", sync);
      window.removeEventListener("pointerdown", touched, { capture: true });
      window.removeEventListener("keydown", touched, { capture: true });
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("resize", onResize);
    };
  }, [bus]);

  const onView = useCallback(
    (pathname: string, search: string) => {
      locRef.current = { pathname, search };
      const next = resolveView(room, pathname, search);
      const prev = viewRef.current;
      if (next === prev) return;
      const p = pending.current;
      const cause: NavCause = p && p.to === next ? p.cause : "pop";
      pending.current = null;
      if (next !== null) stack.current = trackHistory(room, stack.current, prev, next, cause);
      viewRef.current = next;
      if (prev !== null && next !== null && parentOf(room, prev) === next) {
        focusBack.current = prev;
        // ¿El foco venía de la herramienta (o ya se había caído)? Entonces vuelve al objeto aunque caiga en otro lado al cerrar
        const a = document.activeElement as HTMLElement | null;
        focusFromTool.current = !a || a === document.body || !!a.closest("[data-world-tool]");
      }
      setView(next);
      setArrived(levelRef.current === 0);
      if (prev !== null) setChanges((n) => n + 1);
      // Una bajada al nivel 0 que esperaba: este es el momento (la herramienta de antes ya no está)
      if (deferredZero.current) {
        deferredZero.current = false;
        setSceneLevel(0);
      }
    },
    [room],
  );

  const go = useCallback(
    (to: string) => {
      const at = { view: viewRef.current, previous: stack.current[stack.current.length - 1] ?? null, ...locRef.current };
      const step = planNav(room, at, to);
      if (step.kind === "none") return;
      pending.current = { to, cause: step.kind };
      if (step.kind === "back") {
        router.back();
        return;
      }
      // Si solo cambia ?ver= (misma ruta), basta con el historial del navegador: Next sincroniza useSearchParams sin
      // pedirle la página al servidor ni volver a pintar el árbol (el toque no se traba). Otra ruta usa el router.
      const samePath = new URL(step.href, window.location.href).pathname === window.location.pathname;
      if (samePath) window.history[step.kind === "push" ? "pushState" : "replaceState"](null, "", step.href);
      else if (step.kind === "push") router.push(step.href, { scroll: false });
      else router.replace(step.href, { scroll: false });
    },
    [room, router],
  );
  const back = useCallback(() => {
    const v = viewRef.current;
    const up = v ? parentOf(room, v) : null;
    if (up) go(up);
  }, [go, room]);

  // La escena lista reemplaza al SectionStage: de inmediato si nadie lo está usando; si no, en el próximo cambio de vista
  const changesAtReady = useRef(0);
  const wasReady = useRef(false);
  useEffect(() => {
    // Los cambios de vista que cuentan son los posteriores al momento en que la escena quedó lista
    if (ready && !wasReady.current) changesAtReady.current = changes;
    wasReady.current = ready;
    if (shown || sceneLevel === 0 || !ready) return;
    const viewChanged = changes > changesAtReady.current;
    if (forced.current || shouldUpgrade({ ready, interacted: interacted.current, viewChanged })) setShown(true);
  }, [ready, changes, shown, sceneLevel]);
  // Sin lienzo no hay escena lista: si vuelve a subir, se espera otra vez a que cargue
  useEffect(() => {
    if (sceneLevel !== 0) return;
    setReady(false);
    setShown(false);
  }, [sceneLevel]);

  // Si la cámara no avisa (pestaña oculta, escena trabada), la herramienta igual aparece: nada depende del 3D
  useEffect(() => {
    if (arrived) return;
    const t = window.setTimeout(() => setArrived(true), 1500);
    return () => window.clearTimeout(t);
  }, [arrived, view]);

  // Al volver de una herramienta, el foco vuelve a su objeto (si no se fue a otra parte)
  useEffect(() => {
    const id = focusBack.current;
    if (!id) return;
    focusBack.current = null;
    const active = document.activeElement as HTMLElement | null;
    const lost = !active || active === document.body || !!active.closest("[data-world-tool]");
    if (!focusFromTool.current && !lost) return;
    // En el nivel 0 (o si la escena bajó al cerrar) el objeto es la opción del SectionStage
    const target = () => (level > 0 ? bus.anchors.get(id) : null) ?? document.querySelector<HTMLElement>(`[data-option="${CSS.escape(id)}"]`);
    const raf = requestAnimationFrame(() => target()?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(raf);
  }, [view, level, bus]);

  // El nivel visible queda en <html> para las pruebas y el CSS (sin envolver la página: el nivel 0 queda como hoy)
  useEffect(() => {
    document.documentElement.dataset.mundoNivel = String(level);
    return () => {
      delete document.documentElement.dataset.mundoNivel;
    };
  }, [level]);

  // Laboratorio: cambiar de nivel a mano (con la misma regla de no cambiar nada bajo la mano)
  useEffect(() => {
    if (!debug) return;
    const w = window as Window & { __mundo?: { setLevel: (l: WorldLevel) => void } };
    w.__mundo = {
      setLevel: (l) => {
        forced.current = true;
        applyLevel(l);
      },
    };
    return () => {
      delete w.__mundo;
    };
  }, [debug, applyLevel]);

  const api = useMemo<WorldApi>(() => ({ room, level, sceneLevel, view, arrived, reduce, small, go, back, bus }), [room, level, sceneLevel, view, arrived, reduce, small, go, back, bus]);

  return (
    <WorldContext.Provider value={api}>
      <Suspense fallback={null}>
        <ViewSync onView={onView} />
      </Suspense>
      {sceneLevel > 0 && (
        // Detrás de la página y delante del fondo común; invisible (y sin eventos) hasta que reemplaza al SectionStage
        <div aria-hidden data-world-canvas="" className={`fixed inset-0 -z-[5] touch-pan-y transition-opacity duration-300 ease-out ${level > 0 ? "opacity-100" : "pointer-events-none opacity-0"}`}>
          <WorldCanvas level={sceneLevel === 2 ? 2 : 1} paused={hidden} Scene={Scene} />
        </div>
      )}
      {children}
    </WorldContext.Provider>
  );
}
