"use client";

import React, { useState } from "react";
import { Dices, Sparkles, RefreshCw } from "lucide-react";
import { GameItem } from "./GameCard";

interface RandomGameTriggerProps {
  games: GameItem[];
  onSelectGame: (game: GameItem) => void;
}

export default function RandomGameTrigger({ games, onSelectGame }: RandomGameTriggerProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinningName, setSpinningName] = useState<string>("");

  const handleSpin = () => {
    if (games.length === 0 || isSpinning) return;

    setIsSpinning(true);
    let counter = 0;
    const intervalSpeed = 80; // ms
    const totalSteps = 18;

    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * games.length);
      setSpinningName(games[randomIndex].name);
      counter++;

      if (counter >= totalSteps) {
        clearInterval(interval);
        const finalGame = games[randomIndex];
        setIsSpinning(false);
        setSpinningName("");
        onSelectGame(finalGame);
      }
    }, intervalSpeed);
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleSpin}
        disabled={isSpinning}
        className="w-full min-h-[54px] px-6 py-3.5 rounded-3xl bg-gradient-to-r from-carrete-primary via-indigo-600 to-carrete-secondary text-white font-extrabold shadow-glow hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/10"
      >
        {isSpinning ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            <span className="text-sm font-bold tracking-tight">
              Sorteando: {spinningName}...
            </span>
          </>
        ) : (
          <>
            <Dices className="w-6 h-6 animate-bounce" />
            <span className="text-base tracking-tight">
              ¿No se deciden? ¡Juego Aleatorio!
            </span>
          </>
        )}
      </button>
    </div>
  );
}
