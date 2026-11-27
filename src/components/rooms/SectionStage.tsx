"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import RoomVideo, { type RoomVideoName } from "./RoomVideo";
import HostSays from "./HostSays";
import { sfx, warmAudio } from "./sfx";
import { rememberZone, ZONAS_CLUB } from "@/components/gateway/club3d/zonas";

export interface StageOption {
  id: string;
  label: string;
  hint?: string;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  primary?: boolean;
  busy?: boolean;
}

/**
 * Un apartado del club como escena: se llega directo a la vista. Un video real de fondo que respira con el puntero o
 * la inclinación del celular, focos que barren, el host que te recibe y conversa, y las opciones de la sala al
 * alcance de la mano (como lo que te ofrece el barman). Con `compact`, la escena se recoge a cabecera y debajo queda la
 * herramienta elegida (sigue el mismo video detrás: nunca se sale del lugar).
 */
export default function SectionStage({
  id,
  video,
  eyebrow,
  title,
  lines,
  options,
  active,
  compact = false,
  sound = "clink",
  theme = "neon",
  aside,
  children,
}: {
  id: string;
  video: RoomVideoName;
  eyebrow: string;
  title: string;
  lines: string[];
  options?: StageOption[];
  active?: string | null;
  compact?: boolean;
  sound?: keyof typeof sfx;
  /** `casino`: paño esmeralda, oro y marfil en vez del neón azul y morado */
  theme?: "neon" | "casino";
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const play = () => sfx[sound]();
  // Recordar la última zona: al volver al club, la cámara entra mirando hacia ella
  useEffect(() => {
    const z = ZONAS_CLUB.find((x) => x.id === id);
    if (z) rememberZone(z.id);
    warmAudio();
  }, [id]);
  const casino = theme === "casino";
  return (
    <>
      <section
        aria-labelledby={`${id}-title`}
        data-room={id}
        className={`room-stage relative isolate -mt-[calc(4.75rem+env(safe-area-inset-top,0px))] overflow-hidden lg:-mt-24 ${casino ? "theme-casino" : ""} ${compact ? "min-h-[24rem] sm:min-h-[26rem]" : "min-h-[100svh]"}`}
        style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}
      >
        <RoomVideo name={video} veil={casino ? (compact ? "casino-full" : "casino") : compact ? "full" : "bottom"} />
        <div aria-hidden className="room-lights pointer-events-none absolute inset-0" />
        <div
          className={`relative z-10 mx-auto flex w-full max-w-6xl flex-col px-4 pt-[calc(env(safe-area-inset-top,0px)+5.5rem)] sm:px-6 lg:px-10 lg:pt-28 ${
            compact ? "gap-5 pb-6" : "min-h-[100svh] justify-between gap-8 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)]"
          }`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className={`eyebrow ${casino ? "!text-[#ECC85F]" : ""}`}>{eyebrow}</p>
              <h1 id={`${id}-title`} className={`display mt-2 leading-[1.02] ${casino ? "casino-title" : ""} ${compact ? "text-4xl sm:text-5xl" : "text-[2.6rem] sm:text-6xl lg:text-7xl"}`}>
                {title}
                <span className={casino ? "" : "text-accent"}>.</span>
              </h1>
            </div>
            {aside}
          </div>
          <HostSays lines={lines} size={compact ? "sm" : "md"} tone={theme} className={compact ? "" : "lg:max-w-xl"} />
          {options && options.length > 0 && (
            <nav
              aria-label={`Opciones: ${title}`}
              className={`room-options gap-2.5 ${
                compact
                  ? "no-scrollbar -mx-4 flex snap-x overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0"
                  : // Hasta cinco opciones en una fila; con más, dos filas parejas (7 → 4 + 3) para que nada quede apretado
                    `grid grid-cols-1 sm:grid-cols-2 ${["", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5"][Math.min(5, options.length <= 5 ? options.length : Math.ceil(options.length / 2))]}`
              }`}
            >
              {options.map((o, i) => {
                const on = active === o.id;
                const cls = `room-option group relative flex min-h-[4.25rem] items-center gap-3 overflow-hidden rounded-2xl border px-4 py-3 text-left backdrop-blur-md transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out animate-rise-in ${
                  compact ? "min-w-[15rem] shrink-0 snap-start" : ""
                } ${
                  casino
                    ? o.primary
                      ? "casino-gold border-[#F7E3A1]/70 text-[#0B0B0F] shadow-[0_18px_50px_-18px_rgba(212,175,55,0.85)]"
                      : on
                        ? "border-[#ECC85F]/80 bg-[#1F6F54]/70 text-[#F5F0E6]"
                        : "border-[#D4AF37]/35 bg-[#0E3B2E]/65 text-[#F5F0E6] hover:border-[#ECC85F]/70"
                    : o.primary
                      ? "border-indigo-300/60 bg-indigo-500 text-night-950 shadow-[0_18px_50px_-18px_rgba(103,170,255,0.8)]"
                      : on
                        ? "border-indigo-300/70 bg-indigo-500/20 text-white"
                        : "border-white/12 bg-night-950/55 text-white hover:border-indigo-300/50"
                }`;
                const inner = (
                  <>
                    {o.icon && <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xl ${o.primary ? "bg-night-950/15" : casino ? "bg-[#D4AF37]/12" : "bg-white/[0.06]"}`}>{o.icon}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block hyphens-auto break-words font-display text-base font-extrabold leading-tight sm:text-lg">{o.label}</span>
                      {o.hint && <span className={`mt-0.5 block text-xs leading-snug ${o.primary ? "text-night-950/75" : casino ? "text-[#F5F0E6]/75" : "text-slate-300"}`}>{o.hint}</span>}
                    </span>
                    {o.busy ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden /> : <ArrowRight className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 ease-out group-hover:translate-x-0.5" aria-hidden />}
                  </>
                );
                const style = { animationDelay: `${90 + Math.pow(i, 0.85) * 70}ms` };
                return o.href ? (
                  <Link key={o.id} href={o.href} onClick={play} className={cls} style={style} aria-current={on ? "page" : undefined} data-option={o.id}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => {
                      play();
                      o.onSelect?.();
                    }}
                    disabled={o.busy}
                    aria-pressed={active !== undefined ? on : undefined}
                    className={cls}
                    style={style}
                    data-option={o.id}
                  >
                    {inner}
                  </button>
                );
              })}
            </nav>
          )}
        </div>
      </section>
      {children}
    </>
  );
}
