"use client";

import React from "react";
import type { RoundClock } from "@/lib/useRoundClock";

/** Barra de tiempo de la ronda: lineal (es un progreso constante), ámbar en los últimos 10 s. */
export default function RoundTimer({ clock, size = "md" }: { clock: RoundClock; size?: "md" | "tv" }) {
  if (clock.remainingMs === null) return null;
  const urgent = clock.remainingMs <= 10_000;
  const secs = Math.ceil(clock.remainingMs / 1000);
  return (
    <div className="flex items-center gap-3" aria-label={`Quedan ${secs} segundos para votar`}>
      <div className={`flex-1 overflow-hidden rounded-full bg-white/[0.08] ${size === "tv" ? "h-3" : "h-1.5"}`}>
        <div
          className={`h-full origin-left rounded-full ${urgent ? "bg-amber-400" : "bg-slate-300"}`}
          style={{ transform: `scaleX(${1 - clock.progress})`, transition: "transform 250ms linear" }}
        />
      </div>
      <span className={`font-mono tabular ${urgent ? "text-amber-300" : "text-slate-400"} ${size === "tv" ? "text-tv-sm" : "text-xs"}`}>{secs}s</span>
    </div>
  );
}
