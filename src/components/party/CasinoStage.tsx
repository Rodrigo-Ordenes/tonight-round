"use client";

import React, { useEffect, useState } from "react";
import type { LiveRound, Participant } from "@/lib/carreteState";
import { cardLabel, type Card } from "@/lib/partyGames";
import {
  WHEEL_ORDER,
  blackjackDeal,
  handValue,
  jackpotMachines,
  rouletteColor,
  rouletteNumber,
  slotPayout,
  slotSpin,
  type SlotKind,
  type SlotSymbol,
} from "@/lib/casinoGames";
import { BrandMark } from "@/components/shell/AppShell";
import { FOTOS_TRAGOS } from "@/data/fotosTragos";
import { FOTOS_INTRO } from "@/data/fotosEscena";

/**
 * Escenario de los juegos de casino (solo puntos): tragamonedas con el logo de Tonight, el jackpot de la sala, la
 * ruleta europea y el blackjack contra el host. Lo que se ve sale de la semilla de la ronda, igual en la TV y en
 * cada celular. Con movimiento reducido no hay giros: aparece el resultado.
 */
export default function CasinoStage({ round, participants, size = "md" }: { round: LiveRound; participants: Participant[]; size?: "md" | "tv" }) {
  const tv = size === "tv";
  const revealed = !!round.revealedAt;
  const seed = round.seed ?? 0;
  const voters = participants.filter((p) => !p.deleted && round.votes[p.id]);
  const name = (id: string) => participants.find((p) => p.id === id)?.name ?? "alguien";

  switch (round.game) {
    case "tragamonedas":
    case "tragabar": {
      const kind: SlotKind = round.game === "tragabar" ? "bar" : "clasica";
      // En la máquina grande se ve la mejor tirada de la ronda
      const best = voters
        .map((p) => ({ id: p.id, reels: slotSpin(seed, p.id, kind) }))
        .map((x) => ({ ...x, pay: slotPayout(x.reels, kind) }))
        .sort((a, b) => b.pay.points - a.pay.points)[0];
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <SlotMachine reels={revealed && best ? best.reels : null} kind={kind} tv={tv} />
          <p className={`${tv ? "text-tv-sm" : "text-sm"} text-center font-semibold text-slate-200`} aria-live="polite">
            {revealed ? (best ? `La mejor tirada: ${name(best.id)} · ${best.pay.label}` : "Nadie tiró la palanca") : `${voters.length} ${voters.length === 1 ? "palanca tirada" : "palancas tiradas"}`}
          </p>
        </div>
      );
    }
    case "jackpot": {
      const machines = jackpotMachines(seed);
      return (
        <div className={`grid grid-cols-3 items-end py-2 ${tv ? "gap-8" : "gap-2"}`}>
          {machines.map((m) => {
            const who = voters.filter((p) => round.votes[p.id]?.value === m.machine).map((p) => p.name);
            const reels = revealed ? jackpotReels(m.points) : null;
            return (
              <div key={m.machine} className={`flex flex-col items-center gap-2 ${revealed && m.points === 25 ? "jackpot-win" : ""}`}>
                <SlotMachine reels={reels} kind="clasica" tv={tv} compact label={`Máquina ${m.machine}`} />
                <p className={`${tv ? "text-tv-sm" : "text-xs"} min-h-[1.5em] text-center text-slate-300`}>
                  {revealed ? (m.points === 25 ? "¡Pagó el pozo!" : m.points ? "Premio chico" : "Sin premio") : who.length ? who.join(", ") : "Libre"}
                </p>
              </div>
            );
          })}
        </div>
      );
    }
    case "ruleta":
      return <RouletteWheel n={revealed ? rouletteNumber(seed) : null} tv={tv} />;
    case "blackjack": {
      const plans = voters.map((p) => ({ id: p.id, stand: Number(round.votes[p.id]?.value) || 17 }));
      const { dealer, hands } = blackjackDeal(seed, plans);
      return <BlackjackTable dealer={dealer} hands={plans.map((p) => ({ name: name(p.id), cards: hands[p.id] }))} revealed={revealed} tv={tv} />;
    }
    default:
      return null;
  }
}

/** Rodillos para mostrar en el jackpot de la sala según lo que pagó cada máquina */
function jackpotReels(points: number): SlotSymbol[] {
  const s = (id: string, label: string) => ({ id, label, weight: 1 });
  if (points === 25) return [s("logo", "TONIGHT"), s("logo", "TONIGHT"), s("logo", "TONIGHT")];
  if (points) return [s("siete", "7"), s("siete", "7"), s("uva", "🍇")];
  return [s("campana", "🔔"), s("estrella", "★"), s("uva", "🍇")];
}

/** Lo que va en una ventana del rodillo: el logo dibujado, la foto real del trago o el símbolo */
function ReelSymbol({ s, kind, tv }: { s: SlotSymbol; kind: SlotKind; tv: boolean }) {
  if (s.id === "logo") return <BrandMark className={`neon-electric ${tv ? "h-20 w-20" : "h-10 w-10"}`} />;
  if (kind === "bar") {
    const photo = s.id === "agua" ? FOTOS_INTRO.agua?.lleno : FOTOS_TRAGOS[s.id]?.src;
    // eslint-disable-next-line @next/next/no-img-element
    if (photo) return <img src={photo} alt={s.label} className={`${tv ? "h-28" : "h-14"} w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]`} />;
  }
  if (s.id === "siete") return <span className={`font-display font-black text-purple-200 [text-shadow:0_0_14px_rgba(185,62,243,0.8)] ${tv ? "text-8xl" : "text-4xl"}`}>7</span>;
  return <span className={`${tv ? "text-7xl" : "text-3xl"} text-indigo-100`}>{s.label}</span>;
}

/** Gabinete de tragamonedas: marquesina con el logo, tres ventanas de rodillo y la palanca */
function SlotMachine({ reels, kind, tv, compact, label }: { reels: SlotSymbol[] | null; kind: SlotKind; tv: boolean; compact?: boolean; label?: string }) {
  const win = (tv ? "h-36 w-32" : "h-[4.5rem] w-16") + (compact ? " scale-[0.85]" : "");
  return (
    <div className="relative">
      <div className="slot-cabinet relative rounded-[22px] border border-white/15 p-3 pt-2 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9)]">
        <div className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 bg-night-950/90 px-3 py-1.5 shadow-neon">
          <BrandMark className={`neon-electric ${tv ? "h-8 w-8" : "h-5 w-5"}`} />
          <span className={`font-led font-bold tracking-[0.2em] text-indigo-100 ${tv ? "text-tv-sm" : "text-xs"}`}>{label ?? (kind === "bar" ? "BAR TONIGHT" : "TONIGHT")}</span>
        </div>
        <div className="flex gap-2 rounded-xl bg-night-950 p-2 shadow-[inset_0_6px_16px_rgba(0,0,0,0.9)]">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`reel-window relative grid place-items-center overflow-hidden rounded-lg ${win}`}>
              {reels ? (
                <span className="reel-land grid place-items-center" style={{ animationDelay: `${i * 260}ms` }}>
                  <ReelSymbol s={reels[i]} kind={kind} tv={tv} />
                </span>
              ) : (
                <span aria-hidden className="reel-blur absolute inset-x-0 top-0 flex flex-col items-center gap-3 text-indigo-200/70" style={{ animationDelay: `${i * -120}ms` }}>
                  {["7", "★", "◆", "🍇", "🔔", "7", "★", "◆"].map((x, k) => (
                    <span key={k} className={tv ? "text-6xl" : "text-2xl"}>
                      {x}
                    </span>
                  ))}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
      {!compact && (
        <span aria-hidden className={`absolute -right-5 top-1/3 flex flex-col items-center ${tv ? "-right-8" : ""}`}>
          <span className={`rounded-full bg-[radial-gradient(circle_at_35%_30%,#D793FF,#7712A2)] shadow-[0_0_14px_rgba(185,62,243,0.7)] ${tv ? "h-8 w-8" : "h-4 w-4"}`} />
          <span className={`rounded-full bg-gradient-to-b from-slate-300 to-slate-600 ${tv ? "h-20 w-2" : "h-10 w-1"}`} />
        </span>
      )}
    </div>
  );
}

/** Ruleta europea: aro de madera, 37 bolsillos (morado, azul y el cero en menta), cono metálico y la bola arriba */
function RouletteWheel({ n, tv }: { n: number | null; tv: boolean }) {
  const step = 360 / 37;
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    if (n === null) return;
    const i = WHEEL_ORDER.indexOf(n);
    // Cinco vueltas y frena con el número bajo la bola
    setAngle(-(360 * 5 + i * step));
  }, [n, step]);
  const fill = { menta: "#2D8162", morado: "#981BCD", azul: "#0257AB" };
  const size = tv ? "h-[26rem] w-[26rem]" : "h-56 w-56";
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className={`relative ${size}`} role="img" aria-label={n === null ? "La ruleta espera las fichas" : `La ruleta cayó en ${n} ${rouletteColor(n)}`}>
        <svg viewBox="-110 -110 220 220" className="h-full w-full drop-shadow-[0_24px_40px_rgba(0,0,0,0.7)]">
          <defs>
            <radialGradient id="rw-wood" cx="0.5" cy="0.45" r="0.6">
              <stop offset="0.82" stopColor="#5A3A22" />
              <stop offset="1" stopColor="#2B1B12" />
            </radialGradient>
            <radialGradient id="rw-cone" cx="0.42" cy="0.38" r="0.7">
              <stop offset="0" stopColor="#3E3F47" />
              <stop offset="1" stopColor="#090A0D" />
            </radialGradient>
            <radialGradient id="rw-chrome" cx="0.35" cy="0.3" r="0.7">
              <stop offset="0" stopColor="#F0F7FF" />
              <stop offset="0.5" stopColor="#89BDFF" />
              <stop offset="1" stopColor="#2F3037" />
            </radialGradient>
          </defs>
          <circle r="108" fill="url(#rw-wood)" stroke="#E4B853" strokeOpacity="0.5" strokeWidth="1.2" />
          <circle r="95" fill="#131318" />
          <g className="roulette-spin" style={{ transform: `rotate(${angle}deg)` }}>
            {WHEEL_ORDER.map((num, i) => {
              const a0 = ((i - 0.5) * step - 90) * (Math.PI / 180);
              const a1 = ((i + 0.5) * step - 90) * (Math.PI / 180);
              const R = 92;
              const r0 = 62;
              const p = (rad: number, rr: number) => `${(Math.cos(rad) * rr).toFixed(2)} ${(Math.sin(rad) * rr).toFixed(2)}`;
              const mid = (i * step - 90) * (Math.PI / 180);
              return (
                <g key={num}>
                  <path d={`M${p(a0, r0)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r0)} A${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`} fill={fill[rouletteColor(num)]} stroke="#E4B853" strokeOpacity="0.55" strokeWidth="0.6" />
                  <text x={Math.cos(mid) * 83} y={Math.sin(mid) * 83} fill="#F0F7FF" fontSize="7.5" fontWeight="800" textAnchor="middle" dominantBaseline="central" transform={`rotate(${i * step} ${Math.cos(mid) * 83} ${Math.sin(mid) * 83})`}>
                    {num}
                  </text>
                </g>
              );
            })}
            <circle r="62" fill="url(#rw-cone)" stroke="#E4B853" strokeOpacity="0.4" />
            {[0, 1, 2, 3].map((k) => (
              <path key={k} d="M0 -12 L0 -46" transform={`rotate(${k * 90})`} stroke="url(#rw-chrome)" strokeWidth="4" strokeLinecap="round" />
            ))}
            <circle r="13" fill="url(#rw-chrome)" />
          </g>
          {/* La bola, quieta arriba: la ruleta gira bajo ella */}
          <circle cy="-84" r="5" fill="#FFFFFF" stroke="#89BDFF" strokeWidth="0.8" className={n === null ? "" : "roulette-ball"} />
          <path d="M0 -104 L-5 -96 L5 -96 Z" fill="#E4B853" />
        </svg>
      </div>
      {n !== null && (
        <p className={`font-led font-bold tracking-[0.18em] ${tv ? "text-tv-md" : "text-xl"} text-white`} aria-hidden>
          {n} · {rouletteColor(n).toUpperCase()}
        </p>
      )}
    </div>
  );
}

/** Carta de blackjack: blanca con el palo en color; boca abajo, el dorso neón de Tonight */
function BjCard({ card, tv, hidden }: { card: Card; tv: boolean; hidden?: boolean }) {
  const red = card.suit === "♥" || card.suit === "♦";
  const box = tv ? "h-36 w-24 text-3xl" : "h-16 w-11 text-sm";
  if (hidden)
    return (
      <span aria-label="Carta boca abajo" className={`grid place-items-center rounded-lg border border-indigo-300/60 bg-[repeating-linear-gradient(45deg,#0A4380_0_6px,#380F4C_6px_12px)] shadow-[0_8px_16px_-6px_rgba(0,0,0,0.8)] ${box}`}>
        <BrandMark className={tv ? "h-10 w-10" : "h-5 w-5"} />
      </span>
    );
  return (
    <span aria-label={cardLabel(card)} className={`bj-card relative grid place-items-center rounded-lg bg-[linear-gradient(160deg,#FFFFFF,#E2EFFF)] font-black shadow-[0_8px_16px_-6px_rgba(0,0,0,0.8)] ${box} ${red ? "text-[#C9214B]" : "text-night-950"}`}>
      <span className={`absolute left-1 top-0.5 ${tv ? "text-xl" : "text-xs"}`}>{cardLabel(card)}</span>
      <span>{card.suit}</span>
    </span>
  );
}

/** Mesa de blackjack: el host reparte (una carta tapada hasta revelar) y la mano de cada participante */
function BlackjackTable({ dealer, hands, revealed, tv }: { dealer: Card[]; hands: { name: string; cards: Card[] }[]; revealed: boolean; tv: boolean }) {
  const t = tv ? "text-tv-sm" : "text-sm";
  return (
    <div className="bj-felt relative overflow-hidden rounded-[28px] border border-emerald-300/20 p-4 sm:p-6">
      <p className={`text-center font-led tracking-[0.25em] text-emerald-200/70 ${tv ? "text-tv-sm" : "text-xs"}`}>BLACKJACK PAGA 30 · EL HOST SE PLANTA EN 17</p>
      <div className="mt-3 flex flex-col items-center gap-2">
        <span className={`${t} font-semibold text-slate-200`}>El host {revealed ? `· ${handValue(dealer)}${handValue(dealer) > 21 ? " (se pasó)" : ""}` : ""}</span>
        <div className="flex gap-2">
          {(revealed ? dealer : dealer.slice(0, 2)).map((c, i) => (
            <BjCard key={i} card={c} tv={tv} hidden={!revealed && i === 1} />
          ))}
        </div>
      </div>
      <ul className={`mt-5 grid gap-3 ${hands.length > 2 ? "sm:grid-cols-2" : ""}`}>
        {hands.map((h) => (
          <li key={h.name} className="flex items-center gap-3 rounded-2xl bg-night-950/40 p-2.5">
            <span className={`${t} min-w-0 flex-1 truncate font-bold text-white`}>{h.name}</span>
            <span className="flex gap-1.5">
              {revealed ? h.cards.map((c, i) => <BjCard key={i} card={c} tv={false} />) : <span className={`${t} text-slate-400`}>Eligió su jugada</span>}
            </span>
            {revealed && <span className={`font-mono font-bold ${t} ${handValue(h.cards) > 21 ? "text-amber-300" : "text-emerald-200"}`}>{handValue(h.cards)}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
