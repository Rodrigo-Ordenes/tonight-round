"use client";

import React, { useEffect, useRef, useState } from "react";
import SlotLever from "./SlotLever";
import { Check, Lock } from "lucide-react";
import type { LiveRound, Participant } from "@/lib/carreteState";
import { reflejosDelay, ultimoPasos, pairVote, type UltimoPaso } from "@/lib/partyGames";
import { MAX_FICHAS_RULETA, bjCanDouble, bjDealerHand, bjPlayerHand, parseRouletteBets } from "@/lib/casinoGames";
import { PlayingCard, RouletteFelt } from "@/components/party/CasinoTables";
import { audioEffects } from "@/lib/audioEffects";

/**
 * Mando del celular para Party Games: cada juego con su forma de elegir. Lo elegido viaja como un voto secreto
 * (VOTE) y queda bloqueado; la TV revela con la semilla de la ronda.
 */
export default function PartyControls({ round, me, people, vote }: { round: LiveRound; me: Participant; people: Participant[]; vote: (value: string) => void }) {
  const mine = round.votes[me.id]?.value;
  switch (round.game) {
    // Tragamonedas: se agarra la palanca y se tira, como en la máquina
    case "tragamonedas":
    case "tragabar":
    case "frutillita":
      return mine ? (
        <Locked>Palanca tirada. Mira los rodillos en la TV.</Locked>
      ) : (
        <div className="flex flex-col items-center gap-2 py-2">
          <SlotLever size="lg" onPull={() => vote("tirar")} />
          <p className="text-sm text-slate-300">Agarra la palanca y tírala hacia abajo.</p>
        </div>
      );
    // Blackjack mano a mano: tu mano en el celular y, en cada momento, pedir, plantarse o doblar
    case "blackjack":
      return <BlackjackPhone key={round.id} round={round} me={me} mine={mine} onAct={vote} />;
    // Ruleta: el paño en el celular; pones hasta 5 fichas y las mandas a la mesa
    case "ruleta":
      return <RoulettePhone key={round.id} mine={mine} onSend={vote} />;
    case "proximidad":
      return <NumberPick key={round.id} mine={mine} onLock={(n) => vote(String(n))} suffix="" />;
    case "porcentaje":
      return <PercentPick key={round.id} mine={mine} onLock={(pct, yes) => vote(pairVote(String(pct), yes ? "si" : "no"))} />;
    case "mayoria":
      return <TwoStep key={round.id} round={round} mine={mine} onLock={(pred, ans) => vote(pairVote(pred, ans))} />;
    case "casilla":
      return <Grid key={round.id} round={round} mine={mine} cols={3} onPick={vote} kind="casilla" />;
    case "cajas":
      return <Grid key={round.id} round={round} mine={mine} cols={3} onPick={vote} kind="caja" />;
    case "cronometro":
      return <Bomb key={round.id} mine={mine} onStop={(ms) => vote(String(ms))} />;
    case "reflejos":
      return <Reflex key={round.id} round={round} mine={mine} onDone={vote} />;
    case "ultimo":
      return <LastStanding key={round.id} round={round} mine={mine} onDone={(n) => vote(String(n))} />;
    case "mentiroso":
    case "infiltrado":
      return <Options round={round} mine={mine} onPick={vote} exclude={people.length > 1 ? me.id : undefined} people={people} />;
    default:
      return <Options round={round} mine={mine} onPick={vote} />;
  }
}

/** Mensaje de elección bloqueada */
function Locked({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center text-sm font-bold text-emerald-100">
      <Lock className="h-4 w-4" aria-hidden /> {children}
    </p>
  );
}

const confirm = () => {
  audioEffects.playPop();
  audioEffects.triggerHaptic(20);
};

function Options({ round, mine, onPick, exclude }: { round: LiveRound; mine?: string; onPick: (v: string) => void; exclude?: string; people?: Participant[] }) {
  const opts = round.options.filter((o) => o.id !== exclude);
  return (
    <div className={`grid gap-2 ${opts.length <= 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"}`}>
      {opts.map((o) => {
        const on = mine === o.id;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => {
              confirm();
              onPick(o.id);
            }}
            className={`min-h-[56px] rounded-2xl border px-4 text-left text-base font-bold transition-[transform,background-color,border-color] active:scale-[0.97] ${
              on ? "border-indigo-300 bg-indigo-500 text-night-950" : "border-white/10 bg-white/[0.04] text-white hover:border-white/25"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="min-w-0 break-words">{o.label}</span>
              {on && <Check className="h-5 w-5" aria-hidden />}
            </span>
          </button>
        );
      })}
      <p className="col-span-full text-center text-xs text-slate-400">{mine ? "Elegido en secreto ✓ · puedes cambiarlo hasta que revelen" : "Tu elección es secreta"}</p>
    </div>
  );
}

function NumberPick({ mine, onLock, suffix }: { mine?: string; onLock: (n: number) => void; suffix: string }) {
  const [n, setN] = useState(50);
  if (mine) return <Locked>Elegiste {mine}{suffix}</Locked>;
  const step = (d: number) => setN((x) => Math.max(0, Math.min(100, x + d)));
  return (
    <div className="space-y-4">
      <p className="text-center font-led text-7xl font-black tracking-[0.08em] text-indigo-100 neon-blue" aria-live="polite">
        {n}
        {suffix}
      </p>
      <input type="range" min={0} max={100} value={n} onChange={(e) => setN(Number(e.target.value))} aria-label="Tu número" className="party-range w-full" />
      <div className="grid grid-cols-4 gap-2">
        {[-10, -1, 1, 10].map((d) => (
          <button key={d} type="button" onClick={() => step(d)} className="min-h-[48px] rounded-2xl border border-white/10 bg-white/[0.04] font-mono text-lg font-bold text-white active:scale-[0.96]">
            {d > 0 ? `+${d}` : d}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => {
          confirm();
          onLock(n);
        }}
        className="btn-primary w-full !min-h-[56px] text-base"
      >
        <Lock className="h-4 w-4" aria-hidden /> Bloquear {n}
        {suffix}
      </button>
    </div>
  );
}

function PercentPick({ mine, onLock }: { mine?: string; onLock: (pct: number, yes: boolean) => void }) {
  const [pct, setPct] = useState(50);
  const [yes, setYes] = useState<boolean | null>(null);
  if (mine) {
    const [p, a] = mine.split("|");
    return <Locked>Predijiste {p} % · respondiste {a === "si" ? "sí" : "no"}</Locked>;
  }
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow">1 · ¿Qué porcentaje dirá que sí?</p>
        <p className="mt-2 text-center font-led text-6xl font-black text-indigo-100 neon-blue">{pct} %</p>
        <input type="range" min={0} max={100} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} aria-label="Tu predicción en porcentaje" className="party-range mt-2 w-full" />
      </div>
      <div>
        <p className="eyebrow">2 · ¿Y tú?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button key={String(v)} type="button" aria-pressed={yes === v} onClick={() => setYes(v)} className={`min-h-[52px] rounded-2xl border text-base font-bold active:scale-[0.97] ${yes === v ? "border-indigo-300 bg-indigo-500 text-night-950" : "border-white/10 bg-white/[0.04] text-white"}`}>
              {v ? "Sí" : "No"}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        disabled={yes === null}
        onClick={() => {
          confirm();
          onLock(pct, !!yes);
        }}
        className="btn-primary w-full !min-h-[56px] text-base"
      >
        <Lock className="h-4 w-4" aria-hidden /> Bloquear
      </button>
    </div>
  );
}

function TwoStep({ round, mine, onLock }: { round: LiveRound; mine?: string; onLock: (pred: string, ans: string) => void }) {
  const [pred, setPred] = useState<string | null>(null);
  const label = (id?: string) => round.options.find((o) => o.id === id)?.label ?? "";
  if (mine) {
    const [p, a] = mine.split("|");
    return <Locked>Predijiste {label(p)} · respondiste {label(a)}</Locked>;
  }
  return (
    <div className="space-y-3">
      <p className="eyebrow">{pred ? "2 · ¿Y tú qué eliges?" : "1 · ¿Qué elegirá la mayoría?"}</p>
      <div className="grid grid-cols-2 gap-2">
        {round.options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              if (!pred) {
                audioEffects.playTick();
                setPred(o.id);
              } else {
                confirm();
                onLock(pred, o.id);
              }
            }}
            className="min-h-[56px] rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-left text-base font-bold text-white active:scale-[0.97] hover:border-white/25"
          >
            {o.label}
          </button>
        ))}
      </div>
      {pred && (
        <p className="text-center text-xs text-slate-400">
          Predijiste {label(pred)}.{" "}
          <button type="button" onClick={() => setPred(null)} className="underline">
            Cambiar
          </button>
        </p>
      )}
    </div>
  );
}

function Grid({ round, mine, cols, onPick, kind }: { round: LiveRound; mine?: string; cols: number; onPick: (v: string) => void; kind: "casilla" | "caja" }) {
  return (
    <div className="space-y-2">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {round.options.map((o) => {
          const on = mine === o.id;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              aria-label={kind === "caja" ? `Caja ${o.id}` : `Casilla ${o.id}`}
              onClick={() => {
                confirm();
                onPick(o.id);
              }}
              className={`party-cell grid aspect-square place-items-center rounded-2xl border text-2xl font-black transition-[transform,background-color,border-color] active:scale-[0.94] ${
                on ? "border-indigo-300 bg-indigo-500 text-night-950 shadow-neon" : "border-white/10 bg-white/[0.04] text-white hover:border-indigo-400/40"
              }`}
            >
              {kind === "caja" ? <span aria-hidden>🎁</span> : o.label}
            </button>
          );
        })}
      </div>
      <p className="text-center text-xs text-slate-400">{mine ? `Elegiste la ${kind} ${mine} ✓ · puedes cambiarla hasta que revelen` : `Elige tu ${kind} en secreto`}</p>
    </div>
  );
}

/** La bomba de tiempo: el reloj se ve 1,5 s y después se apaga; hay que sentir el segundo secreto */
function Bomb({ mine, onStop }: { mine?: string; onStop: (ms: number) => void }) {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (start === null) return;
    let raf = 0;
    const loop = () => {
      setNow(performance.now());
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  if (mine) return <Locked>Detuviste la bomba en {(Number(mine) / 1000).toLocaleString("es-CL", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} s</Locked>;
  const elapsed = start === null ? 0 : now - start;
  const blind = elapsed > 1500;
  return (
    <div className="space-y-4 text-center">
      <div className={`party-bomb mx-auto grid h-36 w-36 place-items-center rounded-full border-2 ${start === null ? "border-white/15" : "border-amber-300/60 party-bomb-on"}`} aria-hidden>
        <span className="text-6xl">💣</span>
      </div>
      <p className="font-led text-4xl font-black text-indigo-100" aria-live="off">
        {start === null ? "0,00 s" : blind ? "?,?? s" : `${(elapsed / 1000).toFixed(2).replace(".", ",")} s`}
      </p>
      {start === null ? (
        <button
          type="button"
          onClick={() => {
            audioEffects.playTick(660, 0.08);
            setStart(performance.now());
            setNow(performance.now());
          }}
          className="btn-primary w-full !min-h-[60px] text-lg"
        >
          Encender la mecha
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            confirm();
            onStop(Math.round(performance.now() - start));
          }}
          className="w-full min-h-[72px] rounded-3xl bg-amber-300 text-xl font-black text-night-950 shadow-[0_0_40px_-8px_rgba(228,184,83,0.8)] active:scale-[0.97]"
        >
          ¡DETENER!
        </button>
      )}
      <p className="text-xs text-slate-400">El reloj se apaga a los 1,5 s. Solo vale el primer intento.</p>
    </div>
  );
}

/** No te adelantes: espera la señal; tocar antes descalifica */
function Reflex({ round, mine, onDone }: { round: LiveRound; mine?: string; onDone: (v: string) => void }) {
  const [phase, setPhase] = useState<"idle" | "wait" | "go">("idle");
  const goAt = useRef(0);
  const timer = useRef(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  if (mine) return <Locked>{mine === "early" ? "Te adelantaste: quedaste fuera" : `Tu reacción: ${mine} ms`}</Locked>;
  const ready = () => {
    setPhase("wait");
    timer.current = window.setTimeout(() => {
      goAt.current = performance.now();
      setPhase("go");
      audioEffects.triggerHaptic(40);
    }, reflejosDelay(round.seed ?? 0));
  };
  const tap = () => {
    if (phase === "wait") {
      window.clearTimeout(timer.current);
      audioEffects.playBuzz();
      onDone("early");
    } else if (phase === "go") {
      confirm();
      onDone(String(Math.round(performance.now() - goAt.current)));
    }
  };
  if (phase === "idle")
    return (
      <button type="button" onClick={ready} className="btn-primary w-full !min-h-[60px] text-lg">
        Estoy listo
      </button>
    );
  return (
    <button
      type="button"
      onPointerDown={tap}
      className={`grid min-h-[220px] w-full place-items-center rounded-3xl text-3xl font-black transition-colors duration-75 ${
        phase === "go" ? "bg-emerald-300 text-night-950 shadow-[0_0_60px_-10px_rgba(140,227,190,0.9)]" : "bg-rose-500/80 text-white"
      }`}
    >
      {phase === "go" ? "¡AHORA!" : "Espera…"}
    </button>
  );
}

/** Último en pie: 12 instrucciones con cada vez menos tiempo; el primer error o el tiempo agotado terminan */
function LastStanding({ round, mine, onDone }: { round: LiveRound; mine?: string; onDone: (n: number) => void }) {
  const [steps] = useState<UltimoPaso[]>(() => ultimoPasos(round.seed ?? 0));
  const [i, setI] = useState(-1);
  const deadline = useRef(0);
  const [, force] = useState(0);
  const finished = useRef(false);
  const finish = (n: number) => {
    if (finished.current) return;
    finished.current = true;
    onDone(n);
  };
  useEffect(() => {
    if (i < 0 || i >= steps.length || finished.current) return;
    deadline.current = performance.now() + steps[i].ms;
    const iv = window.setInterval(() => {
      if (performance.now() >= deadline.current) {
        window.clearInterval(iv);
        audioEffects.playBuzz();
        finish(i);
      } else force((x) => x + 1);
    }, 50);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i]);
  if (mine) return <Locked>Llegaste a {mine} de 12</Locked>;
  if (i < 0)
    return (
      <button type="button" onClick={() => setI(0)} className="btn-primary w-full !min-h-[60px] text-lg">
        Empezar
      </button>
    );
  const step = steps[i];
  const left = Math.max(0, deadline.current - performance.now());
  return (
    <div className="space-y-3">
      <p className="flex items-center justify-between text-xs text-slate-400">
        <span>Paso {i + 1} de 12</span>
        <span className="font-mono">{(left / 1000).toFixed(1)} s</span>
      </p>
      <p className="display text-center text-3xl">{step.text}</p>
      <div className="grid grid-cols-2 gap-2">
        {step.options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-label={o.label || o.id}
            onPointerDown={() => {
              if (o.id === step.answer) {
                audioEffects.playTick(880, 0.05);
                if (i + 1 >= steps.length) finish(12);
                else setI(i + 1);
              } else {
                audioEffects.playBuzz();
                finish(i);
              }
            }}
            className="grid min-h-[84px] place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-2xl font-black text-white active:scale-[0.95]"
            style={o.color ? { background: o.color } : undefined}
          >
            {o.label ? <Shape name={o.label} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}

function Shape({ name }: { name: string }) {
  const common = { className: "h-10 w-10", fill: "none", stroke: "currentColor", strokeWidth: 2.4 } as const;
  if (name === "círculo") return <svg viewBox="0 0 40 40" {...common}><circle cx="20" cy="20" r="14" /></svg>;
  if (name === "cuadrado") return <svg viewBox="0 0 40 40" {...common}><rect x="7" y="7" width="26" height="26" rx="3" /></svg>;
  if (name === "triángulo") return <svg viewBox="0 0 40 40" {...common}><path d="M20 6 L35 33 H5 Z" /></svg>;
  if (name === "estrella") return <svg viewBox="0 0 40 40" {...common}><path d="M20 4 L24.5 15 L36 15.5 L27 23 L30 34.5 L20 28 L10 34.5 L13 23 L4 15.5 L15.5 15 Z" /></svg>;
  return <span>{name}</span>;
}

/**
 * El blackjack en el celular, como sentado en la mesa: ves tu mano y la carta visible del host, y decides jugada a
 * jugada. Cada decisión se suma a tu voto («ppm» = pidió, pidió y se plantó), así la TV va mostrando tu mano en vivo.
 */
function BlackjackPhone({ round, me, mine, onAct }: { round: LiveRound; me: Participant; mine?: string; onAct: (v: string) => void }) {
  const seed = round.seed ?? 0;
  const actions = mine ?? "";
  const h = bjPlayerHand(seed, me.id, actions);
  const up = bjDealerHand(seed)[0];
  const act = (a: "p" | "m" | "d") => {
    confirm();
    onAct(actions + a);
  };
  const done = h.status !== "jugando";
  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3 rounded-2xl bg-[#0c3328] p-3 shadow-[inset_0_0_0_1px_rgba(228,184,83,0.45)]">
        <div className="flex flex-col items-center gap-1">
          <span className="font-led text-[0.65rem] tracking-[0.16em] text-amber-100/80">HOST</span>
          <div className="flex -space-x-4">
            <PlayingCard card={up} faceUp size="sm" />
            <PlayingCard card={up} faceUp={false} startDown size="sm" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="font-led text-[0.65rem] tracking-[0.16em] text-emerald-100/80">TU MANO · {h.value}</span>
          <div className="flex -space-x-5">
            {h.cards.map((c, i) => (
              <PlayingCard key={`${i}-${c.rank}${c.suit}`} card={c} faceUp size="md" from={i >= 2 ? { x: 80, y: -120 } : undefined} />
            ))}
          </div>
        </div>
      </div>
      {done && actions ? (
        <Locked>
          {h.status === "pasado" ? `Te pasaste con ${h.value}.` : h.status === "doblado" ? `Doblaste: ${h.value}.` : h.status === "blackjack" ? "¡Blackjack!" : `Te plantaste con ${h.value}.`} Mira la mesa en la TV.
        </Locked>
      ) : h.status === "blackjack" ? (
        <button type="button" onClick={() => act("m")} className="btn-primary !min-h-[52px] w-full justify-center">
          ¡Blackjack! Cobrar
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => act("p")} className="btn-primary !min-h-[52px] justify-center">
            Pedir carta
          </button>
          <button type="button" onClick={() => act("m")} className="btn-ghost !min-h-[52px] justify-center">
            Plantarme
          </button>
          <button type="button" disabled={!bjCanDouble(h.cards, h.status)} onClick={() => act("d")} className="btn-ghost !min-h-[52px] justify-center disabled:opacity-40">
            Doblar
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * La ruleta en el celular: el paño vertical, como parado frente a la mesa. Cada toque pone una ficha (plenos, docenas,
 * color, par o impar; hasta 5). «Apostar» las manda a la mesa; mientras no gire la bola se pueden cambiar.
 */
function RoulettePhone({ mine, onSend }: { mine?: string; onSend: (v: string) => void }) {
  const [ids, setIds] = useState<string[]>(() => parseRouletteBets(mine ?? "").map((b) => (b.id === "cero" ? "cero" : b.id)));
  const sent = mine ?? "";
  const value = ids.join(".");
  const full = ids.length >= MAX_FICHAS_RULETA;
  return (
    <div className="space-y-3">
      <p className="text-center text-sm text-slate-300">
        Fichas: <b className="font-led text-white">{ids.length}</b> / {MAX_FICHAS_RULETA} · toca el paño para apostar
      </p>
      <RouletteFelt
        vertical
        chips={ids.map((id) => ({ id, tag: "●" }))}
        n={null}
        disabled={full}
        onBet={(id) => {
          confirm();
          setIds((x) => (x.length >= MAX_FICHAS_RULETA ? x : [...x, id]));
        }}
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={() => setIds([])} disabled={!ids.length} className="btn-ghost !min-h-[48px] justify-center disabled:opacity-40">
          Borrar fichas
        </button>
        <button
          type="button"
          disabled={!ids.length || value === sent}
          onClick={() => {
            confirm();
            onSend(value);
          }}
          className="btn-primary !min-h-[48px] justify-center disabled:opacity-50"
        >
          {sent && value === sent ? "En la mesa ✓" : "Apostar"}
        </button>
      </div>
    </div>
  );
}
