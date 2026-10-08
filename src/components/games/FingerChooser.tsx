"use client";

import React, { useState, useEffect, useRef } from "react";
import { fireConfetti } from "@/lib/confetti";
import { 
  Hand, 
  RotateCcw, 
  Sparkles, 
  Zap, 
  Smartphone, 
  Users,
  CheckCircle2
} from "lucide-react";

interface TouchFinger {
  id: number;
  x: number;
  y: number;
  color: string;
}

const FINGER_COLORS = [
  "#6366f1", // indigo
  "#ec4899", // pink
  "#10b981", // emerald
  "#f59e0b", // amber
  "#06b6d4", // cyan
  "#8b5cf6", // purple
  "#ef4444", // red
  "#3b82f6", // blue
];

export default function FingerChooser() {
  const [fingers, setFingers] = useState<TouchFinger[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [selectedFingerId, setSelectedFingerId] = useState<number | null>(null);
  const [mode, setMode] = useState<"loser" | "winner">("loser");

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Trigger haptic vibration if available
  const triggerHaptic = (pattern: number | number[]) => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  };

  // Clear pending timers
  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setCountdown(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFingerId !== null) return; // Game already resolved

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newFingers: TouchFinger[] = [];
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      newFingers.push({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        color: FINGER_COLORS[i % FINGER_COLORS.length],
      });
    }

    setFingers(newFingers);
    triggerHaptic(40);

    // If at least 2 fingers touch, start 3-second countdown
    if (newFingers.length >= 2) {
      clearTimers();
      let timeLeft = 3;
      setCountdown(timeLeft);
      triggerHaptic([60, 60]);

      countdownIntervalRef.current = setInterval(() => {
        timeLeft -= 1;
        if (timeLeft > 0) {
          setCountdown(timeLeft);
          triggerHaptic(80);
        } else {
          clearInterval(countdownIntervalRef.current!);
          countdownIntervalRef.current = null;
        }
      }, 1000);

      timerRef.current = setTimeout(() => {
        // Resolve choice
        if (newFingers.length >= 2) {
          const randomIndex = Math.floor(Math.random() * newFingers.length);
          const chosen = newFingers[randomIndex];
          setSelectedFingerId(chosen.id);
          setCountdown(null);

          triggerHaptic([100, 80, 200]);

          fireConfetti({
            particleCount: 70,
            spread: 60,
            origin: {
              x: (rect.left + chosen.x) / window.innerWidth,
              y: (rect.top + chosen.y) / window.innerHeight,
            },
            colors: [chosen.color, "#ffffff", "#f59e0b"],
          });
        }
      }, 3000);
    } else {
      clearTimers();
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFingerId !== null) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    setFingers((prev) =>
      prev.map((f) => {
        for (let i = 0; i < e.touches.length; i++) {
          if (e.touches[i].identifier === f.id) {
            return {
              ...f,
              x: e.touches[i].clientX - rect.left,
              y: e.touches[i].clientY - rect.top,
            };
          }
        }
        return f;
      })
    );
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (selectedFingerId !== null) return; // Keep winner visible until reset

    const remainingTouches = e.touches.length;
    if (remainingTouches < 2) {
      clearTimers();
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const updated: TouchFinger[] = [];
    for (let i = 0; i < e.touches.length; i++) {
      const touch = e.touches[i];
      updated.push({
        id: touch.identifier,
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
        color: FINGER_COLORS[i % FINGER_COLORS.length],
      });
    }
    setFingers(updated);
  };

  const resetGame = () => {
    clearTimers();
    setSelectedFingerId(null);
    setFingers([]);
  };

  // Simulated desktop click fallback to demo the mechanics
  const handleDesktopClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (selectedFingerId !== null) {
      resetGame();
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    if (fingers.length < 5) {
      const newFinger: TouchFinger = {
        id: Date.now() + Math.random(),
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        color: FINGER_COLORS[fingers.length % FINGER_COLORS.length],
      };
      const updated = [...fingers, newFinger];
      setFingers(updated);

      if (updated.length >= 2) {
        clearTimers();
        let timeLeft = 3;
        setCountdown(timeLeft);

        countdownIntervalRef.current = setInterval(() => {
          timeLeft -= 1;
          if (timeLeft > 0) {
            setCountdown(timeLeft);
          } else {
            clearInterval(countdownIntervalRef.current!);
          }
        }, 1000);

        timerRef.current = setTimeout(() => {
          const randomIndex = Math.floor(Math.random() * updated.length);
          const chosen = updated[randomIndex];
          setSelectedFingerId(chosen.id);
          setCountdown(null);

          fireConfetti({
            particleCount: 60,
            spread: 60,
            colors: [chosen.color, "#ffffff", "#f59e0b"],
          });
        }, 3000);
      }
    }
  };

  return (
    <div className="glass-panel rounded-3xl border border-indigo-500/30 p-4 sm:p-6 bg-night-950/80 shadow-2xl relative overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400">
            <Hand className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>El Dedazo (Selector Táctil)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                2-8 Dedos
              </span>
            </h2>
            <p className="text-[11px] text-slate-400">
              Apoyen los dedos en la pantalla. Quien sea elegido paga o cumple el reto.
            </p>
          </div>
        </div>

        {/* Mode selector */}
        <div className="flex items-center gap-1.5 bg-night-900 p-1 rounded-2xl border border-night-800 text-xs">
          <button
            type="button"
            onClick={() => setMode("loser")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === "loser"
                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            💀 Elige al Que Pierde
          </button>
          <button
            type="button"
            onClick={() => setMode("winner")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
              mode === "winner"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            👑 Elige al Ganador
          </button>
        </div>
      </div>

      {/* Main Touch Canvas Area */}
      <div
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onClick={handleDesktopClick}
        className="w-full h-80 sm:h-96 rounded-3xl bg-night-950 border-2 border-dashed border-night-800 relative overflow-hidden select-none touch-none flex items-center justify-center cursor-pointer shadow-inner"
        style={{ touchAction: "none" }}
      >
        {/* Background Instruction if empty */}
        {fingers.length === 0 && selectedFingerId === null && (
          <div className="text-center p-6 pointer-events-none space-y-2 animate-pulse">
            <Smartphone className="w-10 h-10 text-indigo-400 mx-auto opacity-60" />
            <p className="text-sm font-black text-slate-300">
              ¡Apoyen todos un dedo aquí en la pantalla!
            </p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              (En celular/tablet pon hasta 8 dedos. En computador haz clic para simular puntos).
            </p>
          </div>
        )}

        {/* Countdown Indicator in center */}
        {countdown !== null && selectedFingerId === null && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-black/40 backdrop-blur-sm z-20">
            <span className="text-7xl sm:text-8xl font-black text-amber-400 animate-ping">
              {countdown}
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-white mt-2">
              ¡Mantengan los dedos firmes!
            </span>
          </div>
        )}

        {/* Result Announcement */}
        {selectedFingerId !== null && (
          <div className="absolute top-4 left-4 right-4 z-30 pointer-events-none text-center">
            <div className="inline-block py-2 px-6 rounded-2xl bg-black/80 backdrop-blur-md border border-amber-400/50 shadow-2xl animate-bounce">
              <span className="text-sm sm:text-base font-black text-amber-300 block">
                {mode === "loser" ? "💥 ¡TE TOCÓ A TI, PIERDES! 💥" : "🎉 ¡ERES EL ELEGIDO / GANADOR! 🎉"}
              </span>
              <span className="text-[10px] text-slate-300">
                Toca la pantalla para jugar de nuevo
              </span>
            </div>
          </div>
        )}

        {/* Rendering touch rings for fingers */}
        {fingers.map((f) => {
          const isSelected = selectedFingerId === f.id;
          const isDiscarded = selectedFingerId !== null && !isSelected;

          return (
            <div
              key={f.id}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-opacity duration-300"
              style={{
                left: `${f.x}px`,
                top: `${f.y}px`,
                opacity: isDiscarded ? 0.15 : 1,
              }}
            >
              {/* Outer pulsing ring */}
              <div
                className={`w-28 h-28 rounded-full border-4 animate-ping absolute -top-14 -left-14 opacity-75 ${
                  isSelected ? "scale-150 border-amber-400" : ""
                }`}
                style={{ borderColor: isSelected ? "#f59e0b" : f.color }}
              />

              {/* Main glowing touch spot */}
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-transform ${
                  isSelected ? "scale-125 ring-8 ring-white" : "scale-100"
                }`}
                style={{
                  backgroundColor: isSelected ? "#f59e0b" : f.color,
                  boxShadow: `0 0 35px ${isSelected ? "#f59e0b" : f.color}`,
                }}
              >
                {isSelected ? (
                  <Sparkles className="w-8 h-8 text-black animate-spin" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-white/80" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer controls */}
      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Dedos detectados: <strong className="text-white">{fingers.length}</strong>
        </span>

        {(fingers.length > 0 || selectedFingerId !== null) && (
          <button
            type="button"
            onClick={resetGame}
            className="py-1.5 px-3 rounded-xl bg-night-900 border border-night-700 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar</span>
          </button>
        )}
      </div>
    </div>
  );
}
