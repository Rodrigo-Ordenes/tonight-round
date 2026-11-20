"use client";

import { useRef } from "react";

/**
 * Arrastrar para cerrar una hoja inferior (como el «Drawer» de 21st.dev): se arrastra desde la manija; si baja más de
 * 120 px o se suelta rápido (más de 0,11 px/ms, el umbral de Sonner y Vaul), se cierra; si no, vuelve a su lugar con
 * la curva de cajón de iOS. Hacia arriba ofrece resistencia en vez de un tope seco. Solo transform.
 */
export function useDragDismiss(onClose: () => void) {
  const panel = useRef<HTMLDivElement | null>(null);
  const start = useRef<{ y: number; t: number } | null>(null);

  const set = (y: number, animate: boolean) => {
    const el = panel.current;
    if (!el) return;
    el.style.transition = animate ? "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)" : "none";
    el.style.transform = y ? `translateY(${y}px)` : "";
  };

  const handle = {
    onPointerDown: (e: React.PointerEvent) => {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      start.current = { y: e.clientY, t: e.timeStamp };
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (!start.current) return;
      const dy = e.clientY - start.current.y;
      set(dy >= 0 ? dy : -Math.sqrt(-dy) * 2, false);
    },
    onPointerUp: (e: React.PointerEvent) => {
      const s = start.current;
      start.current = null;
      if (!s) return;
      const dy = e.clientY - s.y;
      const velocity = dy / Math.max(1, e.timeStamp - s.t);
      if (dy > 120 || velocity > 0.11) {
        set(window.innerHeight, true);
        window.setTimeout(onClose, 200);
      } else set(0, true);
    },
    onPointerCancel: () => {
      start.current = null;
      set(0, true);
    },
  };
  return { panel, handle };
}
