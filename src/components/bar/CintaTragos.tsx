"use client";

import React, { useMemo } from "react";
import SushiConveyorMenu, { type ConveyorDish, type DishTier } from "@/components/ui/sushi-conveyor-menu";
import { RECIPES, GLASS_LABEL, type Recipe } from "@/data/drinks";
import { analyzeGlass } from "@/lib/bar";
import { blendColor, darken, drinkLook, lighten } from "@/lib/drinkLook";
import { FOTOS_TRAGOS } from "@/data/fotosTragos";

/** Tragos de la cinta: clásicos del carrete y siempre opciones sin alcohol */
const PICKS = ["piscola", "pisco_sour", "virgin_mojito", "terremoto", "gin_tonic", "limonada_jengibre", "mojito", "michelada_cl", "shirley_temple", "aperol_spritz", "tropical_00", "cuba_libre"];

const LEGEND = { 1: "Sin alcohol", 2: "Suave", 3: "Medio", 4: "Fuerte", 5: "Muy fuerte" };

/** Nivel por gramos de alcohol por porción (fijo, no se anima) */
const tierFor = (grams: number): DishTier => (grams < 0.5 ? 1 : grams <= 10 ? 2 : grams <= 16 ? 3 : grams <= 22 ? 4 : 5);

/** Azar estable por trago (mulberry32 sembrado con el id): cada vaso se ve igual en cada visita */
function seeded(text: string) {
  let a = [...text].reduce((h, ch) => Math.imul(h ^ ch.charCodeAt(0), 16777619), 2166136261) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f1 = (n: number) => n.toFixed(1);

/** Rodaja de cítrico vista desde arriba: cáscara, piel blanca, gajos, brillo y su sombra sobre el trago */
function wheel(cx: number, cy: number, r: number, peel: string, pith: string, pulpIn: string, pulpOut: string, gid: string): string {
  const segs = Array.from({ length: 8 }, (_, i) => {
    const a = (i * Math.PI) / 4 + 0.2;
    return `<path d="M${f1(cx)} ${f1(cy)} L${f1(cx + Math.cos(a) * r * 0.8)} ${f1(cy + Math.sin(a) * r * 0.8)}" stroke="${pith}" stroke-width="0.9"/>`;
  }).join("");
  return (
    `<defs><radialGradient id="${gid}" cx="0.42" cy="0.4" r="0.7"><stop offset="0" stop-color="${pulpIn}"/><stop offset="1" stop-color="${pulpOut}"/></radialGradient></defs>` +
    `<circle cx="${f1(cx + 1.6)}" cy="${f1(cy + 2)}" r="${r}" fill="rgba(0,0,0,0.28)"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="${peel}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${f1(r * 0.9)}" fill="${pith}"/><circle cx="${cx}" cy="${cy}" r="${f1(r * 0.8)}" fill="url(#${gid})"/>${segs}` +
    `<circle cx="${cx}" cy="${cy}" r="1.1" fill="${pith}"/>` +
    `<path d="M${f1(cx - r * 0.55)} ${f1(cy - r * 0.45)} A${f1(r * 0.75)} ${f1(r * 0.75)} 0 0 1 ${f1(cx + r * 0.2)} ${f1(cy - r * 0.7)}" stroke="rgba(255,255,255,0.55)" stroke-width="1" fill="none" stroke-linecap="round"/>`
  );
}

/** Hoja de menta: degradado, nervio central y nervios laterales */
function leaf(x: number, y: number, angle: number, size: number): string {
  return (
    `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${Math.round(angle)}) scale(${(size / 16).toFixed(2)})">` +
    `<path d="M0 0 C4 -6.5 12 -6.5 16 0 C12 6.5 4 6.5 0 0 Z" fill="url(#mint)" stroke="#1F7A41" stroke-width="0.5"/>` +
    `<path d="M0.5 0 L15 0 M5 0 L7.5 -3.6 M9 0 L11.4 -3.2 M5 0 L7.5 3.6 M9 0 L11.4 3.2" stroke="#1F7A41" stroke-width="0.55" stroke-linecap="round" opacity="0.8"/></g>`
  );
}

/** Puntos al azar dentro de un disco (para espuma, burbujas y hielo picado) */
function scatter(rand: () => number, n: number, radius: number, min = 0): [number, number][] {
  return Array.from({ length: n }, () => {
    const a = rand() * Math.PI * 2;
    const d = min + Math.sqrt(rand()) * (radius - min);
    return [50 + Math.cos(a) * d, 50 + Math.sin(a) * d];
  });
}

/**
 * Vaso visto desde arriba (SVG en data URI), lo más real posible sin fotos: sombra y la luz de color que el trago
 * proyecta en la mesa, vidrio grueso con reflejo, el líquido con profundidad (más claro al centro, más oscuro en el
 * borde), granadina que se ve al fondo, espuma con gotas de amargo, helado con su chorrito, hielo con volumen,
 * burbujas y la guarnición dibujada (limón, menta, naranja, pepino, jengibre, frutilla, borde de sal y bombilla).
 */
function glassImage(r: Recipe): string {
  const look = drinkLook(r.spec, r.glass, r.garnish);
  const base = blendColor(r.spec);
  const rand = seeded(r.id);
  const defs: string[] = [
    `<radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0.72" stop-color="#000" stop-opacity="0.5"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="caustic" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="${base}" stop-opacity="0.38"/><stop offset="1" stop-color="${base}" stop-opacity="0"/></radialGradient>`,
    `<radialGradient id="liquid" cx="0.44" cy="0.4" r="0.62"><stop offset="0" stop-color="${lighten(base, 0.2)}"/><stop offset="0.62" stop-color="${base}"/><stop offset="1" stop-color="${darken(base, 0.38)}"/></radialGradient>`,
    `<linearGradient id="rim" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.95"/><stop offset="0.5" stop-color="#fff" stop-opacity="0.35"/><stop offset="1" stop-color="#fff" stop-opacity="0.6"/></linearGradient>`,
    `<linearGradient id="ice" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.7"/><stop offset="1" stop-color="#fff" stop-opacity="0.16"/></linearGradient>`,
    `<linearGradient id="mint" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5ACD86"/><stop offset="1" stop-color="#2A8F4E"/></linearGradient>`,
  ];
  const body: string[] = [
    `<circle cx="55" cy="57" r="45" fill="url(#shadow)"/>`,
    `<circle cx="58" cy="60" r="40" fill="url(#caustic)"/>`,
    `<circle cx="50" cy="50" r="45" fill="rgba(236,236,241,0.08)"/>`,
    `<circle cx="50" cy="50" r="40.5" fill="url(#liquid)"/>`,
  ];

  if (look.sinks) {
    defs.push(`<radialGradient id="sink" cx="0.5" cy="0.52" r="0.5"><stop offset="0" stop-color="${look.sinks}" stop-opacity="0.8"/><stop offset="0.6" stop-color="${look.sinks}" stop-opacity="0.32"/><stop offset="1" stop-color="${look.sinks}" stop-opacity="0"/></radialGradient>`);
    body.push(`<circle cx="50" cy="51" r="40" fill="url(#sink)"/>`);
  }

  if (look.foam) {
    const [hi, lo] = look.foam === "clara" ? ["#FFFBF0", "#EFE6CC"] : ["#FFFDF6", "#F1E3BC"];
    defs.push(`<radialGradient id="foam" cx="0.45" cy="0.42" r="0.6"><stop offset="0" stop-color="${hi}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`);
    body.push(`<circle cx="50" cy="50" r="${look.foam === "cerveza" ? 40.5 : 39}" fill="url(#foam)"/>`);
    for (const [x, y] of scatter(rand, 46, 36)) body.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.5 + rand() * 1.3)}" fill="rgba(255,255,255,0.45)" stroke="rgba(150,120,60,0.22)" stroke-width="0.35"/>`);
    if (look.bitters) {
      // Tres gotas de amargo sobre la espuma, cada una con su halo
      [[38, 44], [50, 40], [61, 47]].forEach(([x, y], i) =>
        body.push(`<ellipse cx="${x}" cy="${y}" rx="${f1(2.8 + i * 0.3)}" ry="2.4" fill="rgba(122,46,18,0.25)"/><circle cx="${x}" cy="${y}" r="1.7" fill="#7A2E12"/><circle cx="${x - 0.5}" cy="${y - 0.5}" r="0.5" fill="rgba(255,255,255,0.5)"/>`)
      );
    }
  }

  if (look.scoop) {
    defs.push(`<radialGradient id="scoop" cx="0.38" cy="0.34" r="0.7"><stop offset="0" stop-color="#FFF9DA"/><stop offset="0.55" stop-color="#F4DE8A"/><stop offset="1" stop-color="#C9A94B"/></radialGradient>`);
    body.push(`<circle cx="52" cy="54" r="21" fill="rgba(0,0,0,0.25)"/><circle cx="49" cy="50" r="20" fill="url(#scoop)"/>`);
    for (let i = 0; i < 14; i++) {
      const a = rand() * Math.PI * 2;
      const d = 4 + rand() * 13;
      body.push(`<circle cx="${f1(49 + Math.cos(a) * d)}" cy="${f1(50 + Math.sin(a) * d)}" r="${f1(0.8 + rand() * 1.4)}" fill="none" stroke="rgba(160,128,50,0.3)" stroke-width="0.5"/>`);
    }
    if (look.drizzle) body.push(`<path d="M34 46 C40 40 44 52 50 45 S60 50 64 43" stroke="${look.drizzle}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0.9"/><circle cx="44" cy="50" r="1.6" fill="${look.drizzle}"/><circle cx="58" cy="47.5" r="1.3" fill="${look.drizzle}"/>`);
  }

  if (look.ice === "cubos") {
    const n = r.glass === "copa_vino" ? 4 : 3;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rand() * 0.8;
      const d = 13 + rand() * 9;
      const s = 7 + rand() * 1.5;
      body.push(
        `<g transform="translate(${f1(50 + Math.cos(a) * d)} ${f1(50 + Math.sin(a) * d)}) rotate(${Math.round(rand() * 90)})">` +
          `<rect x="${f1(-s + 1)}" y="${f1(-s + 1.5)}" width="${f1(s * 2)}" height="${f1(s * 2)}" rx="3.5" fill="rgba(0,0,0,0.18)"/>` +
          `<rect x="${f1(-s)}" y="${f1(-s)}" width="${f1(s * 2)}" height="${f1(s * 2)}" rx="3.5" fill="url(#ice)" stroke="rgba(255,255,255,0.75)" stroke-width="0.8"/>` +
          `<path d="M${f1(-s + 2.5)} ${f1(s - 3)} L${f1(-s + 2.5)} ${f1(-s + 2.5)} L${f1(s - 3)} ${f1(-s + 2.5)}" stroke="#fff" stroke-width="1" fill="none" stroke-linecap="round" opacity="0.85"/>` +
          `<rect x="${f1(-s * 0.35)}" y="${f1(-s * 0.35)}" width="${f1(s * 0.7)}" height="${f1(s * 0.7)}" rx="1.5" fill="rgba(255,255,255,0.28)"/></g>`
      );
    }
  } else if (look.ice === "picado") {
    for (const [x, y] of scatter(rand, 22, 34)) {
      const k = 2 + rand() * 2.6;
      body.push(`<path d="M${f1(x - k)} ${f1(y - k * 0.4)} L${f1(x + k * 0.3)} ${f1(y - k)} L${f1(x + k)} ${f1(y + k * 0.2)} L${f1(x - k * 0.2)} ${f1(y + k)} Z" fill="rgba(255,255,255,${(0.35 + rand() * 0.3).toFixed(2)})" stroke="rgba(255,255,255,0.7)" stroke-width="0.4"/>`);
    }
  }

  if (look.fizzy && !look.foam) {
    for (const [x, y] of scatter(rand, 14, 37, 6)) body.push(`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(0.6 + rand() * 1.2)}" fill="none" stroke="rgba(255,255,255,0.6)" stroke-width="0.45"/>`);
  }

  if (look.ginger) [[40, 62], [45, 66]].forEach(([x, y], i) => body.push(`<ellipse cx="${x}" cy="${y}" rx="5" ry="4.2" transform="rotate(${20 + i * 30} ${x} ${y})" fill="#F1DE9C" stroke="#C9A24E" stroke-width="0.6"/>`));
  if (look.cucumber) body.push(wheel(36, 64, 9, "#3E7D2C", "#E3F3D2", "#D8EFC0", "#A9D48A", "cuke"));
  if (look.mint) [[30, 44, -30, 15], [36, 33, -70, 13], [42, 52, 10, 14], [58, 60, 150, 12]].forEach(([x, y, a, s]) => body.push(leaf(x, y, a + rand() * 20, s)));
  if (look.orange) body.push(wheel(62, 36, 12.5, "#E8801A", "#FFF1DC", "#FFC266", "#FF9A1C", "orange"));
  else if (look.citrus) body.push(wheel(65, 35, 10.5, "#5E9E22", "#F2F8D5", "#E4F6A2", "#BEDD4E", "lime"));
  if (look.strawberry) body.push(`<path d="M70 62 C64 58 64 50 70 50 C76 50 76 58 70 62 Z" fill="#D7263D" stroke="#9E1B2C" stroke-width="0.6"/><path d="M67 50 L70 47 L73 50" stroke="#3DBE6B" stroke-width="1.6" fill="none" stroke-linecap="round"/>`);
  if (look.straw)
    body.push(
      `<path d="M52 50 L77 18" stroke="rgba(0,0,0,0.3)" stroke-width="5" stroke-linecap="round" transform="translate(1.5 2)"/><path d="M52 50 L77 18" stroke="#2B2D36" stroke-width="4.6" stroke-linecap="round"/>` +
        `<path d="M51.3 48.6 L75.8 17.3" stroke="rgba(255,255,255,0.38)" stroke-width="1" stroke-linecap="round"/><ellipse cx="77" cy="18" rx="2.4" ry="2" fill="#090A0D" stroke="#3E3F47" stroke-width="0.6"/>`
    );
  if (look.salt || look.sugar) {
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2 + rand() * 0.05;
      const d = 43.2 + rand() * 2.6;
      body.push(`<circle cx="${f1(50 + Math.cos(a) * d)}" cy="${f1(50 + Math.sin(a) * d)}" r="${f1(0.45 + rand() * 0.55)}" fill="#fff" opacity="${(0.7 + rand() * 0.3).toFixed(2)}"/>`);
    }
  }

  // Vidrio encima: borde grueso, filo interior y el reflejo de la luz
  body.push(
    `<circle cx="50" cy="50" r="44" fill="none" stroke="url(#rim)" stroke-width="2.6"/>`,
    `<circle cx="50" cy="50" r="41.6" fill="none" stroke="rgba(0,0,0,0.28)" stroke-width="1.2"/>`,
    `<path d="M20 34 A33 33 0 0 1 40 17" stroke="rgba(255,255,255,0.7)" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    `<circle cx="27" cy="27" r="1.3" fill="#fff" opacity="0.9"/>`
  );
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs>${defs.join("")}</defs>${body.join("")}</svg>`;
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
          // Foto real del trago en su vaso (scripts/procesar-fotos.py); los que aún no tienen foto siguen con su dibujo
          photo: FOTOS_TRAGOS[r.id],
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
