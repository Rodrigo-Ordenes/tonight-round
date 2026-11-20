"use client";

import React, { useMemo, useState } from "react";
import { Shuffle } from "lucide-react";
import content from "@/data/games_content.json";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { YO_NUNCA } from "@/data/party_prompts";

type NCat = { id: string; name: string; icon: string; questions: string[] };
// Las categorías originales + el banco ampliado de Tonight V10 (sin duplicados)
const EXTRA_BY_ID: Record<string, string> = { mechona: "Piola", universitario: "U y pega", picante: "Picante", toxico: "Tóxico" };
const BASE: NCat[] = content.never_have_i_ever.categories.map((c) => {
  const extra = YO_NUNCA.find((x) => x.cat === EXTRA_BY_ID[c.id])?.items ?? [];
  return { ...c, questions: Array.from(new Set([...c.questions, ...extra])) };
});
const CATS: NCat[] = [
  ...BASE,
  ...YO_NUNCA.filter((x) => !Object.values(EXTRA_BY_ID).includes(x.cat)).map((x) => ({
    id: x.cat.toLowerCase().replace(/\s+/g, "_"),
    name: x.cat,
    icon: x.emoji,
    questions: x.items,
  })),
];

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
      <div className="text-pink-300 font-bold">🙈 YO NUNCA NUNCA</div>
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

      {/* Mazo en abanico (21st «Card Shuffle Deck»): la carta de adelante sale volando abajo a la izquierda y se
          mete detrás del mazo; también se puede lanzar arrastrándola */}
      <ShuffleDeck text={current ? `Yo nunca nunca… ${current}` : "Toca el botón para sacar la primera frase."} onFlick={draw} />

      <p className="text-xs text-slate-500">
        {games.neverDeck.length > 0 ? `Frase ${games.neverIdx} de ${games.neverDeck.length}` : `${pool.length} frases en el mazo`}
      </p>

      <button onClick={draw} className="w-full min-h-[56px] rounded-2xl bg-pink-600 text-white font-bold flex items-center justify-center gap-2">
        <Shuffle className="w-5 h-5" /> 🎲 Frase Aleatoria
      </button>
    </div>
  );
}

function ShuffleDeck({ text, onFlick }: { text: string; onFlick: () => void }) {
  const [gone, setGone] = useState<{ text: string; n: number } | null>(null);
  const prev = React.useRef(text);
  const drag = React.useRef<{ x: number; y: number } | null>(null);
  const front = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    if (prev.current !== text) {
      setGone((g) => ({ text: prev.current, n: (g?.n ?? 0) + 1 }));
      prev.current = text;
    }
  }, [text]);
  const reset = () => {
    if (front.current) {
      front.current.style.transition = "transform 320ms cubic-bezier(0.32, 0.72, 0, 1)";
      front.current.style.transform = "";
    }
  };
  return (
    <div className="shuffle-deck relative mx-auto h-48 w-full max-w-sm" style={{ perspective: "900px" }}>
      <div aria-hidden className="absolute inset-0 rotate-[-5deg] translate-x-[-6px] translate-y-[8px] scale-[0.94] rounded-2xl border border-pink-500/30 bg-night-900" />
      <div aria-hidden className="absolute inset-0 rotate-[4deg] translate-x-[6px] translate-y-[4px] scale-[0.97] rounded-2xl border border-pink-500/30 bg-night-900" />
      <div
        ref={front}
        key={`front-${gone?.n ?? 0}`}
        className="shuffle-front absolute inset-0 flex cursor-grab touch-pan-y items-center justify-center rounded-2xl border border-pink-500/40 bg-[linear-gradient(160deg,rgba(185,62,243,0.18),rgba(13,14,20,0.95))] p-5 active:cursor-grabbing"
        onPointerDown={(e) => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { x: e.clientX, y: e.clientY };
          if (front.current) front.current.style.transition = "none";
        }}
        onPointerMove={(e) => {
          if (!drag.current || !front.current) return;
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          front.current.style.transform = `translate(${dx}px, ${dy * 0.4}px) rotate(${dx * 0.06}deg)`;
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 80) onFlick();
          else reset();
        }}
        onPointerCancel={() => {
          drag.current = null;
          reset();
        }}
      >
        <p className="text-xl font-bold leading-snug text-white" aria-live="polite">
          {text}
        </p>
      </div>
      {gone && (
        <div key={`gone-${gone.n}`} aria-hidden className="shuffle-fling pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl border border-pink-500/40 bg-night-900 p-5">
          <p className="text-xl font-bold leading-snug text-white/80">{gone.text}</p>
        </div>
      )}
    </div>
  );
}
