"use client";

import { useEffect, useLayoutEffect, useState, type RefObject } from "react";

const useIso = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface ActiveRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Mide el elemento activo (por ejemplo `[aria-current="page"]`) dentro de `container` y lo vuelve a medir si el
 * contenedor cambia de tamaño. `key` debe cambiar cuando cambia la opción activa.
 */
export function useActiveRect(container: RefObject<HTMLElement | null>, selector: string, key: unknown): ActiveRect | null {
  const [rect, setRect] = useState<ActiveRect | null>(null);
  // El contenedor puede aparecer después del primer render (la vista del celular pide el nombre antes): tras cada
  // render se compara el nodo y, si cambió, se vuelve a medir. Sin esto la píldora quedaba invisible.
  const [node, setNode] = useState<HTMLElement | null>(null);
  useIso(() => {
    if (container.current !== node) setNode(container.current);
  });
  useIso(() => {
    const el = node;
    if (!el) return;
    const measure = () => {
      const a = el.querySelector<HTMLElement>(selector);
      if (!a) return setRect(null);
      // Relativo a la caja de relleno del contenedor (donde se ubica la píldora), sin depender de offsetParent
      const c = el.getBoundingClientRect();
      const r = a.getBoundingClientRect();
      setRect({ x: r.left - c.left - el.clientLeft + el.scrollLeft, y: r.top - c.top - el.clientTop + el.scrollTop, w: r.width, h: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [node, selector, key]);
  return rect;
}

/**
 * La píldora de neón que se desliza a la opción activa (menú, pestañas). El primer cuadro se ubica sin
 * transición, así no entra volando desde la esquina; después viaja con un rebote leve. Sin movimiento con
 * prefers-reduced-motion (ver .sliding-indicator en globals.css).
 */
export default function SlidingIndicator({ rect, className = "" }: { rect: ActiveRect | null; className?: string }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!rect || ready) return;
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, [rect, ready]);

  return (
    <span
      aria-hidden
      data-ready={ready || undefined}
      className={`sliding-indicator pointer-events-none absolute left-0 top-0 ${className}`}
      style={rect ? { transform: `translate(${rect.x}px, ${rect.y}px)`, width: rect.w, height: rect.h, opacity: 1 } : { opacity: 0 }}
    />
  );
}
