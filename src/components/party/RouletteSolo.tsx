"use client";

import React, { useEffect, useState } from "react";
import { RouletteBoard, RouletteFelt, RouletteWheel } from "@/components/party/CasinoTables";
import { rouletteBet, rouletteNumber, rouletteWins } from "@/lib/casinoGames";
import { audioEffects } from "@/lib/audioEffects";

const FICHAS = [5, 10, 25, 50] as const;
const PRESTAMO = 100;
/** Lo que tarda la bola en caer (igual que la animación de la rueda) */
const SPIN_MS = 5600;

/**
 * La ruleta en este computador, como en la mesa: eliges la ficha, la pones en el paño (plenos 35 a 1, docenas 2 a 1,
 * color, par o impar 1 a 1; varias apuestas a la vez), «Girar», y al caer la bola la mesa paga lo que acertó y recoge
 * el resto. «Repetir apuesta» vuelve a poner las mismas fichas. Solo créditos de puntos, nunca plata.
 */
export default function RouletteSolo({ credits, addCredits }: { credits: number; addCredits: (delta: number) => void }) {
  const [chip, setChip] = useState<number>(10);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [last, setLast] = useState<Record<string, number>>({});
  const [spin, setSpin] = useState<{ id: number; n: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [vertical, setVertical] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setVertical(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);

  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  const place = (id: string) => {
    if (busy) return;
    audioEffects.playTick(1200, 0.02);
    setBets((b) => ({ ...b, [id]: (b[id] ?? 0) + chip }));
  };

  const go = () => {
    if (busy || !total) return;
    setBusy(true);
    setNote(null);
    if (credits < total) {
      addCredits(PRESTAMO * Math.ceil((total - credits) / PRESTAMO));
      setNote("La casa te prestó créditos para cubrir la apuesta.");
    }
    addCredits(-total);
    const n = rouletteNumber((Math.random() * 2 ** 32) >>> 0);
    const placed = bets;
    setSpin({ id: Date.now(), n });
    audioEffects.playReels(1200);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      const payout = Object.entries(placed).reduce((a, [id, amount]) => {
        const b = rouletteBet(id === "cero" ? "n0" : id);
        return b && rouletteWins(b.id, n) ? a + amount * (b.odds + 1) : a;
      }, 0);
      if (payout) {
        addCredits(payout);
        audioEffects.playJackpot();
      }
      setHistory((h) => [payout - total, ...h].slice(0, 12));
      setNumbers((xs) => [n, ...xs].slice(0, 12));
      setLast(placed);
      setBets({});
      setBusy(false);
    }, reduced ? 0 : SPIN_MS);
  };

  return (
    <div className="space-y-4">
      <RouletteWheel key={spin?.id ?? "quieta"} n={spin?.n ?? null} tv={false} />
      <RouletteBoard numbers={numbers} />
      <RouletteFelt
        vertical={vertical}
        chips={Object.entries(busy && spin ? bets : bets).map(([id, amount]) => ({ id, tag: "●", amount }))}
        n={busy ? spin?.n ?? null : null}
        onBet={place}
        disabled={busy}
      />

      <div className="flex flex-wrap items-center justify-center gap-3">
        <div role="radiogroup" aria-label="Ficha" className="flex gap-2">
          {FICHAS.map((f) => (
            <button
              key={f}
              type="button"
              role="radio"
              aria-checked={chip === f}
              onClick={() => setChip(f)}
              className={`casino-chip grid h-12 w-12 place-items-center rounded-full font-led text-xs font-black text-white transition-transform duration-150 ${f >= 50 ? "casino-chip-oro" : f >= 25 ? "casino-chip-morado" : "casino-chip-azul"} ${chip === f ? "-translate-y-1.5 ring-2 ring-white" : "opacity-80"}`}
            >
              <span className="rounded-full bg-night-950/70 px-1">{f}</span>
            </button>
          ))}
        </div>
        <button type="button" disabled={busy || !total} onClick={() => setBets({})} className="machine-btn">
          <span className="font-display text-sm font-black">Borrar</span>
        </button>
        <button type="button" disabled={busy || !Object.keys(last).length} onClick={() => setBets(last)} className="machine-btn">
          <span className="font-display text-sm font-black">Repetir apuesta</span>
        </button>
        <button type="button" disabled={busy || !total} onClick={go} className="machine-btn machine-btn-go">
          <span className="font-led text-[0.6rem] tracking-[0.16em] opacity-80">{total} CRÉDITOS</span>
          <span className="font-display text-lg font-black">Girar</span>
        </button>
      </div>

      <div className="flex min-h-[2rem] flex-col items-center gap-2 text-center" aria-live="polite">
        <p className="text-sm text-slate-300">{busy ? "No va más. La bola gira…" : total ? "Hagan su juego." : "Elige una ficha y tócala en el paño."}</p>
        {note && <p className="text-sm font-semibold text-emerald-200">{note}</p>}
        {history.length > 0 && (
          <ol aria-label="Tus últimas bolas" className="flex flex-wrap justify-center gap-1.5">
            {history.map((w, i) => (
              <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-amber-300/15 text-amber-100" : "bg-white/5 text-slate-400"}`}>
                {w > 0 ? `+${w}` : w}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
