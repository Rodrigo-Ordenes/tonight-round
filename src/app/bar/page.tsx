"use client";

import React, { useCallback, useEffect, useState } from "react";
import BarStudio, { type GlassDraft } from "@/components/bar/BarStudio";
import Recetario from "@/components/bar/Recetario";
import Diccionario from "@/components/bar/Diccionario";
import PiscolometerSlider from "@/components/bar/PiscolometerSlider";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { pantryFromBasket } from "@/lib/basket";

type BarTab = "preparar" | "recetario" | "diccionario" | "piscolometro";

const PANTRY_KEY = "tonight_bar_pantry";
const SHOP_KEY = "tonight_bar_shopping";
const DEFAULT_PANTRY = ["hielo", "limon", "bebida_cola", "pisco"];

function readList(key: string, fallback: string[]): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : fallback;
  } catch {
    return fallback;
  }
}

function writeList(key: string, v: string[]) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* sin almacenamiento */
  }
}

export default function BarPage() {
  const { locale } = useLocale();
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const [tab, setTab] = useState<BarTab>("preparar");
  const [pantry, setPantryState] = useState<Set<string>>(new Set(DEFAULT_PANTRY));
  const [shopping, setShoppingState] = useState<string[]>([]);
  const [draft, setDraft] = useState<GlassDraft>({ recipeId: "piscola", lines: [], scale: { kind: "vaso" } });

  useEffect(() => {
    setPantryState(new Set(readList(PANTRY_KEY, DEFAULT_PANTRY)));
    setShoppingState(readList(SHOP_KEY, []));
  }, []);

  const setPantry = useCallback((ids: string[]) => {
    setPantryState(new Set(ids));
    writeList(PANTRY_KEY, ids);
  }, []);

  const togglePantry = useCallback(
    (id: string) => {
      const next = new Set(pantry);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setPantry(Array.from(next));
      // Si ya lo tienen, sale de la lista de compras
      if (next.has(id) && shopping.includes(id)) {
        const s = shopping.filter((x) => x !== id);
        setShoppingState(s);
        writeList(SHOP_KEY, s);
      }
    },
    [pantry, setPantry, shopping]
  );

  const toggleShopping = useCallback(
    (id: string) => {
      const s = shopping.includes(id) ? shopping.filter((x) => x !== id) : [...shopping, id];
      setShoppingState(s);
      writeList(SHOP_KEY, s);
    },
    [shopping]
  );

  const pickRecipe = (id: string) => {
    audioEffects.playBubble();
    setDraft({ recipeId: id, lines: [], scale: { kind: "vaso" } });
    setTab("preparar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const me = store.participants.find((p) => p.id === store.meId);
  const onLog =
    me && me.role !== "driver"
      ? (label: string, ml: number, abv: number) => store.addConsumption(me.id, { label, ml, abv })
      : undefined;

  const TABS: { id: BarTab; label: string }[] = [
    { id: "preparar", label: "Preparar" },
    { id: "recetario", label: "Recetario" },
    { id: "diccionario", label: "Diccionario" },
    { id: "piscolometro", label: locale.countryCode === "CL" ? "Piscolómetro" : `${locale.drinks.stapleName}-metro` },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="eyebrow">Bar</p>
          <h1 className="display text-display-lg mt-3">
            Arma el trago<span className="text-gradient-ember">.</span>
          </h1>
          <p className="mt-3 text-base text-slate-300">
            Primero lo que tienen, después la idea, y al final el vaso con medidas exactas para uno o para la jarra.
          </p>
        </div>
        <div className="flex max-w-full overflow-x-auto no-scrollbar rounded-2xl bg-white/[0.04] p-1" role="tablist" aria-label="Secciones del bar">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => {
                audioEffects.playPop();
                setTab(t.id);
              }}
              className={`min-h-[44px] shrink-0 rounded-xl px-4 text-sm font-bold transition-colors ${tab === t.id ? "bg-white text-night-950" : "text-slate-300 hover:text-white"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {tab === "preparar" && (
        <BarStudio
          pantry={pantry}
          togglePantry={togglePantry}
          setPantry={setPantry}
          shopping={shopping}
          toggleShopping={toggleShopping}
          clearShopping={() => {
            setShoppingState([]);
            writeList(SHOP_KEY, []);
          }}
          draft={draft}
          setDraft={setDraft}
          onLog={onLog}
          logLabel={me ? `Me lo tomé · registrar a ${me.name}` : undefined}
          basketPantry={pantryFromBasket(store.basket.items)}
        />
      )}

      {tab === "recetario" && <Recetario pantry={pantry} onPick={pickRecipe} />}

      {tab === "diccionario" && <Diccionario onPick={pickRecipe} />}

      {tab === "piscolometro" && <PiscolometerSlider />}
    </div>
  );
}
