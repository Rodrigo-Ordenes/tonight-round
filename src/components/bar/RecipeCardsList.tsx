"use client";

import React, { useState } from "react";
import {
  Sparkles,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Clock,
  BookOpen,
  X,
  Plus,
  Flame,
} from "lucide-react";
import type { CocktailRecipe, IngredientDef } from "@/lib/mixology";
import { audioEffects } from "@/lib/audioEffects";

interface RecipeCardsListProps {
  exact: CocktailRecipe[];
  near: { recipe: CocktailRecipe; missing: IngredientDef[] }[];
  suggestion: string;
  onAddMissingIngredient: (id: string) => void;
}

export default function RecipeCardsList({
  exact,
  near,
  suggestion,
  onAddMissingIngredient,
}: RecipeCardsListProps) {
  const [activeModalRecipe, setActiveModalRecipe] = useState<CocktailRecipe | null>(null);

  const totalViable = exact.length + near.length;

  return (
    <div className="space-y-4">
      {/* Tip de Bartender (Chip Ámbar) */}
      {suggestion && (
        <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 flex items-start gap-2.5 animate-fade-in shadow-sm">
          <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <span>{suggestion}</span>
        </div>
      )}

      {/* Banner Rojo si no hay recetas viables */}
      {totalViable === 0 && (
        <div className="p-4 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-xs sm:text-sm text-rose-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">
              ⚠️ No hay tragos viables con esta combinación.
            </p>
            <p className="mt-1 text-slate-300">
              Te sugerimos agregar <strong>[Hielo]</strong>, <strong>[Bebida Cola]</strong> o{" "}
              <strong>[Sprite]</strong> para activar las recetas más clásicas del carrete chileno.
            </p>
          </div>
        </div>
      )}

      {/* 1. Tragos Preparables Ahora (100% de ingredientes) */}
      {exact.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-white uppercase tracking-wider">
              ✨ Tragos que puedes preparar ahora ({exact.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exact.map((recipe) => (
              <div
                key={recipe.id}
                className="p-4 rounded-3xl bg-night-900/90 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> ¡Listo para servir!
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      ~{recipe.abv_estimated}° ABV
                    </span>
                  </div>

                  <h4 className="font-black text-base text-white mt-1">{recipe.name}</h4>
                  <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                    {recipe.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-night-800 flex items-center justify-between">
                  <span className="text-xs font-mono text-indigo-300 font-bold">
                    {recipe.ratio || "Proporción clásica"}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      audioEffects.playPop();
                      setActiveModalRecipe(recipe);
                    }}
                    className="min-h-[40px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Ver Receta</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Tragos Desbloqueables (Te falta 1 ingrediente) */}
      {near.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-amber-400 uppercase tracking-wider">
              💡 Desbloqueables con 1 ingrediente extra ({near.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {near.map(({ recipe, missing }) => {
              const missingItem = missing[0];

              return (
                <div
                  key={recipe.id}
                  className="p-4 rounded-3xl bg-night-950/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                        Falta: {missingItem?.name || "1 ingrediente"}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        ~{recipe.abv_estimated}° ABV
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-white mt-1">{recipe.name}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {recipe.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-night-850 flex items-center justify-between gap-2">
                    {missingItem && (
                      <button
                        type="button"
                        onClick={() => onAddMissingIngredient(missingItem.id)}
                        className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Sumar {missingItem.name}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        audioEffects.playPop();
                        setActiveModalRecipe(recipe);
                      }}
                      className="min-h-[36px] px-2.5 rounded-xl bg-night-900 text-slate-300 hover:text-white text-xs font-bold"
                    >
                      Detalles
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Interactivo de Receta Completa */}
      {activeModalRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg max-h-[85dvh] flex flex-col rounded-3xl bg-night-900 border border-indigo-500/40 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-night-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  {activeModalRecipe.category} · {activeModalRecipe.glass}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {activeModalRecipe.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRecipe(null)}
                className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con scroll */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Métricas rápidas */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-2xl bg-night-950 border border-night-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Ratio / Proporción
                  </span>
                  <span className="text-sm font-black text-white font-mono">
                    {activeModalRecipe.ratio || "Equilibrado"}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-night-950 border border-night-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Graduación Estimada
                  </span>
                  <span className="text-sm font-black text-amber-400 font-mono">
                    {activeModalRecipe.abv_estimated}° ABV
                  </span>
                </div>
              </div>

              {/* Historia y Contexto Chileno */}
              {activeModalRecipe.history && (
                <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-1">
                  <span className="text-xs font-black text-indigo-300 block">
                    📜 Historia & Tradición Chilena
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {activeModalRecipe.history}
                  </p>
                </div>
              )}

              {/* Proporciones detalladas */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-1">
                  Proporciones e Ingredientes:
                </span>
                <p className="text-xs text-slate-400 font-mono bg-night-950 p-3 rounded-xl border border-night-800">
                  {activeModalRecipe.proportions}
                </p>
              </div>

              {/* Pasos de Preparación */}
              <div>
                <span className="text-xs font-bold text-slate-300 block mb-2">
                  Preparación Paso a Paso:
                </span>
                <div className="space-y-2">
                  {activeModalRecipe.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs text-slate-300 p-2.5 rounded-xl bg-night-950 border border-night-800"
                    >
                      <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-300 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-night-800 bg-night-950/80 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModalRecipe(null)}
                className="min-h-[48px] px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
