"use client";

import React, { useMemo } from "react";
import { AlertTriangle, ShieldCheck, Gauge, Zap } from "lucide-react";

interface CanisterGlassMeterProps {
  pressure: number; // 0 - 100
  isDriver?: boolean;
  theme?: "night" | "halloween";
  drinksCount?: number;
  pureAlcoholGrams?: number;
  heightPx?: number;
}

export default function CanisterGlassMeter({
  pressure,
  isDriver = false,
  theme = "night",
  drinksCount = 0,
  pureAlcoholGrams = 0,
  heightPx = 280,
}: CanisterGlassMeterProps) {
  const clampedPressure = Math.min(100, Math.max(0, pressure));
  
  // Ángulo de la aguja del manómetro: de -90deg (0%) a +90deg (100%)
  const needleRotation = clampedPressure * 1.8 - 90;

  // Detección de estados biológicos/peligro
  const isOverload = clampedPressure >= 80;
  const isHigh = clampedPressure >= 51 && clampedPressure < 80;
  const isDriverBreached = isDriver && (drinksCount > 0 || clampedPressure > 0);

  // Esquema cromático según tema y nivel de presión
  const liquidColors = useMemo(() => {
    if (isDriverBreached) {
      return {
        fill: "#EF4444",
        glow: "rgba(239, 68, 68, 0.6)",
        gradientTop: "from-rose-500",
        gradientBottom: "to-red-950",
        label: "¡RUPTURA DE CONTENCIÓN!",
      };
    }

    if (isDriver) {
      return {
        fill: "#10B981",
        glow: "rgba(16, 185, 129, 0.4)",
        gradientTop: "from-emerald-400",
        gradientBottom: "to-emerald-950",
        label: "PILOTO 0.0% SEGURO",
      };
    }

    if (theme === "halloween") {
      return {
        fill: "#22C55E",
        glow: "rgba(34, 197, 94, 0.65)",
        gradientTop: "from-[#22C55E]",
        gradientBottom: "to-purple-950",
        label: isOverload ? "¡ECTOPLASMA CRÍTICO!" : "PÓCIMA BRUJA",
      };
    }

    if (isOverload) {
      return {
        fill: "#EF4444",
        glow: "rgba(239, 68, 68, 0.6)",
        gradientTop: "from-red-500",
        gradientBottom: "to-rose-950",
        label: "¡SOBREPRESIÓN!",
      };
    }

    if (isHigh) {
      return {
        fill: "#EC4899",
        glow: "rgba(236, 72, 153, 0.5)",
        gradientTop: "from-pink-500",
        gradientBottom: "to-fuchsia-950",
        label: "ALTA ENERGÍA",
      };
    }

    // Normal (0 - 50%)
    return {
      fill: "#06B6D4",
      glow: "rgba(6, 182, 212, 0.45)",
      gradientTop: "from-cyan-400",
      gradientBottom: "to-indigo-950",
      label: "PRESIÓN NORMAL",
    };
  }, [clampedPressure, isDriver, isDriverBreached, theme, isOverload, isHigh]);

  return (
    <div className={`relative flex flex-col items-center w-28 sm:w-32 transition-all ${isOverload || isDriverBreached ? "animate-pulse" : ""}`}>
      {/* 1. Cúpula Metálica Superior & Manómetro Industrial */}
      <div className="relative z-20 flex flex-col items-center">
        {/* Manómetro Analógico */}
        <div className="relative w-12 h-12 rounded-full bg-gradient-to-b from-slate-600 via-slate-800 to-slate-900 border-2 border-amber-500/80 shadow-md flex items-center justify-center p-1">
          {/* Carátula */}
          <div className="relative w-full h-full rounded-full bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Zona roja superior derecha */}
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-rose-500/30 rounded-tr-full" />
            
            {/* Ticks de escala */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-slate-700/60 rotate-0" />
              <div className="w-0.5 h-full bg-slate-700/60 rotate-45" />
              <div className="w-0.5 h-full bg-slate-700/60 -rotate-45" />
            </div>

            {/* Aguja del Manómetro */}
            <div
              className="absolute w-0.5 h-4 bg-rose-500 origin-bottom rounded-full transition-transform duration-700 ease-out shadow-[0_0_5px_rgba(239,68,68,0.8)]"
              style={{
                transform: `rotate(${needleRotation}deg)`,
                bottom: "50%",
              }}
            />

            {/* Tornillo central */}
            <div className="w-2 h-2 rounded-full bg-amber-400 border border-slate-900 z-10" />
          </div>
        </div>

        {/* Cúpula de acero con remaches */}
        <div className="relative -mt-2 w-24 h-6 rounded-t-2xl bg-gradient-to-r from-slate-700 via-slate-500 to-slate-700 border-t-2 border-x-2 border-slate-400 shadow-inner flex items-center justify-between px-2">
          {/* Remaches */}
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-900 border border-slate-400" />
        </div>
      </div>

      {/* 2. Tubo de Cristal Transparente (Cilindro Scare Floor) */}
      <div
        className="relative w-20 sm:w-24 rounded-b-lg border-x-2 border-b-2 border-slate-500/60 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-slate-950/80 backdrop-blur-md overflow-hidden flex flex-col justify-end shadow-2xl"
        style={{ height: `${heightPx}px` }}
      >
        {/* Reflejo de cristal curvado (Highlights) */}
        <div className="absolute top-0 left-2 w-2 h-full bg-white/10 blur-[1px] pointer-events-none z-20" />
        <div className="absolute top-0 right-2 w-1 h-full bg-white/5 pointer-events-none z-20" />

        {/* Escala Graduada de Presión (1 a 10) */}
        <div className="absolute inset-y-0 right-1 w-4 flex flex-col justify-between py-2 pointer-events-none z-20 text-[9px] font-mono text-slate-400 font-bold select-none">
          <span>10</span>
          <span>8</span>
          <span>6</span>
          <span>4</span>
          <span>2</span>
          <span>0</span>
        </div>

        {/* Rayas de nivel en el vidrio */}
        <div className="absolute inset-0 flex flex-col justify-between py-2 pointer-events-none z-10 opacity-30">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="w-full border-b border-dashed border-slate-400/40" />
          ))}
        </div>

        {/* 3. Nivel de Líquido Animado */}
        <div
          className={`relative w-full bg-gradient-to-t ${liquidColors.gradientBottom} ${liquidColors.gradientTop} transition-all duration-700 ease-out flex flex-col justify-start`}
          style={{
            height: `${clampedPressure}%`,
            boxShadow: `0 0 25px ${liquidColors.glow}`,
          }}
        >
          {/* Ola Dinámica Superior (SVG) */}
          <div className="absolute -top-2.5 left-0 w-full overflow-hidden leading-none z-10">
            <svg
              className="w-full h-3 text-current fill-current animate-pulse opacity-90"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
              style={{ color: liquidColors.fill }}
            >
              <path d="M0,10 C30,20 70,0 100,10 L100,20 L0,20 Z" />
            </svg>
          </div>

          {/* Burbujas Ascendentes simulando gas */}
          {clampedPressure > 5 && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <span
                className="absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full bg-white/60 animate-ping"
                style={{ animationDuration: isOverload ? "0.6s" : "1.8s" }}
              />
              <span
                className="absolute bottom-6 right-4 w-2 h-2 rounded-full bg-white/40 animate-ping"
                style={{ animationDuration: isOverload ? "0.8s" : "2.2s" }}
              />
              <span
                className="absolute bottom-12 left-6 w-1 h-1 rounded-full bg-white/70 animate-bounce"
                style={{ animationDuration: "1.2s" }}
              />
            </div>
          )}
        </div>

        {/* Blindaje Especial: Conductor Designado */}
        {isDriver && (
          <div className="absolute inset-x-1 bottom-2 z-30 p-1 rounded bg-slate-950/90 border border-emerald-400 text-center shadow-lg">
            <div className="flex items-center justify-center gap-1 text-[10px] font-black text-emerald-400 uppercase tracking-tighter">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              <span>PILOTO 0.0%</span>
            </div>
          </div>
        )}
      </div>

      {/* 4. Base Metálica con Válvula de Purga */}
      <div className="relative -mt-1 w-26 h-5 rounded-b-xl bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 border-x-2 border-b-2 border-slate-400 shadow-md flex items-center justify-center">
        <span className="w-8 h-1.5 rounded-full bg-slate-950/80 border border-slate-500/50" />
      </div>

      {/* 5. Medición Digital y Alertas */}
      <div className="mt-2 text-center space-y-0.5">
        <div className="flex items-center justify-center gap-1">
          <span className="font-mono text-sm sm:text-base font-black text-white">
            {clampedPressure}%
          </span>
          {isOverload && <Zap className="w-3.5 h-3.5 text-rose-400 animate-bounce" />}
        </div>

        <p
          className={`text-[9px] font-black uppercase tracking-wider ${
            isDriverBreached
              ? "text-rose-400 animate-pulse font-extrabold"
              : isOverload
              ? "text-rose-400"
              : isHigh
              ? "text-pink-400"
              : isDriver
              ? "text-emerald-400"
              : "text-cyan-400"
          }`}
        >
          {liquidColors.label}
        </p>

        {pureAlcoholGrams > 0 && (
          <p className="text-[10px] text-slate-400 font-mono">
            ~{Math.round(pureAlcoholGrams)}g alc. puro
          </p>
        )}
      </div>
    </div>
  );
}
