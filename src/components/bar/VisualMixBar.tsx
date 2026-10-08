"use client";

import React from "react";
import { FlaskConical, AlertTriangle, ShieldCheck, Zap, Droplet } from "lucide-react";
import type { MixAnalysis } from "@/lib/mixology";

interface VisualMixBarProps {
  analysis: MixAnalysis;
  selectedCount: number;
}

export default function VisualMixBar({ analysis, selectedCount }: VisualMixBarProps) {
  const { totalMl, pureAlcoholGrams, abvPercentage, colorHex, status, title, verdict, tip, tasteVerdict } = analysis;

  // Altura del líquido en el vaso (porcentaje visual entre 15% y 85%)
  const liquidHeightPercent = selectedCount === 0 ? 0 : Math.min(85, Math.max(25, (totalMl / 350) * 80));

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-b from-night-900 to-night-950 border border-indigo-500/30 shadow-glow flex flex-col md:flex-row items-center gap-6">
      {/* Vaso SVG con Líquido Dinámico */}
      <div className="relative w-36 h-56 flex flex-col items-center justify-end shrink-0">
        <svg
          viewBox="0 0 120 180"
          className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]"
        >
          <defs>
            {/* Gradiente de vidrio */}
            <linearGradient id="glassWall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
              <stop offset="15%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="85%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.25)" />
            </linearGradient>

            {/* Gradiente de líquido dinámico */}
            <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={colorHex} stopOpacity="0.9" />
              <stop offset="100%" stopColor={colorHex} stopOpacity="0.6" />
            </linearGradient>

            <clipPath id="glassClip">
              {/* Forma del vaso piscolero / highball */}
              <polygon points="20,15 100,15 92,165 28,165" />
            </clipPath>
          </defs>

          {/* Líquido dentro del vaso */}
          {liquidHeightPercent > 0 && (
            <g clipPath="url(#glassClip)">
              <rect
                x="15"
                y={165 - (150 * liquidHeightPercent) / 100}
                width="90"
                height="160"
                fill="url(#liquidGrad)"
                className="transition-all duration-700 ease-out"
              />

              {/* Burbujas si hay gas o efervescencia */}
              <circle cx="45" cy="140" r="2" fill="white" opacity="0.6" className="animate-ping" />
              <circle cx="70" cy="120" r="1.5" fill="white" opacity="0.5" className="animate-pulse" />
              <circle cx="55" cy="85" r="2.5" fill="white" opacity="0.7" className="animate-bounce" />

              {/* Cubos de hielo flotando */}
              <rect
                x="38"
                y={Math.max(25, 165 - (150 * liquidHeightPercent) / 100 + 10)}
                width="20"
                height="20"
                rx="4"
                fill="rgba(255,255,255,0.35)"
                stroke="rgba(255,255,255,0.6)"
                strokeWidth="1"
                transform="rotate(15 48 40)"
              />
              <rect
                x="65"
                y={Math.max(35, 165 - (150 * liquidHeightPercent) / 100 + 25)}
                width="18"
                height="18"
                rx="3"
                fill="rgba(255,255,255,0.3)"
                stroke="rgba(255,255,255,0.5)"
                strokeWidth="1"
                transform="rotate(-10 74 50)"
              />
            </g>
          )}

          {/* Contorno y reflejo del vaso */}
          <polygon
            points="20,15 100,15 92,165 28,165"
            fill="url(#glassWall)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2.5"
          />

          {/* Base pesada del vaso piscolero */}
          <polygon
            points="28,165 92,165 89,173 31,173"
            fill="rgba(255,255,255,0.2)"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
          />

          {/* Reflejo vertical de luz */}
          <line
            x1="26"
            y1="22"
            x2="33"
            y2="155"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>

        {/* Badge inferior de volumen */}
        <span className="absolute bottom-1 px-2 py-0.5 rounded-full bg-slate-900/90 border border-slate-700 text-[10px] font-mono text-slate-300">
          {totalMl > 0 ? `${totalMl} ml aprox.` : "0 ml"}
        </span>
      </div>

      {/* Métricas Químicas y Veredicto */}
      <div className="flex-1 space-y-3 text-center md:text-left">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
          {/* Badge Veredicto de Sabor: Aprobado / Extraño / Peligro */}
          {tasteVerdict && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-black border flex items-center gap-1.5 shadow-sm ${
                tasteVerdict.type === "peligro"
                  ? "bg-rose-500/20 text-rose-300 border-rose-500/60 animate-pulse"
                  : tasteVerdict.type === "extrano"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/60"
                  : "bg-emerald-500/20 text-emerald-300 border-emerald-500/50"
              }`}
            >
              <span>{tasteVerdict.label}</span>
            </span>
          )}

          <span
            className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${
              status === "danger"
                ? "bg-rose-950/60 text-rose-300 border-rose-500/40"
                : status === "warning"
                ? "bg-amber-950/60 text-amber-300 border-amber-500/40"
                : "bg-slate-900 text-slate-300 border-slate-700"
            }`}
          >
            {status === "danger" ? (
              <AlertTriangle className="w-3.5 h-3.5" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5" />
            )}
            <span>{title}</span>
          </span>
        </div>

        {/* Indicadores Numéricos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-night-950 border border-night-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Graduación (% ABV)
            </span>
            <span className="text-xl sm:text-2xl font-black text-white font-mono">
              {abvPercentage}%
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-night-950 border border-night-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Alcohol Puro
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
              {pureAlcoholGrams.toFixed(1)} g
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-2xl bg-night-950 border border-night-800 flex flex-col justify-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              Ingredientes
            </span>
            <span className="text-base font-black text-indigo-300">
              {selectedCount} seleccionados
            </span>
          </div>
        </div>

        {tasteVerdict?.description && (
          <p className="text-xs font-semibold text-slate-200">
            {tasteVerdict.description}
          </p>
        )}

        <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
          {verdict}
        </p>

        {tip && (
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-xs text-indigo-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400 shrink-0" />
            <span>{tip}</span>
          </div>
        )}
      </div>
    </div>
  );
}
