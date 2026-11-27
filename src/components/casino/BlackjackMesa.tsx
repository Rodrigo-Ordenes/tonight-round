"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import MesaShell from "./MesaShell";
import HostSays from "@/components/rooms/HostSays";
import { ChipPile, ChipRack, type Denom } from "./CasinoChip";
import { FLIP_AT, PlayingCard, bjRevealDuration, hostCardAt } from "@/components/party/CasinoTables";
import { bjCanDouble, bjDealerHand, bjPlayerHand, blackjackOutcome, handValue, isNatural } from "@/lib/casinoGames";
import { BrandMark } from "@/components/shell/AppShell";
import { sfx } from "@/components/rooms/sfx";
import { audioEffects } from "@/lib/audioEffects";

/** Si los créditos no alcanzan para la apuesta, la casa presta (son puntos, nunca plata) */
const PRESTAMO = 100;
/** Segundos entre carta y carta del reparto inicial */
const STEP = 0.42;
type Result = { kind: "blackjack" | "gana" | "pierde" | "empate"; payout: number; stake: number };

/**
 * Blackjack de casino, mano a mano con el host: la mesa con su riel de cuero y filo dorado, el paño con «Blackjack paga
 * 3 a 2», el zapato de donde salen las cartas, la bandeja del crupier y el círculo de apuesta. Pones fichas de la
 * bandeja (se apilan en el círculo), el host reparte en el orden real, decides carta a carta (pedir, plantarte o doblar)
 * y él da vuelta su carta y pide hasta 17. La mesa paga con fichas que llegan desde la bandeja (3 a 2 el blackjack) o
 * se lleva las tuyas. Sesión continua: la apuesta queda puesta para la siguiente mano.
 */
export default function BlackjackMesa({ credits, addCredits }: { credits: number; addCredits: (delta: number) => void }) {
  const reduce = useReducedMotion() ?? false;
  const [bet, setBet] = useState(10);
  const [handBet, setHandBet] = useState(10);
  const [seed, setSeed] = useState<number | null>(null);
  const [actions, setActions] = useState("");
  const [closing, setClosing] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const [note, setNote] = useState<string | null>(null);
  const [wide, setWide] = useState(true);
  const timers = useRef<number[]>([]);
  useEffect(() => {
    // Cartas grandes solo si la pantalla es ancha y alta: la mesa entera tiene que caber sin bajar
    const mq = window.matchMedia("(min-width: 768px) and (min-height: 960px)");
    const set = () => setWide(mq.matches);
    set();
    mq.addEventListener("change", set);
    return () => {
      mq.removeEventListener("change", set);
      timers.current.forEach((t) => window.clearTimeout(t));
    };
  }, []);
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, reduce ? 0 : ms));

  const hand = seed === null ? null : bjPlayerHand(seed, "yo", actions);
  const dealer = useMemo(() => (seed === null ? [] : bjDealerHand(seed)), [seed]);
  const playing = !!hand && hand.status === "jugando" && !closing;
  const betting = seed === null || !!result;

  /** El host juega su mano y, al terminar, la mesa paga */
  const close = (s: number, acts: string, base: number) => {
    setClosing(true);
    const h = bjPlayerHand(s, "yo", acts);
    const d = bjDealerHand(s);
    const o = blackjackOutcome(h.cards, d, h.doubled);
    const stake = base * (h.doubled ? 2 : 1);
    const natural = isNatural(h.cards) && !isNatural(d);
    const payout = o.win ? (natural ? Math.round(stake * 2.5) : stake * 2) : o.lose ? 0 : stake;
    // Cada carta del host suena al caer
    later(() => sfx.card(), FLIP_AT * 1000);
    for (let i = 2; i < d.length; i++) later(() => sfx.card(), hostCardAt(i) * 1000);
    later(() => {
      if (payout) addCredits(payout);
      if (o.win) {
        audioEffects.playJackpot();
        sfx.chips(6);
      } else if (o.lose) sfx.chips(3);
      setResult({ kind: o.win ? (natural ? "blackjack" : "gana") : o.lose ? "pierde" : "empate", payout, stake });
      setHistory((x) => [payout - stake, ...x].slice(0, 12));
    }, bjRevealDuration(d));
  };

  const deal = () => {
    if (!betting || bet < 5) return;
    setNote(null);
    if (credits < bet) {
      addCredits(PRESTAMO * Math.ceil((bet - credits) / PRESTAMO));
      setNote("La casa te prestó créditos para la apuesta.");
    }
    addCredits(-bet);
    setHandBet(bet);
    setResult(null);
    const s = (Math.random() * 2 ** 32) >>> 0;
    setSeed(s);
    setActions("");
    setClosing(false);
    sfx.chips(2);
    // El reparto: cuatro cartas en el orden real (tú, el host, tú, el host tapada)
    for (let k = 0; k < 4; k++) later(() => sfx.card(), k * STEP * 1000 + 120);
    if (bjPlayerHand(s, "yo", "").status !== "jugando") later(() => close(s, "", bet), 2000);
  };

  const act = (a: "p" | "m" | "d") => {
    if (seed === null || !playing) return;
    if (a === "d") {
      if (credits < handBet) {
        addCredits(PRESTAMO);
        setNote(`La casa te prestó ${PRESTAMO} créditos para doblar.`);
      }
      addCredits(-handBet);
      sfx.chips(2);
    }
    if (a !== "m") sfx.card();
    else sfx.clink();
    const next = actions + a;
    setActions(next);
    if (bjPlayerHand(seed, "yo", next).status !== "jugando") later(() => close(seed, next, handBet), a === "m" ? 250 : 750);
  };

  /** Después de una mano: hasta tocar una ficha se ve lo que pasó; al tocar, se arma la apuesta nueva desde cero */
  const [fresh, setFresh] = useState(false);
  useEffect(() => {
    if (result) setFresh(false);
  }, [result]);
  const add = (d: Denom) => {
    if (!betting) return;
    sfx.chip();
    setBet((b) => Math.min(1000, (result && !fresh ? 0 : b) + d));
    setFresh(true);
  };
  const stakeNow = handBet * (hand?.doubled ? 2 : 1);
  /** Lo que se ve en el círculo: la apuesta que se arma o, tras la mano, lo que estaba en juego */
  const shown = result && !fresh ? stakeNow : betting ? bet : stakeNow;
  const showResult = !!result && !fresh;

  const total = hand ? handValue(hand.cards) : 0;
  const hostTotal = closing ? handValue(dealer) : dealer.length ? handValue([dealer[0]]) : 0;
  const size = wide ? "lg" : "md";
  const shoeFrom = (row: "host" | "yo") => (wide ? { x: 330, y: row === "host" ? -30 : -250 } : { x: 150, y: row === "host" ? -20 : -170 });
  const dealDelay = (row: "host" | "yo", i: number) => (reduce ? 0 : i < 2 ? (i * 2 + (row === "host" ? 1 : 0)) * STEP : 0);

  const lines = result
    ? result.kind === "blackjack"
      ? [`¡Blackjack! Paga 3 a 2: ${result.payout} créditos.`, "¿Otra mano? Su apuesta sigue puesta."]
      : result.kind === "gana"
        ? [`Gana usted. Le pago ${result.payout} créditos.`, "¿Otra mano? Su apuesta sigue puesta."]
        : result.kind === "empate"
          ? ["Empate: su ficha vuelve.", "¿Otra mano?"]
          : [total > 21 ? "Se pasó de 21. La casa recoge." : "Esta es de la casa.", "La próxima es suya. ¿Otra mano?"]
    : closing
      ? ["Doy vuelta mi carta…", "La casa pide hasta 17."]
      : playing
        ? [total >= 17 ? `Tiene ${total}. ¿Se planta?` : `Tiene ${total}. ¿Carta o se planta?`, "Doblar: una ficha más y una sola carta."]
        : seed === null
          ? ["Bienvenido a la mesa. Ponga sus fichas en el círculo y repartimos.", "Blackjack paga 3 a 2. La casa se planta en 17."]
          : ["Repartiendo…"];

  return (
    <MesaShell id="blackjack" title="Blackjack" credits={credits} lines={lines} host="propio">
      {/* La mesa */}
      <div className="bj-mesa-felt relative mx-auto mt-1 flex w-full max-w-5xl flex-col items-center px-4 pb-8 pt-3 sm:px-10 sm:pb-10">
        {/* Bandeja de descarte, bandeja del crupier y el zapato */}
        <div className="flex w-full items-start justify-between">
          <span aria-hidden className="bj-discard mt-1 h-10 w-12 shrink-0 rounded-md sm:h-14 sm:w-16" />
          {/* El host de crupier, detrás del paño: habla según la jugada */}
          <HostSays lines={lines} tone="casino" size="sm" className="-mt-1 min-w-0 flex-1 justify-center px-2" />
          <span aria-hidden className="bj-shoe-mesa relative mt-1 h-12 w-16 shrink-0 rounded-lg sm:h-16 sm:w-24">
            <span className="absolute inset-y-1.5 right-1.5 w-[70%] rounded-sm bg-[repeating-linear-gradient(90deg,#3a1452_0_2px,#5E1F86_2px_4px)]" />
          </span>
        </div>

        {/* La mano del host */}
        <div className={`mt-1 flex flex-col items-center gap-1.5 ${wide ? "min-h-[11rem]" : "min-h-[7.5rem]"}`}>
          <div className="flex items-center gap-2 sm:gap-3">
            {seed === null ? (
              <span className="grid h-24 w-[4.25rem] place-items-center rounded-[9px] border border-dashed border-[#D4AF37]/40 sm:h-40 sm:w-28" aria-hidden>
                <BrandMark className="h-6 w-6 opacity-40" />
              </span>
            ) : (
              dealer.slice(0, closing ? dealer.length : 2).map((c, i) => (
                <PlayingCard
                  key={`${seed}-h${i}`}
                  card={c}
                  size={size}
                  faceUp={i !== 1 || closing}
                  startDown={i === 1}
                  delay={i < 2 ? dealDelay("host", i) : reduce ? 0 : hostCardAt(i)}
                  flipDelay={i === 1 ? (reduce ? 0 : FLIP_AT) : undefined}
                  from={shoeFrom("host")}
                  tilt={((i * 37) % 5) - 2}
                />
              ))
            )}
          </div>
          {seed !== null && <span className="bj-total-mesa rounded-full px-3 py-0.5 font-led text-xs font-bold tracking-[0.14em] sm:text-sm">HOST {hostTotal}</span>}
        </div>

        {/* Lo impreso en el paño */}
        <svg aria-hidden viewBox="0 12 600 84" className="pointer-events-none -my-1 block h-auto w-[78%] max-w-xl">
          <defs>
            <path id="bj-arc-a" d="M30 20 Q300 120 570 20" />
            <path id="bj-arc-b" d="M70 46 Q300 136 530 46" />
          </defs>
          <text fill="#ECC85F" fontSize="24" fontWeight="900" letterSpacing="5" fontFamily="ui-monospace, Menlo, monospace">
            <textPath href="#bj-arc-a" startOffset="50%" textAnchor="middle">
              BLACKJACK PAGA 3 A 2
            </textPath>
          </text>
          <text fill="#F5F0E6" fillOpacity="0.7" fontSize="12.5" fontWeight="800" letterSpacing="4" fontFamily="ui-monospace, Menlo, monospace">
            <textPath href="#bj-arc-b" startOffset="50%" textAnchor="middle">
              EL HOST SE PLANTA EN 17 · SOLO PUNTOS
            </textPath>
          </text>
        </svg>

        {/* Tu mano */}
        <div className={`flex flex-col items-center gap-1.5 ${wide ? "min-h-[11rem]" : "min-h-[7.5rem]"}`}>
          <div className="flex -space-x-6 sm:-space-x-8">
            {hand?.cards.map((c, i) => (
              <PlayingCard key={`${seed}-y${i}`} card={c} size={size} faceUp delay={dealDelay("yo", i)} from={shoeFrom("yo")} tilt={((i * 53) % 7) - 3} />
            ))}
          </div>
          {hand && (
            <span className={`bj-total-mesa rounded-full px-3 py-0.5 font-led text-xs font-bold tracking-[0.14em] sm:text-sm ${total > 21 ? "!text-amber-200" : ""}`}>
              TÚ {total}
              {hand.doubled ? " · DOBLASTE" : ""}
            </span>
          )}
        </div>

        {/* El círculo de apuesta: tus fichas y, si ganas, el pago que llega de la bandeja */}
        <div className="relative mt-1 grid h-20 w-20 place-items-center sm:h-24 sm:w-24">
          <span aria-hidden className="bj-bet-ring absolute inset-0 rounded-full" />
          <AnimatePresence>
            {shown > 0 && (
              <motion.span
                key={`apuesta-${seed ?? "x"}-${fresh ? "nueva" : "mano"}`}
                className="relative z-10"
                initial={reduce ? false : { y: 40, opacity: 0 }}
                animate={showResult && result?.kind === "pierde" ? { y: -260, opacity: 0, transition: { duration: 0.7, ease: [0.23, 1, 0.32, 1], delay: 0.15 } } : { y: 0, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
              >
                <ChipPile amount={shown} size={wide ? 56 : 46} />
              </motion.span>
            )}
            {showResult && result && result.payout > result.stake && (
              <motion.span
                key={`pago-${seed}`}
                className="absolute left-[78%] top-1 z-10"
                initial={reduce ? false : { y: -280, x: -40, opacity: 0, scale: 0.8 }}
                animate={{ y: 0, x: 0, opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.1 }}
              >
                <ChipPile amount={result.payout - result.stake} size={wide ? 52 : 42} />
              </motion.span>
            )}
          </AnimatePresence>
          <span className="pointer-events-none absolute -bottom-6 font-led text-[0.65rem] font-bold tracking-[0.2em] text-[#ECC85F]/80">
            APUESTA {shown}
          </span>
        </div>

        {/* El sello del resultado */}
        <AnimatePresence>
          {showResult && result && (
            <motion.span
              key={`sello-${seed}`}
              role="status"
              // Centrado por margen (el resorte anima el transform y borraría un translate)
              className={`bj-stamp-mesa pointer-events-none absolute inset-x-0 top-[46%] z-20 mx-auto w-max max-w-[90%] rounded-xl px-5 py-2 text-center font-display text-2xl font-black tracking-wide sm:text-4xl ${result.kind === "pierde" ? "is-lose" : result.kind === "empate" ? "is-push" : "is-win"}`}
              initial={reduce ? false : { scale: 1.7, opacity: 0, rotate: -10 }}
              animate={{ scale: 1, opacity: 1, rotate: -4 }}
              exit={{ opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
            >
              {result.kind === "blackjack" ? `¡BLACKJACK! +${result.payout - result.stake}` : result.kind === "gana" ? `GANAS +${result.payout - result.stake}` : result.kind === "empate" ? "EMPATE" : total > 21 ? "TE PASASTE" : "LA CASA GANA"}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Los controles: en la apuesta, la bandeja de fichas; en la mano, las jugadas */}
      <div className="mt-3 flex flex-col items-center gap-3">
        {playing ? (
          <div className="grid w-full max-w-xl grid-cols-3 gap-2">
            <button type="button" onClick={() => act("p")} className="casino-btn casino-btn-gold">
              Pedir carta
            </button>
            <button type="button" onClick={() => act("m")} className="casino-btn">
              Plantarme
            </button>
            <button type="button" disabled={!bjCanDouble(hand!.cards, hand!.status)} onClick={() => act("d")} className="casino-btn">
              Doblar <span className="block font-led text-[0.6rem] tracking-[0.16em] opacity-80">+{handBet}</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <ChipRack onPick={add} disabled={!betting} label="Fichas para apostar" />
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" disabled={!betting || bet === 0} onClick={() => setBet(0)} className="casino-btn !min-w-0 px-5">
                Borrar
              </button>
              <button type="button" disabled={!betting || bet < 5} onClick={deal} className="casino-btn casino-btn-gold px-8">
                {seed === null ? "Repartir" : "Repartir otra mano"} · {bet}
              </button>
            </div>
          </div>
        )}
        <div className="flex min-h-[2rem] flex-col items-center gap-2 text-center">
          {note && <p className="text-sm font-semibold text-[#F7E3A1]">{note}</p>}
          {history.length > 0 && (
            <ol aria-label="Tus últimas manos" className="flex flex-wrap justify-center gap-1.5">
              {history.map((w, i) => (
                <li key={history.length - i} className={`rounded-md px-2 py-0.5 font-led text-xs font-bold tracking-wider ${w > 0 ? "bg-[#D4AF37]/20 text-[#F7E3A1]" : w === 0 ? "bg-white/10 text-slate-200" : "bg-white/5 text-slate-400"}`}>
                  {w > 0 ? `+${w}` : w}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </MesaShell>
  );
}
