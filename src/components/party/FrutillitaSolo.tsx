"use client";

import React, { useRef, useState } from "react";
import FrutillitaMachine from "@/components/party/FrutillitaMachine";
import SlotLever from "@/components/party/SlotLever";
import { BET_OPTIONS, LINE_OPTIONS, frutillitaSpin, type FrutillitaResult } from "@/lib/frutillita";
import { audioEffects } from "@/lib/audioEffects";

/** Si los créditos no alcanzan para la apuesta, la casa presta (son puntos, nunca plata) */
const PRESTAMO = 100;

/**
 * La Frutillita en este computador, como la máquina del local: eliges cuántas líneas juegan y cuánto por línea con los
 * botones del gabinete, la apuesta se descuenta de los créditos, tiras la palanca (o «Tirar») y lo ganado entra al
 * final de la animación, La vuelta incluida. Juego continuo: apenas termina, se puede tirar otra vez.
 */
export default function FrutillitaSolo({ credits, addCredits }: { credits: number; addCredits: (delta: number) => void }) {
  const [lines, setLines] = useState<number>(9);
  const [bet, setBet] = useState<number>(1);
  const [result, setResult] = useState<FrutillitaResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);
  /** La tirada en curso: se cobra cuando la máquina avisa que terminó (rodillos, líneas y La vuelta) */
  const pending = useRef<FrutillitaResult | null>(null);
  const settle = () => {
    const r = pending.current;
    if (!r) return;
    pending.current = null;
    if (r.win > 0) {
      addCredits(r.win);
      audioEffects.playJackpot();
    }
    setHistory((h) => [r.win, ...h].slice(0, 10));
    setBusy(false);
  };
  const cost = lines * bet;

  const cycle = <T extends number>(opts: readonly T[], cur: T) => opts[(opts.indexOf(cur) + 1) % opts.length];

  const pull = () => {
    if (busy) return;
    setBusy(true);
    setNote(null);
    if (credits < cost) {
      addCredits(PRESTAMO);
      setNote(`La casa te prestó ${PRESTAMO} créditos.`);
    }
    addCredits(-cost);
    setSpinning(true);
    setResult(null);
    audioEffects.playReels(1500);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(
      () => {
        const r = frutillitaSpin((Math.random() * 2 ** 32) >>> 0, "yo", lines, bet);
        pending.current = r;
        setResult(r);
        setSpinning(false);
      },
      reduced ? 0 : 300,
    );
  };

  return (
    <div className="space-y-4">
      <div className="has-lever flex items-center justify-center gap-3">
        <div className="min-w-0 flex-1">
          <FrutillitaMachine result={result} spinning={spinning} credits={credits} onDone={settle} />
        </div>
        <SlotLever size="lg" disabled={busy} onPull={pull} label={busy ? "Los rodillos están girando" : "Tirar la palanca"} />
      </div>

      {/* Botonera del gabinete */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" disabled={busy} onClick={() => setLines((l) => cycle(LINE_OPTIONS, l as (typeof LINE_OPTIONS)[number]))} className="machine-btn" aria-label={`Líneas: ${lines}. Cambiar`}>
          <span className="font-led text-[0.6rem] tracking-[0.18em] opacity-80">LÍNEAS</span>
          <span className="font-led text-lg font-black">{lines}</span>
        </button>
        <button type="button" disabled={busy} onClick={() => setBet((b) => cycle(BET_OPTIONS, b as (typeof BET_OPTIONS)[number]))} className="machine-btn" aria-label={`Apuesta por línea: ${bet}. Cambiar`}>
          <span className="font-led text-[0.6rem] tracking-[0.18em] opacity-80">POR LÍNEA</span>
          <span className="font-led text-lg font-black">{bet}</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            setLines(9);
            setBet(BET_OPTIONS[BET_OPTIONS.length - 1]);
          }}
          className="machine-btn"
        >
          <span className="font-led text-[0.6rem] tracking-[0.18em] opacity-80">APUESTA</span>
          <span className="font-led text-lg font-black">MÁX</span>
        </button>
        <button type="button" disabled={busy} onClick={pull} className="machine-btn machine-btn-go">
          <span className="font-led text-[0.6rem] tracking-[0.18em] opacity-80">{cost} CRÉDITOS</span>
          <span className="font-display text-lg font-black">Tirar</span>
        </button>
      </div>

      <div className="flex min-h-[2rem] flex-col items-center gap-2 text-center">
        {note && <p className="text-sm font-semibold text-emerald-200">{note}</p>}
        {history.length > 0 && (
          <ol aria-label="Tus últimas tiradas" className="flex flex-wrap justify-center gap-1.5">
            {history.map((w, i) => (
              <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-amber-300/15 text-amber-100" : "bg-white/5 text-slate-400"}`}>
                {w > 0 ? `+${w}` : "0"}
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
