"use client";

import { useLayoutEffect, useRef, type RefObject } from "react";

/**
 * FLIP para listas que se reordenan (como la «Live List» de 21st.dev): cada `[data-flip]` se desliza desde su lugar
 * anterior al nuevo cuando cambia el orden, y lo que aparece por primera vez entra desde arriba. Solo transform y
 * opacity; con movimiento reducido no hace nada.
 */
export function useFlip(list: RefObject<HTMLElement | null>, key: unknown) {
  const last = useRef(new Map<string, number>());
  const first = useRef(true);
  useLayoutEffect(() => {
    const root = list.current;
    if (!root) return;
    const items = Array.from(root.querySelectorAll<HTMLElement>("[data-flip]"));
    const now = new Map(items.map((el) => [el.dataset.flip!, el.getBoundingClientRect().top]));
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce && !first.current) {
      for (const el of items) {
        const id = el.dataset.flip!;
        const before = last.current.get(id);
        const after = now.get(id)!;
        if (before === undefined) {
          el.animate([{ transform: "translateY(-10px)", opacity: 0 }, { transform: "none", opacity: 1 }], { duration: 320, easing: "cubic-bezier(0.23, 1, 0.32, 1)" });
        } else if (Math.abs(before - after) > 1) {
          el.animate([{ transform: `translateY(${before - after}px)` }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(0.32, 0.72, 0, 1)" });
        }
      }
    }
    first.current = false;
    last.current = now;
  }, [list, key]);
}
