"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, Loader2 } from "lucide-react";
import { INTRO_REPLAY_EVENT, INTRO_SEEN_KEY } from "@/lib/introGate";
import { BrandMark } from "@/components/shell/AppShell";
import { useIntroParallax } from "./useHomeMotion";
import BackBar from "@/components/ui/BackBar";
import { approach, springStep, surfacePath } from "@/lib/pourPhysics";
import { pulseProgress, scrambleFrame } from "@/lib/signalField";
import {
  COUNTER_Y,
  DROPS,
  EXTRA_NODES,
  HUB_POS,
  NODE_POS,
  NOZZLE_Y,
  PARK_X,
  RAIL_Y,
  ROUND,
  SHAPES,
  TOAST_RIM_Y,
  dropletAt,
  glassTransform,
  levelLocal,
  sceneAt,
  toWorld,
  type GlassKind,
  type Liquid,
} from "@/lib/introScene";

// Dibujos de cada vaso con el pie como origen (y negativa hacia arriba)
const OUTLINE: Record<GlassKind, string> = {
  highball: "M -26 -118 L -22 -5 Q -21.6 0 -16.6 0 L 16.6 0 Q 21.6 0 22 -5 L 26 -118",
  pint: "M -24 -112 L -26.5 -96 L -20.5 -5 Q -20 0 -15 0 L 15 0 Q 20 0 20.5 -5 L 26.5 -96 L 24 -112",
  wine: "M -24 -118 C -26 -88 -15 -63 0 -62 C 15 -63 26 -88 24 -118 M 0 -62 L 0 -3 M -17 0 Q 0 -4 17 0",
  tumbler: "M -28 -86 L -25 -5 Q -24.6 0 -19.6 0 L 19.6 0 Q 24.6 0 25 -5 L 28 -86",
};
const INNER: Record<GlassKind, string> = {
  highball: "M -23.6 -117 L -19.8 -6 Q -19.5 -2.6 -15.6 -2.6 L 15.6 -2.6 Q 19.5 -2.6 19.8 -6 L 23.6 -117 Z",
  pint: "M -21.8 -111 L -24.2 -96 L -18.4 -6 Q -18 -2.6 -14 -2.6 L 14 -2.6 Q 18 -2.6 18.4 -6 L 24.2 -96 L 21.8 -111 Z",
  wine: "M -21.8 -117 C -23.6 -88 -13.6 -65.2 0 -64.4 C 13.6 -65.2 23.6 -88 21.8 -117 Z",
  tumbler: "M -25.6 -85 L -22.8 -6 Q -22.5 -2.6 -18.6 -2.6 L 18.6 -2.6 Q 22.5 -2.6 22.8 -6 L 25.6 -85 Z",
};
const SHEEN: Record<GlassKind, string> = {
  highball: "M -17 -100 L -14.5 -14",
  pint: "M -16 -88 L -13 -14",
  wine: "M -15 -104 C -16 -90 -12 -78 -7 -72",
  tumbler: "M -19 -72 L -17 -14",
};
const LIQUID: Record<Liquid, { fill: string; opacity: number; stream: string; streamOpacity: number }> = {
  pisco: { fill: "currentColor", opacity: 0.26, stream: "currentColor", streamOpacity: 0.6 },
  cola: { fill: "var(--cola)", opacity: 1, stream: "#6a3418", streamOpacity: 1 },
  beer: { fill: "var(--beer)", opacity: 0.95, stream: "var(--beer)", streamOpacity: 1 },
  wine: { fill: "var(--wine)", opacity: 1, stream: "var(--wine)", streamOpacity: 1 },
  water: { fill: "var(--blue)", opacity: 0.2, stream: "var(--blue)", streamOpacity: 0.6 },
};
/** Líquido base de cada vaso de la ronda (la piscola suma la bebida encima) */
const BASE: Liquid[] = ["pisco", "beer", "wine", "water"];
/** Color de cada persona: el mismo en su nodo y en su barra de la tele */
const PERSON = ["var(--blue)", "var(--violet)", "var(--signal)", "var(--amber)"];
const BAR_H = [24, 36, 16, 30];
const ICE_X = [-8, 8, -1];
const NOZZLE_LOCAL = NOZZLE_Y - COUNTER_Y;
const BUBBLES = [
  { glass: 0, x: -11, phase: 0.1, r: 1.8 },
  { glass: 0, x: -3, phase: 0.55, r: 1.3 },
  { glass: 0, x: 6, phase: 0.3, r: 1.6 },
  { glass: 0, x: 12, phase: 0.8, r: 1.2 },
  { glass: 0, x: 1, phase: 0.95, r: 1.4 },
  { glass: 1, x: -12, phase: 0.2, r: 1.5 },
  { glass: 1, x: -5, phase: 0.65, r: 1.2 },
  { glass: 1, x: 2, phase: 0.4, r: 1.7 },
  { glass: 1, x: 9, phase: 0.9, r: 1.3 },
  { glass: 1, x: 14, phase: 0.05, r: 1.1 },
  { glass: 1, x: -1, phase: 0.75, r: 1.4 },
];
const READOUTS = ["Volumen", "Graduación", "Alcohol"];
const HINTS = { scroll: "Desliza para servir", network: "Cada celular, conectado a la tele" } as const;
const DECODE_MS = 260;
const RIPPLE_MS = 700;

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;
const fmt = (n: number, digits = 0) => n.toLocaleString("es-CL", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const readSeen = () => {
  try {
    return localStorage.getItem(INTRO_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};
const markSeen = () => {
  try {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
  } catch {
    /* sin almacenamiento: la intro vuelve a aparecer */
  }
};

/**
 * Intro «La ronda»: al bajar, un dispensador en riel sirve piscola, cerveza, vino y agua (con sus cifras reales),
 * brindan y cada vaso se vuelve un celular conectado a la tele. Termina en la acción: crear sala o entrar con código.
 * El escenario sale de `sceneAt` (probado); aquí se dibuja directo en el DOM, sin renders de React por cuadro.
 * Llega desde el servidor; el script del <head> y el CSS la apagan antes de pintar si ya se vio o con movimiento
 * reducido. La cinta inicial es CSS, así corre aunque la página todavía no hidrate.
 */
export default function PourIntro({ onCreate, onCode, busy = false }: { onCreate?: () => void; onCode?: () => void; busy?: boolean }) {
  const [show, setShow] = useState(true);
  const [ready, setReady] = useState(false);
  const section = useRef<HTMLElement>(null);
  const els = useRef(new Map<string, Element>());
  const reg = (key: string) => (node: Element | null) => {
    if (node) els.current.set(key, node);
    else els.current.delete(key);
  };

  useIntroParallax(section, show);

  useIso(() => {
    if (readSeen() || window.matchMedia("(prefers-reduced-motion: reduce)").matches) setShow(false);
  }, []);

  // «Ver la ronda» desde el inicio: vuelve a mostrarla (aunque ya se haya visto) y sube al principio
  useEffect(() => {
    const replay = () => {
      try {
        localStorage.removeItem(INTRO_SEEN_KEY);
      } catch {
        /* sin almacenamiento: igual se muestra */
      }
      delete document.documentElement.dataset.intro;
      setShow(true);
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    };
    window.addEventListener(INTRO_REPLAY_EVENT, replay);
    return () => window.removeEventListener(INTRO_REPLAY_EVENT, replay);
  }, []);

  useEffect(() => {
    if (!show) return;
    const E = (k: string) => els.current.get(k);
    const set = (k: string, attr: string, v: string | number) => E(k)?.setAttribute(attr, String(v));
    const css = (k: string, prop: "opacity" | "transform" | "fill" | "display", v: string) => {
      const el = E(k) as HTMLElement | SVGElement | undefined;
      if (el) el.style[prop] = v;
    };

    let raf = 0;
    let visible = true;
    let current = 0;
    let lastT = 0;
    let shownLabel = "Sirve la ronda";
    let decodeUntil = 0;
    let shownHint: string | null = "scroll";
    let isReady = false;
    let wasClink = false;
    let clinkAt = -1e9;
    const prevX = ROUND.map((_, i) => PARK_X[i]);
    const prevV = ROUND.map(() => 0);
    const slosh = ROUND.map(() => ({ x: 0, v: 0 }));
    const nameShown = ROUND.map(() => false);
    const nameDecode = ROUND.map(() => 0);

    const target = () => {
      const el = section.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      return Math.min(1, Math.max(0, -rect.top / Math.max(1, rect.height - window.innerHeight)));
    };

    const frame = (t: number, dt: number) => {
      const s = sceneAt(current);

      // Choque del brindis: un golpe de oleaje y el momento de la onda y las gotas
      if (s.clink && !wasClink) {
        clinkAt = t;
        slosh.forEach((sp, i) => (sp.v += (i < 2 ? 1 : -1) * 1.1));
      }
      wasClink = s.clink;
      const sinceClink = t - clinkAt;
      const clinkBoost = sinceClink < 1600 ? 4 * Math.exp(-sinceClink / 450) : 0;

      s.glasses.forEach((g, i) => {
        const kind = ROUND[i].kind;
        const tf = glassTransform(g, kind);
        set(`glass${i}`, "transform", tf);
        set(`glass${i}`, "opacity", g.outline);
        set(`clip${i}`, "transform", tf);

        // Oleaje: la superficie se inclina contra la aceleración del vaso y vuelve con un resorte
        const vx = (g.x - prevX[i]) / Math.max(1, dt);
        const ax = (vx - prevV[i]) / Math.max(1, dt);
        prevX[i] = g.x;
        prevV[i] = vx;
        slosh[i] = springStep(slosh[i], Math.max(-0.25, Math.min(0.25, -ax * 60)), dt);
        const tilt = Math.max(-0.3, Math.min(0.3, slosh[i].x));

        const visibleLiquid = g.fill > 0.002 && g.outline > 0.01;
        css(`liquidWrap${i}`, "display", visibleLiquid ? "" : "none");
        if (visibleLiquid) {
          const lvl = levelLocal(kind, g.fill);
          const surf = toWorld(g, kind, 0, lvl);
          const half = 62 * g.scale;
          const bottom = g.y + g.scale * (SHAPES[kind].height / 2 + 30);
          const amp = (0.9 + Math.min(3.5, Math.abs(vx) * 25) + clinkBoost) * g.scale;
          const d = surfacePath(surf.x - half, half * 2, surf.y, bottom, t + i * 700, amp, tilt);
          set(`liquid${i}`, "d", d);
          set(`liquidWrap${i}`, "opacity", g.outline);
          if (i === 0) {
            set("cola", "d", d);
            set("cola", "opacity", g.mix * 0.92);
          }
          if (i === 1) {
            const foam = 9 * Math.min(1, g.fill * 1.6) * g.scale;
            set("foam", "d", surfacePath(surf.x - half, half * 2, surf.y - foam, surf.y + 4 * g.scale, t * 1.3 + 300, amp * 0.6, tilt));
          }
        }

        // Nombre: aparece decodificándose cuando le sirven y otra vez junto a su celular
        if (g.name > 0 && !nameShown[i]) {
          nameShown[i] = true;
          nameDecode[i] = t + 320;
        } else if (g.name === 0) nameShown[i] = false;
        set(`name${i}`, "x", g.nameX);
        set(`name${i}`, "y", g.nameY);
        set(`name${i}`, "opacity", g.name);
        const nameEl = E(`name${i}`);
        if (nameEl) {
          const k = 1 - Math.max(0, nameDecode[i] - t) / 320;
          const text = k >= 1 ? ROUND[i].person : scrambleFrame(ROUND[i].person, k);
          if (nameEl.textContent !== text) nameEl.textContent = text;
        }

        // Nodo en que se convierte
        set(`node${i}`, "cx", g.x);
        set(`node${i}`, "cy", g.y);
        set(`node${i}`, "opacity", g.node);
        set(`node${i}`, "r", 3 + 3 * g.node);
      });

      // Hielo de la piscola: cae del dispensador, se apila y flota cuando sube el líquido
      const g0 = s.glasses[0];
      const lvl0 = levelLocal("highball", g0.fill);
      s.ice.forEach((k, j) => {
        const stack = -13 - j * 21;
        const float = lvl0 + 10 + j * 12;
        const bob = g0.fill > 0.05 ? Math.sin(t / 520 + j * 1.9) * 1.4 : 0;
        const y = NOZZLE_LOCAL + (Math.min(stack, float) - NOZZLE_LOCAL) * k + bob * k;
        set(`ice${j}`, "transform", `translate(${ICE_X[j]} ${y.toFixed(2)}) rotate(${((1 - k) * (j % 2 ? 28 : -22) + bob * 2).toFixed(1)})`);
        set(`ice${j}`, "opacity", k > 0 ? 1 : 0);
      });

      // Limón del agua
      const lvl3 = levelLocal("tumbler", s.glasses[3].fill);
      const lemonY = NOZZLE_LOCAL + (lvl3 + 1 - NOZZLE_LOCAL) * s.lemon + (s.lemon >= 1 ? Math.sin(t / 600) * 1.2 : 0);
      set("lemon", "transform", `translate(4 ${lemonY.toFixed(2)}) rotate(${(-12 + (1 - s.lemon) * 90).toFixed(1)})`);
      set("lemon", "opacity", s.lemon > 0 ? 1 : 0);

      // Burbujas de la bebida y de la cerveza
      BUBBLES.forEach((b, j) => {
        const g = s.glasses[b.glass];
        const on = b.glass === 0 ? g0.mix : g.fill;
        if (on < 0.05) {
          set(`bubble${j}`, "opacity", 0);
          return;
        }
        const lvl = levelLocal(ROUND[b.glass].kind, g.fill);
        const cycle = (t / 1900 + b.phase) % 1;
        set(`bubble${j}`, "cy", (-6 + (lvl + 4 + 6) * cycle).toFixed(2));
        set(`bubble${j}`, "cx", (b.x + Math.sin(t / 300 + j) * 1.1).toFixed(2));
        set(`bubble${j}`, "opacity", ((1 - cycle) * 0.75 * on).toFixed(3));
      });

      // Chorro y dispensador
      if (s.stream) {
        const st = s.stream;
        const look = LIQUID[st.liquid];
        set("stream", "x", (st.x - 2.2 + Math.sin(t / 90) * 0.5).toFixed(2));
        set("stream", "y", st.top.toFixed(2));
        set("stream", "height", Math.max(0, st.bottom - st.top).toFixed(2));
        css("stream", "fill", look.stream);
        set("stream", "opacity", look.streamOpacity);
      } else set("stream", "opacity", 0);
      set("head", "transform", `translate(${s.head.x.toFixed(2)} ${RAIL_Y})`);
      set("rail", "opacity", s.head.on);
      set("led", "opacity", s.stream ? 1 : 0.3);
      set("counter", "opacity", s.counter);
      set("reflection", "opacity", s.counter);
      css("reflection", "display", s.counter > 0 ? "" : "none");

      // La señal: líneas que se trazan, pulsos que viajan, la tele y sus barras
      s.lines.forEach((k, i) => {
        set(`line${i}`, "stroke-dashoffset", (1 - k).toFixed(4));
        const pp = k >= 1 ? pulseProgress(i * 0.27, t, 2600) : null;
        set(`pulse${i}`, "opacity", pp === null ? 0 : 1);
        if (pp !== null) set(`pulse${i}`, "stroke-dashoffset", (0.14 - 1.14 * pp).toFixed(4));
      });
      set("extras", "opacity", s.extras);
      set("hub", "opacity", s.hub);
      set("hub", "transform", `translate(${HUB_POS.x} ${HUB_POS.y}) scale(${(0.94 + 0.06 * s.hub).toFixed(3)})`);
      s.bars.forEach((k, i) => {
        const h = BAR_H[i] * k;
        set(`bar${i}`, "y", (19 - h).toFixed(2));
        set(`bar${i}`, "height", h.toFixed(2));
      });

      // Onda y gotas del brindis
      const rk = sinceClink / RIPPLE_MS;
      if (rk >= 0 && rk < 1) {
        set("ripple", "r", (8 + 120 * (1 - (1 - rk) ** 3)).toFixed(2));
        set("ripple", "opacity", (0.6 * (1 - rk)).toFixed(3));
      } else set("ripple", "opacity", 0);
      for (let j = 0; j < DROPS; j++) {
        const dp = dropletAt(j, sinceClink);
        set(`drop${j}`, "opacity", dp ? dp.o.toFixed(3) : 0);
        if (dp) {
          set(`drop${j}`, "cx", (HUB_POS.x + dp.x).toFixed(2));
          set(`drop${j}`, "cy", (TOAST_RIM_Y + dp.y).toFixed(2));
        }
      }

      // Lecturas del trago que se está sirviendo (o la pista de arriba)
      if (s.readout) {
        const r = s.readout;
        const values = [`${fmt(r.ml)} ml`, `${fmt(r.abv * 100, 1)} %`, `${fmt(r.grams, 1)} g`];
        values.forEach((v, i) => {
          const n = E(`readout${i}`);
          if (n && n.textContent !== v) n.textContent = v;
        });
      }
      css("readouts", "opacity", s.readout ? "1" : "0");
      const logo = 1 - Math.min(1, Math.max(0, (current - 0.04) / 0.06));
      css("logo", "opacity", String(logo));
      css("logo", "display", logo > 0 ? "" : "none");
      if (s.hint !== shownHint) {
        shownHint = s.hint;
        const n = E("hint");
        if (n && s.hint) n.textContent = HINTS[s.hint];
      }
      css("hint", "opacity", s.hint ? "1" : "0");

      css("bar", "transform", `scaleX(${current.toFixed(4)})`);
      if (s.label !== shownLabel) {
        shownLabel = s.label;
        decodeUntil = t + DECODE_MS;
      }
      const labelEl = E("label");
      if (labelEl) {
        const k = 1 - Math.max(0, decodeUntil - t) / DECODE_MS;
        const text = k >= 1 ? shownLabel : scrambleFrame(shownLabel, k);
        if (labelEl.textContent !== text) labelEl.textContent = text;
      }

      if (s.ready !== isReady) {
        isReady = s.ready;
        setReady(s.ready);
        if (s.ready) markSeen();
      }
    };

    const loop = (t: number) => {
      raf = 0;
      const dt = lastT ? Math.min(64, t - lastT) : 16;
      lastT = t;
      current = approach(current, target(), dt, 100);
      frame(t, dt);
      if (visible) raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && visible) {
        lastT = 0;
        raf = requestAnimationFrame(loop);
      }
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) start();
    });
    if (section.current) io.observe(section.current);
    current = target();
    start();

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [show]);

  if (!show) return null;

  const skip = (e: React.MouseEvent) => {
    e.preventDefault();
    markSeen();
    document.getElementById("inicio")?.scrollIntoView();
  };
  const initial = sceneAt(0);

  return (
    // overflow-anchor: none — sin esto, el anclaje de scroll del navegador persigue al escenario fijo mientras el
    // texto cambia y la página baja sola hasta el final
    <section ref={section} aria-label="Intro: se sirve la ronda" className="pour-intro relative -mt-5 h-[480vh] [overflow-anchor:none] lg:-mt-8">
      <div className="sticky top-14 flex h-[calc(100dvh-3.5rem)] flex-col items-center justify-center gap-4 overflow-hidden pb-[calc(84px+env(safe-area-inset-bottom,0px))] lg:top-0 lg:h-[100dvh] lg:pb-6 [@media(max-height:480px)]:flex-row [@media(max-height:480px)]:gap-8 [@media(max-height:480px)]:pb-[calc(64px+env(safe-area-inset-bottom,0px))]">
        <div data-intro-stage className="relative flex min-h-0 w-full max-w-[34rem] flex-1 items-center justify-center text-slate-50 [@media(max-height:480px)]:aspect-square [@media(max-height:480px)]:h-full [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:flex-none" aria-hidden>
          {/* Logo eléctrico del arranque: se enciende cuando llegan los tragos y se apaga al empezar a servir */}
          {/* Fondo del bar: luces desenfocadas (degradados, sin filtros) en la capa más lejana */}
          <div data-intro-depth="-1" className="pointer-events-none absolute inset-0 -z-10">
            <span className="absolute left-[4%] top-[18%] h-40 w-40 rounded-full bg-[radial-gradient(closest-side,rgba(103,170,255,0.22),transparent)]" />
            <span className="absolute right-[2%] top-[8%] h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgba(185,62,243,0.2),transparent)]" />
            <span className="absolute left-[38%] top-[44%] h-24 w-24 rounded-full bg-[radial-gradient(closest-side,rgba(140,227,190,0.14),transparent)]" />
            <span className="absolute bottom-[6%] left-[12%] h-32 w-32 rounded-full bg-[radial-gradient(closest-side,rgba(185,62,243,0.16),transparent)]" />
            <span className="absolute bottom-[14%] right-[10%] h-28 w-28 rounded-full bg-[radial-gradient(closest-side,rgba(103,170,255,0.18),transparent)]" />
          </div>
          {/* Contrabarra: repisas con botellas en neón tenue, entre las luces y los vasos. Aparece cuando se apaga el
              logo y se va antes del brindis (useIntroParallax) */}
          <BackBar data-intro-depth="-0.45" data-backbar className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-0" />
          {/* Primer plano: hielo, chispa y burbuja cerca del lente (se mueven más que todo lo demás) */}
          <div data-intro-depth="1.9" className="pointer-events-none absolute inset-0 z-20 [@media(max-height:480px)]:hidden">
            <svg viewBox="0 0 40 40" className="absolute left-[2%] top-[34%] h-9 w-9 text-indigo-200/35" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="7" y="7" width="26" height="26" rx="6" transform="rotate(14 20 20)" /><path d="M13 14 L19 13" strokeLinecap="round" /></svg>
            <svg viewBox="0 0 40 40" className="absolute right-[3%] top-[22%] h-6 w-6 text-emerald-200/45" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 5 V35 M5 20 H35 M10 10 L30 30 M30 10 L10 30" /></svg>
            <svg viewBox="0 0 40 40" className="absolute bottom-[12%] right-[8%] h-5 w-5 text-purple-200/40" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="20" cy="20" r="13" /></svg>
          </div>
          <div ref={reg("logo")} data-intro-depth="1.4" className="pointer-events-none absolute inset-x-0 top-[9%] z-10 flex flex-col items-center gap-2 [@media(max-height:480px)]:hidden">
            <BrandMark className="neon-electric h-16 w-16 sm:h-20 sm:w-20" />
            <span className="neon-electric font-display text-3xl font-extrabold tracking-[0.22em] text-indigo-100 [animation-delay:0.45s,2.6s,0s] sm:text-4xl">
              TONIGHT
            </span>
          </div>
          <svg data-intro-depth="0.4" viewBox="0 0 400 400" overflow="visible" className="h-full w-full">
            <defs>
              {ROUND.map((d, i) => (
                <clipPath key={i} id={`ronda-clip-${i}`} clipPathUnits="userSpaceOnUse">
                  <path ref={reg(`clip${i}`)} d={INNER[d.kind]} transform={glassTransform(initial.glasses[i], d.kind)} />
                </clipPath>
              ))}
              {/* Reflejo en la barra: recorte rectangular y un degradado al color del fondo encima (una máscara
                  degradada costaba ~13 cuadros por segundo en escritorio) */}
              <clipPath id="ronda-floor" clipPathUnits="userSpaceOnUse">
                <rect x="-160" y={COUNTER_Y} width="720" height="72" />
              </clipPath>
              <linearGradient id="ronda-floor-fade" x1="0" y1={COUNTER_Y} x2="0" y2={COUNTER_Y + 70} gradientUnits="userSpaceOnUse">
                <stop offset="0" style={{ stopColor: "var(--bg)" }} stopOpacity="0.45" />
                <stop offset="1" style={{ stopColor: "var(--bg)" }} stopOpacity="1" />
              </linearGradient>
              {/* Halo de neón para piezas fijas (la barra y la tele): región en coordenadas del dibujo, porque una línea
                  horizontal no tiene alto y con la caja del objeto el halo se recortaría */}
              <filter id="ronda-glow" filterUnits="userSpaceOnUse" x="-160" y={COUNTER_Y - 14} width="720" height="28" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="2.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="ronda-glow-tv" x="-20%" y="-30%" width="140%" height="160%" colorInterpolationFilters="sRGB">
                <feGaussianBlur stdDeviation="2.6" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Riel y dispensador */}
            <g ref={reg("rail")}>
              <path d={`M -700 ${RAIL_Y} L 1100 ${RAIL_Y}`} stroke="currentColor" strokeOpacity={0.14} strokeWidth="1.5" />
              <g className="ronda-head-in">
                <g ref={reg("head")} transform={`translate(${PARK_X[0]} ${RAIL_Y})`}>
                  <rect x="-15" y="-8" width="30" height="16" rx="5" style={{ fill: "var(--bg)" }} stroke="currentColor" strokeOpacity={0.7} strokeWidth="1.5" />
                  <rect x="-3.5" y="8" width="7" height="8" rx="1.5" fill="currentColor" fillOpacity={0.7} />
                  <circle ref={reg("led")} cx="8" cy="0" r="2" style={{ fill: "var(--blue)" }} opacity="0.3" />
                </g>
              </g>
            </g>

            <rect ref={reg("stream")} x="0" y="0" width="4.4" height="0" rx="2.2" opacity="0" />

            {/* Barra */}
            <g ref={reg("counter")}>
              {/* Tira LED azul bajo la barra */}
              <path
                d={`M -150 ${COUNTER_Y} L 550 ${COUNTER_Y}`}
                pathLength={1}
                className="ronda-counter"
                style={{ stroke: "var(--blue)" }}
                strokeOpacity={0.8}
                strokeWidth="1.6"
                filter="url(#ronda-glow)"
              />
            </g>

            {/* La cinta trae los vasos (CSS, una vez) */}
            <g className="ronda-belt">
              <g id="ronda-glasses">
                {ROUND.map((d, i) => (
                  <g key={i}>
                    <g ref={reg(`liquidWrap${i}`)} clipPath={`url(#ronda-clip-${i})`} style={{ display: "none" }}>
                      <path ref={reg(`liquid${i}`)} d="" style={{ fill: LIQUID[BASE[i]].fill }} fillOpacity={LIQUID[BASE[i]].opacity} />
                      {i === 0 && <path ref={reg("cola")} d="" style={{ fill: "var(--cola)" }} opacity="0" />}
                      {i === 1 && <path ref={reg("foam")} d="" fill="currentColor" fillOpacity={0.9} />}
                    </g>
                    <g ref={reg(`glass${i}`)} transform={glassTransform(initial.glasses[i], d.kind)}>
                      {BUBBLES.map((b, j) =>
                        b.glass === i ? <circle key={j} ref={reg(`bubble${j}`)} cx={b.x} cy={-6} r={b.r} fill="currentColor" fillOpacity={0.9} opacity="0" /> : null
                      )}
                      {i === 0 &&
                        ICE_X.map((x, j) => (
                          <rect
                            key={j}
                            ref={reg(`ice${j}`)}
                            x="-10"
                            y="-10"
                            width="20"
                            height="20"
                            rx="4"
                            transform={`translate(${x} ${NOZZLE_LOCAL})`}
                            fill="currentColor"
                            fillOpacity={0.2}
                            stroke="currentColor"
                            strokeOpacity={0.7}
                            strokeWidth="1.6"
                            opacity="0"
                          />
                        ))}
                      {i === 3 && (
                        <g ref={reg("lemon")} opacity="0">
                          <circle r="9" style={{ fill: "var(--citrus)", stroke: "var(--citrus)" }} fillOpacity={0.22} strokeWidth="1.5" />
                          <path d="M -6 0 L 6 0 M -3 -5.2 L 3 5.2 M 3 -5.2 L -3 5.2" style={{ stroke: "var(--citrus)" }} strokeOpacity={0.7} strokeWidth="1" />
                        </g>
                      )}
                      <path d={SHEEN[d.kind]} fill="none" stroke="currentColor" strokeOpacity={0.2} strokeWidth="2.5" strokeLinecap="round" />
                      <path d={OUTLINE[d.kind]} fill="none" stroke="currentColor" strokeOpacity={0.82} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </g>
                ))}
              </g>
              {/* Reflejo en la barra */}
              <g ref={reg("reflection")}>
                <g clipPath="url(#ronda-floor)" opacity="0.4">
                  <use href="#ronda-glasses" transform={`translate(0 ${COUNTER_Y * 2}) scale(1 -1)`} />
                </g>
                <rect x="-160" y={COUNTER_Y} width="720" height="72" fill="url(#ronda-floor-fade)" />
              </g>
              {ROUND.map((d, i) => (
                <text
                  key={i}
                  ref={reg(`name${i}`)}
                  x={PARK_X[i]}
                  y={COUNTER_Y + 24}
                  textAnchor="middle"
                  fontSize="12.5"
                  fontWeight="600"
                  fill="currentColor"
                  fillOpacity={0.78}
                  opacity="0"
                  style={{ fontFamily: "var(--font-sans)" }}
                >
                  {d.person}
                </text>
              ))}
            </g>

            {/* La señal: cada vaso se vuelve un celular conectado a la tele */}
            <g ref={reg("extras")} opacity="0">
              {EXTRA_NODES.map((n, j) => (
                <g key={j}>
                  <path d={`M ${n.x} ${n.y} L ${HUB_POS.x} ${HUB_POS.y}`} stroke="currentColor" strokeOpacity={0.1} strokeWidth="1" />
                  <circle cx={n.x} cy={n.y} r="2.6" fill="currentColor" fillOpacity={0.45} />
                </g>
              ))}
            </g>
            {NODE_POS.map((n, i) => (
              <g key={i}>
                <path
                  ref={reg(`line${i}`)}
                  d={`M ${n.x} ${n.y} L ${HUB_POS.x} ${HUB_POS.y}`}
                  pathLength={1}
                  stroke="currentColor"
                  strokeOpacity={0.3}
                  strokeWidth="1.3"
                  strokeDasharray="1"
                  strokeDashoffset="1"
                />
                <path
                  ref={reg(`pulse${i}`)}
                  d={`M ${n.x} ${n.y} L ${HUB_POS.x} ${HUB_POS.y}`}
                  pathLength={1}
                  style={{ stroke: PERSON[i] }}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeDasharray="0.14 1.2"
                  strokeDashoffset="0.14"
                  opacity="0"
                />
              </g>
            ))}
            {NODE_POS.map((n, i) => (
              <circle key={i} ref={reg(`node${i}`)} cx={n.x} cy={n.y} r="3" style={{ fill: PERSON[i] }} opacity="0" />
            ))}
            <g ref={reg("hub")} opacity="0" transform={`translate(${HUB_POS.x} ${HUB_POS.y}) scale(0.94)`}>
              <rect x="-46" y="-29" width="92" height="58" rx="7" style={{ fill: "var(--bg)", stroke: "var(--violet)" }} strokeWidth="1.8" filter="url(#ronda-glow-tv)" />
              <path d="M -14 38 L 14 38 M 0 29 L 0 38" stroke="currentColor" strokeOpacity={0.45} strokeWidth="1.6" strokeLinecap="round" />
              <circle cx="-37" cy="-20" r="2.2" style={{ fill: "var(--signal)" }} />
              {BAR_H.map((_, i) => (
                <rect key={i} ref={reg(`bar${i}`)} x={-31 + i * 16} y="19" width="10" height="0" rx="2" style={{ fill: PERSON[i] }} />
              ))}
            </g>

            {/* Brindis: onda y gotas desde el punto de contacto */}
            <circle ref={reg("ripple")} cx={HUB_POS.x} cy={TOAST_RIM_Y} r="8" fill="none" style={{ stroke: "var(--violet)" }} strokeWidth="1.5" opacity="0" />
            {Array.from({ length: DROPS }, (_, j) => (
              <circle key={j} ref={reg(`drop${j}`)} cx={HUB_POS.x} cy={TOAST_RIM_Y} r="1.8" fill="currentColor" fillOpacity={0.85} opacity="0" />
            ))}
          </svg>
        </div>

        <div className="flex w-full max-w-md shrink-0 flex-col items-center gap-3 lg:max-w-2xl [@media(max-height:480px)]:w-auto [@media(max-height:480px)]:max-w-xs [@media(max-height:480px)]:items-start">
          <p className="sr-only">
            Una barra automática sirve la ronda: piscola, cerveza, vino y agua, cada una con su graduación y sus gramos de alcohol. Brindan y cada
            vaso se vuelve un celular conectado a la tele de la sala.
          </p>
          <div className="grid w-full [@media(max-height:480px)]:hidden" aria-hidden>
            <p
              ref={reg("hint")}
              className="col-start-1 row-start-1 self-center text-center text-sm font-semibold text-slate-400 transition-opacity duration-200 ease-out"
            >
              {HINTS.scroll}
            </p>
            <dl ref={reg("readouts")} className="col-start-1 row-start-1 grid grid-cols-3 gap-2 text-center opacity-0 transition-opacity duration-200 ease-out">
              {READOUTS.map((name, i) => (
                <div key={name} className="min-w-0">
                  <dt className="truncate text-xs font-semibold text-slate-400">{name}</dt>
                  <dd ref={reg(`readout${i}`)} className="mt-0.5 font-display text-lg font-bold tabular text-white sm:text-2xl">
                    {i === 0 ? "0 ml" : i === 1 ? "0,0 %" : "0,0 g"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p ref={reg("label")} className="display text-center text-display-lg [@media(max-height:480px)]:text-left [@media(max-height:480px)]:text-4xl" aria-hidden>
            Sirve la ronda
          </p>
          <span className="block h-0.5 w-40 overflow-hidden rounded-full bg-white/10" aria-hidden>
            <span ref={reg("bar")} className="block h-full w-full origin-left bg-indigo-400" style={{ transform: "scaleX(0)" }} />
          </span>

          {/* Saltar y la acción final comparten lugar: al terminar, una reemplaza a la otra sin mover nada */}
          <div className="grid min-h-[48px] w-full place-items-center [@media(max-height:480px)]:place-items-start">
            <a
              href="#inicio"
              onClick={skip}
              aria-hidden={ready}
              tabIndex={ready ? -1 : undefined}
              className={`col-start-1 row-start-1 inline-flex min-h-[44px] items-center text-sm font-semibold text-slate-400 transition-opacity duration-200 ease-out hover:text-white ${
                ready ? "pointer-events-none opacity-0" : ""
              }`}
            >
              Saltar intro <ArrowDown className="ml-1 h-4 w-4" aria-hidden />
            </a>
            <div
              inert={!ready}
              className={`col-start-1 row-start-1 flex flex-wrap justify-center gap-2 transition-[opacity,transform] duration-300 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${
                ready ? "" : "translate-y-2 opacity-0"
              }`}
            >
              <button type="button" onClick={onCreate} disabled={busy} className="btn-primary">
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />} Crear sala
              </button>
              <button type="button" onClick={onCode} className="btn-ghost">
                Tengo un código
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
