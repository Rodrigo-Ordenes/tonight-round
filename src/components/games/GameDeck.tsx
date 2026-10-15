"use client";

import React, { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import gamesData from "@/data/games.json";
import GameCard, { GameItem } from "./GameCard";
import CustomizableRoulette from "./CustomizableRoulette";
import DynamicTimeBomb from "./DynamicTimeBomb";
import RandomPicanteGame from "./RandomPicanteGame";
import FingerChooser from "./FingerChooser";
import LiveGameHost from "@/components/live/LiveGameHost";
import LiveRoundCard from "@/components/live/LiveRoundCard";
import PageHeader from "@/components/ui/PageHeader";
import { audioEffects } from "@/lib/audioEffects";

type Quick = "ruleta" | "bomba" | "nunca" | "dedazo";

const QUICK: { id: Quick; label: string; emoji: string; blurb: string }[] = [
  { id: "ruleta", label: "La Ruleta", emoji: "🎡", blurb: "Castigos, retos y verdades con los nombres de la sala." },
  { id: "bomba", label: "La Bomba", emoji: "💣", blurb: "Categoría al azar y el celular pasa de mano en mano." },
  { id: "nunca", label: "Yo nunca", emoji: "🙊", blurb: "Mazo barajado sin repetir, por niveles." },
  { id: "dedazo", label: "El Dedazo", emoji: "☝️", blurb: "Todos ponen un dedo en la pantalla: el celular elige." },
];

export default function GameDeck() {
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const [quick, setQuick] = useState<Quick>("ruleta");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("Todos");

  const allTags = useMemo(() => ["Todos", ...Array.from(new Set((gamesData as GameItem[]).flatMap((g) => g.tags)))], []);

  const filteredGames = useMemo(
    () =>
      (gamesData as GameItem[]).filter((game) => {
        const q = searchQuery.toLowerCase();
        return (selectedTag === "Todos" || game.tags.includes(selectedTag)) && (!q || game.name.toLowerCase().includes(q) || game.description.toLowerCase().includes(q));
      }),
    [selectedTag, searchQuery]
  );

  const me = store.participants.find((p) => p.id === store.meId);

  return (
    <div className="space-y-16 pb-12">
      <PageHeader eyebrow="Juegos" title="Que empiece el juego">
        La TV hace de escenario y cada celular vota en secreto. Si no hay TV, también hay juegos para un solo celular y un catálogo de clásicos.
      </PageHeader>

      {/* Si este celular es participante y hay ronda, primero su control */}
      {me && store.state.live?.round && (
        <section aria-label="Tu voto">
          <LiveRoundCard store={store} compact />
        </section>
      )}

      <LiveGameHost store={store} />

      <section aria-labelledby="rapidos-title" className="space-y-6">
        <div>
          <p className="eyebrow">Un solo celular</p>
          <h2 id="rapidos-title" className="display mt-1 text-2xl sm:text-3xl">
            Juegos rápidos
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
          {QUICK.map((g) => (
            <button
              key={g.id}
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setQuick(g.id);
              }}
              aria-pressed={quick === g.id}
              className={`surface surface-hover p-4 text-left ${quick === g.id ? "ring-2 ring-indigo-400" : ""}`}
            >
              <span className="text-2xl">{g.emoji}</span>
              <span className="mt-2 block font-display text-base font-bold text-white">{g.label}</span>
              <span className="mt-0.5 block text-xs leading-snug text-slate-400">{g.blurb}</span>
            </button>
          ))}
        </div>
        <div>
          {quick === "ruleta" && <CustomizableRoulette store={store} />}
          {quick === "bomba" && <DynamicTimeBomb store={store} />}
          {quick === "nunca" && <RandomPicanteGame store={store} />}
          {quick === "dedazo" && <FingerChooser />}
        </div>
      </section>

      <section aria-labelledby="catalogo-title" className="space-y-5">
        <div>
          <p className="eyebrow">Sin pantalla</p>
          <h2 id="catalogo-title" className="display mt-1 text-2xl sm:text-3xl">
            {filteredGames.length} clásicos de carrete
          </h2>
        </div>
        <div className="flex flex-col gap-3">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 w-4 h-4 -translate-y-1/2 text-slate-400" />
            <span className="sr-only">Buscar juego</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar juego por nombre o reglas…"
              className="min-h-[50px] w-full rounded-2xl border border-white/10 bg-night-900/70 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-indigo-400"
            />
          </label>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:flex-wrap sm:px-0">
            {allTags.map((tag) => (
              <button key={tag} type="button" onClick={() => setSelectedTag(tag)} className={`chip shrink-0 ${selectedTag === tag ? "chip-on" : ""}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
          {filteredGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </section>
    </div>
  );
}
