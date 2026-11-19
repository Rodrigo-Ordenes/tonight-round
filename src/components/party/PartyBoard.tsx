"use client";

import React from "react";
import { Award, Trophy } from "lucide-react";
import type { LiveState, Participant } from "@/lib/carreteState";
import { leaderboard, type PartyResult } from "@/lib/partyGames";

/** Tabla de una ronda de Party Games: qué eligió cada uno, el resultado y los puntos (en cascada) */
export function PartyRoundTable({ result, size = "md", meId }: { result: PartyResult; size?: "md" | "tv"; meId?: string | null }) {
  const tv = size === "tv";
  if (result.rows.length === 0) return null;
  return (
    <ul className={tv ? "space-y-3" : "space-y-1.5"}>
      {result.rows.map((r, i) => (
        <li
          key={r.id}
          className={`animate-rise-in flex items-center gap-3 rounded-2xl border ${tv ? "px-6 py-4 text-tv-sm" : "px-3 py-2 text-sm"} ${
            r.win ? "border-emerald-300/40 bg-emerald-400/10" : r.lose ? "border-white/10 bg-white/[0.03]" : "border-white/[0.06] bg-transparent"
          } ${r.id === meId ? "ring-1 ring-indigo-300/60" : ""}`}
          style={{ animationDelay: `${120 + i * 70}ms` }}
        >
          <span className="flex w-[34%] min-w-0 items-center gap-2 font-semibold text-white">
            {r.win && <Award className={tv ? "h-7 w-7 shrink-0 text-amber-200" : "h-4 w-4 shrink-0 text-amber-200"} aria-label="Ganó" />}
            <span className="truncate">{r.name}</span>
          </span>
          <span className="min-w-0 flex-1 truncate text-slate-300">{r.pick}</span>
          <span className="hidden min-w-0 flex-1 truncate text-slate-400 sm:block">{r.detail}</span>
          <span className={`shrink-0 font-mono font-bold tabular ${r.points > 0 ? "text-emerald-200" : r.points < 0 ? "text-slate-400" : "text-slate-500"}`}>
            {r.points > 0 ? `+${r.points}` : r.points}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ranking de la noche (suma de todas las rondas con puntos) */
export function PartyLeaderboard({ live, participants, size = "md", meId, limit = 8 }: { live: LiveState | undefined; participants: Participant[]; size?: "md" | "tv"; meId?: string | null; limit?: number }) {
  const tv = size === "tv";
  const board = leaderboard(live?.history ?? [], participants).slice(0, limit);
  if (board.length === 0) return null;
  return (
    <section aria-label="Ranking de la noche" className={`rounded-3xl border border-white/10 bg-white/[0.03] ${tv ? "p-6" : "p-4"}`}>
      <p className={`eyebrow flex items-center gap-2 ${tv ? "!text-xl" : ""}`}>
        <Trophy className={tv ? "h-6 w-6 text-amber-200" : "h-4 w-4 text-amber-200"} aria-hidden /> Ranking de la noche
      </p>
      <ol className={`mt-3 ${tv ? "space-y-2" : "space-y-1"}`}>
        {board.map((b, i) => (
          <li key={b.id} className={`flex items-center gap-3 ${tv ? "text-tv-sm" : "text-sm"} ${b.id === meId ? "font-bold text-white" : "text-slate-200"}`}>
            <span className={`w-8 shrink-0 font-led ${i === 0 ? "text-amber-200" : "text-slate-500"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
            <span className="font-mono tabular">{b.points}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
