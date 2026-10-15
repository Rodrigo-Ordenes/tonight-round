"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Send } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { uid } from "@/store/useCarreteStore";
import { LIVE_GAME_BY_ID, penaltyFor, tally } from "@/lib/liveGames";
import { audioEffects } from "@/lib/audioEffects";
import RoundResults from "./RoundResults";

/**
 * Mando del celular: vota en la ronda activa (en secreto) y manda confesiones anónimas.
 * Vibra al empezar una ronda y al revelar si te toca cumplir.
 */
export default function LiveRoundCard({ store, compact = false }: { store: CarreteStore; compact?: boolean }) {
  const { state, participants, meId, dispatch } = store;
  const round = state.live?.round ?? null;
  const me = participants.find((p) => p.id === meId) ?? null;
  const [confession, setConfession] = useState("");
  const [sent, setSent] = useState(false);
  const seenRound = useRef<string | null>(null);
  const seenReveal = useRef<string | null>(null);

  // Háptica y sonido al empezar / revelar
  useEffect(() => {
    if (!round) return;
    if (seenRound.current !== round.id) {
      if (seenRound.current !== null) {
        audioEffects.triggerHaptic([60, 40, 60]);
        audioEffects.playTick(880, 0.06);
      }
      seenRound.current = round.id;
    }
    if (round.revealedAt && seenReveal.current !== round.id) {
      seenReveal.current = round.id;
      const lost = me && tally(round, participants).loserIds.includes(me.id);
      if (lost) audioEffects.triggerHaptic([200, 80, 200]);
    }
  }, [round, me, participants]);

  if (!me) return null;

  const myVote = round?.votes[me.id]?.value;
  const isImpostor = round?.game === "impostor" && round.answer === me.id;

  const vote = (value: string) => {
    if (!round || round.revealedAt) return;
    audioEffects.playPop();
    audioEffects.triggerHaptic(20);
    dispatch({ type: "VOTE", roundId: round.id, participantId: me.id, value });
  };

  const sendConfession = () => {
    const text = confession.trim();
    if (text.length < 8) return;
    dispatch({ type: "SUBMIT_CONFESSION", confession: { id: uid(), authorId: me.id, text, at: Date.now() } });
    audioEffects.playSuccessChime();
    setConfession("");
    setSent(true);
    setTimeout(() => setSent(false), 2500);
  };

  return (
    <div className="space-y-4">
      {round ? (
        <section className="surface relative overflow-hidden p-5" aria-live="polite">
          <span className="absolute -left-16 -top-16 h-40 w-40 rounded-full bg-indigo-500/25 blur-3xl" aria-hidden />
          <p className="eyebrow relative flex items-center gap-2">
            <span className="live-dot" /> {LIVE_GAME_BY_ID.get(round.game)?.emoji} {LIVE_GAME_BY_ID.get(round.game)?.name}
          </p>

          {round.game === "impostor" && !round.revealedAt && (
            <div
              className={`relative mt-3 rounded-2xl border p-4 text-center ${
                isImpostor ? "border-rose-500/50 bg-rose-500/10" : "border-emerald-400/40 bg-emerald-400/10"
              }`}
            >
              <p className="eyebrow">{isImpostor ? "Tu rol" : "Palabra secreta"}</p>
              <p className="display mt-1 text-3xl">{isImpostor ? "Eres el impostor 🤫" : round.secret}</p>
              {isImpostor && <p className="mt-1 text-xs text-rose-100">Disimula: escucha a los demás e improvisa.</p>}
            </div>
          )}

          <p className={`display relative mt-3 ${compact ? "text-lg" : "text-2xl"}`}>
            {round.game === "confesion" ? `"${round.prompt}"` : round.prompt}
          </p>

          {!round.revealedAt ? (
            <div className={`relative mt-4 grid gap-2 ${round.options.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
              {round.options
                // En El Impostor y Confesiones no puedes votarte a ti mismo
                .filter((o) => !((round.game === "impostor" || round.game === "confesion") && o.id === me.id))
                .map((o) => {
                  const on = myVote === o.id;
                  return (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => vote(o.id)}
                      aria-pressed={on}
                      className={`min-h-[56px] rounded-2xl border px-4 text-left text-base font-bold transition-all active:scale-[0.98] ${
                        on ? "border-indigo-300 bg-indigo-500 text-night-950" : "border-white/10 bg-white/[0.04] text-white hover:border-white/25"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        {o.label}
                        {on && <Check className="w-5 h-5" />}
                      </span>
                    </button>
                  );
                })}
              <p className="col-span-full text-center text-xs text-slate-400">
                {myVote ? "Voto en secreto ✓ · puedes cambiarlo hasta que revelen" : "Tu voto es secreto"}
              </p>
            </div>
          ) : (
            <div className="relative mt-4 space-y-3">
              {tally(round, participants).loserIds.includes(me.id) ? (
                <p className="rounded-2xl border border-indigo-400/40 bg-indigo-500/15 p-3 text-center font-display text-lg font-bold text-white">
                  Te toca: {penaltyFor(me, round.id).text}
                </p>
              ) : (
                <p className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-center text-sm font-bold text-emerald-100">Te salvaste esta ronda 😎</p>
              )}
              {!compact && <RoundResults round={round} participants={participants} meId={me.id} />}
            </div>
          )}
        </section>
      ) : (
        !compact && (
          <section className="rounded-3xl border border-dashed border-white/10 p-5 text-center text-sm text-slate-400">
            Cuando la TV lance un juego, vas a votar desde aquí.
          </section>
        )
      )}

      {/* Confesión anónima */}
      {!compact && (
        <section className="surface p-5">
          <p className="eyebrow">🤫 Confesión anónima</p>
          <p className="mt-1 text-xs text-slate-400">Escríbela en primera persona. La TV la mostrará sin tu nombre y el grupo tendrá que adivinar.</p>
          <div className="mt-3 flex gap-2">
            <input
              value={confession}
              onChange={(e) => setConfession(e.target.value.slice(0, 140))}
              onKeyDown={(e) => e.key === "Enter" && sendConfession()}
              placeholder="Una vez me quedé dormido en…"
              aria-label="Confesión anónima"
              className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
            />
            <button type="button" onClick={sendConfession} disabled={confession.trim().length < 8} className="btn-primary !px-4" aria-label="Enviar confesión">
              {sent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
