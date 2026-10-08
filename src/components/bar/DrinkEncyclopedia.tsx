"use client";

import React, { useState, useMemo } from "react";
import { 
  Search, 
  Wine, 
  Sparkles, 
  GlassWater, 
  Flame, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  X,
  Gauge,
  Info
} from "lucide-react";
import recipesData from "@/data/cocktail_recipes.json";
import { audioEffects } from "@/lib/audioEffects";

export interface CocktailRecipe {
  id: string;
  name: string;
  category: string;
  spirit: string;
  required: string[];
  optional: string[];
  proportions: string;
  abv_estimated: number;
  difficulty: string;
  glass: string;
  description: string;
  chilean_lore: string;
}

const CATEGORIES = [
  "Todos",
  "Pisco Sour",
  "Vinos Chilenos",
  "Destilados",
  "Vodka",
  "Vodka Sabores",
  "Cervezas",
  "Mocktail",
];

export default function DrinkEncyclopedia() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [activeRecipe, setActiveRecipe] = useState<CocktailRecipe | null>(null);

  const recipes = recipesData as CocktailRecipe[];

  const filteredRecipes = useMemo(() => {
    return recipes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.proportions.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.chilean_lore.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === "Todos" ||
        r.category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [recipes, searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-indigo-950/80 border border-purple-500/30 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                DICCIONARIO DE TRAGOS, PISCO SOUR Y VINOS CHILENOS
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                Fichas de preparación, ratios auténticos, cristalería y notas culturales de la noche chilena.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 self-start sm:self-auto">
            {filteredRecipes.length} recetas disponibles
          </span>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, pisco sour, frutillas, pipeño, vodka frambuesa..."
            className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-700 focus:border-purple-500 text-white text-sm outline-none transition-all placeholder:text-slate-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filtros por Categoría */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                audioEffects.playTick(600, 0.02);
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === cat
                  ? "bg-purple-600 text-white shadow-md shadow-purple-600/30 scale-105"
                  : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Recetas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            onClick={() => {
              audioEffects.playPop();
              setActiveRecipe(recipe);
            }}
            className="group cursor-pointer p-5 rounded-3xl bg-night-900/80 hover:bg-night-850 border border-slate-800 hover:border-purple-500/50 transition-all hover:scale-[1.01] active:scale-[0.99] flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {recipe.category}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ~{recipe.abv_estimated}° alc.
                </span>
              </div>

              <h3 className="text-base font-black text-white group-hover:text-purple-300 transition-colors">
                {recipe.name}
              </h3>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {recipe.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span className="truncate max-w-[180px] font-medium text-slate-400">
                {recipe.glass}
              </span>
              <span className="flex items-center gap-1 text-purple-400 font-bold group-hover:translate-x-1 transition-transform">
                <span>Ver receta</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <div className="p-12 text-center rounded-3xl bg-night-900/50 border border-slate-800 text-slate-400 space-y-2">
          <Wine className="w-10 h-10 mx-auto text-slate-600" />
          <p className="text-sm font-semibold">No se encontraron tragos con esa búsqueda.</p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("Todos");
            }}
            className="text-xs text-purple-400 underline font-bold"
          >
            Restablecer filtros
          </button>
        </div>
      )}

      {/* MODAL DETALLADO DE FICHA DE TRAGO */}
      {activeRecipe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-lg my-auto rounded-3xl bg-gradient-to-b from-night-900 via-night-950 to-slate-950 border border-purple-500/40 shadow-2xl p-6 sm:p-8 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {activeRecipe.category}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white mt-1.5">
                  {activeRecipe.name}
                </h3>
              </div>
              <button
                onClick={() => setActiveRecipe(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-3 gap-2 p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Graduación</span>
                <span className="text-amber-400 font-mono font-black text-sm">~{activeRecipe.abv_estimated}°</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Dificultad</span>
                <span className="text-indigo-300 font-bold text-sm">{activeRecipe.difficulty}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Cristalería</span>
                <span className="text-emerald-300 font-semibold text-[11px] truncate block">{activeRecipe.glass}</span>
              </div>
            </div>

            {/* Proporción y Fórmula */}
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/30 space-y-1.5">
              <span className="text-xs font-black uppercase tracking-wider text-purple-300 block">
                📏 Proporción Recomendada:
              </span>
              <p className="text-sm font-bold text-white">
                {activeRecipe.proportions}
              </p>
            </div>

            {/* Preparación & Descripción */}
            <div className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                👨‍🍳 Método de Servicio:
              </span>
              <p>{activeRecipe.description}</p>
            </div>

            {/* Lore Chileno */}
            <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200/90">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-amber-300 block font-bold">Cultura del Carrete Chileno:</strong>
                <p>{activeRecipe.chilean_lore}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveRecipe(null)}
              className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs transition-colors"
            >
              Listo / Volver al Diccionario
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
