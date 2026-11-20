"use client";

import React from "react";
import CasinoStage from "./CasinoStage";
import type { LiveRound, Participant } from "@/lib/carreteState";
import { cajas, cardLabel, casillaMaldita, cronometroTarget, dados, mayorMenorCards, proximidadNumber, resolveParty, type Card } from "@/lib/partyGames";

/**
 * El escenario de Party Games en la TV (y en la mesa del anfitrión). Antes de revelar muestra lo que está en juego
 * (la carta a la vista, las casillas, las cajas cerradas); al revelar, la animación del azar: la ruleta gira hasta
 * su número, los dados ruedan, la carta se da vuelta, las cajas se abren. Todo con transform y opacity; con
 * movimiento reducido aparece el resultado directo.
 */
export default function PartyStage({ round, participants, size = "md" }: { round: LiveRound; participants: Participant[]; size?: "md" | "tv" }) {
  const tv = size === "tv";
  const revealed = !!round.revealedAt;
  const seed = round.seed ?? 0;
  const scale = tv ? "text-tv-md" : "text-2xl";

  switch (round.game) {
    case "tragamonedas":
    case "tragabar":
    case "jackpot":
    case "ruleta":
    case "blackjack":
      return <CasinoStage round={round} participants={participants} size={size} />;
    case "proximidad":
      return <Wheel n={revealed ? proximidadNumber(seed) : null} tv={tv} />;
    case "dados": {
      const [a, b] = dados(seed);
      return (
        <div className="flex items-center justify-center gap-6 py-4" aria-label={revealed ? `Dados: ${a} y ${b}` : "Dados por lanzar"}>
          <Die value={revealed ? a : null} tv={tv} delay={0} />
          <Die value={revealed ? b : null} tv={tv} delay={120} />
        </div>
      );
    }
    case "mayormenor": {
      const { first, next } = mayorMenorCards(seed);
      return (
        <div className="flex items-center justify-center gap-6 py-4">
          <PlayingCard card={first} tv={tv} />
          <span className={`${scale} text-slate-500`} aria-hidden>
            →
          </span>
          <PlayingCard card={revealed ? next : null} tv={tv} flip={revealed} />
        </div>
      );
    }
    case "casilla": {
      const cursed = revealed ? casillaMaldita(seed) : null;
      const picks = countPicks(round);
      return (
        <div className={`mx-auto grid grid-cols-3 gap-3 py-2 ${tv ? "max-w-[32rem]" : "max-w-[16rem]"}`}>
          {Array.from({ length: 9 }, (_, i) => {
            const id = i + 1;
            const bad = cursed === id;
            return (
              <div
                key={id}
                className={`party-reveal-cell relative grid aspect-square place-items-center rounded-2xl border font-black ${tv ? "text-5xl" : "text-xl"} ${
                  bad ? "border-rose-400/70 bg-rose-500/20 text-rose-100 party-cursed" : cursed ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-100" : "border-white/10 bg-white/[0.04] text-white"
                }`}
                style={cursed ? { animationDelay: `${i * 70}ms` } : undefined}
              >
                {bad ? "💀" : id}
                {picks[id] ? <span className={`absolute -right-1.5 -top-1.5 grid place-items-center rounded-full bg-indigo-500 font-bold text-night-950 ${tv ? "h-9 w-9 text-xl" : "h-5 w-5 text-[11px]"}`}>{picks[id]}</span> : null}
              </div>
            );
          })}
        </div>
      );
    }
    case "cajas": {
      const prizes = revealed ? cajas(seed) : null;
      const picks = countPicks(round);
      return (
        <div className={`mx-auto grid grid-cols-3 gap-3 py-2 ${tv ? "max-w-[44rem]" : "max-w-[20rem]"}`}>
          {Array.from({ length: 6 }, (_, i) => {
            const prize = prizes?.[i];
            return (
              <div key={i} className="party-box relative" style={{ perspective: "600px" }}>
                <div
                  className={`grid aspect-[4/3] place-items-center rounded-2xl border font-black ${tv ? "text-4xl" : "text-lg"} ${
                    !prize ? "border-white/10 bg-white/[0.04] text-white" : prize.points < 0 ? "border-rose-400/60 bg-rose-500/15 text-rose-100" : prize.wild ? "border-purple-300/60 bg-purple-500/20 text-purple-100" : "border-emerald-300/40 bg-emerald-400/10 text-emerald-100"
                  } ${prize ? "party-box-open" : ""}`}
                  style={prize ? { animationDelay: `${i * 110}ms` } : undefined}
                >
                  {prize ? prize.label : <span aria-hidden>🎁</span>}
                </div>
                <span className={`mt-1 block text-center text-slate-400 ${tv ? "text-xl" : "text-xs"}`}>
                  Caja {i + 1}
                  {picks[i + 1] ? ` · ${picks[i + 1]}` : ""}
                </span>
              </div>
            );
          })}
        </div>
      );
    }
    case "cronometro": {
      const target = cronometroTarget(seed);
      return (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className={`grid place-items-center rounded-full border-2 ${revealed ? "border-amber-300/70 party-boom" : "border-white/15 party-bomb-on"} ${tv ? "h-56 w-56 text-8xl" : "h-28 w-28 text-5xl"}`} aria-hidden>
            {revealed ? "💥" : "💣"}
          </div>
          {revealed && <p className={`font-led font-black text-amber-200 ${tv ? "text-tv-lg" : "text-3xl"}`}>{(target / 1000).toLocaleString("es-CL", { minimumFractionDigits: 1 })} s</p>}
        </div>
      );
    }
    case "porcentaje":
    case "mayoria":
    case "reflejos":
    case "ultimo":
    case "mentiroso":
    case "infiltrado": {
      if (!revealed) return null;
      const r = resolveParty(round, participants);
      return <p className={`party-outcome text-center font-led font-black text-indigo-100 neon-blue ${tv ? "text-tv-lg" : "text-3xl"} py-2`}>{r.outcome}</p>;
    }
    default:
      return null;
  }
}

const countPicks = (round: LiveRound) => {
  const out: Record<number, number> = {};
  if (!round.revealedAt) return out; // antes de revelar no se muestra quién eligió qué
  Object.values(round.votes).forEach((v) => {
    const n = Number(v.value);
    if (n) out[n] = (out[n] ?? 0) + 1;
  });
  return out;
};

/** Ruleta 0–100: gira tres vueltas y frena en el número (transform con transición; sin animación en reposo) */
function Wheel({ n, tv }: { n: number | null; tv: boolean }) {
  const size = tv ? 360 : 200;
  const angle = n === null ? 0 : 3 * 360 + (n / 101) * 360;
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 200 200" className="party-wheel h-full w-full" style={{ transform: `rotate(${-angle}deg)` }} aria-hidden>
          <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="2" className="text-white" />
          {Array.from({ length: 101 }, (_, i) => {
            const a = (i / 101) * Math.PI * 2;
            const long = i % 10 === 0;
            const r1 = long ? 80 : 88;
            return (
              <line
                key={i}
                x1={100 + Math.sin(a) * r1}
                y1={100 - Math.cos(a) * r1}
                x2={100 + Math.sin(a) * 95}
                y2={100 - Math.cos(a) * 95}
                stroke={long ? "var(--blue)" : "var(--violet-text)"}
                strokeOpacity={long ? 0.9 : 0.4}
                strokeWidth={long ? 2 : 1}
              />
            );
          })}
          {Array.from({ length: 10 }, (_, k) => {
            const a = ((k * 10) / 101) * Math.PI * 2;
            return (
              <text key={k} x={100 + Math.sin(a) * 66} y={104 - Math.cos(a) * 66} textAnchor="middle" fontSize="10" fill="currentColor" className="text-slate-300 font-mono">
                {k * 10}
              </text>
            );
          })}
        </svg>
        <span className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1 text-2xl text-amber-200" aria-hidden>
          ▼
        </span>
        <span className={`absolute inset-0 grid place-items-center font-led font-black ${n === null ? "text-slate-500" : "party-outcome text-indigo-100 neon-blue"} ${tv ? "text-8xl" : "text-5xl"}`}>
          {n === null ? "?" : n}
        </span>
      </div>
    </div>
  );
}

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

function Die({ value, tv, delay }: { value: number | null; tv: boolean; delay: number }) {
  const s = tv ? 160 : 84;
  return (
    <svg viewBox="0 0 100 100" width={s} height={s} className={value ? "party-die-roll" : "party-die-idle"} style={{ animationDelay: `${delay}ms` }} aria-hidden>
      <rect x="4" y="4" width="92" height="92" rx="18" fill="rgba(103,170,255,0.08)" stroke="var(--blue)" strokeWidth="3" />
      {value ? PIPS[value].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" fill="var(--violet-text)" />) : <text x="50" y="64" textAnchor="middle" fontSize="44" fill="currentColor" className="text-slate-400">?</text>}
    </svg>
  );
}

function PlayingCard({ card, tv, flip }: { card: Card | null; tv: boolean; flip?: boolean }) {
  const red = card && (card.suit === "♥" || card.suit === "♦");
  return (
    <div className={`${flip ? "party-card-flip" : ""}`} style={{ perspective: "800px" }}>
      <div
        className={`grid place-items-center rounded-2xl border-2 font-black ${tv ? "h-64 w-44 text-7xl" : "h-32 w-24 text-3xl"} ${
          card ? "border-white/70 bg-slate-100 text-night-950" : "border-indigo-400/50 bg-[repeating-linear-gradient(45deg,rgba(103,170,255,0.18)_0_8px,rgba(185,62,243,0.18)_8px_16px)] text-transparent"
        }`}
        aria-label={card ? cardLabel(card) : "Carta boca abajo"}
      >
        {card && <span className={red ? "text-rose-600" : "text-night-950"}>{cardLabel(card)}</span>}
      </div>
    </div>
  );
}
