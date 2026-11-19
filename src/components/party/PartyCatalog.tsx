"use client";

import React, { useState } from "react";
import { Clock, Play, Users } from "lucide-react";
import { PARTY_CATEGORIES, PARTY_GAMES, type PartyCategory } from "@/lib/partyGames";
import type { LiveGame } from "@/lib/carreteState";

/**
 * Catálogo de Party Games: nombre, ilustración, categoría, jugadores y duración, con filtro por categoría.
 * `onPlay` lanza la ronda en la sala; sin sala, el botón lleva a crearla (`noRoom`).
 */
export default function PartyCatalog({ onPlay, playing, noRoom }: { onPlay?: (id: LiveGame) => void; playing?: LiveGame | null; noRoom?: React.ReactNode }) {
  const [cat, setCat] = useState<PartyCategory | "Todos">("Todos");
  const games = PARTY_GAMES.filter((g) => cat === "Todos" || g.category === cat);
  return (
    <section aria-labelledby="party-title" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Party Games</p>
          <h2 id="party-title" className="display text-2xl sm:text-3xl">
            Azar, predicción y faroles<span className="text-accent">.</span>
          </h2>
          <p className="meta mt-1">Cada uno elige en secreto desde su celular, la TV revela y suma puntos. Perder da un reto con alternativas, nunca obliga a tomar.</p>
        </div>
      </div>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1" role="radiogroup" aria-label="Categoría">
        {(["Todos", ...PARTY_CATEGORIES] as const).map((c) => (
          <button key={c} type="button" role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className={`chip shrink-0 ${cat === c ? "!border-indigo-300 !bg-indigo-500 !text-night-950" : ""}`}>
            {c}
          </button>
        ))}
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-3">
        {games.map((g) => (
          <li key={g.id}>
            <article className={`surface relative flex h-full flex-col overflow-hidden p-4 ${playing === g.id ? "ring-2 ring-indigo-400" : ""}`}>
              <span aria-hidden className="pointer-events-none absolute -right-3 -top-4 text-[5.5rem] leading-none opacity-[0.12]">
                {g.emoji}
              </span>
              <span className="text-4xl" aria-hidden>
                {g.emoji}
              </span>
              <h3 className="mt-3 font-display text-lg font-bold text-white">{g.name}</h3>
              <p className="mt-1 flex-1 text-xs leading-snug text-slate-400">{g.blurb}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span className="rounded-full border border-indigo-400/30 px-2 py-0.5 text-indigo-200">{g.category}</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" aria-hidden /> {g.minPlayers}+
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" aria-hidden /> {g.duration}
                </span>
              </p>
              {onPlay ? (
                <button type="button" onClick={() => onPlay(g.id)} className="btn-primary mt-3 w-full !min-h-[44px]">
                  <Play className="h-4 w-4" aria-hidden /> Jugar
                </button>
              ) : (
                noRoom
              )}
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
