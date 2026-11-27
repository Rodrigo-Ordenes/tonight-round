"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import MesaShell from "./MesaShell";
import { ChipRack, type Denom } from "./CasinoChip";
import { WHEEL_SPIN_MS } from "./tiempos";
import { RouletteBoard, RouletteFelt, RouletteWheel } from "@/components/party/CasinoTables";
import { rouletteBet, rouletteColor, rouletteNumber, rouletteWins } from "@/lib/casinoGames";
import { sfx } from "@/components/rooms/sfx";
import { audioEffects } from "@/lib/audioEffects";

// La rueda en 3D se carga aparte (three.js) y solo en el navegador
const Wheel3D = dynamic(() => import("./Wheel3D"), { ssr: false, loading: () => <div className="aspect-square w-full" /> });

const PRESTAMO = 100;
const hasWebGL = () => {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
};

/**
 * La ruleta de casino: la rueda en 3D a un lado (cilindro de madera, trastes de oro, bola de marfil que rueda, frena y
 * salta hasta caer) y el paño al otro, con la bandeja de fichas. El crupier canta «Hagan sus apuestas», «No va más» y el
 * número; la mesa paga lo que acertó (pleno 35 a 1, docena 2 a 1, color, par o impar 1 a 1) y recoge el resto.
 * «Repetir apuesta» vuelve a poner las mismas fichas. Solo puntos.
 */
export default function RuletaMesa({ credits, addCredits }: { credits: number; addCredits: (delta: number) => void }) {
  const [chip, setChip] = useState<Denom>(10);
  const [bets, setBets] = useState<Record<string, number>>({});
  const [last, setLast] = useState<Record<string, number>>({});
  const [spin, setSpin] = useState<{ id: number; n: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ n: number; won: number } | null>(null);
  const [numbers, setNumbers] = useState<number[]>([]);
  const [history, setHistory] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [vertical, setVertical] = useState(false);
  const [three, setThree] = useState(false);
  const wheelBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const set = () => setVertical(mq.matches);
    set();
    mq.addEventListener("change", set);
    setThree(hasWebGL() && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    return () => mq.removeEventListener("change", set);
  }, []);

  const total = Object.values(bets).reduce((a, b) => a + b, 0);
  const place = (id: string) => {
    if (busy) return;
    sfx.chip();
    setResult(null);
    setBets((b) => ({ ...b, [id]: (b[id] ?? 0) + chip }));
  };

  const go = () => {
    if (busy || !total) return;
    setBusy(true);
    setNote(null);
    setResult(null);
    if (credits < total) {
      addCredits(PRESTAMO * Math.ceil((total - credits) / PRESTAMO));
      setNote("La casa te prestó créditos para cubrir la apuesta.");
    }
    addCredits(-total);
    const n = rouletteNumber((Math.random() * 2 ** 32) >>> 0);
    const placed = bets;
    setSpin({ id: Date.now(), n });
    // En el celular el paño queda abajo: al girar, la vista sube a la rueda para ver caer la bola
    if (vertical) wheelBox.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) sfx.ball(WHEEL_SPIN_MS / 1000);
    window.setTimeout(
      () => {
        const payout = Object.entries(placed).reduce((a, [id, amount]) => {
          const b = rouletteBet(id === "cero" ? "n0" : id);
          return b && rouletteWins(b.id, n) ? a + amount * (b.odds + 1) : a;
        }, 0);
        if (payout) {
          addCredits(payout);
          audioEffects.playJackpot();
          sfx.chips(6);
        }
        setResult({ n, won: payout });
        setHistory((h) => [payout - total, ...h].slice(0, 12));
        setNumbers((xs) => [n, ...xs].slice(0, 12));
        setLast(placed);
        setBets({});
        setBusy(false);
      },
      reduced ? 0 : WHEEL_SPIN_MS + 200,
    );
  };

  const lines = busy
    ? ["No va más.", "La bola gira…"]
    : result
      ? [`Salió el ${result.n}, ${rouletteColor(result.n)}. ${result.won ? `Le pago ${result.won} créditos.` : "La casa recoge."}`, "¿Repetimos la apuesta?"]
      : total
        ? [`${total} créditos en el paño. ¿Algo más?`, "Cuando quiera: «Girar»."]
        : ["Hagan sus apuestas: elija la ficha y tóquela en el paño.", "Pleno paga 35 a 1; docena 2 a 1; color, par o impar 1 a 1."];

  return (
    <MesaShell id="ruleta" title="La ruleta" credits={credits} lines={lines}>
      <div className="mt-2 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        {/* La rueda */}
        <div className="flex flex-col items-center gap-3">
          <div ref={wheelBox} className="ruleta-mesa-wheel relative aspect-square w-full max-w-[19rem] sm:max-w-[30rem]">
            {three ? <Wheel3D spin={spin} small={vertical} /> : <RouletteWheel key={spin?.id ?? "quieta"} n={spin?.n ?? null} tv={false} />}
          </div>
          <RouletteBoard numbers={numbers} />
        </div>
        {/* El paño y las fichas */}
        <div className="flex flex-col items-center gap-4">
          <RouletteFelt vertical={vertical} chips={Object.entries(bets).map(([id, amount]) => ({ id, tag: "●", amount }))} n={!busy && result ? result.n : null} onBet={place} disabled={busy} />
          <ChipRack onPick={(d) => setChip(d)} selected={chip} disabled={busy} label="Ficha para el paño" />
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button type="button" disabled={busy || !total} onClick={() => setBets({})} className="casino-btn !min-w-0 px-5">
              Borrar
            </button>
            <button type="button" disabled={busy || !Object.keys(last).length} onClick={() => setBets(last)} className="casino-btn">
              Repetir apuesta
            </button>
            <button type="button" disabled={busy || !total} onClick={go} className="casino-btn casino-btn-gold px-8">
              Girar <span className="block font-led text-[0.6rem] tracking-[0.16em] opacity-80">{total} CRÉDITOS</span>
            </button>
          </div>
          <div className="flex min-h-[2rem] flex-col items-center gap-2 text-center" aria-live="polite">
            <p className="text-sm text-[#F5F0E6]/80">{busy ? "No va más. La bola gira…" : total ? "Hagan su juego." : "Elige una ficha y tócala en el paño."}</p>
            {note && <p className="text-sm font-semibold text-[#F7E3A1]">{note}</p>}
            {history.length > 0 && (
              <ol aria-label="Tus últimas bolas" className="flex flex-wrap justify-center gap-1.5">
                {history.map((w, i) => (
                  <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-[#D4AF37]/20 text-[#F7E3A1]" : "bg-white/5 text-slate-400"}`}>
                    {w > 0 ? `+${w}` : w}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </MesaShell>
  );
}
