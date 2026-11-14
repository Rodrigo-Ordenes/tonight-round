"use client";

import React from "react";
import CountUp from "@/components/ui/CountUp";
import type { LiveRound, Participant } from "@/lib/carreteState";
import { penaltyFor, tally } from "@/lib/liveGames";

/** Resultados de una ronda revelada. `size="tv"` usa la escala 10-foot para la Smart TV. */
export default function RoundResults({
  round,
  participants,
  size = "md",
  meId,
}: {
  round: LiveRound;
  participants: Participant[];
  size?: "md" | "tv";
  meId?: string | null;
}) {
  const t = tally(round, participants);
  const tv = size === "tv";
  const max = Math.max(1, ...t.rows.map((r) => r.count));
  const losers = participants.filter((p) => t.loserIds.includes(p.id));
  const name = (id: string) => participants.find((p) => p.id === id)?.name ?? "?";

  return (
    <div className={tv ? "space-y-8" : "space-y-4"}>
      <p className={`display ${tv ? "text-tv-lg" : "text-2xl"} animate-rise-in`}>{t.headline}</p>
      {round.explain && <p className={`${tv ? "text-tv-sm" : "text-sm"} max-w-3xl text-slate-300`}>{round.explain}</p>}

      <ul className={tv ? "space-y-4" : "space-y-2"}>
        {t.rows
          .filter((r) => r.count > 0 || t.rows.length <= 4)
          .sort((a, b) => b.count - a.count)
          .map((r, i) => {
            const correct = !!round.answer && r.id === round.answer;
            // Revelado en cascada: cada fila entra y su barra crece 70 ms después de la anterior
            const delay = { animationDelay: `${120 + i * 70}ms` };
            return (
              <li key={r.id} className="animate-rise-in" style={delay}>
                <div className={`flex items-center justify-between gap-3 ${tv ? "text-tv-sm" : "text-sm"} font-semibold text-white`}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate">{r.label}</span>
                    {correct && <span className="rounded-full bg-emerald-400 px-2 py-0.5 text-[0.7em] font-bold text-night-950">{round.game === "mito" ? "correcta" : "¡era!"}</span>}
                  </span>
                  <span className="font-mono tabular text-slate-300">{tv ? <CountUp value={r.count} duration={900} /> : r.count}</span>
                </div>
                <div className={`mt-1.5 overflow-hidden rounded-full bg-white/[0.06] ${tv ? "h-5" : "h-2.5"}`}>
                  <div
                    className={`h-full rounded-full origin-left animate-bar-grow transition-transform duration-300 ease-out ${correct ? "bg-emerald-400" : "bg-indigo-500"}`}
                    style={{ transform: `scaleX(${((r.count / max) * 100) / 100})`, ...delay }}
                  />
                </div>
                {round.game !== "impostor" && round.game !== "confesion" && r.voterIds.length > 0 && round.game !== "probable" && (
                  <p className={`mt-1 ${tv ? "text-xl" : "text-xs"} text-slate-400`}>{r.voterIds.map(name).join(", ")}</p>
                )}
              </li>
            );
          })}
      </ul>

      {losers.length > 0 && (
        <div
          className={`animate-rise-in rounded-3xl border border-indigo-400/30 bg-indigo-500/[0.08] ${tv ? "p-8" : "p-4"}`}
          style={{ animationDelay: `${200 + t.rows.length * 70}ms` }}
        >
          <p className={`eyebrow ${tv ? "!text-lg" : ""}`}>Cumplen</p>
          <ul className={`mt-2 grid gap-2 ${tv ? "grid-cols-2" : ""}`}>
            {losers.map((p) => {
              const pen = penaltyFor(p, round.id);
              return (
                <li key={p.id} className={`flex items-baseline gap-2 ${tv ? "text-tv-sm" : "text-sm"} ${p.id === meId ? "font-bold text-white" : "text-slate-200"}`}>
                  <span className="max-w-[45%] shrink-0 truncate font-semibold">{p.name}</span>
                  <span className={pen.water ? "text-cyan-200" : "text-slate-300"}>· {pen.text}</span>
                </li>
              );
            })}
          </ul>
          <p className={`mt-2 ${tv ? "text-2xl" : "text-xs"} text-slate-400`}>Cada uno puede elegir otra opción en su celular, o pasar.</p>
        </div>
      )}
    </div>
  );
}
