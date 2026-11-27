"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Card } from "@/lib/partyGames";
import { WHEEL_ORDER, blackjackOutcome, handValue, isNatural, rouletteColor, rouletteWins as rouletteWinsLocal } from "@/lib/casinoGames";
import { BrandMark } from "@/components/shell/AppShell";
import { FOTO_HOST_SALUDO } from "@/data/fotosEscena";

/* =====================================================================================================================
   Blackjack: mesa de casino con mesón acolchado, sabot, bandeja de fichas, el host de crupier y cartas de verdad.
   El reparto sigue el orden real (jugadores, host, jugadores, host tapada), después las cartas pedidas, el host da
   vuelta su carta y pide hasta 17. Todo sale de la misma semilla que la TV y los celulares.
   ===================================================================================================================== */

/** Segundos entre carta y carta del reparto */
const STEP = 0.42;
const RANK: Record<number, string> = { 11: "J", 12: "Q", 13: "K", 14: "A" };
const rankOf = (c: Card) => RANK[c.rank] ?? String(c.rank);
const isRed = (c: Card) => c.suit === "♥" || c.suit === "♦";

export type BjHand = { id: string; name: string; cards: Card[]; doubled?: boolean; status?: string };

/** Cuándo cae cada carta del host al cerrar la mano: la tapada se da vuelta y después pide de a una */
export const FLIP_AT = 0.35;
const HIT_GAP = 0.6;
export const hostCardAt = (i: number) => FLIP_AT + 0.45 + (i - 2) * HIT_GAP;
/** Milisegundos que tarda el host en cerrar (dar vuelta y pedir) desde que se revela la mano */
export const bjRevealDuration = (dealer: Card[]) => Math.round((hostCardAt(Math.max(2, dealer.length)) + 0.5) * 1000);

/** Carta de casino: índices en dos esquinas, pips o figura al centro; dorso con el logo. Se da vuelta en 3D. */
export function PlayingCard({ card, faceUp, size = "md", delay = 0, flipDelay, from, tilt = 0, startDown = false }: { card: Card; faceUp: boolean; size?: "sm" | "md" | "lg"; delay?: number; flipDelay?: number; from?: { x: number; y: number }; tilt?: number; startDown?: boolean }) {
  const reduce = useReducedMotion();
  const box = size === "lg" ? "h-40 w-28" : size === "sm" ? "h-[4.2rem] w-12" : "h-24 w-[4.25rem]";
  const idx = size === "lg" ? "text-xl" : size === "sm" ? "text-[0.7rem]" : "text-sm";
  const pip = size === "lg" ? "text-6xl" : size === "sm" ? "text-2xl" : "text-4xl";
  const face = card.rank >= 11 && card.rank <= 13;
  return (
    <motion.span
      className={`relative inline-block shrink-0 ${box}`}
      style={{ perspective: 800 }}
      initial={reduce || !from ? false : { x: from.x, y: from.y, rotate: -24, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, y: 0, rotate: tilt, opacity: 1, scale: 1 }}
      transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 210, damping: 24, mass: 0.8, delay }}
    >
      <motion.span
        className="absolute inset-0"
        style={{ transformStyle: "preserve-3d" }}
        initial={{ rotateY: startDown || !faceUp ? 180 : 0 }}
        animate={{ rotateY: faceUp ? 0 : 180 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 160, damping: 18, delay: faceUp ? (flipDelay ?? delay) : 0 }}
      >
        {/* Cara */}
        <span
          aria-label={faceUp ? `${rankOf(card)} de ${card.suit}` : undefined}
          className={`playing-card absolute inset-0 rounded-[9px] ${isRed(card) ? "text-[#B0173F]" : "text-[#121218]"}`}
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className={`absolute left-1.5 top-1 flex flex-col items-center font-black leading-none ${idx}`}>
            <span>{rankOf(card)}</span>
            <span className="text-[0.85em]">{card.suit}</span>
          </span>
          <span className={`absolute bottom-1 right-1.5 flex rotate-180 flex-col items-center font-black leading-none ${idx}`}>
            <span>{rankOf(card)}</span>
            <span className="text-[0.85em]">{card.suit}</span>
          </span>
          {face ? (
            <span className="absolute inset-[18%_16%] grid place-items-center rounded-[5px] border border-current/40 bg-[linear-gradient(160deg,rgba(185,62,243,0.16),rgba(103,170,255,0.14))]">
              <span className={`font-display font-black ${size === "sm" ? "text-lg" : size === "lg" ? "text-5xl" : "text-3xl"}`}>{rankOf(card)}</span>
              <span className={`absolute right-1 top-0.5 ${size === "sm" ? "text-[0.6rem]" : "text-xs"}`}>{card.suit}</span>
              <span aria-hidden className="absolute bottom-0.5 left-1 text-[0.6rem] opacity-70">♛</span>
            </span>
          ) : (
            <span className={`absolute inset-0 grid place-items-center ${pip}`}>{card.suit}</span>
          )}
        </span>
        {/* Dorso */}
        <span aria-label={faceUp ? undefined : "Carta boca abajo"} className="playing-card-back absolute inset-0 grid place-items-center rounded-[9px]" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
          <span className="grid h-[62%] w-[62%] place-items-center rounded-md border border-[#E4B853]/60">
            <BrandMark className={size === "sm" ? "h-4 w-4" : size === "lg" ? "h-10 w-10" : "h-6 w-6"} />
          </span>
        </span>
      </motion.span>
    </motion.span>
  );
}

/** Pila de fichas de casino (puntos, nunca plata) */
function ChipStack({ n, color = "azul", tv }: { n: number; color?: "azul" | "morado" | "oro"; tv: boolean }) {
  const size = tv ? "h-10 w-10" : "h-7 w-7";
  return (
    <span aria-hidden className={`relative inline-block ${size}`}>
      {Array.from({ length: n }, (_, k) => (
        <span key={k} className={`casino-chip casino-chip-${color} absolute left-0 ${size} rounded-full`} style={{ top: `${-k * (tv ? 4 : 3)}px` }} />
      ))}
    </span>
  );
}

const STATUS_LABEL: Record<string, string> = { jugando: "Pensando…", plantado: "Se plantó", pasado: "Se pasó", doblado: "Dobló", blackjack: "¡Blackjack!" };

/**
 * Mesa de blackjack contra el host, mano a mano: mesón con paño, riel acolchado y filo dorado, sabot y bandeja; el host
 * de crupier comenta. Las cartas llegan de a una a medida que cada jugador pide (las del reparto inicial, en el orden
 * real); la segunda del host está tapada hasta que todos terminan, ahí se da vuelta y el host pide en vivo hasta 17.
 * Cada puesto recibe su sello y las fichas se pagan o se recogen.
 */
export function BlackjackTable({ dealer, hands, revealed, tv, bet }: { dealer: Card[]; hands: BjHand[]; revealed: boolean; tv: boolean; bet?: number }) {
  const reduce = useReducedMotion();
  const hostTotal = handValue(dealer);
  const results = hands.map((h) => ({ h, r: blackjackOutcome(h.cards, dealer, !!h.doubled) }));
  const solo = hands.length === 1;
  const cardSize = tv ? "lg" : solo ? "md" : "sm";

  // Las cartas que ya estaban al montar la mesa salen en el orden del reparto; las que llegan después, al instante
  const initial = useRef<Map<string, number> | null>(null);
  if (initial.current === null) {
    const order = new Map<string, number>();
    let k = 0;
    for (let r = 0; r < 2; r++) {
      hands.forEach((h) => h.cards[r] && order.set(`${h.id}-${r}`, k++));
      order.set(`host-${r}`, k++);
    }
    hands.forEach((h) => h.cards.slice(2).forEach((_, i) => order.set(`${h.id}-${i + 2}`, k++)));
    initial.current = order;
  }
  const dealDelay = (key: string) => (reduce ? 0 : (initial.current!.get(key) ?? -1) >= 0 ? initial.current!.get(key)! * STEP : 0);

  // Cierre: cuando se revela, el host da vuelta y pide; recién al terminar se ven los sellos y se pagan las fichas
  // La mano del host se identifica por sus cartas (el arreglo cambia en cada render): así el cierre no se reinicia
  const [closed, setClosed] = useState(false);
  const dealerKey = dealer.map((c) => `${c.rank}${c.suit}`).join(",");
  const closeMs = bjRevealDuration(dealer);
  useEffect(() => {
    if (!revealed) {
      setClosed(false);
      return;
    }
    const t = window.setTimeout(() => setClosed(true), reduce ? 0 : closeMs);
    return () => window.clearTimeout(t);
  }, [revealed, dealerKey, closeMs, reduce]);
  const playing = hands.some((h) => h.status === "jugando");
  const say = closed
    ? hostTotal > 21
      ? `Me pasé con ${hostTotal}. Pago.`
      : isNatural(dealer)
        ? "Blackjack de la casa."
        : `La casa hace ${hostTotal}.`
    : revealed
      ? "Doy vuelta mi carta…"
      : hands.length === 0
        ? "Hagan su juego."
        : playing
          ? "¿Carta?"
          : "Todos listos.";

  return (
    <div className="bj-table relative mx-auto w-full max-w-3xl">
      {/* El host de crupier, detrás del mesón */}
      <div className="relative z-0 flex items-end justify-center gap-3">
        <motion.img
          src={FOTO_HOST_SALUDO.src}
          alt=""
          aria-hidden
          width={FOTO_HOST_SALUDO.w}
          height={FOTO_HOST_SALUDO.h}
          decoding="async"
          className={`${tv ? "h-40" : "h-24 sm:h-28"} -mb-3 w-auto select-none object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]`}
          animate={reduce ? undefined : revealed && !closed ? { rotate: [0, -3, 0], y: [0, 3, 0] } : { y: [0, -2, 0] }}
          transition={revealed && !closed ? { duration: HIT_GAP, repeat: Infinity, ease: "easeInOut" } : { duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.span
          key={say}
          role="status"
          className={`bj-bubble relative mb-10 max-w-[13rem] rounded-2xl px-3 py-2 font-semibold text-white ${tv ? "text-tv-sm" : "text-sm"}`}
          initial={reduce ? false : { opacity: 0, y: 6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          {say}
        </motion.span>
      </div>

      {/* El mesón */}
      <div className="bj-felt-v2 relative z-10 overflow-hidden px-3 pb-8 pt-4 sm:px-6">
        <div aria-hidden className="absolute inset-x-0 top-0 flex items-start justify-between px-4">
          <span className="bj-tray mt-1 flex gap-1 rounded-b-xl px-2 pb-1.5 pt-1">
            {(["azul", "morado", "oro", "azul", "morado"] as const).map((c, i) => (
              <span key={i} className={`casino-chip casino-chip-${c} ${tv ? "h-6 w-6" : "h-4 w-4"} rounded-full`} />
            ))}
          </span>
          <span className={`bj-shoe-v2 mt-2 rounded-md ${tv ? "h-16 w-24" : "h-10 w-16"}`} />
        </div>

        {/* La mano del host: la segunda tapada hasta el cierre; después pide de a una */}
        <div className="relative mt-6 flex min-h-[6rem] flex-col items-center gap-1.5">
          <div className="flex items-center gap-2">
            {hands.length === 0 ? (
              <span className={`rounded-xl border border-dashed border-[#E4B853]/40 ${tv ? "h-40 w-56" : "h-24 w-36"}`} aria-hidden />
            ) : (
              dealer.slice(0, revealed ? dealer.length : 2).map((c, i) => (
                <PlayingCard
                  key={`h${i}-${c.rank}${c.suit}`}
                  card={c}
                  size={cardSize}
                  faceUp={i !== 1 || revealed}
                  startDown={i === 1}
                  delay={i < 2 ? dealDelay(`host-${i}`) : reduce ? 0 : hostCardAt(i)}
                  flipDelay={i === 1 ? (reduce ? 0 : FLIP_AT) : undefined}
                  from={{ x: tv ? 320 : 180, y: -30 }}
                  tilt={((i * 37) % 5) - 2}
                />
              ))
            )}
          </div>
          {hands.length > 0 && (
            <span className={`bj-total font-led font-bold ${tv ? "text-tv-sm" : "text-xs"} ${closed && hostTotal > 21 ? "text-amber-200" : "text-white"}`}>
              HOST {closed ? hostTotal : handValue([dealer[0]])}
            </span>
          )}
        </div>

        <svg aria-hidden viewBox="0 0 400 70" className="pointer-events-none mx-auto mt-2 block h-auto w-[92%] opacity-70">
          <path id="bj-arc-v2" d="M10 8 Q200 78 390 8" fill="none" stroke="rgba(228,184,83,0.55)" strokeWidth="1" />
          <text fill="rgba(228,184,83,0.85)" fontSize="11" fontWeight="800" letterSpacing="3.2">
            <textPath href="#bj-arc-v2" startOffset="50%" textAnchor="middle">BLACKJACK PAGA 30 · EL HOST SE PLANTA EN 17</textPath>
          </text>
        </svg>

        {/* Los puestos */}
        <ul className={`relative mt-1 grid gap-3 ${hands.length > 2 ? "sm:grid-cols-2" : ""} ${hands.length === 2 ? "grid-cols-2" : ""}`}>
          {results.map(({ h, r }) => {
            const total = handValue(h.cards);
            return (
              <li key={h.id} className="relative flex flex-col items-center gap-2">
                <div className="flex min-h-[1.5rem] items-end justify-center">
                  <div className="flex -space-x-5">
                    {h.cards.map((c, i) => (
                      <PlayingCard key={`${h.id}-${i}-${c.rank}${c.suit}`} card={c} size={cardSize} faceUp delay={dealDelay(`${h.id}-${i}`)} from={{ x: tv ? 300 : 160, y: tv ? -260 : -170 }} tilt={((i * 53 + h.id.length) % 7) - 3} />
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bj-spot relative grid place-items-center rounded-full">
                    <motion.span animate={closed && r.lose ? { y: -120, opacity: 0 } : { y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.2 }}>
                      <ChipStack n={h.doubled ? 6 : 3} tv={tv} />
                    </motion.span>
                    {closed && r.points > 0 && (
                      <motion.span className="absolute -left-9 top-1" initial={reduce ? false : { y: -140, x: -30, opacity: 0 }} animate={{ y: 0, x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 180, damping: 20 }}>
                        <ChipStack n={Math.min(8, Math.max(2, Math.round(r.points / 5)))} color="oro" tv={tv} />
                      </motion.span>
                    )}
                  </span>
                  <span className="min-w-0 text-left">
                    <span className={`block truncate font-bold text-white ${tv ? "text-tv-sm" : "text-sm"}`}>{h.name}</span>
                    <span className={`block font-led font-bold ${tv ? "text-tv-sm" : "text-xs"} ${total > 21 ? "text-amber-200" : "text-emerald-200"}`}>
                      {total}
                      {!closed && h.status ? ` · ${STATUS_LABEL[h.status] ?? ""}` : h.doubled ? " · DOBLÓ" : ""}
                    </span>
                  </span>
                </div>
                {closed && (
                  <motion.span
                    className={`bj-stamp rounded-lg px-3 py-1 font-display font-black tracking-wide ${tv ? "text-tv-sm" : "text-sm"} ${r.win ? "bj-stamp-win" : r.lose ? "bj-stamp-lose" : "bj-stamp-push"}`}
                    initial={reduce ? false : { scale: 1.6, opacity: 0, rotate: -8 }}
                    animate={{ scale: 1, opacity: 1, rotate: -3 }}
                    transition={{ type: "spring", stiffness: 320, damping: 18 }}
                  >
                    {isNatural(h.cards) && r.win ? `¡BLACKJACK! +${bet ? Math.round(bet * (h.doubled ? 2 : 1) * 1.5) : r.points}` : r.win ? `GANAS +${bet ? bet * (h.doubled ? 2 : 1) : r.points}` : r.lose ? (total > 21 ? "TE PASASTE" : "LA CASA GANA") : bet ? "EMPATE · VUELVE TU FICHA" : `EMPATE +${r.points}`}
                  </motion.span>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/* =====================================================================================================================
   Ruleta europea de casino: tazón de madera, pista de la bola con rombos, trastes dorados, bolsillos con fondo, cono
   y torreta cromada, y un reflejo fijo de las luces del salón que no gira con el cilindro. Dos vistas: la mesa en 3D
   (como la cámara de un casino en vivo) y cenital. La bola corre al revés, rebota en los rombos y cae al bolsillo.
   ===================================================================================================================== */

/** Bolsillos de casino: verde paño (el cero), morado real (en vez de rojo) y negro laca */
const POCKET = { verde: "#0E6B43", morado: "#6A1E92", negro: "#121217" };
type View = "mesa" | "cenital";
const VIEW_KEY = "tonight_ruleta_vista";

export function RouletteWheel({ n, tv }: { n: number | null; tv: boolean }) {
  const reduce = useReducedMotion();
  const step = 360 / 37;
  const [angle, setAngle] = useState(0);
  const [view, setView] = useState<View>("mesa");
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "mesa" || v === "cenital") setView(v);
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const choose = (v: View) => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* sin almacenamiento */
    }
  };
  useEffect(() => {
    if (n === null) return;
    const i = WHEEL_ORDER.indexOf(n);
    setAngle(-(360 * 5 + i * step));
  }, [n, step]);

  const size = tv ? "h-[30rem] w-[30rem]" : "h-64 w-64 sm:h-72 sm:w-72";
  const p = (deg: number, r: number) => {
    const a = (deg - 90) * (Math.PI / 180);
    return `${(Math.cos(a) * r).toFixed(2)} ${(Math.sin(a) * r).toFixed(2)}`;
  };
  const color = n === null ? null : rouletteColor(n);

  return (
    <div className="flex flex-col items-center gap-3 py-1">
      {!tv && (
        <div role="group" aria-label="Vista de la ruleta" className="flex rounded-full border border-white/10 bg-night-950/60 p-1 text-xs font-semibold">
          {(["mesa", "cenital"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => choose(v)} className={`rounded-full px-3 py-1.5 transition-colors ${view === v ? "bg-indigo-500 text-night-950" : "text-slate-300 hover:text-white"}`}>
              {v === "mesa" ? "Mesa 3D" : "Cenital"}
            </button>
          ))}
        </div>
      )}
      <div className="relative" style={{ perspective: tv ? 1600 : 1000 }}>
        <motion.div
          className={`relative ${size}`}
          initial={false}
          animate={{ rotateX: view === "mesa" && !reduce ? 44 : 0, scale: view === "mesa" && !reduce ? 1.22 : 1, y: view === "mesa" && !reduce ? (tv ? -10 : -4) : 0 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          style={{ transformStyle: "preserve-3d" }}
          role="img"
          aria-label={n === null ? "La ruleta espera las fichas" : `La ruleta cayó en ${n} ${color}`}
        >
          {/* Sombra en el paño */}
          <span aria-hidden className="absolute inset-[4%] -z-10 translate-y-[6%] rounded-full bg-black/70 blur-2xl" />
          <svg viewBox="-120 -120 240 240" className="h-full w-full">
            <defs>
              <radialGradient id="rw2-wood" cx="0.5" cy="0.42" r="0.62">
                <stop offset="0.78" stopColor="#6B4528" />
                <stop offset="0.9" stopColor="#3A2414" />
                <stop offset="1" stopColor="#1C110A" />
              </radialGradient>
              <radialGradient id="rw2-track" cx="0.5" cy="0.4" r="0.6">
                <stop offset="0.86" stopColor="#2A2B33" />
                <stop offset="0.95" stopColor="#4A4C57" />
                <stop offset="1" stopColor="#15161B" />
              </radialGradient>
              <radialGradient id="rw2-cone" cx="0.4" cy="0.35" r="0.75">
                <stop offset="0" stopColor="#7A5A3A" />
                <stop offset="0.55" stopColor="#4A3220" />
                <stop offset="1" stopColor="#1F140B" />
              </radialGradient>
              <radialGradient id="rw2-pocket" cx="0.5" cy="0.5" r="0.5">
                <stop offset="0.8" stopColor="rgba(0,0,0,0)" />
                <stop offset="1" stopColor="rgba(0,0,0,0.55)" />
              </radialGradient>
              <linearGradient id="rw2-chrome" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.45" stopColor="#B9C2D3" />
                <stop offset="0.55" stopColor="#6E7584" />
                <stop offset="1" stopColor="#E9EEF7" />
              </linearGradient>
              <radialGradient id="rw2-ball" cx="0.35" cy="0.3" r="0.7">
                <stop offset="0" stopColor="#FFFFFF" />
                <stop offset="0.6" stopColor="#E6E9EF" />
                <stop offset="1" stopColor="#8D93A1" />
              </radialGradient>
              <radialGradient id="rw2-gloss" cx="0.32" cy="0.22" r="0.5">
                <stop offset="0" stopColor="rgba(255,255,255,0.35)" />
                <stop offset="1" stopColor="rgba(255,255,255,0)" />
              </radialGradient>
            </defs>
            {/* Tazón de madera con filo dorado */}
            <circle r="118" fill="url(#rw2-wood)" stroke="#E4B853" strokeOpacity="0.7" strokeWidth="1.4" />
            {/* Pista de la bola y rombos */}
            <circle r="104" fill="url(#rw2-track)" />
            {Array.from({ length: 8 }, (_, k) => (
              <path key={k} d={`M${p(k * 45, 98)} L${p(k * 45 + 2.2, 94)} L${p(k * 45, 90)} L${p(k * 45 - 2.2, 94)} Z`} fill="url(#rw2-chrome)" />
            ))}
            <circle r="88" fill="#0B0B0F" />
            {/* Cilindro que gira: bolsillos, trastes, números, cono y torreta */}
            <g className="roulette-spin" style={{ transform: `rotate(${angle}deg)` }}>
              {WHEEL_ORDER.map((num, i) => {
                const a0 = (i - 0.5) * step;
                const a1 = (i + 0.5) * step;
                const R = 87;
                const r0 = 58;
                const mid = i * step;
                const [tx, ty] = p(mid, 78).split(" ").map(Number);
                return (
                  <g key={num}>
                    <path d={`M${p(a0, r0)} L${p(a0, R)} A${R} ${R} 0 0 1 ${p(a1, R)} L${p(a1, r0)} A${r0} ${r0} 0 0 0 ${p(a0, r0)} Z`} fill={POCKET[rouletteColor(num)]} />
                    <text x={tx} y={ty} fill="#F7F3E8" fontSize="7.2" fontWeight="800" textAnchor="middle" dominantBaseline="central" transform={`rotate(${mid} ${tx} ${ty})`}>
                      {num}
                    </text>
                    {/* Traste dorado entre bolsillos */}
                    <path d={`M${p(a0, r0)} L${p(a0, 70)}`} stroke="#E4B853" strokeWidth="0.9" />
                  </g>
                );
              })}
              {/* Fondo de los bolsillos: anillo interior más oscuro */}
              <circle r="70" fill="none" stroke="#E4B853" strokeOpacity="0.6" strokeWidth="0.6" />
              <circle r="64" fill="url(#rw2-pocket)" opacity="0.9" />
              <circle r="58" fill="url(#rw2-cone)" stroke="#E4B853" strokeOpacity="0.5" />
              {[0, 1, 2, 3].map((k) => (
                <g key={k} transform={`rotate(${k * 90})`}>
                  <path d="M0 -10 L0 -40" stroke="url(#rw2-chrome)" strokeWidth="3.4" strokeLinecap="round" />
                  <circle cy="-42" r="3.2" fill="url(#rw2-chrome)" />
                </g>
              ))}
              <circle r="11" fill="url(#rw2-chrome)" />
              <circle r="4" fill="#E4B853" />
            </g>
            {/* La bola: corre por la pista al revés, rebota en los rombos y cae al bolsillo de arriba */}
            <g key={n ?? "espera"} className={n === null ? "" : "roulette-ball-orbit"}>
              <g className={n === null ? "" : "roulette-ball-drop2"}>
                <circle cy="-81" r="4.6" fill="url(#rw2-ball)" />
                <circle cy="-82.4" cx="-1.4" r="1.2" fill="#FFFFFF" opacity="0.9" />
              </g>
            </g>
            {/* Reflejo fijo de las luces del salón: no gira con el cilindro */}
            <ellipse cx="-30" cy="-46" rx="70" ry="42" fill="url(#rw2-gloss)" pointerEvents="none" />
            <path d="M0 -119 L-5 -110 L5 -110 Z" fill="#E4B853" />
          </svg>
        </motion.div>
      </div>
      {/* El número que salió, como en el marcador del casino */}
      <div className="h-14">
        {n !== null && color && (
          <motion.div
            key={n}
            className={`roulette-result grid place-items-center rounded-2xl px-5 font-led font-black text-white ${tv ? "h-20 text-tv-lg" : "h-14 text-3xl"}`}
            style={{ background: POCKET[color] }}
            initial={reduce ? false : { scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 16, delay: 5.6 }}
            aria-hidden
          >
            {n} · {color.toUpperCase()}
          </motion.div>
        )}
      </div>
    </div>
  );
}

/** Marcador de las últimas bolas, como la pantalla junto a la mesa del casino */
export function RouletteBoard({ numbers }: { numbers: number[] }) {
  if (!numbers.length) return null;
  return (
    <ol aria-label="Últimos números" className="roulette-board flex items-center gap-1.5 rounded-xl px-2 py-1.5">
      <li className="pr-1 font-led text-[0.65rem] font-bold tracking-[0.18em] text-amber-200/80">ÚLTIMOS</li>
      {numbers.map((x, i) => (
        <li
          key={`${numbers.length - i}-${x}`}
          className={`grid h-7 min-w-7 place-items-center rounded-md px-1 font-led text-xs font-black text-white ${i === 0 ? "ring-1 ring-amber-200/80" : "opacity-80"}`}
          style={{ background: POCKET[rouletteColor(x)] }}
        >
          {x}
        </li>
      ))}
    </ol>
  );
}

/* =====================================================================================================================
   Paño de la ruleta, interactivo: el 0, los 36 números y las apuestas de afuera. Con `onBet`, cada casilla es un botón
   para poner una ficha (plenos incluidos). Las fichas muestran su monto o la inicial de quién apostó; al caer la bola se
   ilumina el número y las apuestas que pagan. En el celular el paño va vertical, como se ve parado frente a la mesa.
   ===================================================================================================================== */

export type FeltChip = { id: string; tag: string; amount?: number };
const FELT_FILL = { verde: "bg-[#0E6B43]", morado: "bg-[#6A1E92]", negro: "bg-[#121217]" };

export function RouletteFelt({ chips, n, tv = false, onBet, vertical = false, disabled = false }: { chips: FeltChip[]; n: number | null; tv?: boolean; onBet?: (id: string) => void; vertical?: boolean; disabled?: boolean }) {
  const reduce = useReducedMotion();
  const cellH = tv ? "min-h-12 text-tv-sm" : vertical ? "min-h-[1.9rem] text-sm" : "min-h-9 text-xs";
  const lit = (id: string) => (n !== null && rouletteWinsLocal(id, n) ? "roulette-lit" : "");
  const ctx: FeltCtx = { chips, onBet, disabled, tv, reduce: !!reduce };
  const hit = (num: number) => (n === num ? "roulette-hit" : "");
  const outside: [string, string][] = [
    ["par", "Par"],
    ["morado", "Morado"],
    ["negro", "Negro"],
    ["impar", "Impar"],
  ];

  if (vertical) {
    // Celular: 0 arriba, 12 filas de 3 números y las de afuera abajo
    return (
      <div className="roulette-felt w-full rounded-2xl p-1.5" role={onBet ? "group" : "img"} aria-label="Paño de la ruleta">
        <div className="grid grid-cols-3 gap-[2px] font-bold text-white">
          <FeltCell ctx={ctx} id="cero" label="0" aria="cero" className={`col-span-3 rounded-t-lg ${cellH} ${FELT_FILL.verde} ${hit(0)} ${lit("cero")}`} />
          {Array.from({ length: 36 }, (_, i) => i + 1).map((num) => (
            <FeltCell ctx={ctx} key={num} id={`n${num}`} label={num} aria={`el ${num}`} className={`${cellH} ${FELT_FILL[rouletteColor(num)]} ${hit(num)}`} />
          ))}
          {(["d1", "d2", "d3"] as const).map((d, i) => (
            <FeltCell ctx={ctx} key={d} id={d} label={`${i + 1}ª doc.`} aria={`la ${i + 1}ª docena`} className={`border border-[#E4B853]/40 ${cellH} ${lit(d)}`} />
          ))}
        </div>
        <div className="mt-[2px] grid grid-cols-4 gap-[2px] font-bold text-white">
          {outside.map(([id, label]) => (
            <FeltCell ctx={ctx} key={id} id={id} label={label} aria={label.toLowerCase()} className={`border border-[#E4B853]/40 ${cellH} ${id === "morado" ? FELT_FILL.morado : id === "negro" ? FELT_FILL.negro : ""} ${lit(id)}`} />
          ))}
        </div>
      </div>
    );
  }

  const rows = [3, 2, 1].map((r) => Array.from({ length: 12 }, (_, c) => c * 3 + r));
  return (
    <div className="roulette-felt w-full max-w-4xl overflow-x-auto rounded-2xl p-2" role={onBet ? "group" : "img"} aria-label={`Paño de la ruleta con ${chips.length} ${chips.length === 1 ? "ficha" : "fichas"}`}>
      <div className="grid min-w-[30rem] grid-cols-[2.2rem_repeat(12,minmax(0,1fr))] gap-[2px] font-bold text-white">
        <FeltCell ctx={ctx} id="cero" label="0" aria="cero" className={`row-span-3 rounded-l-lg ${FELT_FILL.verde} ${hit(0)} ${lit("cero")}`} />
        {rows.flat().map((num) => (
          <FeltCell ctx={ctx} key={num} id={`n${num}`} label={num} aria={`el ${num}`} className={`${cellH} ${FELT_FILL[rouletteColor(num)]} ${hit(num)}`} />
        ))}
        <div />
        {(["d1", "d2", "d3"] as const).map((d, i) => (
          <FeltCell ctx={ctx} key={d} id={d} label={`${i + 1}ª docena`} aria={`la ${i + 1}ª docena`} className={`col-span-4 border border-[#E4B853]/40 ${cellH} ${lit(d)}`} />
        ))}
        <div />
        {outside.map(([id, label]) => (
          <FeltCell ctx={ctx} key={id} id={id} label={label} aria={label.toLowerCase()} className={`col-span-3 border border-[#E4B853]/40 ${cellH} ${id === "morado" ? FELT_FILL.morado : id === "negro" ? FELT_FILL.negro : ""} ${lit(id)}`} />
        ))}
      </div>
    </div>
  );
}

type FeltCtx = { chips: FeltChip[]; onBet?: (id: string) => void; disabled: boolean; tv: boolean; reduce: boolean };

/** Una casilla del paño: botón para poner ficha (o solo vista) con la pila de fichas encima */
function FeltCell({ ctx, id, label, className, aria }: { ctx: FeltCtx; id: string; label: React.ReactNode; className: string; aria: string }) {
  const { chips, onBet, disabled, tv, reduce } = ctx;
  const here = chips.filter((c) => c.id === id || (id === "cero" && c.id === "n0"));
  const total = here.reduce((a, c) => a + (c.amount ?? 0), 0);
  const stack = here.length ? (
    <motion.span
      key={here.length}
      className={`roulette-chip pointer-events-none absolute z-10 grid place-items-center rounded-full font-black text-night-950 ${tv ? "h-9 w-9 text-tv-sm" : "h-6 w-6 text-[0.6rem]"}`}
      initial={reduce ? false : { scale: 1.6, y: -14, opacity: 0 }}
      animate={{ scale: 1, y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 420, damping: 22 }}
      title={here.map((c) => c.tag).join(", ")}
    >
      {total ? total : here.length > 1 ? `×${here.length}` : here[0].tag}
    </motion.span>
  ) : null;
  return onBet ? (
    <button type="button" disabled={disabled} onClick={() => onBet(id)} aria-label={`Ficha a ${aria}`} className={`relative grid place-items-center transition-[filter] duration-150 hover:brightness-125 active:brightness-90 disabled:cursor-not-allowed ${className}`}>
      {label}
      {stack}
    </button>
  ) : (
    <div className={`relative grid place-items-center ${className}`}>
      {label}
      {stack}
    </div>
  );
}
