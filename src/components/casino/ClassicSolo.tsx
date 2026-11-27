"use client";

import React, { useEffect, useState } from "react";
import PartyStage from "@/components/party/PartyStage";
import { CreditMeter } from "@/components/party/CasinoStage";
import SlotLever from "@/components/party/SlotLever";
import { buildPartyRound, resolveParty } from "@/lib/partyGames";
import { audioEffects } from "@/lib/audioEffects";
import type { LiveGame, LiveRound, Participant } from "@/lib/carreteState";

const ME = { id: "yo", name: "Tú" } as Participant;

function freshRound(game: LiveGame): LiveRound {
  const base = { id: `solo-${Date.now()}`, game, startedAt: Date.now(), durationMs: 60_000 };
  return { ...buildPartyRound(game, base, [ME], (xs) => xs[0]), votes: {} } as LiveRound;
}

const LEVER_GAMES = new Set<LiveGame>(["tragamonedas", "tragabar"]);

/**
 * Las máquinas clásicas (tragamonedas, la del bar y el jackpot de la sala) en juego continuo: cada tirada arma una
 * ronda nueva con la misma escena y lógica de la TV; los rodillos giran, frenan y pagan, y se puede tirar otra vez.
 */
export default function ClassicSolo({ game, addCredits, big = false }: { game: LiveGame; addCredits: (delta: number) => void; big?: boolean }) {
  // En la pantalla grande la máquina se ve en su tamaño de salón (el de la TV)
  const [wide, setWide] = useState(false);
  useEffect(() => setWide(big && window.matchMedia("(min-width: 1024px)").matches), [big]);
  const [round, setRound] = useState<LiveRound>(() => freshRound(game));
  const [pending, setPending] = useState<LiveRound>(round);
  const [last, setLast] = useState<{ headline: string; won: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const lever = LEVER_GAMES.has(game);

  const playHand = (value: string) => {
    if (busy) return;
    setBusy(true);
    setWaiting(true);
    const fresh = pending;
    setRound(fresh);
    setPending(freshRound(game));
    audioEffects.playReels(lever ? 1500 : 1200);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        const next = { ...fresh, votes: { [ME.id]: { value, at: Date.now() } }, revealedAt: Date.now() } as LiveRound;
        const res = resolveParty(next, [ME]);
        const won = res.points[ME.id] ?? 0;
        setRound(next);
        // En solitario el titular habla contigo: «¡Ganaste!» en vez de «Gana Tú»
        const headline = res.headline.replace(/(Le )?[Gg]anan? Tú\./, "¡Ganaste!").replace(/: Tú\./, ".").replace(/para Tú/, "para ti");
        window.setTimeout(
          () => {
            setLast({ headline, won });
            setHistory((h) => [won, ...h].slice(0, 10));
            setWaiting(false);
            if (won > 0) {
              addCredits(won);
              audioEffects.playJackpot();
            }
          },
          reduced ? 0 : lever ? 900 : 1200,
        );
        window.setTimeout(() => setBusy(false), reduced ? 0 : lever ? 1300 : 1800);
      },
      reduced ? 0 : lever ? 650 : 60,
    );
  };

  const revealed = !!round.revealedAt;
  return (
    <>
      <div className={`flex items-center justify-center gap-4 ${lever ? "has-lever" : ""}`}>
        <div className={`min-w-0 ${lever ? (wide ? "w-full max-w-2xl" : "w-full max-w-sm") : "flex-1"}`}>
          <PartyStage key={round.id} round={round} participants={[ME]} size={wide ? "tv" : "md"} />
        </div>
        {lever && <SlotLever size="lg" disabled={busy} onPull={() => playHand("tirar")} label={busy ? "Los rodillos están girando" : "Tirar la palanca"} />}
      </div>

      <div className="flex min-h-[4.5rem] flex-col items-center gap-2 text-center">
        <p className="font-display text-lg font-bold text-white" aria-live="polite">
          {waiting ? (lever ? "Girando…" : "Giran las máquinas…") : last ? last.headline : lever ? "Agarra la palanca y tírala hacia abajo." : pending.prompt.replace("en la TV", "aquí")}
        </p>
        {!waiting && revealed && last && last.won > 0 && game === "jackpot" && <CreditMeter key={round.id} value={last.won} tv={false} delay={1400} label="GANASTE" />}
        {history.length > 0 && (
          <ol aria-label={lever ? "Tus últimas tiradas" : "Tus últimas máquinas"} className="flex flex-wrap justify-center gap-1.5">
            {history.map((w, i) => (
              <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-amber-300/15 text-amber-100" : "bg-white/5 text-slate-400"} ${i === 0 ? "animate-fade-in" : ""}`}>
                {w > 0 ? `+${w}` : "0"}
              </li>
            ))}
          </ol>
        )}
      </div>

      {!lever && (
        <div>
          {revealed && <p className="mb-2 text-center text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Otra jugada</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {pending.options.map((o) => (
              <button key={o.id} type="button" disabled={busy} onClick={() => playHand(o.id)} className="btn-ghost !min-h-[48px] justify-center disabled:opacity-50">
                {o.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
