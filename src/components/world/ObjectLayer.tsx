"use client";

import React, { useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { StageOption } from "@/components/rooms/SectionStage";
import { sfx } from "@/components/rooms/sfx";
import { useWorld } from "./WorldProvider";

/*
 * La capa DOM paralela al 3D: cada opción es un botón (o enlace) real, con teclado, lector de pantalla y el mismo
 * nombre accesible de hoy (la etiqueta y la pista, como en SectionStage). En la escena, el lienzo lo mueve en cada
 * cuadro encima de su objeto y, si el objeto sale del cuadro, lo asoma por el borde: nunca desaparece. Con una
 * herramienta abierta, los mismos botones se ordenan en una tira arriba (para pasar de una a otra) con «Volver»
 * delante. Una opción sin objeto en la escena va a la bandeja de abajo. Siempre hay un solo control por opción.
 */

type Modo = "escena" | "tira" | "bandeja";

const STYLE = {
  neon: {
    escena: "border-indigo-300/45 bg-night-950/75 text-white shadow-[0_0_28px_-8px_rgba(103,170,255,0.75)] hover:border-indigo-200 aria-pressed:border-indigo-200",
    fila: "border-white/12 bg-night-950/70 text-white hover:border-indigo-300/50",
    on: "border-indigo-300/70 bg-indigo-500/20 text-white",
    primary: "border-indigo-300/60 bg-indigo-500 text-night-950",
    ring: "bg-indigo-300 shadow-[0_0_12px_2px_rgba(185,62,243,0.8)]",
    hint: "text-slate-300",
  },
  casino: {
    escena: "border-[#D4AF37]/55 bg-[#07231B]/80 text-[#F5F0E6] shadow-[0_0_28px_-8px_rgba(212,175,55,0.75)] hover:border-[#ECC85F]",
    fila: "border-[#D4AF37]/35 bg-[#0E3B2E]/75 text-[#F5F0E6] hover:border-[#ECC85F]/70",
    on: "border-[#ECC85F]/80 bg-[#1F6F54]/75 text-[#F5F0E6]",
    primary: "casino-gold border-[#F7E3A1]/70 text-[#0B0B0F]",
    ring: "bg-[#ECC85F] shadow-[0_0_12px_2px_rgba(212,175,55,0.85)]",
    hint: "text-[#F5F0E6]/75",
  },
} as const;

function ObjectButton({ o, modo, on, pressable, theme, sound }: { o: StageOption; modo: Modo; on: boolean; pressable: boolean; theme: "neon" | "casino"; sound: keyof typeof sfx }) {
  const world = useWorld();
  const s = STYLE[theme];
  const self = useRef<HTMLElement | null>(null);
  const register = (el: HTMLElement | null) => {
    self.current = el;
    if (!el || !world) return;
    world.bus.anchors.set(o.id, el);
    return () => {
      if (world.bus.anchors.get(o.id) === el) world.bus.anchors.delete(o.id);
    };
  };
  const escena = modo === "escena";
  // Fuera de la escena, el botón vuelve al flujo: se borra la posición que le escribió el lienzo
  useLayoutEffect(() => {
    const el = self.current;
    if (!el || escena) return;
    el.style.transform = "";
    delete el.dataset.listo;
    delete el.dataset.borde;
  }, [escena]);
  const tone = o.primary ? s.primary : on ? s.on : escena ? s.escena : s.fila;
  const cls = escena
    ? // En la escena: una píldora con su punto de neón. `fixed` a propósito: la ubica el lienzo con transform, y
      // la cascada de entrada de página (.page-in) solo funde a quien contiene piezas fijas
      `world-object pointer-events-auto fixed left-0 top-0 flex min-h-[44px] max-w-[15rem] items-center gap-2 rounded-full border py-2 pl-2.5 pr-4 text-left backdrop-blur-md transition-[border-color,background-color,opacity] duration-200 ease-out [&:not([data-listo])]:opacity-0 data-[borde='1']:opacity-80 ${tone}`
    : `world-object pointer-events-auto relative flex min-h-[3.5rem] min-w-[13rem] shrink-0 snap-start items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left backdrop-blur-md transition-[border-color,background-color] duration-200 ease-out ${tone}`;
  const inner = (
    <>
      {escena ? (
        <span aria-hidden className={`h-3 w-3 shrink-0 rounded-full ${s.ring}`} />
      ) : (
        o.icon && (
          <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-lg">
            {o.icon}
          </span>
        )
      )}
      <span className="min-w-0 flex-1">
        <span className="block font-display text-sm font-extrabold leading-tight sm:text-base">{o.label}</span>
        {/* La pista es parte del nombre accesible (como en SectionStage); en la escena no se ve para no tapar el lugar */}
        {o.hint && <span className={escena ? "sr-only" : `mt-0.5 block text-xs leading-snug ${o.primary ? "text-night-950/75" : s.hint}`}>{o.hint}</span>}
      </span>
      {o.busy && <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />}
    </>
  );
  const play = () => sfx[sound]();
  return o.href ? (
    <Link ref={register} href={o.href} onClick={play} data-modo={modo} aria-current={on ? "page" : undefined} className={cls}>
      {inner}
    </Link>
  ) : (
    <button
      ref={register}
      type="button"
      data-modo={modo}
      disabled={o.busy}
      aria-pressed={pressable ? on : undefined}
      onClick={() => {
        play();
        o.onSelect?.();
      }}
      className={cls}
    >
      {inner}
    </button>
  );
}

export function ObjectLayer({
  title,
  options,
  active,
  toolOpen,
  theme,
  sound,
}: {
  title: string;
  options: StageOption[];
  active: string | null | undefined;
  toolOpen: boolean;
  theme: "neon" | "casino";
  sound: keyof typeof sfx;
}) {
  const world = useWorld();
  if (!world) return null;
  const anchored = new Set(world.room.anchors.map((a) => a.id));
  const modo = (o: StageOption): Modo => (toolOpen ? "tira" : anchored.has(o.id) ? "escena" : "bandeja");
  const row = options.some((o) => modo(o) !== "escena");
  return (
    // Una sola lista, en el orden de importancia de hoy (así también recorre el teclado); los botones de la escena
    // salen del flujo (fixed) y los demás forman la fila de arriba (tira) o de abajo (bandeja)
    <nav
      aria-label={`Opciones: ${title}`}
      data-world-strip={toolOpen ? "" : undefined}
      data-world-tray={!toolOpen && row ? "" : undefined}
      className={`no-scrollbar pointer-events-none fixed inset-x-0 z-30 flex snap-x gap-2 overflow-x-auto px-3 sm:px-6 lg:px-10 ${
        toolOpen ? "top-[calc(env(safe-area-inset-top,0px)+4rem)] lg:top-[4.5rem]" : "bottom-[calc(max(12px,env(safe-area-inset-bottom))+5.75rem)]"
      }`}
    >
      {toolOpen && (
        <button
          type="button"
          onClick={() => {
            sfx.whoosh();
            world.back();
          }}
          className={`pointer-events-auto flex min-h-[3.5rem] shrink-0 items-center gap-1.5 rounded-2xl border px-3.5 font-display text-sm font-extrabold backdrop-blur-md transition-colors duration-200 ${STYLE[theme].fila}`}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver
        </button>
      )}
      {options.map((o) => (
        <ObjectButton key={o.id} o={o} modo={modo(o)} on={active === o.id} pressable={active !== undefined} theme={theme} sound={sound} />
      ))}
    </nav>
  );
}
