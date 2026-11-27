"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BrandMark } from "@/components/shell/AppShell";
import { audioEffects } from "@/lib/audioEffects";
import { ANILLO, FRUTA_BY_ID, LINEAS, type Casilla, type FrutaId, type FrutillitaResult } from "@/lib/frutillita";

/* Tiempos de la máquina (ms): giro, frenada de cada rodillo, cada línea que paga y cada vuelta del bonus */
const SPIN = 650;
const REEL_GAP = 230;
const LINE_MS = 650;
/** Lo que dura en promedio una vuelta del anillo (la primera de cada ronda es más larga; las siguientes, rápidas) */
const VUELTA_MS = 2300;
const LINE_COLORS = ["#F7F3E8", "#67AAFF", "#B93EF3", "#8CE3BE", "#E4B853", "#89BDFF", "#D793FF", "#B8F0D6", "#F3D98F"];
const STRIP: FrutaId[] = ["cereza", "limon", "uva", "durazno", "frutilla", "sandia", "campana", "siete", "logo"];

/** Cuánto dura la animación completa de una tirada (para pagar y habilitar la siguiente al final) */
export function frutillitaDuration(r: FrutillitaResult, reduce = false) {
  if (reduce) return 0;
  const land = SPIN + REEL_GAP * 4 + 400;
  const lines = Math.min(r.wins.length, 6) * LINE_MS;
  const bonus = r.vueltas.length ? 1400 + r.vueltas.length * VUELTA_MS : 0;
  return land + lines + bonus;
}

/** Un símbolo: frutas en ficha de vidrio; el logo de las copas es el comodín; la frutilla, la dispersa con su halo */
function Simbolo({ id, size, lit = false }: { id: FrutaId; size: "sm" | "md" | "lg"; lit?: boolean }) {
  const f = FRUTA_BY_ID.get(id)!;
  const txt = size === "lg" ? "text-6xl" : size === "md" ? "text-4xl" : "text-2xl";
  return (
    <span className={`fruta-cell relative grid h-full w-full place-items-center rounded-lg ${id === "frutilla" ? "is-frutilla" : ""} ${lit ? "is-lit" : ""}`}>
      {id === "logo" ? (
        <span className="flex flex-col items-center">
          <BrandMark className={size === "lg" ? "h-12 w-12" : size === "md" ? "h-9 w-9" : "h-6 w-6"} />
          <span className="font-led text-[0.55rem] font-black tracking-[0.18em] text-indigo-100">COMODÍN</span>
        </span>
      ) : id === "siete" ? (
        <span className={`font-led font-black text-[#F3D98F] [text-shadow:0_0_14px_rgba(228,184,83,0.9)] ${txt}`}>7</span>
      ) : (
        <span className={`${txt} drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]`}>{f.label}</span>
      )}
    </span>
  );
}

/** Medidor LED de la barra superior: el número corre hasta su valor */
function Led({ label, value, color = "text-amber-100" }: { label: string; value: number; color?: string }) {
  return (
    <div className="credit-meter flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-2.5 py-1.5" role="status" aria-label={`${label}: ${value}`}>
      <span className="font-led text-[0.6rem] font-bold tracking-[0.18em] text-amber-200/70">{label}</span>
      <span aria-hidden className={`font-led text-lg font-black tabular-nums ${color} [text-shadow:0_0_10px_rgba(228,184,83,0.6)]`}>
        {String(value).padStart(5, "0")}
      </span>
    </div>
  );
}

/**
 * La Frutillita: gabinete de 5×3 con 9 líneas numeradas a los costados, barra LED (apuesta, paga y créditos), rodillos
 * que frenan uno tras otro, líneas de neón que se dibujan al pagar y, con 3 frutillas o más, «La vuelta»: la
 * mini-máquina del centro gira y una luz corre por el anillo de frutas hasta detenerse; si coincide con el centro,
 * paga, y sigue hasta caer en SALIDA.
 */
export default function FrutillitaMachine({
  result,
  spinning,
  tv = false,
  credits,
  player,
  onDone,
}: {
  result: FrutillitaResult | null;
  spinning: boolean;
  tv?: boolean;
  credits?: number;
  player?: string;
  /** Avisa cuando la tirada terminó de verdad (rodillos, líneas y La vuelta, aunque se haya saltado) */
  onDone?: () => void;
}) {
  const reduce = useReducedMotion() ?? false;
  const key = result ? result.grid.flat().join() + result.win : "idle";
  const [phase, setPhase] = useState<"idle" | "land" | "lines" | "bonus" | "done">("idle");
  const [lineIdx, setLineIdx] = useState(-1);
  const [paid, setPaid] = useState(0);
  const wins = useMemo(() => (result ? result.wins.slice(0, 6) : []), [result]);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (phase === "done") done.current?.();
  }, [phase]);

  // La secuencia de una tirada: frenan los rodillos, se dibujan las líneas una por una y, si hay, La vuelta
  useEffect(() => {
    if (!result || spinning) {
      setPhase("idle");
      setLineIdx(-1);
      setPaid(0);
      return;
    }
    if (reduce) {
      setPhase("done");
      setLineIdx(wins.length - 1);
      setPaid(result.win);
      return;
    }
    const timers: number[] = [];
    setPhase("land");
    const landAt = SPIN + REEL_GAP * 4 + 400;
    for (let i = 0; i < 5; i++) timers.push(window.setTimeout(() => audioEffects.playTick(300 + i * 60, 0.05), SPIN + REEL_GAP * i));
    let acc = 0;
    wins.forEach((w, i) => {
      timers.push(
        window.setTimeout(() => {
          setPhase("lines");
          setLineIdx(i);
          acc += w.pay;
          setPaid(acc);
          audioEffects.playCoin();
        }, landAt + i * LINE_MS),
      );
    });
    const afterLines = landAt + wins.length * LINE_MS;
    if (result.vueltas.length) timers.push(window.setTimeout(() => setPhase("bonus"), afterLines + 300));
    else timers.push(window.setTimeout(() => setPhase("done"), afterLines));
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [key, spinning, reduce, result, wins]);

  const litCells = useMemo(() => {
    const set = new Set<string>();
    wins.slice(0, lineIdx + 1).forEach((w) => w.cells.forEach(([c, r]) => set.add(`${c}-${r}`)));
    return set;
  }, [wins, lineIdx]);

  const cell = tv ? "h-28 w-28" : "h-[4.1rem] w-[3.6rem] sm:h-20 sm:w-[4.5rem]";
  const size = tv ? "lg" : "md";
  const lines = result?.lines ?? 9;
  const bet = result?.bet ?? 1;

  return (
    <div className="frutillita-cabinet relative mx-auto w-full max-w-[34rem] rounded-[28px] p-2.5 sm:p-3.5">
      {/* Barra LED */}
      <div className="flex gap-1.5">
        <Led label="APUESTA" value={lines * bet} />
        <Led label="PAGA" value={phase === "idle" ? 0 : paid} color="text-[#F3D98F]" />
        {credits !== undefined && <Led label="CRÉDITOS" value={credits} color="text-indigo-100" />}
      </div>
      {/* Marquesina */}
      <div className="slot-marquee relative my-2 flex items-center justify-center gap-2 rounded-xl border border-indigo-400/40 px-4 py-1.5">
        <span className="text-xl">🍓</span>
        <span className={`font-display font-black tracking-wide text-white [text-shadow:0_0_14px_rgba(185,62,243,0.9)] ${tv ? "text-tv-md" : "text-lg sm:text-2xl"}`}>La Frutillita</span>
        <span className="font-led text-[0.6rem] font-bold tracking-[0.2em] text-indigo-200/80">TONIGHT</span>
      </div>

      {/* Rodillos con las líneas numeradas a los costados */}
      <div className="relative flex items-stretch gap-1">
        <LineNumbers side="left" lines={lines} lit={wins.slice(0, lineIdx + 1).map((w) => w.line)} />
        <div className="slot-bezel relative rounded-2xl p-[3px]">
          <div className="relative flex gap-1 rounded-[13px] bg-[#0b1030] p-1">
            {[0, 1, 2, 3, 4].map((reel) => (
              <div key={reel} className="reel-window relative overflow-hidden rounded-md">
                {spinning || !result ? (
                  <div className={`flex flex-col gap-1 ${spinning && !reduce ? "fruta-blur" : ""}`} style={{ animationDelay: `${reel * -90}ms` }}>
                    {(spinning ? STRIP.concat(STRIP) : STRIP.slice(reel, reel + 3)).map((s, k) => (
                      <span key={k} className={cell}>
                        <Simbolo id={s} size={size} />
                      </span>
                    ))}
                  </div>
                ) : (
                  <motion.div
                    key={key + reel}
                    className="flex flex-col gap-1"
                    initial={reduce ? false : { y: "-110%", filter: "blur(3px)" }}
                    animate={{ y: 0, filter: "blur(0px)" }}
                    transition={{ type: "spring", stiffness: 260, damping: 18, mass: 0.8, delay: (SPIN + REEL_GAP * reel) / 1000 - 0.15 }}
                  >
                    {result.grid[reel].map((s, row) => (
                      <span key={row} className={cell}>
                        <Simbolo id={s} size={size} lit={litCells.has(`${reel}-${row}`) || (s === "frutilla" && result.frutillas >= 3 && phase !== "land")} />
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
            {/* Las líneas que pagan, dibujadas en neón una tras otra */}
            {result && !spinning && (
              <svg aria-hidden className="pointer-events-none absolute inset-1" viewBox="0 0 500 300" preserveAspectRatio="none">
                {wins.slice(0, lineIdx + 1).map((w) => {
                  const pts = LINEAS[w.line].map((row, reel) => `${reel * 100 + 50},${row * 100 + 50}`).join(" ");
                  return (
                    <motion.polyline
                      key={`${key}-${w.line}`}
                      points={pts}
                      fill="none"
                      stroke={LINE_COLORS[w.line]}
                      strokeWidth="5"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                      style={{ filter: `drop-shadow(0 0 6px ${LINE_COLORS[w.line]})` }}
                      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
                    />
                  );
                })}
              </svg>
            )}
          </div>
        </div>
        <LineNumbers side="right" lines={lines} lit={wins.slice(0, lineIdx + 1).map((w) => w.line)} />
      </div>

      {/* Lo que pasó */}
      <p className={`mt-2 min-h-[1.5em] text-center font-semibold text-slate-200 ${tv ? "text-tv-sm" : "text-sm"}`} aria-live="polite">
        {phase === "idle" ? (spinning ? "Girando…" : "9 líneas · el logo es comodín · 3 🍓 abren La vuelta") : phase === "land" ? "…" : `${player ? `${player}: ` : ""}${result?.label}`}
      </p>

      {/* La vuelta: pantalla de bonus sobre la máquina */}
      <AnimatePresence>{result && phase === "bonus" && <LaVuelta key={key} result={result} tv={tv} onPaid={(n) => setPaid((p) => p + n)} onEnd={() => setPhase("done")} skippable={!tv} />}</AnimatePresence>
    </div>
  );
}

function LineNumbers({ side, lines, lit }: { side: "left" | "right"; lines: number; lit: number[] }) {
  // Orden clásico de los números a los costados (como en las máquinas de frutas)
  const order = side === "left" ? [1, 3, 5, 7, 9, 8, 6, 4, 2] : [2, 4, 6, 8, 9, 7, 5, 3, 1];
  return (
    <div aria-hidden className="flex flex-col justify-around py-1">
      {order.map((n) => (
        <span
          key={n}
          className={`grid h-5 w-5 place-items-center rounded-full font-led text-[0.65rem] font-black transition-[opacity,box-shadow] duration-200 ${n <= lines ? "opacity-100" : "opacity-25"} ${lit.includes(n - 1) ? "ring-2 ring-white" : ""}`}
          style={{ background: LINE_COLORS[n - 1], color: "#090A0D", boxShadow: lit.includes(n - 1) ? `0 0 12px ${LINE_COLORS[n - 1]}` : undefined }}
        >
          {n}
        </span>
      ))}
    </div>
  );
}

/**
 * «La vuelta»: el anillo de 24 casillas (todas las frutas y SALIDA) alrededor de una mini-máquina de 4 rodillos. En
 * cada vuelta giran los rodillos chicos, la luz corre por el anillo frenando de a poco y se detiene; si la fruta salió
 * en el centro, paga y se ilumina; si es SALIDA, termina (o pasa a la ronda siguiente).
 */
function LaVuelta({ result, tv, onPaid, onEnd, skippable = false }: { result: FrutillitaResult; tv: boolean; onPaid: (n: number) => void; onEnd: () => void; skippable?: boolean }) {
  const reduce = useReducedMotion() ?? false;
  const [k, setK] = useState(0);
  const [light, setLight] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [total, setTotal] = useState(0);
  const lightRef = useRef(0);
  const v = result.vueltas[Math.min(k, result.vueltas.length - 1)];

  useEffect(() => {
    if (!v) return;
    setStopped(false);
    const timers: number[] = [];
    const n = ANILLO.length;
    // La primera vuelta de cada ronda es la de suspenso (dos vueltas de anillo que frenan de a poco); las siguientes,
    // una vuelta rápida: el bonus no puede dejar a nadie mirando un minuto sin jugar
    const first = k === 0 || result.vueltas[k - 1]?.ronda !== v.ronda;
    const from = lightRef.current;
    const dist = ((v.index - from + n) % n) + n * (first ? 2 : 1);
    let t = first ? 600 : 250;
    for (let s = 1; s <= dist; s++) {
      const p = s / dist;
      t += first ? 24 + 150 * p * p * p : 10 + 70 * p * p * p;
      const at = (from + s) % n;
      timers.push(
        window.setTimeout(() => {
          lightRef.current = at;
          setLight(at);
          if (s % 2 === 0 || p > 0.8) audioEffects.playTick(900 + (s % 3) * 120, 0.015);
        }, reduce ? 0 : t),
      );
    }
    timers.push(
      window.setTimeout(() => {
        setStopped(true);
        if (v.pay > 0) {
          audioEffects.playJackpot();
          setTotal((x) => x + v.pay);
          onPaid(v.pay);
        } else if (v.casilla === "salida") audioEffects.playTick(160, 0.12);
      }, reduce ? 0 : t + 150),
    );
    timers.push(
      window.setTimeout(() => {
        if (k + 1 < result.vueltas.length) setK(k + 1);
        else onEnd();
      }, reduce ? 0 : Math.max(t + (first ? 800 : 500), 1100)),
    );
    return () => timers.forEach((x) => window.clearTimeout(x));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [k]);

  const n = ANILLO.length;
  return (
    <motion.div
      className="absolute inset-0 z-20 grid place-items-center rounded-[28px] bg-[radial-gradient(70%_60%_at_50%_45%,rgba(185,62,243,0.35),rgba(9,10,13,0.96)_75%)] backdrop-blur-sm"
      initial={reduce ? false : { opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      role="dialog"
      aria-label="La vuelta: bonus de la Frutillita"
    >
      <div className={`relative ${tv ? "h-[34rem] w-[34rem]" : "h-[19rem] w-[19rem] sm:h-[23rem] sm:w-[23rem]"}`}>
        {/* El anillo */}
        {ANILLO.map((c, i) => {
          const a = (i / n) * Math.PI * 2 - Math.PI / 2;
          const on = i === light;
          const win = on && stopped;
          return (
            <span
              key={i}
              className={`vuelta-casilla absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-lg ${tv ? "h-16 w-16" : "h-9 w-9 sm:h-11 sm:w-11"} ${on ? "is-on" : ""} ${win && c !== "salida" && v.pay > 0 ? "is-win" : ""} ${c === "salida" ? "is-salida" : ""}`}
              style={{ left: `${50 + Math.cos(a) * 44}%`, top: `${50 + Math.sin(a) * 44}%` }}
            >
              <CasillaIcon c={c} tv={tv} />
            </span>
          );
        })}
        {/* El centro: título, mini-máquina de 4 rodillos y lo acumulado */}
        <div className="absolute inset-[22%] flex flex-col items-center justify-center gap-2 text-center">
          <span className={`font-display font-black text-white [text-shadow:0_0_16px_rgba(185,62,243,0.95)] ${tv ? "text-tv-md" : "text-lg sm:text-xl"}`}>La vuelta</span>
          <span className="font-led text-[0.6rem] font-bold tracking-[0.2em] text-indigo-200/80">
            RONDA {v?.ronda ?? 1} · VUELTA {k + 1}
          </span>
          <div className="flex gap-1 rounded-lg bg-[#0b1030] p-1 ring-1 ring-[#E4B853]/50">
            {(v?.inner ?? []).map((f, i) => (
              <motion.span
                key={`${k}-${i}`}
                className={`grid ${tv ? "h-16 w-14" : "h-9 w-8 sm:h-11 sm:w-9"} place-items-center rounded ${stopped && v.casilla === f ? "bg-amber-300/30 ring-1 ring-amber-200" : "bg-white/5"}`}
                initial={reduce ? false : { y: -16, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 16, delay: 0.1 + i * 0.12 }}
              >
                <span className={tv ? "text-4xl" : "text-xl"}>{f === "logo" ? <BrandMark className="h-5 w-5" /> : f === "siete" ? <b className="font-led text-[#F3D98F]">7</b> : FRUTA_BY_ID.get(f)!.label}</span>
              </motion.span>
            ))}
          </div>
          <span className="font-led text-sm font-black tracking-[0.14em] text-[#F3D98F]" aria-live="polite">
            {stopped ? (v.casilla === "salida" ? "SALIDA" : v.pay > 0 ? `+${v.pay}` : "SIN PREMIO") : "…"} · {String(total).padStart(4, "0")}
          </span>
          {skippable && (
            <button
              type="button"
              onClick={() => {
                // Cobrar ya: lo que falta del bonus entra de una y se vuelve a la máquina
                const all = result.vueltas.reduce((a, x) => a + x.pay, 0);
                if (all > total) onPaid(all - total);
                onEnd();
              }}
              className="machine-btn mt-1 !min-h-[34px] !px-3 !text-[0.65rem]"
            >
              Cobrar ya
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function CasillaIcon({ c, tv }: { c: Casilla; tv: boolean }) {
  if (c === "salida") return <span className={`font-led font-black tracking-wider text-slate-200 ${tv ? "text-sm" : "text-[0.5rem] sm:text-[0.6rem]"}`}>SALIDA</span>;
  if (c === "logo") return <BrandMark className={tv ? "h-9 w-9" : "h-5 w-5"} />;
  if (c === "siete") return <span className={`font-led font-black text-[#F3D98F] ${tv ? "text-3xl" : "text-base"}`}>7</span>;
  return <span className={tv ? "text-4xl" : "text-lg sm:text-xl"}>{FRUTA_BY_ID.get(c)!.label}</span>;
}
