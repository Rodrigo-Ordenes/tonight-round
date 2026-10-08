"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bomb, RotateCcw, Check } from "lucide-react";
import content from "@/data/games_content.json";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

const CATS: string[] = content.time_bomb_categories;

/** Bomba de Tiempo: categoría aleatoria sin repetir la anterior + rondas sobrevividas. */
export default function DynamicTimeBomb({ store }: { store: CarreteStore }) {
  const { games, patchGames } = store;
  const [phase, setPhase] = useState<"idle" | "ticking" | "boom">("idle");
  const [category, setCategory] = useState("");
  const [survived, setSurvived] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const beep = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastRef = useRef(games.bombLast);

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    if (beep.current) clearInterval(beep.current);
  };
  useEffect(() => clear, []);

  const pickCategory = () => {
    const pool = CATS.filter((c) => c !== lastRef.current);
    const next = pool[Math.floor(Math.random() * pool.length)];
    lastRef.current = next;
    setCategory(next);
    patchGames({ bombLast: next });
    return next;
  };

  const arm = () => {
    clear();
    const ms = 7000 + Math.random() * 18000;
    let elapsed = 0;
    beep.current = setInterval(() => {
      elapsed += 700;
      audioEffects.playBombBeep();
      audioEffects.triggerHaptic?.();
    }, 700);
    timer.current = setTimeout(() => {
      clear();
      audioEffects.playBombExplosion();
      setPhase("boom");
      patchGames({ bombRounds: games.bombRounds + survived });
    }, ms);
  };

  const start = () => {
    setSurvived(0);
    pickCategory();
    setPhase("ticking");
    arm();
  };

  const pass = () => {
    audioEffects.playSuccessChime();
    setSurvived((s) => s + 1);
    pickCategory();
  };

  return (
    <div className="rounded-3xl bg-night-900/80 border border-amber-500/30 p-5 text-center space-y-4">
      <div className="flex items-center justify-center gap-2 text-amber-300 font-black">
        <Bomb className="w-5 h-5" /> LA BOMBA DE TIEMPO
      </div>
      <p className="text-xs text-slate-400">
        Di algo de la categoría y pasa el celular. Quien la tenga cuando explote, toma agua (o cumple una penitencia).
      </p>

      <div className="text-xs font-bold text-amber-300">Rondas sobrevividas: {survived}</div>

      {phase !== "idle" && (
        <div
          className={`rounded-2xl p-5 border-2 ${
            phase === "boom" ? "border-rose-500 bg-rose-950/50" : "border-amber-500/50 bg-amber-950/20 animate-pulse"
          }`}
        >
          {phase === "boom" ? (
            <>
              <div className="text-5xl">💥</div>
              <p className="text-xl font-black text-white mt-1">¡BOOM!</p>
              <p className="text-sm text-slate-300">Sobrevivieron {survived} {survived === 1 ? "ronda" : "rondas"}.</p>
            </>
          ) : (
            <>
              <p className="text-[11px] uppercase tracking-widest text-slate-400">Categoría</p>
              <p className="text-2xl font-black text-white">{category}</p>
            </>
          )}
        </div>
      )}

      {phase === "ticking" ? (
        <button onClick={pass} className="w-full min-h-[56px] rounded-2xl bg-emerald-600 text-white font-black flex items-center justify-center gap-2">
          <Check className="w-5 h-5" /> ¡Respondí! Pasar la bomba
        </button>
      ) : (
        <button onClick={start} className="w-full min-h-[56px] rounded-2xl bg-amber-600 text-white font-black flex items-center justify-center gap-2">
          {phase === "boom" ? <RotateCcw className="w-5 h-5" /> : <Bomb className="w-5 h-5" />}
          {phase === "boom" ? "Otra ronda" : "Encender bomba"}
        </button>
      )}
    </div>
  );
}
