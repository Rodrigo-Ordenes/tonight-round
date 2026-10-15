"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Eye, Play, SkipForward, Square, Tv, Users } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { LIVE_GAMES, LIVE_GAME_BY_ID, buildRound, tally } from "@/lib/liveGames";
import type { LiveGame } from "@/lib/carreteState";
import { audioEffects } from "@/lib/audioEffects";
import { fireConfetti } from "@/lib/confetti";
import RoundResults from "./RoundResults";

/**
 * Control del anfitrión: elige el juego, lanza la ronda, ve quién votó y revela.
 * Los votos llegan desde los celulares (LiveRoundCard) como acciones idempotentes.
 */
export default function LiveGameHost({ store }: { store: CarreteStore }) {
  const { state, participants, dispatch, isSolo, code } = store;
  const live = state.live;
  const round = live?.round ?? null;
  const [error, setError] = useState<string | null>(null);
  const revealedRef = useRef<string | null>(null);

  const usedPrompts = useMemo(() => new Set((live?.history ?? []).map((h) => h.prompt)), [live?.history]);
  const pendingConfessions = (live?.confessions ?? []).filter((c) => !c.used).length;

  useEffect(() => {
    if (round?.revealedAt && revealedRef.current !== round.id) {
      revealedRef.current = round.id;
      audioEffects.playReveal();
      void fireConfetti({ particleCount: 90, spread: 80, origin: { y: 0.6 }, colors: ["#FF5E36", "#9C82FF", "#86E64C", "#F7F5F3"] });
    }
  }, [round?.revealedAt, round?.id]);

  if (isSolo) {
    return (
      <div className="surface p-6">
        <p className="eyebrow">Juegos en vivo</p>
        <h3 className="display mt-2 text-2xl">Necesitan una sala</h3>
        <p className="mt-2 max-w-lg text-sm text-slate-400">
          En los juegos en vivo cada persona vota en secreto desde su celular y la TV revela los resultados. Crea una sala y compartan el código.
        </p>
        <Link href="/" className="btn-primary mt-4">
          Crear sala
        </Link>
      </div>
    );
  }

  const start = (game: LiveGame) => {
    setError(null);
    const r = buildRound(game, { participants, confessions: live?.confessions ?? [], usedPrompts });
    if ("error" in r) {
      setError(r.error);
      audioEffects.playBuzz();
      return;
    }
    audioEffects.playPop();
    if (round && !round.revealedAt) dispatch({ type: "END_ROUND", roundId: round.id });
    dispatch({ type: "START_ROUND", round: r });
  };

  const reveal = () => {
    if (!round) return;
    const t = tally(round, participants);
    dispatch({ type: "REVEAL_ROUND", roundId: round.id, winner: t.spotlightId, guiltyIds: t.loserIds });
  };

  const voters = round ? Object.keys(round.votes) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow flex items-center gap-2">
            <span className="live-dot" /> En vivo · sala {code}
          </p>
          <h2 className="display mt-1 text-2xl sm:text-3xl">La TV es el escenario. Los celulares, el control.</h2>
        </div>
        <Link href="/carrete/tv" className="btn-ghost !min-h-[44px] text-xs">
          <Tv className="w-4 h-4" /> Abrir en la TV
        </Link>
      </div>

      {participants.length < 2 && (
        <p className="flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/[0.07] p-3 text-sm text-amber-100">
          <Users className="w-4 h-4 shrink-0" /> Pídanle a la sala que se una con el código {code} desde sus celulares para votar.
        </p>
      )}

      {/* Selector de juego */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-3">
        {LIVE_GAMES.map((g) => {
          const active = round?.game === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => start(g.id)}
              className={`surface surface-hover flex flex-col p-4 text-left ${active ? "ring-2 ring-indigo-400" : ""}`}
            >
              <span className="flex items-center justify-between">
                <span className="text-3xl">{g.emoji}</span>
                <Play className="w-4 h-4 text-slate-400" />
              </span>
              <span className="mt-3 font-display text-lg font-bold text-white">{g.name}</span>
              <span className="mt-1 text-xs leading-snug text-slate-400">{g.blurb}</span>
              {g.id === "confesion" && <span className="mt-2 text-[11px] font-semibold text-indigo-300">{pendingConfessions} confesiones en espera</span>}
            </button>
          );
        })}
      </div>

      {error && <p className="rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-100">{error}</p>}

      {/* Ronda actual */}
      {round && (
        <section className="surface relative overflow-hidden p-6" aria-live="polite">
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl" aria-hidden />
          <p className="eyebrow relative">
            {LIVE_GAME_BY_ID.get(round.game)?.emoji} {LIVE_GAME_BY_ID.get(round.game)?.name}
          </p>
          <p className="display relative mt-3 text-2xl sm:text-4xl">
            {round.game === "confesion" ? `"${round.prompt}"` : round.prompt}
          </p>
          {round.game === "prefieres" && (
            <p className="relative mt-2 text-lg text-slate-300">
              {round.options[0].label} <span className="text-slate-500">o</span> {round.options[1].label}
            </p>
          )}

          {!round.revealedAt ? (
            <>
              <div className="relative mt-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">
                    Votaron <span className="font-mono font-bold text-white">{voters.length}</span> de {participants.length}
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.06]">
                  <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-500" style={{ width: `${(voters.length / Math.max(1, participants.length)) * 100}%` }} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {participants.map((p) => (
                    <span
                      key={p.id}
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${voters.includes(p.id) ? "bg-emerald-400/20 text-emerald-100" : "bg-white/[0.04] text-slate-500"}`}
                    >
                      {voters.includes(p.id) ? "✓ " : ""}
                      {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="relative mt-6 flex flex-wrap gap-2">
                <button type="button" onClick={reveal} disabled={voters.length === 0} className="btn-primary">
                  <Eye className="w-4 h-4" /> Revelar
                </button>
                <button type="button" onClick={() => dispatch({ type: "END_ROUND", roundId: round.id })} className="btn-ghost">
                  <Square className="w-4 h-4" /> Cancelar
                </button>
              </div>
            </>
          ) : (
            <div className="relative mt-6 space-y-6">
              <RoundResults round={round} participants={participants} />
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => start(round.game)} className="btn-primary">
                  <SkipForward className="w-4 h-4" /> Otra ronda
                </button>
                <button type="button" onClick={() => dispatch({ type: "END_ROUND", roundId: round.id })} className="btn-ghost">
                  Terminar
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
