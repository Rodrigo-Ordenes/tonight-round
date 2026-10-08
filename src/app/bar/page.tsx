"use client";

import React, { useState, useMemo } from "react";
import { FlaskConical, BookOpen, Flame, Sparkles } from "lucide-react";
import VisualMixBar from "@/components/bar/VisualMixBar";
import IngredientChips from "@/components/bar/IngredientChips";
import RecipeCardsList from "@/components/bar/RecipeCardsList";
import PiscolometerSlider from "@/components/bar/PiscolometerSlider";
import DrinkEncyclopedia from "@/components/bar/DrinkEncyclopedia";
import { analyzeMix, matchRecipes } from "@/lib/mixology";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";

type BarTab = "mix" | "piscolometer" | "encyclopedia";

export default function BarPage() {
  const { locale } = useLocale();
  const [activeTab, setActiveTab] = useState<BarTab>("mix");

  // Estado del vaso de mezclas visual
  const [selectedIds, setSelectedIds] = useState<string[]>(["pisco", "bebida_cola", "hielo"]);

  // Análisis fisicoquímico en tiempo real
  const analysis = useMemo(() => analyzeMix(selectedIds), [selectedIds]);

  // Recetas que hacen match
  const { exact, near, suggestion } = useMemo(
    () => matchRecipes(selectedIds),
    [selectedIds]
  );

  const handleToggle = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleClear = () => {
    audioEffects.playPop();
    setSelectedIds([]);
  };

  const handlePreset = (ids: string[]) => {
    setSelectedIds(ids);
  };

  const handleAddMissing = (id: string) => {
    audioEffects.playSuccessChime();
    setSelectedIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  return (
    <div className="py-2 space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Top Navigation Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-night-900 border border-night-800">
        <button
          type="button"
          onClick={() => {
            audioEffects.playPop();
            setActiveTab("mix");
          }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "mix"
              ? "bg-indigo-600 text-white shadow-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <FlaskConical className="w-4 h-4 text-indigo-300" />
          <span>Barra & Mezclas</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playPop();
            setActiveTab("piscolometer");
          }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "piscolometer"
              ? "bg-rose-600 text-white shadow-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Flame className="w-4 h-4 text-rose-300" />
          <span>{locale.countryCode === "CL" ? "El Piscolómetro" : `El ${locale.drinks.stapleName}`}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playPop();
            setActiveTab("encyclopedia");
          }}
          className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "encyclopedia"
              ? "bg-purple-600 text-white shadow-glow-purple"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-300" />
          <span>Diccionario</span>
        </button>
      </div>

      {/* TAB 1: BARRA & MEZCLAS VISUAL (FUSIÓN UNIFICADA) */}
      {activeTab === "mix" && (
        <div className="space-y-6">
          {/* Vaso SVG Animado con Graduación y Veredicto */}
          <VisualMixBar analysis={analysis} selectedCount={selectedIds.length} />

          {/* Chips de Ingredientes en 5 Pestañas */}
          <IngredientChips
            selectedIds={selectedIds}
            onToggle={handleToggle}
            onClear={handleClear}
            onPreset={handlePreset}
          />

          {/* Listado de Recetas Viables y Sugerencias */}
          <RecipeCardsList
            exact={exact}
            near={near}
            suggestion={suggestion}
            onAddMissingIngredient={handleAddMissing}
          />
        </div>
      )}

      {/* TAB 2: PISCOLÓMETRO */}
      {activeTab === "piscolometer" && <PiscolometerSlider />}

      {/* TAB 3: DICCIONARIO COMPLETO */}
      {activeTab === "encyclopedia" && <DrinkEncyclopedia />}
    </div>
  );
}
