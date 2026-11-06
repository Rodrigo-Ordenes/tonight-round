"use client";

import React, { useState } from "react";
import { Shuffle } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import type { SeatMode } from "@/lib/carreteState";
import { groupCountFor, makeGroups, seatPool } from "@/lib/shuffle";
import { audioEffects } from "@/lib/audioEffects";

const MODES: { id: SeatMode; label: string; hint: string }[] = [
  { id: "puestos", label: "Cambio de puestos", hint: "Nuevo orden alrededor de la mesa" },
  { id: "parejas", label: "Parejas", hint: "De a dos para el próximo juego" },
  { id: "trios", label: "Tríos", hint: "Grupos de tres" },
  { id: "equipos", label: "Dos equipos", hint: "Para charadas o vaso pong" },
];

export const GROUP_LABEL: Record<SeatMode, (i: number) => string> = {
  puestos: () => "Orden de la mesa",
  parejas: (i) => `Pareja ${i + 1}`,
  trios: (i) => `Trío ${i + 1}`,
  equipos: (i) => (i === 0 ? "Equipo coral" : "Equipo lima"),
};

/**
 * Rotación de puestos y equipos al estilo de los nomikai japoneses (sekigae): una autoridad neutral
 * que mezcla al grupo. El resultado se publica a la sala y se ve en la TV.
 */
export default function SeatShuffle({ store }: { store: CarreteStore }) {
  const { participants, games, patchGames } = store;
  const [mode, setMode] = useState<SeatMode>("puestos");
  const draw = games.seats;
  const name = (id: string) => participants.find((p) => p.id === id)?.name ?? "—";

  const shuffle = () => {
    const ids = seatPool(participants);
    if (ids.length < 2) return;
    audioEffects.playReveal();
    const seed = Math.floor(Math.random() * 2 ** 31);
    patchGames({ seats: { mode, groups: makeGroups(ids, groupCountFor(mode, ids.length), seed), at: Date.now() } });
  };

  return (
    <section className="surface p-6">
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de sorteo">
        {MODES.map((m) => (
          <button key={m.id} type="button" role="radio" aria-checked={mode === m.id} onClick={() => setMode(m.id)} className={`chip ${mode === m.id ? "chip-on" : ""}`}>
            {m.label}
          </button>
        ))}
      </div>
      <p className="meta mt-3">{MODES.find((m) => m.id === mode)?.hint}</p>

      <button type="button" onClick={shuffle} disabled={participants.length < 2} className="btn-primary mt-5 w-full sm:w-auto">
        <Shuffle className="w-4 h-4" /> Sortear
      </button>
      {participants.length < 2 && <p className="mt-2 text-sm text-slate-400">Se necesitan al menos 2 personas en la sala.</p>}

      {draw && (
        <div key={draw.at} className="mt-6 grid gap-3 sm:grid-cols-2">
          {draw.groups.map((g, i) => (
            <div key={i} className="rounded-xl border border-white/[0.08] p-4 animate-rise-in" style={{ animationDelay: `${i * 60}ms` }}>
              <p className="eyebrow">{GROUP_LABEL[draw.mode](i)}</p>
              <ol className={`mt-2 ${draw.mode === "puestos" ? "space-y-1" : "flex flex-wrap gap-x-3 gap-y-1"}`}>
                {g.map((id, k) => (
                  <li key={id} className="min-w-0 truncate font-display text-lg font-bold text-white">
                    {draw.mode === "puestos" && <span className="mr-2 font-mono text-sm text-slate-500">{k + 1}</span>}
                    {name(id)}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
