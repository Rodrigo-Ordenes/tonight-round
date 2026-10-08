"use client";

import React, { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import content from "@/data/games_content.json";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

type NCat = { id: string; name: string; icon: string; questions: string[] };
const CATS: NCat[] = content.never_have_i_ever.categories;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Yo Nunca: frase aleatoria con barajado Fisher-Yates, sin repetir hasta agotar el mazo. */
export default function RandomPicanteGame({ store }: { store: CarreteStore }) {
  const { games, patchGames } = store;
  const [catId, setCatId] = useState<string>("todas");

  const pool = useMemo(
    () => (catId === "todas" ? CATS.flatMap((c) => c.questions) : CATS.find((c) => c.id === catId)?.questions ?? []),
    [catId]
  );

  const current = games.neverDeck[games.neverIdx - 1];

  const draw = () => {
    audioEffects.playPop();
    let deck = games.neverDeck;
    let idx = games.neverIdx;
    const valid = deck.length > 0 && deck.every((q) => pool.includes(q));
    if (!valid || idx >= deck.length) {
      deck = shuffle(pool);
      idx = 0;
    }
    patchGames({ neverDeck: deck, neverIdx: idx + 1 });
  };

  const changeCat = (id: string) => {
    setCatId(id);
    patchGames({ neverDeck: [], neverIdx: 0 });
  };

  return (
    <div className="rounded-3xl bg-night-900/80 border border-pink-500/30 p-5 space-y-4 text-center">
      <div className="text-pink-300 font-black">🙈 YO NUNCA NUNCA</div>
      <div className="flex flex-wrap justify-center gap-2">
        {[{ id: "todas", name: "Todas", icon: "🎲" }, ...CATS].map((c) => (
          <button
            key={c.id}
            onClick={() => changeCat(c.id)}
            className={`min-h-[48px] px-3 rounded-xl text-xs font-bold ${
              catId === c.id ? "bg-pink-600 text-white" : "bg-slate-800 text-slate-300"
            }`}
          >
            {c.icon} {c.name}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border-2 border-pink-500/40 bg-pink-950/20 p-5 min-h-[120px] flex items-center justify-center">
        <p className="text-xl font-black text-white leading-snug">
          {current ? `Yo nunca nunca… ${current}` : "Toca el botón para sacar la primera frase."}
        </p>
      </div>

      <p className="text-[11px] text-slate-500">
        {games.neverDeck.length > 0 ? `Frase ${games.neverIdx} de ${games.neverDeck.length}` : `${pool.length} frases en el mazo`}
      </p>

      <button onClick={draw} className="w-full min-h-[56px] rounded-2xl bg-pink-600 text-white font-black flex items-center justify-center gap-2">
        <Shuffle className="w-5 h-5" /> 🎲 Frase Aleatoria
      </button>
    </div>
  );
}
