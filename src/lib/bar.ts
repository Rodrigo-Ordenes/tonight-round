import {
  DILUTION,
  ICE_CUBES,
  INGREDIENT_BY_ID,
  RECIPES,
  type Glass,
  type Method,
  type Recipe,
  type SpecLine,
} from "@/data/drinks";

/** g de alcohol puro por ml de etanol (se usa 0.8 en toda la app). */
const ETHANOL_DENSITY = 0.8;
/** Gramos por "trago estándar" de referencia (OMS ≈ 10 g). */
export const STANDARD_DRINK_G = 10;

export type Tone = "ok" | "warn" | "danger";

export interface GlassAnalysis {
  liquidMl: number;
  /** Volumen servido incluyendo el agua del hielo */
  servedMl: number;
  alcoholMl: number;
  grams: number;
  abv: number; // 0..100
  standardDrinks: number;
  iceCubes: number;
  verdict: { tone: Tone; title: string; text: string };
}

const isSolid = (id: string) => INGREDIENT_BY_ID.get(id)?.solid ?? false;

export function analyzeGlass(lines: SpecLine[], method: Method, glass: Glass, servings = 1): GlassAnalysis {
  const liquid = lines.filter((l) => !isSolid(l.id) && l.ml > 0);
  const liquidMl = liquid.reduce((a, l) => a + l.ml, 0);
  const alcoholMl = liquid.reduce((a, l) => a + l.ml * (INGREDIENT_BY_ID.get(l.id)?.abv ?? 0), 0);
  const servedMl = liquidMl * (1 + DILUTION[method]);
  const abv = servedMl > 0 ? (alcoholMl / servedMl) * 100 : 0;
  const grams = alcoholMl * ETHANOL_DENSITY;
  const perServingGrams = servings > 0 ? grams / servings : grams;
  const iceCubes = lines.some((l) => l.id === "hielo") ? Math.round(ICE_CUBES[glass] * servings) : 0;

  const ids = new Set(liquid.map((l) => l.id));
  const cats = liquid.map((l) => INGREDIENT_BY_ID.get(l.id)?.cat);
  const spirits = liquid.filter((l) => INGREDIENT_BY_ID.get(l.id)?.cat === "destilado").length;
  const hasMixer = cats.some((c) => c === "mezclador" || c === "jugo");
  const hasAlcohol = alcoholMl > 0.5;

  let verdict: GlassAnalysis["verdict"];
  if (liquidMl === 0) {
    verdict = { tone: "ok", title: "Vaso vacío", text: "Elige una receta o agrega ingredientes al vaso." };
  } else if (ids.has("energetica") && hasAlcohol) {
    verdict = {
      tone: "danger",
      title: "Alcohol + energética",
      text: "La cafeína tapa la sensación de ebriedad: crees que estás bien y sigues tomando. Si lo haces, que sea uno y con agua después.",
    };
  } else if (spirits >= 2 && !hasMixer && servedMl / servings > 60) {
    verdict = { tone: "danger", title: "Destilados puros mezclados", text: "Mucho alcohol concentrado sin dilución. Agrega hielo y un mezclador." };
  } else if (!hasAlcohol) {
    verdict = { tone: "ok", title: "Sin alcohol", text: "Cero alcohol: perfecto para quien maneja o para alternar." };
  } else if (perServingGrams >= 20) {
    verdict = {
      tone: "warn",
      title: `Cuenta como ~${(perServingGrams / STANDARD_DRINK_G).toFixed(1)} tragos`,
      text: "Es un trago cargado. Tómalo lento y acompáñalo con un vaso de agua.",
    };
  } else if (abv >= 25) {
    verdict = { tone: "warn", title: "Fuerte", text: "Graduación alta para un solo trago. Mejor con hielo y despacio." };
  } else if (ids.has("espumante") && spirits > 0) {
    verdict = { tone: "warn", title: "Burbujas + destilado", text: "El gas acelera la absorción del alcohol. Con comida, mejor." };
  } else {
    verdict = { tone: "ok", title: "Equilibrado", text: `${abv.toFixed(1)}% de alcohol servido, ${perServingGrams.toFixed(0)} g por porción.` };
  }

  return {
    liquidMl,
    servedMl,
    alcoholMl,
    grams,
    abv,
    standardDrinks: perServingGrams / STANDARD_DRINK_G,
    iceCubes,
    verdict,
  };
}

/** Volumen de una porción ya servida (con dilución). */
export function servingMl(recipe: Recipe): number {
  const liquid = recipe.spec.filter((l) => !isSolid(l.id)).reduce((a, l) => a + l.ml, 0);
  return liquid * (1 + DILUTION[recipe.method]);
}

export type Scale = { kind: "vaso" } | { kind: "jarra"; liters: number } | { kind: "personas"; n: number };

/** Cuántas porciones caben en la escala pedida. */
export function servingsFor(recipe: Recipe, scale: Scale): number {
  if (scale.kind === "vaso") return 1;
  if (scale.kind === "personas") return scale.n;
  const per = servingMl(recipe);
  return per > 0 ? Math.max(1, Math.round(((scale.liters * 1000) / per) * 2) / 2) : 1;
}

export function scaleSpec(spec: SpecLine[], servings: number): SpecLine[] {
  return spec.map((l) => ({ ...l, ml: Math.round(l.ml * servings) }));
}

export function fmtMl(ml: number): string {
  if (ml >= 1000) return `${(ml / 1000).toFixed(ml % 1000 === 0 ? 0 : 2).replace(/\.?0+$/, "")} L`;
  return `${Math.round(ml)} ml`;
}

/* ------------------------------------------------------------------ */
/* Barra (lo que hay en la mesa) → qué se puede preparar              */
/* ------------------------------------------------------------------ */

/** Ingredientes que se asume que siempre hay (no bloquean una receta). */
const ALWAYS = new Set(["agua"]);

export function missingFor(recipe: Recipe, pantry: Set<string>): SpecLine[] {
  return recipe.spec.filter((l) => !l.optional && !ALWAYS.has(l.id) && !pantry.has(l.id));
}

export interface PantryMatch {
  ready: Recipe[];
  almost: { recipe: Recipe; missing: SpecLine[] }[];
}

export function matchPantry(pantry: Set<string>): PantryMatch {
  const ready: Recipe[] = [];
  const almost: PantryMatch["almost"] = [];
  for (const r of RECIPES) {
    const missing = missingFor(r, pantry);
    if (missing.length === 0) ready.push(r);
    else if (missing.length <= 2 && pantry.size > 0) {
      // Solo sugerimos "casi" si la receta usa al menos un líquido que sí tienes.
      const usesSomething = r.spec.some((l) => pantry.has(l.id) && !isSolid(l.id));
      if (usesSomething) almost.push({ recipe: r, missing });
    }
  }
  almost.sort((a, b) => a.missing.length - b.missing.length);
  return { ready, almost };
}

/** Lo que más recetas desbloquea si lo compras (lista de compras inteligente). */
export function bestNextBuys(pantry: Set<string>, limit = 4): { id: string; unlocks: number }[] {
  const count = new Map<string, number>();
  for (const r of RECIPES) {
    const missing = missingFor(r, pantry);
    if (missing.length === 1) count.set(missing[0].id, (count.get(missing[0].id) ?? 0) + 1);
  }
  return Array.from(count.entries())
    .map(([id, unlocks]) => ({ id, unlocks }))
    .sort((a, b) => b.unlocks - a.unlocks)
    .slice(0, limit);
}
