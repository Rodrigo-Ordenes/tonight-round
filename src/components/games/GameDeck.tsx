"use client";

import React, { useState, useMemo } from "react";
import { Dices, Search, Bomb, Shuffle, Hand, BookOpen, Sparkles } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import gamesData from "@/data/games.json";
import GameCard, { GameItem } from "./GameCard";
import CustomizableRoulette from "./CustomizableRoulette";
import DynamicTimeBomb from "./DynamicTimeBomb";
import RandomPicanteGame from "./RandomPicanteGame";
import FingerChooser from "./FingerChooser";
import { audioEffects } from "@/lib/audioEffects";

type GameTab = "ruleta" | "bomba" | "nunca" | "dedazo" | "catalogo";

export default function GameDeck() {
  const { code } = useActiveCode();
  const { locale } = useLocale();
  const store = useCarreteStore(code);

  const [activeTab, setActiveTab] = useState<GameTab>("ruleta");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("Todos");

  const ALL_TAGS = ["Todos", "Sin materiales", "Rompehielos", "Cartas", "Rápido", "Clásico"];

  const filteredGames = useMemo(() => {
    return (gamesData as GameItem[]).filter((game) => {
      const matchesTag = selectedTag === "Todos" || game.tags.includes(selectedTag);
      const matchesQuery =
        !searchQuery ||
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTag && matchesQuery;
    });
  }, [selectedTag, searchQuery]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-night-950 via-indigo-950/60 to-night-950 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Game Studio {locale.terminology.partyName}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white">
            Dinámicas & Juegos Sociales
          </h1>
          <p className="text-xs text-slate-400">
            {code !== "SOLO"
              ? `Sincronizado con ${locale.terminology.partyName} ${code}`
              : "Modo individual / Juegos sociales"}
          </p>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-1.5 rounded-2xl bg-night-900 border border-night-800">
        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            setActiveTab("ruleta");
          }}
          className={`min-h-[46px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "ruleta"
              ? "bg-indigo-600 text-white shadow-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Dices className="w-4 h-4 text-indigo-300" />
          <span>La Ruleta</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            setActiveTab("bomba");
          }}
          className={`min-h-[46px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "bomba"
              ? "bg-amber-600 text-white shadow-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Bomb className="w-4 h-4 text-amber-300" />
          <span>La Bomba</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            setActiveTab("nunca");
          }}
          className={`min-h-[46px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "nunca"
              ? "bg-pink-600 text-white shadow-glow"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Shuffle className="w-4 h-4 text-pink-300" />
          <span>Yo Nunca</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            setActiveTab("dedazo");
          }}
          className={`min-h-[46px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "dedazo"
              ? "bg-emerald-600 text-white shadow-glow-accent"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Hand className="w-4 h-4 text-emerald-300" />
          <span>El Dedazo</span>
        </button>

        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            setActiveTab("catalogo");
          }}
          className={`col-span-2 sm:col-span-1 min-h-[46px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
            activeTab === "catalogo"
              ? "bg-purple-600 text-white shadow-glow-purple"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <BookOpen className="w-4 h-4 text-purple-300" />
          <span>Catálogo</span>
        </button>
      </div>

      {/* RENDER JUEGOS */}
      {activeTab === "ruleta" && <CustomizableRoulette store={store} />}
      {activeTab === "bomba" && <DynamicTimeBomb store={store} />}
      {activeTab === "nunca" && <RandomPicanteGame store={store} />}
      {activeTab === "dedazo" && <FingerChooser />}

      {/* CATÁLOGO DE DINÁMICAS */}
      {activeTab === "catalogo" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar juego por nombre o reglas..."
                className="w-full min-h-[48px] pl-10 pr-4 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {ALL_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-bold whitespace-nowrap ${
                    selectedTag === tag
                      ? "bg-purple-600 text-white"
                      : "bg-night-950 text-slate-400 border border-night-800"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
