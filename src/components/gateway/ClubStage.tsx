"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, ArrowLeft, ArrowRight, KeyRound, Loader2, Music2, Play, Sparkles } from "lucide-react";
import { ZONAS_CLUB, lastZone, rememberZone } from "./club3d/zonas";
import { sfx } from "@/components/rooms/sfx";
import { askGyro } from "@/components/rooms/useParallax";
import { addWave, createFlow, smoothstep, spring, type Estacion, type Flow } from "./club3d/flow";
import { clubAudio } from "./club3d/clubAudio";
import HostNeonSvg from "./club3d/HostNeonSvg";

// La escena 3D (three.js) se carga solo en el navegador y después de la portada: no bloquea la primera pintura
const ClubScene = dynamic(() => import("./club3d/ClubScene"), { ssr: false, loading: () => null });

const N = ZONAS_CLUB.length;
/** Cuánto scroll pide cada estación (calle → adentro → zona), en altos de pantalla */
const TRAVEL = 0.9;
const SOUND_KEY = "tonight_club_sound";
const mod = (i: number) => ((i % N) + N) % N;

function saludo(hour: number) {
  if (hour >= 6 && hour < 13) return "Buenos días";
  if (hour >= 13 && hour < 20) return "Buenas tardes";
  return "Buenas noches";
}

const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/** «Entrar al bar», «Entrar a la pista»: el artículo se contrae como corresponde */
const entrarA = (title: string) => (title.startsWith("El ") ? `Entrar al ${title.slice(3).toLowerCase()}` : `Entrar a ${title.toLowerCase()}`);

const editable = (t: EventTarget | null) => t instanceof HTMLElement && !!t.closest("input,textarea,select,[contenteditable='true']");

/** Opacidad y desplazamiento de una capa de la interfaz según la profundidad (sin re-render) */
function band(el: HTMLElement | null, o: number, dy: number) {
  if (!el) return;
  el.style.opacity = o.toFixed(3);
  el.style.transform = `translate3d(0, ${dy.toFixed(1)}px, 0)`;
  el.style.visibility = o < 0.02 ? "hidden" : "visible";
}

/**
 * La sala principal: una sola toma continua. Afuera, la puerta del club y el host de neón que invita a pasar (y ya ahí,
 * lo más importante: crear la sala o entrar con código). Bajar es profundizar: la rueda, el dedo, las flechas o
 * «Pasar» abren las hojas y la cámara cruza el umbral; adentro, el host en medio del club presenta cada zona y se mira
 * alrededor arrastrando, con el trackpad de lado o con las flechas; bajar otra vez mete la cámara en la zona de
 * enfrente y aparece su carta. Todo lo mueve un mismo motor con resortes (la ola): la cámara, la puerta, el host, las
 * luces, el sonido y la interfaz. Sin WebGL o con movimiento reducido, la misma toma en 2D y sin movimiento de cámara.
 */
export default function ClubStage({
  onCreate,
  busy,
  codeOpen,
  onToggleCode,
  codePanel,
  alert,
  resume,
  onResume,
  onReplay,
  eyebrow,
}: {
  onCreate: () => void;
  busy: boolean;
  codeOpen: boolean;
  onToggleCode: () => void;
  codePanel: React.ReactNode;
  alert: React.ReactNode;
  resume: string | null;
  onResume: () => void;
  onReplay: () => void;
  eyebrow?: string;
}) {
  const router = useRouter();
  const reduce = useReducedMotion() ?? false;
  const [greet, setGreet] = useState("Buenas noches");
  const [three, setThree] = useState(false);
  const [ready, setReady] = useState(false);
  const [small, setSmall] = useState(false);
  const [station, setStation] = useState<Estacion>(0);
  const [active, setActive] = useState(0);
  const [visible, setVisible] = useState(true);
  const [sound, setSound] = useState(false);
  const zone = ZONAS_CLUB[active];

  const flow = useRef<Flow>(createFlow());
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLElement>(null);
  const doorUi = useRef<HTMLDivElement>(null);
  const zoneUi = useRef<HTMLDivElement>(null);
  const mobileActs = useRef<HTMLDivElement>(null);
  /** Geometría del recorrido: dónde empieza (px del documento) y cuánto scroll pide cada estación */
  const geo = useRef({ top: 0, travel: 800 });
  const settled = useRef<Estacion>(0);
  const stationRef = useRef<Estacion>(0);
  const activeRef = useRef(0);
  const anim = useRef<{ from: number; to: number; t0: number; dur: number; inout: boolean } | null>(null);
  const gesture = useRef({ lastScroll: 0, touching: false, wheelAt: 0, from: 0 as Estacion, virtual: null as number | null, yawWheelAt: 0, lastInput: 0, pinchAt: 0 });
  const touched = useRef(false);
  /** Volvió dentro de las últimas horas: el host lo saluda como a un conocido y entra mirando su última zona */
  const [back, setBack] = useState(false);
  /** Saliendo hacia el apartado de la zona (el destello antes de cambiar de vista) */
  const [leaving, setLeaving] = useState(false);
  const leaveTimer = useRef(0);
  const routerRef = useRef(router);
  routerRef.current = router;

  // ---------- Preparación ----------
  useEffect(() => {
    setGreet(saludo(new Date().getHours()));
    setSmall(window.matchMedia("(max-width: 700px)").matches);
    flow.current.reduce = reduce;
    setThree(hasWebGL() && !reduce);
    try {
      setSound(localStorage.getItem(SOUND_KEY) === "1");
    } catch {
      /* sin almacenamiento: queda apagado */
    }
    const last = lastZone();
    const k = last ? ZONAS_CLUB.findIndex((z) => z.id === last) : -1;
    if (k > 0) {
      const f = flow.current;
      f.yaw = f.yawTarget = k;
      activeRef.current = k;
      setActive(k);
    }
    if (k >= 0) setBack(true);
  }, [reduce]);

  // En el celular, inclinarlo mueve la cámara (el relieve de las fotos se nota sin puntero). iPhone lo pide al «Pasar»
  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: coarse)").matches) return;
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null) return;
      flow.current.tiltX = Math.max(-1, Math.min(1, e.gamma / 25));
      flow.current.tiltY = Math.max(-1, Math.min(1, -(e.beta - 45) / 25));
    };
    window.addEventListener("deviceorientation", onTilt, { passive: true });
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, [reduce]);

  // La escena solo se dibuja mientras la sala está a la vista y la pestaña visible
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    let seen = true;
    const update = () => setVisible(seen && document.visibilityState === "visible");
    const io = new IntersectionObserver(([e]) => {
      seen = e.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  // El recorrido mide tres estaciones de alto; si es lo primero de la portada sube hasta el borde (bajo el encabezado)
  useEffect(() => {
    const el = track.current;
    const st = stage.current;
    const parent = el?.parentElement;
    if (!el || !st || !parent) return;
    const measure = () => {
      const h = st.offsetHeight;
      const travel = Math.round(h * TRAVEL);
      el.style.height = `${h + travel * 2}px`;
      geo.current = { top: el.getBoundingClientRect().top + window.scrollY, travel };
    };
    const fit = () => {
      // Cambió lo que hay arriba (la intro aparece o se va): se suelta cualquier ajuste en curso y se espera a que el
      // alto se asiente antes de volver a acomodar el scroll
      anim.current = null;
      gesture.current.lastScroll = performance.now() + 900;
      const kids = [...parent.children];
      const before = kids.slice(0, kids.indexOf(el)).some((c) => !(c as HTMLElement).hasAttribute("data-night") && (c as HTMLElement).offsetHeight > 0);
      el.style.marginTop = "0px";
      if (!before) el.style.marginTop = `${-(el.getBoundingClientRect().top + window.scrollY)}px`;
      measure();
    };
    fit();
    // Si se vuelve atrás desde un apartado, el navegador deja el scroll metido en la zona: se vuelve al centro del club
    const g0 = geo.current;
    if ((window.scrollY - g0.top) / g0.travel > 1.4) window.scrollTo({ top: g0.top + g0.travel, behavior: "instant" });
    const mo = new MutationObserver(fit);
    mo.observe(parent, { childList: true });
    const ro = new ResizeObserver(measure);
    ro.observe(document.body);
    window.addEventListener("resize", fit);
    return () => {
      mo.disconnect();
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  /**
   * Lleva el scroll (y con él la cámara) a una estación. Pedido con un botón o una tecla es una toma de cine (la ola
   * toma impulso, cruza y se asienta: la puerta alcanza a abrirse antes de que la cámara entre); para terminar un gesto
   * suelto a medio camino, una curva que arranca decidida y llega suave.
   */
  const goStation = useCallback(
    (s: number, cinematic = false) => {
      const target = Math.max(0, Math.min(2, s)) as Estacion;
      const g = geo.current;
      const y = g.top + target * g.travel;
      gesture.current.virtual = null;
      gesture.current.lastInput = performance.now();
      if (reduce) {
        anim.current = null;
        window.scrollTo({ top: y, behavior: "instant" });
        return;
      }
      const from = window.scrollY;
      if (Math.abs(y - from) < 2) return;
      const span = Math.abs(y - from) / g.travel;
      anim.current = cinematic
        ? { from, to: y, t0: performance.now(), dur: Math.min(2400, Math.max(900, span * 1500)), inout: true }
        : { from, to: y, t0: performance.now(), dur: Math.min(1250, Math.max(520, span * 900)), inout: false };
    },
    [reduce],
  );

  /** Fija la zona buscada y la muestra en el mismo toque (el contador y la carta nunca quedan un cuadro atrás) */
  const aimZone = useCallback((target: number) => {
    const f = flow.current;
    f.yawTarget = target;
    const k = mod(Math.round(target));
    if (k !== activeRef.current) {
      activeRef.current = k;
      setActive(k);
      f.zoneAt = f.time + 0.15;
    }
  }, []);

  const step = useCallback(
    (d: number) => {
      touched.current = true;
      aimZone(Math.round(flow.current.yawTarget) + d);
    },
    [aimZone],
  );

  /** Tocar un punto de neón: si es la zona de enfrente, se entra; si no, la cámara gira hacia ella (por el lado corto) */
  const pick = useCallback(
    (i: number) => {
      if (stationRef.current < 1) return;
      touched.current = true;
      const f = flow.current;
      const cur = Math.round(f.yawTarget);
      const k = mod(cur);
      if (i === k) {
        goStation(2, true);
        return;
      }
      aimZone(cur + (((i - k + N + Math.floor(N / 2)) % N) - Math.floor(N / 2)));
    },
    [goStation, aimZone],
  );

  // ---------- El motor: un cuadro por vez ----------
  useEffect(() => {
    if (!visible) return;
    let raf = 0;
    let last = performance.now();
    let first = true;
    let prevDepth = flow.current.depth;
    let lastMeasure = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const f = flow.current;
      const g = geo.current;
      const gs = gesture.current;
      f.time += dt;
      // Remedir de vez en cuando (las fuentes, la intro o el aviso pueden correr el recorrido)
      if (now - lastMeasure > 700 && track.current) {
        lastMeasure = now;
        g.top = track.current.getBoundingClientRect().top + window.scrollY;
      }

      // Scroll animado hacia una estación
      const a = anim.current;
      if (a) {
        const k = Math.min(1, (now - a.t0) / a.dur);
        const e = k >= 1 ? 1 : a.inout ? (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) : 1 - Math.pow(1 - k, 3.2);
        window.scrollTo({ top: a.from + (a.to - a.from) * e, behavior: "instant" });
        if (k >= 1) anim.current = null;
      }

      // El scroll es la profundidad
      const p = (window.scrollY - g.top) / g.travel;
      f.depthTarget = Math.max(0, Math.min(2, p));
      if (first) {
        f.depth = f.depthTarget;
        first = false;
      }

      // Al soltar a medio camino, la ola termina de llegar a la estación más cercana (o a la siguiente si ya se pasó)
      const idle = now - gs.lastScroll > 170 && now - gs.wheelAt > 170 && !gs.touching && !anim.current;
      if (idle && p > 0.002 && p < 1.998 && track.current) {
        // Antes de acomodar, se vuelve a medir: si algo cambió arriba, la posición vieja llevaría a cualquier parte
        g.top = track.current.getBoundingClientRect().top + window.scrollY;
      }
      const pNow = (window.scrollY - g.top) / g.travel;
      if (idle && pNow > 0.002 && pNow < 1.998 && Math.abs(pNow - p) < 0.01) {
        const r = Math.round(p);
        if (Math.abs(p - r) > 0.004) {
          const from = settled.current;
          let to: number = from;
          if (p > from + 0.08) to = Math.min(2, Math.ceil(p - 0.08));
          else if (p < from - 0.08) to = Math.max(0, Math.floor(p + 0.08));
          goStation(to);
        }
      }
      if (!anim.current && idle && Math.abs(p - Math.round(p)) < 0.01 && p > -0.01 && p < 2.01) settled.current = Math.round(p) as Estacion;

      // Giro con el trackpad de lado: al soltar se asienta en la zona más cercana
      if (now - gs.yawWheelAt > 160 && gs.yawWheelAt > 0) {
        gs.yawWheelAt = 0;
        f.yawTarget = Math.round(f.yawTarget);
      }

      // Resortes: la profundidad pesa (cámara de cine); el giro se pasa apenas y vuelve, como el agua
      if (f.reduce) {
        f.depth = f.depthTarget;
        f.yaw = f.yawTarget;
        f.depthVel = f.yawVel = 0;
      } else {
        [f.depth, f.depthVel] = spring(f.depth, f.depthVel, f.depthTarget, 38, 0.92, dt);
        [f.yaw, f.yawVel] = spring(f.yaw, f.yawVel, f.yawTarget, 46, 0.72, dt);
      }
      f.beat = clubAudio.beat(now);

      // La puerta se entreabre sola cada tanto mientras se espera afuera (la luz y el bajo se escapan)
      const waiting = stationRef.current === 0 && now - gs.lastInput > 2500 && !f.reduce;
      const cyc = (f.time - 2.5) % 6.5;
      f.ajar = waiting && cyc > 0 && cyc < 1.8 ? Math.pow(Math.sin((cyc / 1.8) * Math.PI), 2) : 0;

      // Ondas: al cruzar el umbral
      if (prevDepth < 0.42 && f.depth >= 0.42) addWave(f, 0.5, 0.45, 1);
      prevDepth = f.depth;

      // Capas de la interfaz, ligadas a la profundidad
      const d = f.depth;
      const door = smoothstep(0.04, 0.32, d);
      band(doorUi.current, 1 - door, -16 * door);
      const zIn = smoothstep(0.55, 0.92, d);
      const zOut = smoothstep(1.12, 1.42, d);
      band(zoneUi.current, zIn * (1 - zOut), 14 * (1 - zIn) - 10 * zOut);
      band(mobileActs.current, 1 - smoothstep(1.25, 1.55, d), 0);

      // Estación (para la accesibilidad y lo que se puede tocar), con margen para no titilar en el borde
      const st = f.depthTarget;
      const cand = Math.round(st) as Estacion;
      if (cand !== stationRef.current && Math.abs(st - cand) < 0.42) {
        const prev = stationRef.current;
        stationRef.current = cand;
        setStation(cand);
        if (cand >= 1 && prev === 0) f.zoneAt = f.time + 0.5;
        window.clearTimeout(leaveTimer.current);
        if (cand === 2) {
          // Meterse en la zona es entrar a su apartado: la cámara se zambulle, destello y la vista nueva
          addWave(f, 0.5, 0.5, 0.75);
          sfx.whoosh();
          const z = ZONAS_CLUB[activeRef.current];
          leaveTimer.current = window.setTimeout(
            () => {
              rememberZone(z.id);
              setLeaving(true);
              window.setTimeout(() => routerRef.current.push(z.href), f.reduce ? 0 : 260);
            },
            f.reduce ? 0 : 420,
          );
        }
      }
      const act = mod(Math.round(f.yawTarget));
      if (act !== activeRef.current) {
        activeRef.current = act;
        setActive(act);
        f.zoneAt = f.time + 0.15;
      }
      clubAudio.setPlace(d, act, -f.yaw * ((Math.PI * 2) / N));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveTimer.current);
    };
  }, [visible, goStation]);

  // ---------- Gestos ----------
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const gs = gesture.current;
    const onScroll = () => {
      gs.lastScroll = performance.now();
    };
    const onTouchStart = () => {
      gs.touching = true;
      gs.lastInput = performance.now();
      anim.current = null;
    };
    const onTouchEnd = () => {
      gs.touching = false;
      gs.lastScroll = performance.now();
    };
    // La rueda dentro de la sala: de lado gira, hacia abajo profundiza (una estación por gesto, sin pasarse de largo)
    const onWheel = (e: WheelEvent) => {
      // Pellizco del trackpad (llega como rueda con ctrl): abrir los dedos entra, juntarlos sale. Una estación por gesto
      if (e.ctrlKey) {
        e.preventDefault();
        const now = performance.now();
        if (now - gs.pinchAt < 700 || Math.abs(e.deltaY) < 1.5) return;
        gs.pinchAt = now;
        const s0 = stationRef.current;
        if (e.deltaY < 0 && s0 < 2) goStation(s0 + 1, true);
        else if (e.deltaY > 0 && s0 > 0) goStation(s0 - 1, true);
        return;
      }
      const f = flow.current;
      const g = geo.current;
      const now = performance.now();
      gs.lastInput = now;
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? window.innerHeight : 1;
      const dx = e.deltaX * unit;
      const dy = e.deltaY * unit;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (stationRef.current >= 1 && Math.abs(dx) > 0.5) {
          e.preventDefault();
          touched.current = true;
          f.yawTarget += dx / 520;
          gs.yawWheelAt = now;
        }
        return;
      }
      const p = (window.scrollY - g.top) / g.travel;
      // Mientras la sala no está fija en pantalla (más arriba o más abajo), la página baja como siempre
      if (p < -0.005 || p > 2.005) return;
      if (now - gs.wheelAt > 220) gs.from = settled.current;
      gs.wheelAt = now;
      // En los extremos se deja bajar (o subir) la página como siempre
      if ((p >= 1.995 && dy > 0 && gs.from === 2) || (p <= 0.005 && dy < 0)) return;
      e.preventDefault();
      anim.current = null;
      const base = gs.virtual ?? p;
      const next = Math.max(Math.max(0, gs.from - 1.1), Math.min(Math.min(2, gs.from + 1.1), base + (dy / g.travel) * 0.85));
      gs.virtual = next;
      window.scrollTo({ top: g.top + next * g.travel, behavior: "instant" });
      window.setTimeout(() => {
        if (performance.now() - gs.wheelAt >= 200) gs.virtual = null;
      }, 220);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.metaKey || e.ctrlKey || editable(e.target)) return;
      const g = geo.current;
      const p = (window.scrollY - g.top) / g.travel;
      if (p < -0.05 || p > 2.05) return;
      gs.lastInput = performance.now();
      const onControl = e.target instanceof HTMLElement && !!e.target.closest("button,a");
      const s = settled.current;
      if ((e.key === "ArrowDown" || e.key === "PageDown" || (e.key === " " && !onControl)) && s < 2) {
        e.preventDefault();
        goStation(s + 1, true);
      } else if ((e.key === "ArrowUp" || e.key === "PageUp") && s > 0) {
        e.preventDefault();
        goStation(s - 1, true);
      } else if (e.key === "ArrowRight" && stationRef.current >= 1) {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" && stationRef.current >= 1) {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Escape" && stationRef.current === 2) goStation(1, true);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("keydown", onKey);
    };
  }, [goStation, step]);

  // Arrastrar para mirar alrededor: el mundo sigue al dedo y, al soltar, la inercia decide la zona
  const onPointerDown = (e: React.PointerEvent) => {
    gesture.current.lastInput = performance.now();
    // Tocar un botón no frena la cámara; tocar la escena sí (para tomar el control)
    if ((e.target as HTMLElement).closest("button,a,input")) return;
    anim.current = null;
    if (stationRef.current < 1) return;
    const f = flow.current;
    const x0 = e.clientX;
    const yaw0 = f.yawTarget;
    const w = stage.current?.clientWidth ?? window.innerWidth;
    let moved = false;
    let lastX = x0;
    let lastT = performance.now();
    let vel = 0;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - x0;
      if (!moved && Math.abs(dx) > 6) {
        moved = true;
        touched.current = true;
      }
      if (!moved) return;
      const t = performance.now();
      const inst = (ev.clientX - lastX) / Math.max(1, t - lastT);
      vel = vel * 0.7 + inst * 0.3;
      lastX = ev.clientX;
      lastT = t;
      f.yawTarget = yaw0 - (dx / w) * 1.4;
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!moved) return;
      touched.current = true;
      // Un tirón rápido avanza aunque el arrastre haya sido corto
      const projected = f.yawTarget - ((vel * 220) / w) * 1.4;
      let target = Math.round(projected);
      if (target === Math.round(yaw0) && Math.abs(vel) > 0.5) target += vel < 0 ? 1 : -1;
      aimZone(target);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Recorrido solo por el club hasta que la persona toma el control
  useEffect(() => {
    if (station !== 1 || reduce) return;
    const t = window.setInterval(() => {
      if (!touched.current && document.visibilityState === "visible") aimZone(Math.round(flow.current.yawTarget) + 1);
    }, 7000);
    return () => window.clearInterval(t);
  }, [station, reduce, aimZone]);

  useEffect(() => {
    router.prefetch(zone.href);
  }, [zone.href, router]);

  // ---------- Sonido del club ----------
  useEffect(() => {
    if (!sound) {
      clubAudio.stop();
      return;
    }
    if (!visible) {
      clubAudio.stop();
      return;
    }
    // Los navegadores solo dejan sonar después de un toque: si ya lo había encendido, arranca con el primero
    const go = () => void clubAudio.start().catch(() => undefined);
    const ua = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation;
    if (!ua || ua.hasBeenActive) go();
    window.addEventListener("pointerdown", go, { once: true });
    window.addEventListener("keydown", go, { once: true });
    return () => {
      window.removeEventListener("pointerdown", go);
      window.removeEventListener("keydown", go);
    };
  }, [sound, visible]);
  useEffect(() => () => clubAudio.stop(), []);
  const toggleSound = () => {
    const on = !sound;
    setSound(on);
    try {
      localStorage.setItem(SOUND_KEY, on ? "1" : "0");
    } catch {
      /* sin almacenamiento: solo por esta visita */
    }
    if (on) void clubAudio.start().catch(() => undefined);
  };

  const inside = station >= 1;
  return (
    <div ref={track} id="inicio" className="relative h-[calc(100svh*2.8)]" style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
      <section
        ref={stage}
        aria-labelledby="host-title"
        onPointerDown={onPointerDown}
        // Doble toque en la escena: un paso más adentro (de la calle al club, del club a la zona)
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest("button,a,input")) return;
          const s0 = stationRef.current;
          if (s0 < 2) goStation(s0 + 1, true);
        }}
        // La rueda dentro de la sala la maneja el motor (no el scroll suave de la portada)
        data-lenis-prevent
        className="club-stage sticky top-0 isolate flex h-[100svh] min-h-[560px] touch-pan-y select-none flex-col overflow-hidden bg-[#060609]"
      >
        {/* ---------- El club: 3D o, sin WebGL, las fotos ---------- */}
        <div aria-hidden className="absolute inset-0 z-0">
          {three ? (
            <>
              <div className={`absolute inset-0 bg-cover bg-center transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-40"}`} style={{ backgroundImage: "url(/fotos/ambiente/club-sm.webp)" }} />
              {/* Mientras carga el club, su letrero se enciende letra a letra (no un spinner) */}
              <div className={`neon-loader pointer-events-none absolute inset-x-0 top-[38%] z-[2] flex flex-col items-center gap-2 transition-opacity duration-700 ${ready ? "opacity-0" : "opacity-100"}`}>
                <span className="flex font-led text-4xl font-black tracking-[0.5em] text-indigo-100 sm:text-6xl">
                  {"TONIGHT".split("").map((c, i) => (
                    <span key={i} style={{ animationDelay: `${i * 0.16}s` }}>
                      {c}
                    </span>
                  ))}
                </span>
                <span className="text-xs font-semibold tracking-[0.2em] text-slate-400">ENCENDIENDO EL CLUB</span>
              </div>
              <ClubScene flow={flow} active={active} small={small} paused={!visible} onReady={() => setReady(true)} onPick={pick} />
            </>
          ) : (
            <Flat zone={zone.foto} station={station} reduce={reduce} />
          )}
        </div>
        {/* Velo para leer arriba y abajo */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(6,6,9,0.78)_0%,rgba(6,6,9,0.08)_32%,rgba(6,6,9,0.06)_58%,rgba(6,6,9,0.88)_100%)] lg:bg-[linear-gradient(90deg,rgba(6,6,9,0.72)_0%,rgba(6,6,9,0.15)_40%,transparent_60%),linear-gradient(180deg,transparent_62%,rgba(6,6,9,0.85)_100%)]" />

        {/* ---------- La interfaz, coreografiada con la profundidad ---------- */}
        <div className="pointer-events-none relative z-10 flex flex-1 flex-col justify-between px-4 pb-[calc(env(safe-area-inset-bottom,0px)+6rem)] pt-[4.5rem] sm:px-6 lg:px-10 lg:pt-24">
          <div className="pointer-events-auto max-w-xl">
            <p className="eyebrow flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-purple-300" aria-hidden /> {eyebrow ?? "Tonight · tu host esta noche"}
            </p>
            <h1 id="host-title" className="display mt-2 text-[2.1rem] leading-[1.02] sm:text-5xl lg:text-[3.6rem]">
              {greet}.<br />
              <HostLine text={inside ? (back ? "Qué bueno verte de vuelta" : "Qué gusto tenerte acá") : back ? "Volviste: pase, su mesa lo espera" : "Pase, lo estábamos esperando"} reduce={reduce} />
            </h1>
            <p className="mt-3 hidden max-w-md text-lg leading-relaxed text-slate-300 sm:block [@media(max-height:820px)]:hidden">
              {inside ? "Mira alrededor y toca un punto de luz: cada rincón del club es una parte de la noche." : "Baja para entrar al club, o arma tu sala de una vez."}
            </p>
            <div className="mt-5 hidden flex-wrap items-center gap-3 lg:flex">
              <Actions onCreate={onCreate} busy={busy} codeOpen={codeOpen} onToggleCode={onToggleCode} />
            </div>
            <div className="mt-4 hidden flex-wrap gap-x-4 gap-y-2 lg:flex">
              <Extras resume={resume} onResume={onResume} onReplay={onReplay} />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="grid">
              {/* En la puerta: «Pasar» (o bajar) */}
              <div ref={doorUi} inert={station !== 0 ? true : undefined} className="pointer-events-auto col-start-1 row-start-1 flex flex-col items-center gap-2 self-end text-center lg:items-center">
                <button
                  type="button"
                  onClick={() => {
                    // En iPhone el giroscopio se pide con un toque: este es el momento natural
                    void askGyro();
                    sfx.whoosh();
                    goStation(1, true);
                  }}
                  className="btn-primary !min-h-[48px] px-8"
                >
                  Pasar
                </button>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-400" aria-hidden>
                  <ArrowDown className="h-3.5 w-3.5 animate-bounce" /> o baja para entrar
                </span>
              </div>
              {/* Adentro: la zona de enfrente */}
              <div ref={zoneUi} inert={station !== 1 ? true : undefined} style={{ opacity: 0, visibility: "hidden" }} className="pointer-events-auto col-start-1 row-start-1 flex flex-col gap-3 self-end lg:mx-auto lg:w-full lg:max-w-2xl lg:items-center lg:text-center">
                <div className="sr-only" aria-live="polite">{inside ? `${zone.title}, ${active + 1} de ${N}` : ""}</div>
                <motion.div key={zone.id} initial={reduce ? false : { opacity: 0, y: 8, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}>
                  <p className="font-display text-2xl font-extrabold text-white sm:text-3xl lg:text-4xl">{zone.title}</p>
                  <p className="mt-1 max-w-md text-sm text-slate-300 sm:text-base">{zone.desc}</p>
                </motion.div>
                <div className="flex items-center gap-2 lg:justify-center">
                  <Link
                    href={zone.href}
                    data-orbit-card={zone.id}
                    aria-current="true"
                    onClick={(e) => {
                      e.preventDefault();
                      goStation(2, true);
                    }}
                    className="btn-primary !min-h-[48px] min-w-0 flex-1 px-5 sm:flex-none"
                  >
                    {entrarA(zone.title)} <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <button type="button" onClick={() => step(-1)} aria-label="Módulo anterior" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-night-900/70 text-slate-200 backdrop-blur-md transition-colors hover:border-indigo-400/50 hover:text-white">
                    <ArrowLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <span className="hidden min-w-[4rem] text-center font-led text-base font-bold tracking-[0.14em] text-slate-300 sm:inline">
                    <span data-track-count className="text-indigo-200">
                      {String(active + 1).padStart(2, "0")}
                    </span>{" "}
                    / {String(N).padStart(2, "0")}
                  </span>
                  <button type="button" onClick={() => step(1)} aria-label="Módulo siguiente" className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-night-900/70 text-slate-200 backdrop-blur-md transition-colors hover:border-indigo-400/50 hover:text-white">
                    <ArrowRight className="h-5 w-5" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
            {/* Lo importante, siempre a mano en el celular: crear la sala o entrar con código */}
            <div ref={mobileActs} className="pointer-events-auto flex flex-col gap-2 lg:hidden">
              <div className="flex flex-wrap items-center gap-2.5">
                <Actions onCreate={onCreate} busy={busy} codeOpen={codeOpen} onToggleCode={onToggleCode} />
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 [&_*]:text-xs">
                <Extras resume={resume} onResume={onResume} onReplay={onReplay} />
              </div>
            </div>
          </div>
        </div>

        {/* Al meterse en una zona: un destello de neón y se entra a su apartado */}
        {leaving && <div aria-hidden className="club-flash pointer-events-none absolute inset-0 z-40" />}

        {/* Sonido del club: el bajo tras la puerta, que se abre al entrar */}
        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={sound}
          className={`absolute right-3 top-[4.25rem] z-30 flex h-10 items-center gap-2 rounded-full border px-3.5 text-xs font-semibold backdrop-blur-md transition-colors sm:right-6 lg:top-20 ${sound ? "border-indigo-400/50 bg-indigo-500/15 text-indigo-100" : "border-white/10 bg-night-900/60 text-slate-300 hover:text-white"}`}
        >
          {sound ? <EqBars /> : <Music2 className="h-4 w-4" aria-hidden />}
          <span>Sonido del club</span>
        </button>

        {codeOpen && (
          <div className="absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom,0px)+6.25rem)] z-30 mx-auto max-w-lg animate-rise-in sm:inset-x-6">
            <div className="surface relative overflow-hidden p-5 shadow-lift sm:p-6">{codePanel}</div>
          </div>
        )}
        {alert && <div className="absolute inset-x-3 top-20 z-30 mx-auto max-w-lg">{alert}</div>}
      </section>
    </div>
  );
}

/** La frase del host: entra palabra por palabra, como una ola (la primera vez y cada vez que cambia) */
function HostLine({ text, reduce }: { text: string; reduce: boolean }) {
  const words = text.split(" ");
  return (
    <span className="relative inline-block">
      <span className="sr-only">{text}.</span>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span key={text} aria-hidden className="inline-block" exit={reduce ? undefined : { opacity: 0, y: -10, filter: "blur(4px)", transition: { duration: 0.18 } }}>
          {words.map((w, i) => (
            <motion.span
              key={i}
              className="inline-block whitespace-pre"
              initial={reduce ? false : { opacity: 0, y: "0.55em", filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              // La ola: cada palabra un poco después de la anterior, cada vez más juntas
              transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1], delay: reduce ? 0 : 0.05 + Math.pow(i, 0.85) * 0.07 }}
            >
              {w}
              {i < words.length - 1 ? " " : ""}
            </motion.span>
          ))}
          <span className="text-accent">.</span>
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Barras de ecualizador que laten al tempo del club (118 BPM) */
function EqBars() {
  return (
    <span className="eq-bars flex h-3.5 items-end gap-[2px]" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="w-[3px] rounded-full bg-indigo-300" style={{ animationDelay: `${i * -0.13}s` }} />
      ))}
    </span>
  );
}

/** Sin WebGL o con movimiento reducido: la foto de la estación (afuera, el club en penumbra; adentro, la zona) y el host */
function Flat({ zone, station, reduce }: { zone: string; station: Estacion; reduce: boolean }) {
  const foto = station === 0 ? "club" : zone;
  return (
    <>
      <AnimatePresence mode="popLayout">
        <motion.div
          key={foto}
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(/fotos/ambiente/${foto}.webp)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: station === 0 ? 0.35 : 0.9, scale: station === 2 && !reduce ? 1.12 : 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      </AnimatePresence>
      <HostNeonSvg className={`absolute bottom-[22svh] right-[4vw] h-[34svh] w-auto transition-opacity duration-500 sm:bottom-[8svh] sm:h-[48svh] ${station === 2 ? "opacity-0" : "opacity-100"}`} />
    </>
  );
}

function Actions({ onCreate, busy, codeOpen, onToggleCode }: { onCreate: () => void; busy: boolean; codeOpen: boolean; onToggleCode: () => void }) {
  return (
    <>
      <button type="button" onClick={onCreate} disabled={busy} className="btn-primary !min-h-[48px] px-6">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Crear sala
      </button>
      <button type="button" onClick={onToggleCode} aria-expanded={codeOpen} className="btn-ghost !min-h-[48px]">
        <KeyRound className="h-4 w-4" aria-hidden /> Tengo un código
      </button>
    </>
  );
}

function Extras({ resume, onResume, onReplay }: { resume: string | null; onResume: () => void; onReplay: () => void }) {
  return (
    <>
      {resume && (
        <button type="button" onClick={onResume} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100">
          <span className="live-dot" /> Volver a la sala <span className="font-mono tracking-[0.2em]">{resume}</span>
        </button>
      )}
      <Link href="/bar" className="text-sm font-semibold text-emerald-200 underline-offset-4 hover:underline">
        ¿Te toca manejar? Te preparo algo sin alcohol
      </Link>
      <button type="button" onClick={onReplay} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-300 hover:text-white">
        <Play className="h-3.5 w-3.5" aria-hidden /> Ver la ronda
      </button>
    </>
  );
}
