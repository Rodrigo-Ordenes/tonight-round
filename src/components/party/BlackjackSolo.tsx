"use client";

import React, { useMemo, useState } from "react";
import { BlackjackTable, bjRevealDuration } from "@/components/party/CasinoTables";
import { bjCanDouble, bjDealerHand, bjPlayerHand, blackjackOutcome, isNatural } from "@/lib/casinoGames";
import { audioEffects } from "@/lib/audioEffects";

const FICHAS = [5, 10, 25, 50] as const;
/** Si los créditos no alcanzan para la apuesta, la casa presta (son puntos, nunca plata) */
const PRESTAMO = 100;

/**
 * Blackjack en este computador, como en la mesa: eliges la ficha, el host reparte, y en cada momento decides pedir
 * carta, plantarte o doblar (doblar pone otra ficha igual y recibes una sola carta). Cuando terminas, el host da
 * vuelta su carta y pide hasta 17; la mesa paga: blackjack 3 a 2, mano ganada 1 a 1, empate devuelve la ficha.
 * Sesión continua: apenas se paga, se reparte la siguiente.
 */
export default function BlackjackSolo({ credits, addCredits }: { credits: number; addCredits: (delta: number) => void }) {
  const [bet, setBet] = useState<number>(10);
  /** La ficha de la mano en juego (la del selector puede cambiar para la siguiente) */
  const [handBet, setHandBet] = useState(10);
  const [seed, setSeed] = useState<number | null>(null);
  const [actions, setActions] = useState("");
  const [closing, setClosing] = useState(false);
  const [paid, setPaid] = useState(true);
  const [history, setHistory] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);

  const hand = seed === null ? null : bjPlayerHand(seed, "yo", actions);
  const dealer = useMemo(() => (seed === null ? [] : bjDealerHand(seed)), [seed]);
  const playing = hand?.status === "jugando" && !closing;

  /** Cierra la mano: el host juega y, al terminar su animación, la mesa paga */
  const close = (s: number, acts: string, base: number) => {
    setClosing(true);
    const h = bjPlayerHand(s, "yo", acts);
    const d = bjDealerHand(s);
    const o = blackjackOutcome(h.cards, d, h.doubled);
    const stake = base * (h.doubled ? 2 : 1);
    const payout = o.win ? (isNatural(h.cards) && !isNatural(d) ? Math.round(stake * 2.5) : stake * 2) : o.lose ? 0 : stake;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => {
      if (payout) addCredits(payout);
      if (o.win) audioEffects.playJackpot();
      setHistory((x) => [payout - stake, ...x].slice(0, 12));
      setPaid(true);
    }, reduced ? 0 : bjRevealDuration(d));
  };

  const deal = () => {
    if (!paid) return;
    setNote(null);
    if (credits < bet) {
      addCredits(PRESTAMO);
      setNote(`La casa te prestó ${PRESTAMO} créditos.`);
    }
    addCredits(-bet);
    setHandBet(bet);
    const s = (Math.random() * 2 ** 32) >>> 0;
    setSeed(s);
    setActions("");
    setClosing(false);
    setPaid(false);
    audioEffects.playTick(520, 0.05);
    // Blackjack natural: no hay nada que decidir, la mesa cierra sola después del reparto
    if (bjPlayerHand(s, "yo", "").status !== "jugando") window.setTimeout(() => close(s, "", bet), 1800);
  };

  const act = (a: "p" | "m" | "d") => {
    if (seed === null || !playing) return;
    if (a === "d") {
      if (credits < handBet) {
        addCredits(PRESTAMO);
        setNote(`La casa te prestó ${PRESTAMO} créditos para doblar.`);
      }
      addCredits(-handBet);
    }
    audioEffects.playTick(a === "m" ? 300 : 620, 0.05);
    const next = actions + a;
    setActions(next);
    if (bjPlayerHand(seed, "yo", next).status !== "jugando") window.setTimeout(() => close(seed, next, handBet), a === "m" ? 200 : 700);
  };

  return (
    <div className="space-y-4">
      {seed === null ? (
        <BlackjackTable key="vacia" dealer={[]} hands={[]} revealed={false} tv={false} />
      ) : (
        <BlackjackTable key={seed} dealer={dealer} hands={[{ id: "yo", name: "Tú", cards: hand!.cards, doubled: hand!.doubled, status: hand!.status }]} revealed={closing} tv={false} bet={handBet} />
      )}

      {playing ? (
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <button type="button" onClick={() => act("p")} className="machine-btn machine-btn-go">
            <span className="font-display text-base font-black">Pedir carta</span>
          </button>
          <button type="button" onClick={() => act("m")} className="machine-btn">
            <span className="font-display text-base font-black">Plantarme</span>
          </button>
          <button type="button" disabled={!bjCanDouble(hand!.cards, hand!.status)} onClick={() => act("d")} className="machine-btn">
            <span className="font-display text-base font-black">Doblar</span>
            <span className="font-led text-[0.6rem] tracking-[0.16em] opacity-80">+{handBet}</span>
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div role="radiogroup" aria-label="Ficha de apuesta" className="flex gap-2">
            {FICHAS.map((f) => (
              <button
                key={f}
                type="button"
                role="radio"
                aria-checked={bet === f}
                disabled={!paid}
                onClick={() => setBet(f)}
                className={`casino-chip grid h-14 w-14 place-items-center rounded-full font-led text-sm font-black text-white transition-transform duration-150 ${f >= 50 ? "casino-chip-oro" : f >= 25 ? "casino-chip-morado" : "casino-chip-azul"} ${bet === f ? "-translate-y-1.5 ring-2 ring-white" : "opacity-80"}`}
              >
                <span className="rounded-full bg-night-950/70 px-1.5">{f}</span>
              </button>
            ))}
          </div>
          <button type="button" disabled={!paid} onClick={deal} className="btn-primary !min-h-[48px] px-8 disabled:opacity-50">
            {seed === null ? "Repartir" : "Repartir otra mano"} · {bet}
          </button>
        </div>
      )}

      <div className="flex min-h-[2rem] flex-col items-center gap-2 text-center">
        {note && <p className="text-sm font-semibold text-emerald-200">{note}</p>}
        {history.length > 0 && (
          <ol aria-label="Tus últimas manos" className="flex flex-wrap justify-center gap-1.5">
            {history.map((w, i) => (
              <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-amber-300/15 text-amber-100" : w === 0 ? "bg-white/10 text-slate-200" : "bg-white/5 text-slate-400"}`}>
                {w > 0 ? `+${w}` : w}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
