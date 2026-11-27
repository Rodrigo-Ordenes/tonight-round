"use client";

import React, { useEffect, useState } from "react";
import type { LiveRound, Participant } from "@/lib/carreteState";
import {
  blackjackOutcome,
  bjDealerHand,
  bjPlayerHand,
  jackpotMachines,
  rouletteColor,
  rouletteNumber,
  parseRouletteBets,
  rouletteWins,
  slotPayout,
  slotSpin,
  type SlotKind,
  SLOT_BAR,
  SLOT_CLASSIC,
  SLOT_FRUTAS,
  type SlotSymbol,
} from "@/lib/casinoGames";
import { BrandMark } from "@/components/shell/AppShell";
import FrutillitaMachine from "@/components/party/FrutillitaMachine";
import { frutillitaSpin } from "@/lib/frutillita";
import { BlackjackTable, RouletteFelt, RouletteWheel, bjRevealDuration, type BjHand } from "@/components/party/CasinoTables";
import { audioEffects } from "@/lib/audioEffects";
import { FOTOS_TRAGOS } from "@/data/fotosTragos";
import { FOTOS_INTRO, FOTO_HOST_AVATAR } from "@/data/fotosEscena";

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
    case "frutillita": {
      // La máquina grande muestra la mejor tirada de la ronda, con sus líneas y La vuelta
      const plays = voters.map((p) => ({ p, r: frutillitaSpin(seed, p.id) })).sort((a, b) => b.r.win - a.r.win);
      const top = plays[0];
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <FrutillitaMachine key={round.id} result={revealed && top ? top.r : null} spinning={false} tv={tv} player={top ? name(top.p.id) : undefined} />
          {!revealed && (
            <p className={`${tv ? "text-tv-sm" : "text-sm"} text-center font-semibold text-slate-200`}>
              {voters.length} {voters.length === 1 ? "palanca tirada" : "palancas tiradas"}
            </p>
          )}
        </div>
      );
    }
    case "tragamonedas":
    case "tragabar": {
      const kind: SlotKind = round.game === "tragabar" ? "bar" : "clasica";
      const best = voters
        .map((p) => {
          const reels = slotSpin(seed, p.id, kind);
          return { id: p.id, reels, pay: slotPayout(reels, kind) };
        })
        .sort((a, b) => b.pay.points - a.pay.points)[0];
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <SlotMachine key={round.id} reels={revealed && best ? best.reels : null} kind={kind} tv={tv} win={!!best && best.pay.points > 0} />
          {revealed && best && <CreditMeter value={best.pay.points} tv={tv} delay={1200} />}
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
    case "ruleta": {
      const n = revealed ? rouletteNumber(seed) : null;
      return (
        <div className="flex flex-col items-center gap-4">
          <RouletteWheel n={n} tv={tv} />
          <RouletteFelt chips={voters.flatMap((p) => parseRouletteBets(round.votes[p.id]?.value ?? "").map((b) => ({ id: b.id, tag: p.name.charAt(0).toUpperCase() })))} n={n} tv={tv} />
        </div>
      );
    }
    case "blackjack": {
      // Mano a mano: cada celular va pidiendo; la mesa muestra las manos en vivo y el host cierra al revelar
      const dealer = bjDealerHand(seed);
      const seats: BjHand[] = voters.map((p) => {
        const h = bjPlayerHand(seed, p.id, round.votes[p.id]?.value ?? "");
        return { id: p.id, name: name(p.id), cards: h.cards, doubled: h.doubled, status: h.status };
      });
      const won = seats.reduce((sum, h) => sum + blackjackOutcome(h.cards, dealer, !!h.doubled).points, 0);
      return (
        <div className="flex flex-col items-center gap-3">
          <BlackjackTable key={round.id} dealer={dealer} hands={seats} revealed={revealed} tv={tv} />
          {revealed && <CreditMeter value={won} tv={tv} delay={bjRevealDuration(dealer)} label="LA MESA PAGA" />}
        </div>
      );
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

/** Lo que va en una ventana del rodillo: el emblema del host, la foto real del trago o el símbolo */
function ReelSymbol({ s, kind, tv }: { s: SlotSymbol; kind: SlotKind; tv: boolean }) {
  if (s.id === "logo") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={FOTO_HOST_AVATAR.src}
        alt={s.label}
        width={FOTO_HOST_AVATAR.w}
        height={FOTO_HOST_AVATAR.h}
        decoding="async"
        className={`${tv ? "h-24" : "h-12"} w-auto select-none object-contain`}
      />
    );
  }
  if (kind === "bar") {
    const photo = s.id === "agua" ? FOTOS_INTRO.agua?.lleno : FOTOS_TRAGOS[s.id]?.src;
    // eslint-disable-next-line @next/next/no-img-element
    if (photo) return <img src={photo} alt={s.label} className={`${tv ? "h-28" : "h-14"} w-auto object-contain drop-shadow-[0_6px_10px_rgba(0,0,0,0.6)]`} />;
  }
  if (s.id === "siete") return <span className={`font-display font-black text-purple-200 [text-shadow:0_0_14px_rgba(185,62,243,0.8)] ${tv ? "text-8xl" : "text-4xl"}`}>7</span>;
  return <span className={`${tv ? "text-7xl" : "text-3xl"} text-indigo-100`}>{s.label}</span>;
}

/** Tira de cada rodillo según la máquina: arriba y abajo del símbolo pagador se asoman sus vecinos */
const STRIPS: Record<SlotKind, SlotSymbol[]> = { clasica: SLOT_CLASSIC, bar: SLOT_BAR, frutas: SLOT_FRUTAS };
const neighbor = (kind: SlotKind, s: SlotSymbol, d: number) => {
  const list = STRIPS[kind];
  const i = Math.max(0, list.findIndex((x) => x.id === s.id));
  return list[(i + d + list.length) % list.length];
};

/**
 * Gabinete de tragamonedas como en un casino: marquesina con ampolletas que corren mientras gira y destellan si paga,
 * bisel cromado, rodillos con curvatura de cilindro (se asoman el símbolo de arriba y el de abajo), línea de pago,
 * palanca y bandeja de fichas.
 */
function SlotMachine({ reels, kind, tv, compact, label, win }: { reels: SlotSymbol[] | null; kind: SlotKind; tv: boolean; compact?: boolean; label?: string; win?: boolean }) {
  const box = tv ? "h-44 w-36" : "h-[5.5rem] w-[4.5rem]";
  const bulbs = tv ? 14 : 10;
  const state = reels ? (win ? "slot-win" : "") : "slot-spinning";
  return (
    <div className={`relative ${compact ? "scale-[0.85]" : ""} ${state}`}>
      <div className="slot-cabinet relative rounded-[26px] border border-white/15 p-3 pt-2">
        {/* Marquesina con ampolletas */}
        <div className="slot-marquee relative mb-2.5 rounded-xl border border-indigo-400/40 px-4 py-2">
          <div aria-hidden className="pointer-events-none absolute inset-x-2 -top-1 flex justify-between">
            {Array.from({ length: bulbs }, (_, k) => (
              <span key={k} className="slot-bulb" style={{ animationDelay: `${(k % 4) * 0.12}s` }} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <BrandMark className={`neon-electric ${tv ? "h-8 w-8" : "h-5 w-5"}`} />
            <span className={`font-led font-bold tracking-[0.2em] text-indigo-100 ${tv ? "text-tv-sm" : "text-xs"}`}>{label ?? (kind === "bar" ? "BAR TONIGHT" : "TONIGHT")}</span>
          </div>
          <div aria-hidden className="pointer-events-none absolute inset-x-2 -bottom-1 flex justify-between">
            {Array.from({ length: bulbs }, (_, k) => (
              <span key={k} className="slot-bulb" style={{ animationDelay: `${((k + 2) % 4) * 0.12}s` }} />
            ))}
          </div>
        </div>
        {/* Bisel cromado con los rodillos y la línea de pago */}
        <div className="slot-bezel relative rounded-2xl p-[3px]">
          <div className="relative flex gap-1.5 rounded-[13px] bg-night-950 p-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`reel-window relative overflow-hidden rounded-lg ${box}`}>
                {reels ? (
                  <span className="reel-land absolute inset-0" style={{ animationDelay: `${i * 260}ms` }}>
                    <span aria-hidden className="absolute inset-x-0 -top-[22%] grid h-[44%] scale-75 place-items-center opacity-40">
                      <ReelSymbol s={neighbor(kind, reels[i], -1)} kind={kind} tv={tv} />
                    </span>
                    <span className="absolute inset-x-0 top-1/2 grid -translate-y-1/2 place-items-center">
                      <ReelSymbol s={reels[i]} kind={kind} tv={tv} />
                    </span>
                    <span aria-hidden className="absolute inset-x-0 -bottom-[22%] grid h-[44%] scale-75 place-items-center opacity-40">
                      <ReelSymbol s={neighbor(kind, reels[i], 1)} kind={kind} tv={tv} />
                    </span>
                  </span>
                ) : (
                  <span aria-hidden className="reel-blur absolute inset-x-0 top-0 flex flex-col items-center gap-3 text-indigo-200/70" style={{ animationDelay: `${i * -120}ms` }}>
                    {STRIPS[kind].concat(STRIPS[kind]).map((x, k) => (
                      <span key={k} className={tv ? "text-6xl" : "text-2xl"}>
                        {x.id === "logo" ? "★" : x.label.length > 2 ? "◆" : x.label}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            ))}
            <span aria-hidden className="slot-payline pointer-events-none absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2" />
          </div>
        </div>
        {/* Bandeja de fichas */}
        <div aria-hidden className="slot-tray mx-auto mt-3 h-3 w-2/3 rounded-b-xl" />
      </div>
      {!compact && (
        <span aria-hidden className={`slot-static-lever absolute top-[28%] flex flex-col items-center ${tv ? "-right-9" : "-right-5"}`}>
          <span className={`slot-knob rounded-full ${tv ? "h-9 w-9" : "h-4 w-4"}`} />
          <span className={`rounded-full bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700 ${tv ? "h-24 w-2.5" : "h-11 w-1"}`} />
          <span className={`rounded-md bg-gradient-to-b from-slate-500 to-slate-800 ${tv ? "h-4 w-6" : "h-2 w-3"}`} />
        </span>
      )}
    </div>
  );
}

/**
 * Medidor de créditos como el de una máquina real: el premio corre número a número con el tic del pago, después de
 * que caen los rodillos. Son puntos, nunca plata. Con movimiento reducido aparece el total directo.
 */
export function CreditMeter({ value, tv, delay = 1000, label = "PAGA" }: { value: number; tv: boolean; delay?: number; label?: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || value <= 0) {
      setShown(value);
      return;
    }
    let raf = 0;
    let lastTick = 0;
    const t0 = performance.now() + delay;
    const dur = Math.min(2400, 600 + value * 28);
    const step = (t: number) => {
      const p = Math.min(1, Math.max(0, (t - t0) / dur));
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p > 0 && p < 1 && t - lastTick > 70) {
        lastTick = t;
        audioEffects.playTick(1500, 0.02);
      }
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, delay]);
  return (
    <div className="credit-meter flex items-center gap-3 rounded-xl px-4 py-2" role="status" aria-label={`${label}: ${value} créditos`}>
      <span className={`font-led font-bold tracking-[0.2em] text-amber-200/80 ${tv ? "text-tv-sm" : "text-xs"}`}>{label}</span>
      <span aria-hidden className={`font-led font-black tabular-nums text-amber-100 [text-shadow:0_0_12px_rgba(228,184,83,0.7)] ${tv ? "text-tv-lg" : "text-3xl"}`}>
        {String(shown).padStart(4, "0")}
      </span>
    </div>
  );
}


