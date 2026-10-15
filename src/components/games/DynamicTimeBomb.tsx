"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bomb, RotateCcw } from "lucide-react";
import content from "@/data/games_content.json";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { BOMBA_CATEGORIAS } from "@/data/party_prompts";
import { penaltyFor } from "@/lib/liveGames";
import type { Participant } from "@/lib/carreteState";

const CATS: string[] = Array.from(new Set([...content.time_bomb_categories, ...BOMBA_CATEGORIAS]));

/**
 * La Bomba: categoría al azar, el celular pasa de mano en mano y nadie sabe cuándo explota.
 * El tic-tac y la vibración se aceleran al final; si hay gente en la sala, se juega por turnos con sus nombres.
 */
export default function DynamicTimeBomb({ store }: { store: CarreteStore }) {
  const { games, patchGames, participants } = store;
  const [phase, setPhase] = useState<"idle" | "ticking" | "boom">("idle");
  const [category, setCategory] = useState("");
  const [passes, setPasses] = useState(0);
  const [turn, setTurn] = useState(0);
  const [heat, setHeat] = useState(0); // 0..1, ritmo visual y sonoro
  const [victim, setVictim] = useState<Participant | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const turnRef = useRef(0);
  const lastRef = useRef(games.bombLast);
  const order = participants.filter((p) => p.active !== false);
  const orderRef = useRef(order);
  orderRef.current = order;

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const pickCategory = () => {
    const pool = CATS.filter((c) => c !== lastRef.current);
    const next = pool[Math.floor(Math.random() * pool.length)];
    lastRef.current = next;
    setCategory(next);
    patchGames({ bombLast: next });
  };

  const arm = () => {
    clear();
    const total = 12000 + Math.random() * 20000;
    const t0 = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - t0) / total);
      setHeat(p);
      audioEffects.playUrgentTick(p);
      // De ~900 ms a ~160 ms entre tics
      timers.current.push(setTimeout(tick, 900 - 740 * p * p));
    };
    tick();
    timers.current.push(
      setTimeout(() => {
        clear();
        audioEffects.playBombExplosion();
        audioEffects.triggerHaptic([300, 100, 400]);
        setPhase("boom");
        setHeat(1);
        const o = orderRef.current;
        setVictim(o.length ? o[turnRef.current % o.length] : null);
        patchGames({ bombRounds: games.bombRounds + 1 });
      }, total)
    );
  };

  const start = () => {
    setPasses(0);
    setVictim(null);
    pickCategory();
    setPhase("ticking");
    arm();
  };

  const pass = () => {
    audioEffects.playPop();
    audioEffects.triggerHaptic(15);
    setPasses((s) => s + 1);
    const next = turn + 1;
    turnRef.current = next;
    setTurn(next);
  };

  const current = order.length ? order[turn % order.length] : null;
  const nextUp = order.length ? order[(turn + 1) % order.length] : null;
  const pulse = `${Math.max(0.18, 0.9 - heat * 0.72)}s`;

  return (
    <section className="surface relative overflow-hidden p-6 text-center">
      <span
        className="pointer-events-none absolute inset-0 transition-opacity duration-700"
        style={{ background: "radial-gradient(circle at 50% 40%, rgba(250,45,74,0.35), transparent 60%)", opacity: phase === "ticking" ? heat : phase === "boom" ? 1 : 0 }}
        aria-hidden
      />
      <p className="eyebrow relative">La Bomba · {passes} pases</p>

      {phase === "idle" && (
        <div className="relative py-6">
          <div className="text-7xl">💣</div>
          <p className="mx-auto mt-4 max-w-md text-sm text-slate-300">
            Sale una categoría. Di algo que calce y pasa el celular. Nadie sabe cuándo explota: el tic-tac se acelera al final.
          </p>
        </div>
      )}

      {phase === "ticking" && (
        <div className="relative py-4">
          <div className="text-8xl animate-bomb-pulse" style={{ animationDuration: pulse }} aria-hidden>
            💣
          </div>
          <p className="eyebrow mt-4">Categoría</p>
          <p className="display mt-1 text-3xl sm:text-4xl">{category}</p>
          {current && (
            <p className="mt-3 text-lg text-slate-200">
              Tiene la bomba: <span className="font-bold text-white">{current.name}</span>
            </p>
          )}
        </div>
      )}

      {phase === "boom" && (
        <div className="relative py-4 animate-rise-in" role="alert">
          <div className="text-8xl">💥</div>
          <p className="display mt-2 text-4xl">¡BOOM!</p>
          {victim ? (
            <p className="mt-3 text-lg text-slate-100">
              Le explotó a <span className="font-bold">{victim.name}</span>: {penaltyFor(victim, `bomba-${games.bombRounds}`).text}
            </p>
          ) : (
            <p className="mt-3 text-slate-300">A quien tenga el celular: shot de agua o penitencia de la ruleta.</p>
          )}
          <p className="mt-1 text-sm text-slate-400">
            Aguantaron {passes} {passes === 1 ? "pase" : "pases"}.
          </p>
        </div>
      )}

      <div className="relative mt-4">
        {phase === "ticking" ? (
          <button onClick={pass} className="btn w-full !min-h-[72px] bg-emerald-400 text-lg text-night-950">
            ¡Dije algo! Pasar{nextUp ? ` a ${nextUp.name}` : ""} →
          </button>
        ) : (
          <button onClick={start} className="btn w-full !min-h-[64px] bg-rose-500 text-base text-white">
            {phase === "boom" ? <RotateCcw className="w-5 h-5" /> : <Bomb className="w-5 h-5" />}
            {phase === "boom" ? "Otra ronda" : "Encender la bomba"}
          </button>
        )}
      </div>
    </section>
  );
}
