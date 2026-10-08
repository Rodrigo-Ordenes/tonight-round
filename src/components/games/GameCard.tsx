"use client";

import React, { useState } from "react";
import { Users, Clock, Package, ChevronDown, ChevronUp, Sparkles, Award } from "lucide-react";

export interface GameItem {
  id: string;
  name: string;
  players: string;
  materials: string;
  duration: string;
  tags: string[];
  description: string;
  rules: string[];
  non_alcoholic_variant: string;
}

interface GameCardProps {
  game: GameItem;
  isFeatured?: boolean;
}

export default function GameCard({ game, isFeatured = false }: GameCardProps) {
  const [expanded, setExpanded] = useState<boolean>(isFeatured);

  return (
    <div
      className={`glass-panel rounded-3xl p-5 border transition-all ${
        isFeatured
          ? "border-carrete-primary/60 bg-night-900/90 shadow-glow"
          : "border-night-800 hover:border-night-700 bg-night-950/70"
      }`}
    >
      {/* Header Info */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-1.5 mb-2">
            {game.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-night-850 text-indigo-300 border border-night-700/60"
              >
                {tag}
              </span>
            ))}
          </div>

          <h3 className="text-base font-extrabold text-white tracking-tight">
            {game.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {game.description}
          </p>
        </div>
      </div>

      {/* Meta Pills */}
      <div className="grid grid-cols-3 gap-2 mt-3.5 pt-3 border-t border-night-850 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5 truncate">
          <Users className="w-3.5 h-3.5 text-carrete-primary shrink-0" />
          <span className="truncate">{game.players}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="truncate">{game.duration}</span>
        </div>
        <div className="flex items-center gap-1.5 truncate">
          <Package className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{game.materials}</span>
        </div>
      </div>

      {/* Expand/Collapse Rules Toggle */}
      <div className="mt-4">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="w-full min-h-[44px] py-2 px-3 rounded-2xl bg-night-900 hover:bg-night-850 border border-night-800 text-xs font-bold text-slate-300 flex items-center justify-between transition-colors active:scale-[0.99]"
        >
          <span>{expanded ? "Ocultar Reglas" : "Ver Reglas y Dinámica"}</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* Expanded Rules Section */}
      {expanded && (
        <div className="mt-4 space-y-4 pt-3 border-t border-night-800 text-xs animate-fade-in">
          <div>
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Reglas de la Ronda</span>
            </h4>
            <div className="space-y-2">
              {game.rules.map((rule, idx) => (
                <div key={idx} className="flex items-start gap-2 text-slate-300 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-carrete-primary/20 text-indigo-300 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Non-Alcoholic / Points Variant */}
          <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-200">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300 mb-1 text-[11px]">
              <Award className="w-3.5 h-3.5 text-emerald-400" />
              <span>Variante Sin Alcohol / Por Puntos</span>
            </div>
            <p className="text-[11px] text-emerald-100/90 leading-relaxed">
              {game.non_alcoholic_variant}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
