"use client";

import React, { useState } from "react";
import { Check, RotateCcw, Sparkles } from "lucide-react";
import { INGREDIENTS, type IngredientDef } from "@/lib/mixology";
import { audioEffects } from "@/lib/audioEffects";

interface IngredientChipsProps {
  selectedIds: string[];
  onToggle: (id: string) => void;
  onClear: () => void;
  onPreset: (ids: string[]) => void;
}

const TABS = [
  { id: "destilados", label: "Destilados", icon: "🥃" },
  { id: "fermentados", label: "Fermentados", icon: "🍷" },
  { id: "mezcladores", label: "Mezcladores", icon: "🥤" },
  { id: "jugos", label: "Jugos", icon: "🍊" },
  { id: "esenciales", label: "Esenciales", icon: "🧊" },
] as const;

export default function IngredientChips({
  selectedIds,
  onToggle,
  onClear,
  onPreset,
}: IngredientChipsProps) {
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]["id"]>("destilados");

  const currentIngredients = INGREDIENTS.filter((item) => item.category === activeTab);

  const presets = [
    { label: "Piscola Clásica", ids: ["pisco", "bebida_cola", "hielo"] },
    { label: "Terremoto", ids: ["pipeno", "helado_pina", "granadina"] },
    { label: "Gin Tonic", ids: ["gin", "tonica", "hielo"] },
    { label: "Mocktail Cítrico", ids: ["jugo_naranja", "agua_gas", "menta", "hielo"] },
  ];

  return (
    <div className="space-y-4 p-5 rounded-3xl bg-night-900/80 border border-slate-800">
      {/* Selector de Pestañas de Ingredientes */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              audioEffects.playTick();
              setActiveTab(tab.id);
            }}
            className={`min-h-[48px] px-3.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "bg-night-950 text-slate-400 hover:text-white border border-night-800"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Chips de Ingredientes en la pestaña activa */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
        {currentIngredients.map((ing) => {
          const isSelected = selectedIds.includes(ing.id);

          return (
            <button
              key={ing.id}
              type="button"
              onClick={() => {
                audioEffects.playPop();
                onToggle(ing.id);
              }}
              className={`min-h-[50px] p-2.5 rounded-2xl border text-left transition-all active:scale-[0.98] flex items-center justify-between gap-2 ${
                isSelected
                  ? "bg-indigo-950/80 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]"
                  : "bg-night-950/70 border-slate-800 text-slate-300 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xl shrink-0">{ing.icon}</span>
                <div className="min-w-0">
                  <span className="font-bold text-xs block truncate">{ing.name}</span>
                  {ing.abv > 0 && (
                    <span className="text-[10px] text-amber-400 font-mono block">
                      {Math.round(ing.abv * 100)}° ABV
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-indigo-500 text-white" : "border border-slate-700"
                }`}
              >
                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* Barra de Presets Rápidos y Limpiar */}
      <div className="pt-3 border-t border-night-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-slate-400 font-bold mr-1">Cargar rápido:</span>
          {presets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                audioEffects.playSuccessChime();
                onPreset(preset.ids);
              }}
              className="text-[11px] font-bold px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="min-h-[40px] px-3 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Limpiar vaso ({selectedIds.length})</span>
          </button>
        )}
      </div>
    </div>
  );
}
