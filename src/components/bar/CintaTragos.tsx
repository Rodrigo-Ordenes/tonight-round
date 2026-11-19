"use client";

import React, { useMemo } from "react";
import SushiConveyorMenu, { type ConveyorDish, type DishTier } from "@/components/ui/sushi-conveyor-menu";
import { INGREDIENT_BY_ID, RECIPES, GLASS_LABEL, type Recipe } from "@/data/drinks";
import { analyzeGlass } from "@/lib/bar";

/** Tragos de la cinta: clásicos del carrete y siempre opciones sin alcohol */
const PICKS = ["piscola", "pisco_sour", "virgin_mojito", "terremoto", "gin_tonic", "limonada_jengibre", "mojito", "michelada_cl", "shirley_temple", "aperol_spritz", "tropical_00", "cuba_libre"];

const LEGEND = { 1: "Sin alcohol", 2: "Suave", 3: "Medio", 4: "Fuerte", 5: "Muy fuerte" };

/** Nivel por gramos de alcohol por porción (fijo, no se anima) */
const tierFor = (grams: number): DishTier => (grams < 0.5 ? 1 : grams <= 10 ? 2 : grams <= 16 ? 3 : grams <= 22 ? 4 : 5);

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Color del trago: mezcla de los colores de sus líquidos según sus ml */
function liquidColor(r: Recipe): string {
  let total = 0;
  const acc = [0, 0, 0];
  for (const l of r.spec) {
    const ing = INGREDIENT_BY_ID.get(l.id);
    if (!ing?.color || l.ml <= 0) continue;
    const c = hex(ing.color);
    acc.forEach((_, i) => (acc[i] += c[i] * l.ml));
    total += l.ml;
  }
  if (!total) return "#BFE7F5";
  return `rgb(${acc.map((v) => Math.round(v / total)).join(",")})`;
}

/** Vaso visto desde arriba (SVG en data URI): borde de vidrio, el trago, hielo y la guarnición */
function glassImage(r: Recipe): string {
  const has = (id: string) => r.spec.some((l) => l.id === id);
  const color = liquidColor(r);
  const ice = has("hielo")
    ? [
        [42, 40, 12],
        [58, 46, -10],
        [46, 58, 20],
      ]
        .map(([x, y, a]) => `<rect x="${x - 8}" y="${y - 8}" width="16" height="16" rx="3.5" transform="rotate(${a} ${x} ${y})" fill="rgba(255,255,255,0.32)" stroke="rgba(255,255,255,0.6)" stroke-width="1"/>`)
        .join("")
    : "";
  const lime =
    has("limon") || has("lima") || /lim/i.test(r.garnish ?? "")
      ? `<g transform="translate(64 32)"><circle r="10" fill="#C9E86B" stroke="#8DB33A" stroke-width="2"/>${[0, 60, 120, 180, 240, 300].map((a) => `<path d="M0 0 L${(Math.cos((a * Math.PI) / 180) * 8).toFixed(1)} ${(Math.sin((a * Math.PI) / 180) * 8).toFixed(1)}" stroke="#F4FBD9" stroke-width="1.2"/>`).join("")}</g>`
      : "";
  const mint = has("menta") ? `<path d="M30 60 q6 -10 14 -4 q-6 8 -14 4z M34 66 q8 -6 12 2 q-8 4 -12 -2z" fill="#4DBF7A" opacity="0.9"/>` : "";
  const foam = r.id.includes("sour") || r.id === "terremoto" ? `<circle cx="50" cy="50" r="30" fill="rgba(255,255,255,0.55)"/>` : "";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="rgba(236,236,241,0.06)" stroke="rgba(236,236,241,0.75)" stroke-width="3"/><circle cx="50" cy="50" r="40" fill="${color}" opacity="0.88"/>${foam}${ice}${mint}${lime}<path d="M22 34 A32 32 0 0 1 40 18" stroke="rgba(255,255,255,0.55)" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const fmt = (g: number) => `${g.toLocaleString("es-CL", { maximumFractionDigits: 0 })} g de alcohol`;

/**
 * La cinta de tragos del Bar: los tragos giran como en un kaiten; al elegir uno se abre su ficha y «Preparar» lo
 * manda al vaso. Quien maneja solo ve tragos sin alcohol.
 */
export default function CintaTragos({ onPick, driver = false }: { onPick: (id: string) => void; driver?: boolean }) {
  const items = useMemo<ConveyorDish[]>(() => {
    return PICKS.map((id) => RECIPES.find((r) => r.id === id))
      .filter((r): r is Recipe => !!r)
      .map((r) => {
        const a = analyzeGlass(r.spec, r.method, r.glass);
        const grams = a.grams;
        return {
          id: r.id,
          name: r.name,
          description: r.blurb,
          price: grams < 0.5 ? "Sin alcohol" : fmt(grams),
          tier: tierFor(grams),
          image: glassImage(r),
          details: [GLASS_LABEL[r.glass], r.family, ...(r.batch ? ["Rinde en jarra"] : [])],
        };
      })
      .filter((d) => !driver || d.tier === 1);
  }, [driver]);

  return (
    <SushiConveyorMenu
      items={items}
      legend={driver ? { 1: LEGEND[1] } : LEGEND}
      eyebrow="Cinta de tragos"
      heading="Los tragos dan la vuelta. Elige el tuyo."
      caption="Pasa el puntero para detener la cinta, lánzala con el dedo y toca un vaso para ver la receta."
      labels={{ add: "Preparar", close: "Cerrar", previous: "Trago anterior", next: "Trago siguiente", pause: "Pausar la cinta" }}
      onAdd={(item) => onPick(item.id)}
    />
  );
}
