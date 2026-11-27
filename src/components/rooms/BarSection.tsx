"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BarStudio, { type GlassDraft } from "@/components/bar/BarStudio";
import Recetario from "@/components/bar/Recetario";
import Diccionario from "@/components/bar/Diccionario";
import PiscolometerSlider from "@/components/bar/PiscolometerSlider";
import CintaTragos from "@/components/bar/CintaTragos";
import SectionStage, { type StageOption } from "./SectionStage";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { pantryFromBasket } from "@/lib/basket";

type Estacion = "preparar" | "recetario" | "diccionario" | "piscolometro" | "sinalcohol";
const ESTACIONES: Estacion[] = ["preparar", "recetario", "diccionario", "piscolometro", "sinalcohol"];

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

/**
 * Apartado Bar: llegas a la barra y el barman te atiende. Sus estaciones (lo que hay en la mesa, el recetario, el
 * diccionario, el piscolómetro y lo sin alcohol) están al alcance; al elegir una, la barra se recoge y queda la
 * herramienta, con el barman al lado diciéndote qué hacer. Se llega directo con `?ver=`. A quien maneja, el barman le
 * ofrece primero lo sin alcohol.
 */
export default function BarSection() {
  const { locale } = useLocale();
  const { code } = useActiveCode();
  const store = useCarreteStore(code);
  const router = useRouter();
  const params = useSearchParams();
  const raw = params.get("ver") as Estacion | null;
  const ver = raw && ESTACIONES.includes(raw) ? raw : null;
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
      if (next.has(id) && shopping.includes(id)) {
        const s = shopping.filter((x) => x !== id);
        setShoppingState(s);
        writeList(SHOP_KEY, s);
      }
    },
    [pantry, setPantry, shopping],
  );
  const toggleShopping = useCallback(
    (id: string) => {
      const s = shopping.includes(id) ? shopping.filter((x) => x !== id) : [...shopping, id];
      setShoppingState(s);
      writeList(SHOP_KEY, s);
    },
    [shopping],
  );

  const open = (v: Estacion | null) => router.replace(v ? `/bar?ver=${v}` : "/bar", { scroll: false });
  const pickRecipe = (id: string) => {
    audioEffects.playBubble();
    setDraft({ recipeId: id, lines: [], scale: { kind: "vaso" } });
    open("preparar");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const me = store.participants.find((p) => p.id === store.meId);
  const driver = me?.role === "driver";
  const onLog = me && !driver ? (label: string, ml: number, abv: number) => store.addConsumption(me.id, { label, ml, abv }) : undefined;
  const piscolometro = locale.countryCode === "CL" ? "Piscolómetro" : `${locale.drinks.stapleName}-metro`;

  const options: StageOption[] = [
    { id: "preparar", label: "Lo que hay en la mesa", hint: "Dime qué tienen y te digo qué sale", icon: "🍸", onSelect: () => open("preparar") },
    { id: "sinalcohol", label: "Sin alcohol", hint: "Para quien maneja o no toma", icon: "🍋", onSelect: () => open("sinalcohol") },
    { id: "recetario", label: "Recetario", hint: "Todos los tragos, con medidas exactas", icon: "📖", onSelect: () => open("recetario") },
    { id: "piscolometro", label: piscolometro, hint: "La proporción justa, a tu gusto", icon: "🎚️", onSelect: () => open("piscolometro") },
    { id: "diccionario", label: "Diccionario", hint: "Qué es cada cosa detrás de la barra", icon: "🗂️", onSelect: () => open("diccionario") },
    // Cuidado, a mano en la barra: cuánto tarda en bajar (no a quien maneja, que no toma) y los mitos de la caña
    ...(driver ? [] : [{ id: "tiempo", label: "¿En cuánto se me pasa?", hint: "Cuánto tarda en bajar lo que tomaste", icon: "⏳", href: "/tiempo" }]),
    { id: "mitos", label: "Mitos y verdades", hint: "Qué es cierto y qué no sobre la caña", icon: "💬", href: "/mitos" },
  ];
  // Quien maneja ve primero lo sin alcohol (y el barman se lo ofrece)
  if (driver) options.unshift(options.splice(1, 1)[0]);

  const lines: Record<Estacion | "hub", string[]> = {
    hub: driver
      ? ["Tú manejas: te preparo lo mejor sin alcohol.", "Limonadas, mocktails y tónicas: nada que envidiarle a nadie."]
      : [
          "Bienvenido a la barra. ¿Qué hay en la mesa? Yo te digo qué sale.",
          "¿Algo sin alcohol? Tengo varios que no tienen nada que envidiar.",
          "Medidas exactas, para un vaso o para la jarra: tú me dices.",
          "Cuando quieras, te digo en cuánto se te pasa y qué mitos de la caña no sirven.",
        ],
    preparar: ["Marca lo que tienen y te muestro qué podemos preparar.", "Al final, el vaso con sus medidas exactas, para uno o para la jarra."],
    sinalcohol: ["Estos no llevan alcohol y se ven igual de buenos.", "Elige uno y te lo dejo con sus medidas."],
    recetario: ["Todos los tragos de la casa: filtra por familia u origen.", "Toca uno y lo preparamos."],
    piscolometro: ["La piscola perfecta es la que te gusta: ajusta la proporción.", "Más bebida, menos alcohol: siempre se puede."],
    diccionario: ["¿Dudas con algún nombre? Aquí está todo lo de la barra.", "Toca un trago y te lo preparo."],
  };

  return (
    <SectionStage id="bar" video="bar" eyebrow="El bar · tu barman esta noche" title={ver ? "La barra" : "El bar"} lines={lines[ver ?? "hub"]} options={options} active={ver} compact={!!ver}>
      {ver && (
        <div className="relative space-y-8 pt-6 pb-12">
          {ver === "preparar" && (
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
          {ver === "sinalcohol" && <CintaTragos onPick={pickRecipe} driver />}
          {ver === "recetario" && (
            <>
              <CintaTragos onPick={pickRecipe} driver={driver} />
              <Recetario pantry={pantry} onPick={pickRecipe} />
            </>
          )}
          {ver === "diccionario" && <Diccionario onPick={pickRecipe} />}
          {ver === "piscolometro" && <PiscolometerSlider />}
        </div>
      )}
    </SectionStage>
  );
}
