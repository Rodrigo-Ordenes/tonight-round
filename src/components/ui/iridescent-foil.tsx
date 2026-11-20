"use client";

/**
 * «Iridescent Foil» de 21st.dev (@dqnamo) adaptada a Tonight: una lámina holográfica hecha solo con capas de degradado
 * (brillo de arcoíris, película de color, perla, brillo direccional y reflejo especular) mezcladas con `mix-blend-mode`,
 * sobre la penumbra de la paleta Neón. Cambios respecto del original:
 * - Cada capa es una lámina más grande que la tarjeta y se mueve con `transform`; el original movía
 *   `background-position` y repintaba en cada cuadro.
 * - Tres fuentes de luz: el puntero fino sobre la tarjeta, el avance del scroll (así brilla en el celular sin pedir
 *   nada) y, si se activa, la inclinación del teléfono.
 * - La tarjeta se inclina con un resorte suave (rAF) y las capas internas `[data-foil-depth]` se separan según su
 *   profundidad (parallax dentro de la tarjeta).
 * - Solo trabaja mientras se ve y se detiene al asentarse. Con movimiento reducido queda quieta: los estilos se
 *   encargan y aquí no se escucha nada.
 */
import React, { useEffect, useRef } from "react";

type FoilProps = React.HTMLAttributes<HTMLDivElement> & {
  /** Grados máximos de inclinación hacia la luz (0 = no se inclina) */
  tilt?: number;
  /** Transform fijo de la tarjeta, antes de la inclinación (el reverso de una carta lleva "rotateY(180deg)") */
  base?: string;
  /** Con false la lámina queda quieta: la cara oculta de una carta que se voltea */
  active?: boolean;
  /** Usa la inclinación del teléfono como luz (en iPhone, solo después de `requestOrientation`) */
  motion?: boolean;
  /** Cambia cuando cambia el contenido: vuelve a buscar las capas `[data-foil-depth]` */
  layersKey?: unknown;
};

/** Inclinación del teléfono: Safari en iPhone exige pedir permiso con un toque; Android la entrega sin preguntar */
export function orientationNeedsPermission(): boolean {
  if (typeof window === "undefined" || typeof DeviceOrientationEvent === "undefined") return false;
  return typeof (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission === "function";
}

export async function requestOrientation(): Promise<boolean> {
  try {
    const req = (DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> }).requestPermission;
    return req ? (await req()) === "granted" : true;
  } catch {
    return false;
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
/** Fracción del resorte por cuadro a 60 fps (se corrige según el tiempo real entre cuadros) */
const SPRING = 0.14;
const REST = 0.0006;

export default function IridescentFoil({ tilt = 0, base = "", active = true, motion = false, layersKey, className = "", children, ...props }: FoilProps) {
  const root = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLSpanElement>(null);
  const film = useRef<HTMLSpanElement>(null);
  const pearl = useRef<HTMLSpanElement>(null);
  const shine = useRef<HTMLSpanElement>(null);
  const glare = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !active || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(el.querySelectorAll<HTMLElement>("[data-foil-depth]")).map((node) => ({ node, depth: Number(node.dataset.foilDepth ?? 0) }));
    // Luz objetivo (0–1) y la actual, que la persigue con resorte; `s` es el avance del scroll por la vista
    const target = { x: 0.5, y: 0.38, s: 0.4 };
    const now = { ...target };
    let pointer = false;
    let tiltX = 0;
    let tiltY = 0;
    let visible = false;
    let frame = 0;
    let last = 0;
    let size = { w: el.offsetWidth, h: el.offsetHeight };

    const readScroll = () => {
      const r = el.getBoundingClientRect();
      const range = window.innerHeight + r.height;
      target.s = range > 0 ? clamp((window.innerHeight - r.top) / range, 0, 1) : 0.4;
    };

    const paint = () => {
      const fx = now.x - 0.5;
      const fy = now.y - 0.5;
      if (tilt) el.style.transform = `${base} rotateX(${(-fy * tilt * 2).toFixed(2)}deg) rotateY(${(fx * tilt * 2).toFixed(2)}deg)`;
      // Banda de arcoíris: la lámina mide 320 % y cruza la tarjeta con el scroll y la luz
      const shift = clamp(now.s * 0.8 + fx * 0.36 + 0.1, 0, 1);
      if (sheet.current) sheet.current.style.transform = `translate3d(${(-shift * 68).toFixed(2)}%, 0, 0)`;
      if (film.current) film.current.style.transform = `translate3d(${(-fx * 8 + (now.s - 0.5) * 6).toFixed(2)}%, ${(fy * 6 - (now.s - 0.5) * 4).toFixed(2)}%, 0)`;
      if (pearl.current) pearl.current.style.transform = `translate3d(${(fx * 12 - (now.s - 0.5) * 10).toFixed(2)}%, 0, 0)`;
      if (shine.current) {
        shine.current.style.transform = `rotate(${(-40 + now.s * 80 + fx * 28).toFixed(1)}deg)`;
        shine.current.style.opacity = (0.26 + Math.abs(fx) * 0.3 + now.s * 0.08).toFixed(3);
      }
      if (glare.current) {
        const r = size.w * 0.45;
        glare.current.style.transform = `translate3d(${(now.x * size.w - r).toFixed(1)}px, ${(now.y * size.h - r).toFixed(1)}px, 0)`;
      }
      for (const l of layers) l.node.style.transform = `translate3d(${(fx * l.depth).toFixed(2)}px, ${(fy * l.depth * 0.8).toFixed(2)}px, 0)`;
    };

    const step = (t: number) => {
      frame = 0;
      const dt = last ? Math.min(64, t - last) : 16.7;
      last = t;
      const k = 1 - Math.pow(1 - SPRING, dt / 16.7);
      if (!pointer) {
        target.x = 0.5 + tiltX;
        target.y = 0.38 + tiltY;
      }
      let moving = false;
      for (const key of ["x", "y", "s"] as const) {
        const d = target[key] - now[key];
        if (Math.abs(d) > REST) {
          now[key] += d * k;
          moving = true;
        } else now[key] = target[key];
      }
      paint();
      if (moving && visible) frame = requestAnimationFrame(step);
      else last = 0;
    };
    const wake = () => {
      if (!frame && visible) frame = requestAnimationFrame(step);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      pointer = true;
      target.x = clamp((e.clientX - r.left) / r.width, 0.06, 0.94);
      target.y = clamp((e.clientY - r.top) / r.height, 0.06, 0.94);
      wake();
    };
    const onLeave = () => {
      pointer = false;
      wake();
    };
    const onScroll = () => {
      if (!visible) return;
      readScroll();
      wake();
    };
    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma === null || e.beta === null) return;
      tiltX = clamp(e.gamma / 40, -0.45, 0.45);
      tiltY = clamp((e.beta - 45) / 40, -0.45, 0.45);
      wake();
    };

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        readScroll();
        wake();
      }
    });
    io.observe(el);
    const ro = new ResizeObserver(() => {
      size = { w: el.offsetWidth, h: el.offsetHeight };
      wake();
    });
    ro.observe(el);
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    if (motion) window.addEventListener("deviceorientation", onOrient, { passive: true });
    paint();

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("deviceorientation", onOrient);
      // La cara que se apaga vuelve a su lugar (la de atrás conserva su giro base)
      el.style.transform = base;
      for (const l of layers) l.node.style.transform = "";
    };
  }, [tilt, base, active, motion, layersKey]);

  return (
    <div ref={root} className={`foil ${className}`} {...props}>
      <span ref={sheet} aria-hidden className="foil-sheet" />
      <span ref={film} aria-hidden className="foil-film" />
      <span ref={pearl} aria-hidden className="foil-pearl" />
      <div className="foil-content">{children}</div>
      <span ref={shine} aria-hidden className="foil-shine" />
      <span ref={glare} aria-hidden className="foil-glare" />
    </div>
  );
}
