"use client";

import React, { useEffect, useRef } from "react";
import { Award, Trophy } from "lucide-react";
import type { LiveState, Participant } from "@/lib/carreteState";
import { leaderboard, type PartyResult } from "@/lib/partyGames";
import { useFlip } from "@/lib/useFlip";
import { audioEffects } from "@/lib/audioEffects";

/** Tabla de una ronda de Party Games: qué eligió cada uno, el resultado y los puntos (en cascada) */
export function PartyRoundTable({ result, size = "md", meId }: { result: PartyResult; size?: "md" | "tv"; meId?: string | null }) {
  const tv = size === "tv";
  // Al revelar suena como tragamonedas: los rodillos se frenan y, si alguien ganó, paga (solo puntos, nunca dinero)
  const signature = `${result.headline}|${result.rows.length}`;
  const hasWinner = result.rows.some((r) => r.win);
  useEffect(() => {
    audioEffects.playReels(1200);
    if (!hasWinner) return;
    const id = window.setTimeout(() => audioEffects.playJackpot(), 1350);
    return () => window.clearTimeout(id);
  }, [signature, hasWinner]);
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
  const list = useRef<HTMLOListElement>(null);
  const before = useRef(new Map<string, number>());
  // Al cambiar el orden, cada fila se desliza a su nuevo puesto (FLIP, como la «Live List» de 21st)
  useFlip(list, board.map((b) => `${b.id}:${b.points}`).join("|"));
  // La fila que sumó puntos destella un momento detrás del nombre (solo opacidad; la cifra no se anima)
  useEffect(() => {
    const root = list.current;
    const prev = before.current;
    // Alguien sumó: suena la moneda una vez por actualización (el sonido no depende del movimiento reducido)
    if (prev.size && board.some((b) => (prev.get(b.id) ?? b.points) < b.points)) audioEffects.playCoin();
    if (root && prev.size && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      for (const b of board) {
        const old = prev.get(b.id);
        if (old === undefined || b.points <= old) continue;
        root.querySelector<HTMLElement>(`[data-flip="${CSS.escape(b.id)}"] .rank-glow`)?.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 0 }], { duration: 1600, easing: "ease-out" });
      }
    }
    before.current = new Map(board.map((b) => [b.id, b.points]));
  });
  if (board.length === 0) return null;
  return (
    <section aria-label="Ranking de la noche" className={`rounded-3xl border border-white/10 bg-white/[0.03] ${tv ? "p-6" : "p-4"}`}>
      <p className={`eyebrow flex items-center gap-2 ${tv ? "!text-xl" : ""}`}>
        <Trophy className={tv ? "h-6 w-6 text-amber-200" : "h-4 w-4 text-amber-200"} aria-hidden /> Ranking de la noche
      </p>
      <ol ref={list} className={`mt-3 ${tv ? "space-y-2" : "space-y-1"}`}>
        {board.map((b, i) => (
          <li key={b.id} data-flip={b.id} className={`relative isolate flex items-center gap-3 ${tv ? "text-tv-sm" : "text-sm"} ${b.id === meId ? "font-bold text-white" : "text-slate-200"}`}>
            <span aria-hidden className="rank-glow pointer-events-none absolute -inset-x-2 -inset-y-0.5 -z-10 rounded-xl bg-emerald-400/15 opacity-0" />
            <span className={`w-8 shrink-0 font-led ${i === 0 ? "text-amber-200" : "text-slate-500"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className="min-w-0 flex-1 truncate">{b.name}</span>
            <span className="font-mono tabular">{b.points}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
