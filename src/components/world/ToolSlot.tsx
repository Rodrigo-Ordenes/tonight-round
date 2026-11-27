"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import { useWorld } from "./WorldProvider";

/*
 * USAR: el objeto se vuelve la herramienta. En el 3D la herramienta de hoy se monta en un marco fijo alineado sobre el
 * rectángulo del objeto en pantalla (lo escribe el lienzo en variables CSS, sin re-render), invisible e inerte
 * mientras la cámara viaja; al llegar entra con un fundido que nace del objeto y recibe el foco. Escape (fuera de un
 * diálogo) hace el camino inverso. Sin herramienta abierta, el mismo nodo deja el contenido en el flujo, debajo de la
 * escena (por ejemplo, todas las mesas del casino). Pasar de un modo a otro no vuelve a montar la herramienta.
 */

export function ToolSlot({ mode, label, theme = "neon", host, children }: { mode: "marco" | "debajo"; label: string; theme?: "neon" | "casino"; host?: React.ReactNode; children: React.ReactNode }) {
  const world = useWorld();
  const bus = world?.bus;
  const ref = useRef<HTMLDivElement>(null);
  const marco = mode === "marco";
  const shown = marco && !!world?.arrived;

  useLayoutEffect(() => {
    if (!bus) return;
    const el = ref.current;
    bus.tool.el = marco ? el : null;
    return () => {
      if (bus.tool.el === el) bus.tool.el = null;
    };
  }, [marco, bus]);

  // El foco entra con la herramienta (sin mover la página)
  useEffect(() => {
    if (shown) ref.current?.focus({ preventScroll: true });
  }, [shown]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!marco || e.key !== "Escape" || e.defaultPrevented) return;
    // Un diálogo de la herramienta cierra con su propio Escape
    if ((e.target as Element).closest("dialog")) return;
    e.preventDefault();
    world?.back();
  };

  const casino = theme === "casino";
  return (
    <div
      ref={ref}
      data-world-tool={mode}
      role={marco ? "region" : undefined}
      aria-label={marco ? label : undefined}
      tabIndex={marco ? -1 : undefined}
      inert={marco && !shown ? true : undefined}
      onKeyDown={onKeyDown}
      className={
        marco
          ? `fixed z-30 overflow-y-auto overscroll-contain rounded-2xl border shadow-lift outline-none backdrop-blur-xl transition-[opacity,transform] duration-[240ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transform-none ${
              casino ? "theme-casino border-[#D4AF37]/35 bg-[#07231B]/90" : "border-white/10 bg-night-950/85"
            } ${shown ? "scale-100 opacity-100" : "pointer-events-none scale-[0.98] opacity-0"}`
          : "relative"
      }
      style={
        marco
          ? {
              left: "var(--tool-x, 12px)",
              top: "var(--tool-y, 8rem)",
              width: "var(--tool-w, calc(100vw - 24px))",
              height: "var(--tool-h, calc(100dvh - 15rem))",
              transformOrigin: "var(--tool-ox, 50%) var(--tool-oy, 50%)",
            }
          : undefined
      }
    >
      {/* Debajo de la escena: primero se ve el lugar entero */}
      {mode === "debajo" && <div aria-hidden className="pointer-events-none h-[100svh]" />}
      {marco && host ? <div className="sticky top-0 z-10 bg-gradient-to-b from-night-950/90 to-transparent px-4 pb-4 pt-4 sm:px-6">{host}</div> : null}
      <div className={marco ? "px-4 pb-6 sm:px-6" : undefined}>{children}</div>
    </div>
  );
}
