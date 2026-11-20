"use client";

/**
 * «Vinyl Album Card» de 21st.dev (Great UI, MIT) adaptada a Tonight sin framer-motion: el disco sale de la funda
 * (x +140 px de 288, gira 180°) y la funda se inclina (−4°, 0,98, x −20 px) con los mismos resortes del original
 * (rigidez 80/amortiguación 15 y 150/20), pasados a curvas CSS `linear()` calculadas con esa física. Con puntero
 * fino se activa al pasar; en táctil, al tocar. Sin imagen de portada: una funda neón con el ambiente que suena.
 */
import React, { useState } from "react";

/** Resorte k=80, c=15, m=1 (978 ms) y k=150, c=20 (743 ms), muestreados en 41 puntos */
const SPRING_DISC =
  "linear(0, 0.024, 0.081, 0.159, 0.241, 0.333, 0.424, 0.505, 0.585, 0.657, 0.717, 0.773, 0.82, 0.858, 0.892, 0.92, 0.941, 0.959, 0.973, 0.983, 0.991, 0.997, 1.001, 1.004, 1.006, 1.007, 1.007, 1.007, 1.007, 1.006, 1.006, 1.005, 1.005, 1.004, 1.003, 1.003, 1.002, 1.002, 1.001, 1.001, 1)";
const SPRING_SLEEVE =
  "linear(0, 0.029, 0.09, 0.17, 0.261, 0.355, 0.448, 0.542, 0.621, 0.692, 0.754, 0.807, 0.852, 0.889, 0.922, 0.945, 0.964, 0.979, 0.989, 0.997, 1.003, 1.007, 1.009, 1.01, 1.01, 1.01, 1.01, 1.009, 1.008, 1.007, 1.006, 1.005, 1.004, 1.003, 1.003, 1.002, 1.002, 1.001, 1.001, 1.001, 1)";

export interface VinylAlbumCardProps {
  title: string;
  artist: string;
  meta?: string;
  /** Emoji o letra para la etiqueta y la funda */
  mark?: string;
  className?: string;
}

export default function VinylAlbumCard({ title, artist, meta, mark = "♪", className = "" }: VinylAlbumCardProps) {
  const [out, setOut] = useState(false);
  return (
    <div
      className={`vinyl-card group relative flex flex-col items-center select-none ${className}`}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOut(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOut(false)}
    >
      <button
        type="button"
        onClick={() => setOut((v) => !v)}
        aria-pressed={out}
        aria-label={out ? `Guardar el disco de ${title}` : `Sacar el disco de ${title}`}
        className="relative z-10 flex h-48 w-48 items-center justify-center rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:h-56 sm:w-56"
      >
        {/* Disco: surcos concéntricos, reflejo neón y etiqueta */}
        <span
          aria-hidden
          className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#0c0c10]"
          style={{
            transform: out ? "translateX(48.6%) rotate(180deg)" : "none",
            transition: `transform 978ms ${SPRING_DISC}`,
          }}
        >
          {[1, 2, 4, 6, 8, 10, 12, 16, 20].map((i) => (
            <span key={i} className="absolute rounded-full border border-white/[0.07]" style={{ inset: `${i * 4}px` }} />
          ))}
          <span className="relative grid h-16 w-16 place-items-center rounded-full bg-[conic-gradient(from_0deg,#67AAFF,#B93EF3,#8CE3BE,#67AAFF)] text-2xl">
            <span className="absolute h-2.5 w-2.5 rounded-full bg-[#0c0c10] ring-1 ring-black/50" />
            <span className="opacity-0">{mark}</span>
          </span>
          <span className="pointer-events-none absolute inset-0 rotate-45 bg-gradient-to-tr from-indigo-400/20 via-purple-400/20 to-emerald-300/20 mix-blend-overlay" />
        </span>
        {/* Funda */}
        <span
          aria-hidden
          className="absolute inset-0 z-20 overflow-hidden rounded-xl border border-white/10 bg-[radial-gradient(120%_90%_at_20%_10%,rgba(103,170,255,0.55),transparent_55%),radial-gradient(100%_80%_at_90%_100%,rgba(185,62,243,0.6),transparent_60%),#101118] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)]"
          style={{
            transform: out ? "translateX(-6.9%) rotate(-4deg) scale(0.98)" : "none",
            transition: `transform 743ms ${SPRING_SLEEVE}`,
          }}
        >
          <span className="absolute left-4 top-4 font-led text-xs tracking-[0.3em] text-white/70">TONIGHT</span>
          <span className="absolute inset-0 grid place-items-center text-6xl">{mark}</span>
          <span className="absolute bottom-4 left-4 right-4 truncate font-display text-sm font-bold text-white">{title}</span>
        </span>
      </button>
      <div className="z-20 mt-5 w-48 sm:w-56">
        <p className="truncate font-display text-lg font-bold text-white">{title}</p>
        <p className="mt-0.5 truncate text-sm text-slate-400">
          {artist}
          {meta ? ` · ${meta}` : ""}
        </p>
      </div>
    </div>
  );
}
