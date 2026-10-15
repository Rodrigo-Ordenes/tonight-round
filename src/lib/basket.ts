import pricesData from "@/data/prices_cl.json";
import type { BasketItem, BasketProfile, PriceBase } from "./carreteState";

export type CatalogItem = (typeof pricesData.items)[number];
export const CATALOG: CatalogItem[] = pricesData.items;
const byId = new Map(CATALOG.map((i) => [i.id, i]));

export const STORE_LABEL: Record<PriceBase, string> = {
  lider: "Líder",
  jumbo: "Jumbo",
  botilleria: "Botillería",
};

export const priceKey = (b: PriceBase) => (b === "botilleria" ? "botilleria_ref" : b) as "lider" | "jumbo" | "botilleria_ref";

export function toBasketItem(c: CatalogItem, quantity: number): BasketItem {
  return {
    id: c.id,
    name: c.name,
    category: c.category,
    quantity,
    unit: "un",
    prices: c.prices,
  };
}

export function unitPrice(item: BasketItem, base: PriceBase): number {
  return item.customPrice ?? item.prices[priceKey(base)];
}

export function basketTotal(items: BasketItem[], base: PriceBase): number {
  return items.reduce((a, i) => a + unitPrice(i, base) * i.quantity, 0);
}

/* ------------------------------------------------------------------ */
/* Canasta multi-licor                                                  */
/* ------------------------------------------------------------------ */

export type DrinkType = "cerveza" | "vino" | "pisco" | "ron" | "vodka" | "gin" | "whisky" | "tequila" | "fernet" | "mocktail";

export const DRINK_TYPES: { id: DrinkType; name: string; emoji: string; desc: string }[] = [
  { id: "cerveza", name: "Cerveza", emoji: "🍺", desc: "Latas y packs" },
  { id: "vino", name: "Vino y pipeño", emoji: "🍷", desc: "Caja, botellón, terremoto" },
  { id: "pisco", name: "Pisco", emoji: "🍇", desc: "Piscola, pisco sour" },
  { id: "ron", name: "Ron", emoji: "🏝️", desc: "Cuba libre, mojito" },
  { id: "vodka", name: "Vodka", emoji: "🧊", desc: "Con jugo o lima-limón" },
  { id: "gin", name: "Gin", emoji: "🌿", desc: "Gin tonic" },
  { id: "whisky", name: "Whisky", emoji: "🥃", desc: "Con ginger o cola" },
  { id: "tequila", name: "Tequila", emoji: "🌵", desc: "Paloma, shots" },
  { id: "fernet", name: "Fernet", emoji: "🌱", desc: "Fernet con cola" },
  { id: "mocktail", name: "Sin alcohol", emoji: "🥤", desc: "Para quien maneja" },
];

const TYPE_OF = (id: string): DrinkType | null => {
  if (id.startsWith("cerveza_")) return "cerveza";
  if (id.startsWith("vino_") || id.startsWith("pipeno_")) return "vino";
  for (const t of ["pisco", "ron", "vodka", "gin", "whisky", "tequila", "fernet"] as const) if (id.startsWith(`${t}_`)) return t;
  return null;
};

/** ml por "trago" de cada tipo (lata, copa o medida de destilado). */
const SERVING_ML: Record<Exclude<DrinkType, "mocktail">, number> = {
  cerveza: 350,
  vino: 150,
  pisco: 50,
  ron: 50,
  vodka: 50,
  gin: 50,
  whisky: 50,
  tequila: 45,
  fernet: 50,
};

/** Peso relativo en el reparto: la cerveza se toma más seguido. */
const WEIGHT: Record<Exclude<DrinkType, "mocktail">, number> = {
  cerveza: 1.4,
  vino: 1,
  pisco: 1,
  ron: 1,
  vodka: 1,
  gin: 1,
  whisky: 0.8,
  tequila: 0.6,
  fernet: 0.6,
};

/** Mezclador sugerido por destilado (ml de mezclador por ml de destilado). */
const MIXERS: Partial<Record<DrinkType, { id: string; ratio: number }[]>> = {
  pisco: [{ id: "bebida_coca_cola_3l", ratio: 3 }],
  ron: [{ id: "bebida_coca_cola_3l", ratio: 3 }],
  fernet: [{ id: "bebida_coca_cola_3l", ratio: 3 }],
  whisky: [{ id: "ginger_ale_canada_dry_15l", ratio: 2.5 }],
  gin: [{ id: "tonica_nordic_15l", ratio: 3 }],
  vodka: [
    { id: "bebida_sprite_25l", ratio: 1.5 },
    { id: "jugo_watts_naranja_15l", ratio: 1.5 },
  ],
  tequila: [{ id: "bebida_sprite_25l", ratio: 2 }],
};

const volumeOf = (c: CatalogItem): number => ("unit_volume_ml" in c && typeof c.unit_volume_ml === "number" ? c.unit_volume_ml : 0);
const priceOf = (c: CatalogItem, base: PriceBase) => c.prices[priceKey(base)];
const perMl = (c: CatalogItem, base: PriceBase) => priceOf(c, base) / Math.max(1, volumeOf(c));

/** Opciones de un tipo ordenadas de más barata a más cara por ml. */
function optionsFor(t: DrinkType, base: PriceBase): CatalogItem[] {
  return CATALOG.filter((c) => TYPE_OF(c.id) === t && volumeOf(c) > 0).sort((a, b) => perMl(a, base) - perMl(b, base));
}

/** Mezcla por defecto según presupuesto por persona: variada, no solo pisco. */
export function defaultMix(perPerson: number, profile: BasketProfile): DrinkType[] {
  if (profile === "mocktail") return ["mocktail"];
  if (perPerson < 4500) return ["cerveza", "vino"];
  if (perPerson < 7000 || profile === "ahorro") return ["cerveza", "vino", "pisco"];
  if (perPerson < 11000) return ["cerveza", "pisco", "ron", "gin"];
  return ["cerveza", "pisco", "gin", "ron", "whisky", "vino"];
}

const parseDrinksIsAuto = (target: string | undefined) => !target || target.split(",").map((x) => x.trim()).includes("mix");

export function parseDrinks(target: string | undefined, perPerson: number, profile: BasketProfile): DrinkType[] {
  const list = (target ?? "mix")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
  if (list.length === 0 || list.includes("mix")) return defaultMix(perPerson, profile);
  const valid = list.filter((x): x is DrinkType => DRINK_TYPES.some((d) => d.id === x));
  return valid.length ? valid : defaultMix(perPerson, profile);
}

/**
 * Arma la canasta repartiendo los tragos necesarios entre TODOS los tipos elegidos (no gira en torno al pisco),
 * elige el producto con mejor precio por ml según presupuesto, agrega mezcladores y luego ajusta al presupuesto.
 * `targetDrink` acepta "mix" o una lista separada por comas: "cerveza,ron,gin".
 */
export function generateBasket(
  profile: BasketProfile = "clasica",
  attendees: number = 8,
  hours: number = 5,
  budget?: number,
  targetDrink: string = "mix",
  base: PriceBase = "lider"
): BasketItem[] {
  const n = Math.max(2, attendees);
  const h = Math.max(1, hours);
  const targetBudget = budget && budget > 0 ? budget : profile === "ahorro" ? 35000 : 60000;
  const perPerson = targetBudget / n;
  const types = parseDrinks(targetDrink, perPerson, profile);
  const alcoholTypes = types.filter((t): t is Exclude<DrinkType, "mocktail"> => t !== "mocktail");
  const drinkers = alcoholTypes.length ? Math.ceil(n * 0.8) : 0;
  // Ritmo responsable: ~1,5 tragos la primera hora y ~0,8 por hora después.
  const drinksNeeded = drinkers * (1.5 + 0.8 * (h - 1));
  const premium = profile === "clasica" && perPerson >= 9000;

  const qty = new Map<string, number>();
  const add = (id: string, q: number) => {
    if (q > 0) qty.set(id, (qty.get(id) ?? 0) + Math.ceil(q));
  };

  // 1. Reparto de tragos entre los tipos elegidos
  const totalW = alcoholTypes.reduce((a, t) => a + WEIGHT[t], 0);
  const mixerMl = new Map<string, number>();
  for (const t of alcoholTypes) {
    const ml = (drinksNeeded * WEIGHT[t]) / totalW * SERVING_ML[t];
    const opts = optionsFor(t, base);
    if (opts.length === 0) continue;
    // Barato por ml salvo presupuesto holgado, donde se prefiere la marca "clásica" más conveniente.
    const pick = premium ? opts.find((o) => o.tier === "clasica") ?? opts[0] : opts[0];
    add(pick.id, ml / volumeOf(pick));
    if (t === "cerveza" && ml > 6000) {
      // Packs grandes cuando el volumen lo justifica
      const big = opts.filter((o) => volumeOf(o) >= 8000).sort((a, b) => perMl(a, base) - perMl(b, base))[0];
      if (big) {
        qty.delete(pick.id);
        add(big.id, ml / volumeOf(big));
      }
    }
    for (const m of MIXERS[t] ?? []) mixerMl.set(m.id, (mixerMl.get(m.id) ?? 0) + ml * m.ratio);
  }
  mixerMl.forEach((ml, id) => {
    const c = byId.get(id);
    if (c) add(id, ml / Math.max(1, volumeOf(c)));
  });
  // Mezcla automática: las botellas enteras inflan mucho el alcohol con 4+ licores. Si sobra más de 1,8×
  // lo recomendado, se reduce la variedad (manteniendo al menos 2 tipos) y la plata va a hielo, agua y picoteo.
  if (parseDrinksIsAuto(targetDrink) && drinkers > 0) {
    const gramsNow = () =>
      Array.from(qty.entries()).reduce((a, [id, q]) => {
        const c = byId.get(id);
        return c && TYPE_OF(id) ? a + q * volumeOf(c) * abvOf(c) * 0.8 : a;
      }, 0);
    const limit = drinksNeeded * 1.8 * GRAMS_PER_DRINK;
    const minTypes = perPerson >= 11000 ? 3 : 2;
    const droppable = [...alcoholTypes].reverse().filter((t) => t !== "cerveza");
    for (const t of droppable) {
      const kept = new Set(Array.from(qty.keys()).map(TYPE_OF).filter(Boolean));
      if (gramsNow() <= limit || kept.size <= minTypes) break;
      Array.from(qty.keys()).forEach((id) => TYPE_OF(id) === t && qty.delete(id));
      const stillUsed = new Set(Array.from(kept).flatMap((k) => (k && k !== t ? (MIXERS[k] ?? []).map((m) => m.id) : [])));
      for (const m of MIXERS[t] ?? []) if (!stillUsed.has(m.id)) qty.delete(m.id);
    }
  }
  const presentTypes = new Set(Array.from(qty.keys()).map(TYPE_OF));
  if (presentTypes.has("tequila") || presentTypes.has("gin")) add("limon_malla_1kg", 1);

  // 2. Sin alcohol: para conductores y quienes no toman (o todo el grupo si solo eligieron eso)
  if (types.includes("mocktail")) {
    const sober = alcoholTypes.length ? Math.max(1, n - drinkers) : n;
    add("ginger_ale_canada_dry_15l", sober / 3);
    add("jugo_watts_naranja_15l", sober / 3);
    add("tonica_nordic_15l", sober / 4);
    add("jarabe_granadina_mitjans_900ml", 1);
    add("limon_malla_1kg", 1);
    add("menta_fresca_atado", 1);
  }

  const toItems = (): BasketItem[] => {
    const list: BasketItem[] = [];
    qty.forEach((q, id) => {
      const c = byId.get(id);
      if (c && q > 0) list.push(toBasketItem(c, q));
    });
    return list;
  };
  const cost = () => basketTotal(toItems(), base);

  // 3. Ajuste al presupuesto: primero bajar de marca, luego cantidades, al final quitar el tipo más caro.
  const downgrade = () => {
    const entries = Array.from(qty.entries())
      .map(([id, q]) => ({ id, q, c: byId.get(id)! }))
      .filter((e) => e.c && TYPE_OF(e.id))
      .sort((a, b) => priceOf(b.c, base) * b.q - priceOf(a.c, base) * a.q);
    for (const e of entries) {
      const t = TYPE_OF(e.id)!;
      const cheaper = optionsFor(t, base).find((o) => o.id !== e.id && perMl(o, base) < perMl(e.c, base) * 0.97);
      if (cheaper) {
        qty.delete(e.id);
        add(cheaper.id, (e.q * volumeOf(e.c)) / volumeOf(cheaper));
        return true;
      }
    }
    return false;
  };
  let guard = 0;
  while (cost() > targetBudget && guard++ < 20 && downgrade()) {
    /* bajar de marca */
  }
  guard = 0;
  while (cost() > targetBudget && guard++ < 60) {
    const reducible = Array.from(qty.entries())
      .filter(([id, q]) => q > 1 && byId.get(id))
      .sort((a, b) => priceOf(byId.get(b[0])!, base) - priceOf(byId.get(a[0])!, base));
    if (reducible.length === 0) break;
    const [id, q] = reducible[0];
    qty.set(id, q - 1);
  }
  guard = 0;
  while (cost() > targetBudget && guard++ < 6) {
    const alcoholIds = Array.from(qty.keys()).filter((id) => TYPE_OF(id));
    if (alcoholIds.length <= 1) break;
    const priciest = alcoholIds.sort((a, b) => priceOf(byId.get(b)!, base) - priceOf(byId.get(a)!, base))[0];
    qty.delete(priciest);
    // Quitar mezcladores y limones que ya no acompañan a ningún licor de la canasta
    const left = new Set(Array.from(qty.keys()).map(TYPE_OF).filter(Boolean) as DrinkType[]);
    const usedMixers = new Set(Array.from(left).flatMap((t) => (MIXERS[t] ?? []).map((m) => m.id)));
    const t = TYPE_OF(priciest);
    for (const m of (t && MIXERS[t]) || []) if (!usedMixers.has(m.id) && !types.includes("mocktail")) qty.delete(m.id);
    if (!left.has("tequila") && !left.has("gin") && !types.includes("mocktail")) qty.delete("limon_malla_1kg");
  }
  if (cost() > targetBudget && targetBudget >= 890) {
    // Último recurso: lo más rendidor por peso
    qty.clear();
    if (targetBudget >= 4190) {
      add("vino_gato_caja_2l", 1);
      if (targetBudget >= 6680) add("bebida_sprite_25l", 1);
    } else add("cerveza_baltica_lata_473", Math.floor(targetBudget / 890));
  }

  // 4. Básicos con lo que sobre: hielo y agua primero (hidratación), luego vasos y picoteo.
  let remaining = targetBudget - cost();
  const tryAdd = (id: string, q = 1) => {
    const c = byId.get(id);
    if (!c) return false;
    const p = priceOf(c, base) * q;
    if (remaining >= p) {
      add(id, q);
      remaining -= p;
      return true;
    }
    return false;
  };
  if (!(n >= 6 && tryAdd("hielo_4kg"))) tryAdd("hielo_2kg");
  tryAdd("agua_vital_sin_gas_2l", Math.max(1, Math.ceil(n / 5)));
  if (types.some((t) => t !== "cerveza")) tryAdd("vasos_plasticos_500cc_50u");
  if (profile !== "ahorro") tryAdd("papas_lays_380g");
  else tryAdd("mani_salado_180g");
  if (profile === "clasica") tryAdd("doritos_mega_220g");

  return toItems();
}

/** Texto EXACTO del pedido para exportar / pegar en apps de delivery. */
export function buildOrderText(items: BasketItem[], base: PriceBase): string {
  const lines = items
    .filter((i) => i.quantity > 0)
    .map((i) => `• ${i.quantity}x ${i.name}`);
  const total = basketTotal(items, base);
  return [
    "🛒 PEDIDO DE CARRETE — TONIGHT",
    "",
    ...lines,
    "",
    `Total estimado: $${total.toLocaleString("es-CL")} CLP (precios ${STORE_LABEL[base]}, referencial)`,
  ].join("\n");
}

/* ------------------------------------------------------------------ */
/* ¿Alcanza? Lectura útil del presupuesto                               */
/* ------------------------------------------------------------------ */

/** Gramos por "trago" de referencia (≈ una lata de cerveza o un trago de destilado). */
export const GRAMS_PER_DRINK = 14;

/** Graduación estimada de un producto del catálogo (por tipo y nombre). */
export function abvOf(c: { id: string; name: string }): number {
  const t = TYPE_OF(c.id);
  if (!t) return 0;
  const deg = c.name.match(/(\d{2})°/);
  if (deg) return Number(deg[1]) / 100;
  return { cerveza: 0.05, vino: 0.12, pisco: 0.35, ron: 0.4, vodka: 0.4, gin: 0.4, whisky: 0.4, tequila: 0.38, fernet: 0.39, mocktail: 0 }[t];
}

export type Coverage = "corto" | "justo" | "holgado";

export interface BasketInsights {
  total: number;
  budget: number;
  diff: number;
  /** Cuota por persona redondeada hacia arriba a un monto cómodo de transferir */
  quota: number;
  drinkers: number;
  drinksPerDrinker: number;
  recommendedPerDrinker: number;
  coverage: Coverage;
  /** Horas que cubre el alcohol al ritmo recomendado */
  hoursCovered: number;
  iceKg: number;
  iceNeededKg: number;
  waterL: number;
  waterNeededL: number;
  mixerL: number;
  mixerNeededL: number;
  /** Tipos de trago pedidos que no entraron por presupuesto */
  missingTypes: DrinkType[];
  suggestions: { id: string; name: string; price: number; reason: string }[];
}

export function basketInsights(
  items: BasketItem[],
  base: PriceBase,
  attendees: number,
  hours: number,
  budget: number,
  targetDrink: string,
  profile: BasketProfile
): BasketInsights {
  const n = Math.max(1, attendees);
  const h = Math.max(1, hours);
  const total = basketTotal(items, base);
  const diff = budget - total;
  const quota = Math.ceil(Math.max(total, 0) / n / 500) * 500;
  const types = parseDrinks(targetDrink, budget / n, profile);
  const alcoholTypes = types.filter((t) => t !== "mocktail");
  const drinkers = alcoholTypes.length ? Math.ceil(n * 0.8) : 0;

  let grams = 0;
  let spiritMl = 0;
  let iceKg = 0;
  let waterL = 0;
  let mixerL = 0;
  for (const i of items) {
    const c = byId.get(i.id);
    if (!c) continue;
    const vol = volumeOf(c);
    const t = TYPE_OF(c.id);
    if (t) {
      grams += i.quantity * vol * abvOf(c) * 0.8;
      if (t !== "cerveza" && t !== "vino") spiritMl += i.quantity * vol;
    } else if (c.id.startsWith("hielo_")) iceKg += (i.quantity * ("unit_weight_g" in c && typeof c.unit_weight_g === "number" ? c.unit_weight_g : 0)) / 1000;
    else if (c.id.startsWith("agua_")) waterL += (i.quantity * vol) / 1000;
    else if (c.category === "mezcladores") mixerL += (i.quantity * vol) / 1000;
  }

  const recommendedPerDrinker = drinkers ? 1.5 + 0.8 * (h - 1) : 0;
  const drinksPerDrinker = drinkers ? grams / GRAMS_PER_DRINK / drinkers : 0;
  const coverage: Coverage = !drinkers
    ? "justo"
    : drinksPerDrinker < recommendedPerDrinker * 0.8
    ? "corto"
    : drinksPerDrinker > recommendedPerDrinker * 1.4
    ? "holgado"
    : "justo";
  const hoursCovered = drinkers ? Math.max(0, drinksPerDrinker <= 1.5 ? drinksPerDrinker / 1.5 : 1 + (drinksPerDrinker - 1.5) / 0.8) : h;
  const iceNeededKg = Math.ceil(n * 0.5);
  const waterNeededL = Math.ceil(n * 0.5);
  const mixerNeededL = (spiritMl * 2.5) / 1000;

  const present = new Set(items.map((i) => TYPE_OF(i.id)).filter(Boolean) as DrinkType[]);
  const missingTypes = alcoholTypes.filter((t) => !present.has(t));

  // Qué conviene agregar con lo que sobra, en orden de utilidad
  const suggestions: BasketInsights["suggestions"] = [];
  let remaining = diff;
  const offer = (id: string, reason: string) => {
    const c = byId.get(id);
    if (!c || suggestions.some((s) => s.id === id)) return;
    const price = priceOf(c, base);
    if (price <= remaining) {
      suggestions.push({ id, name: c.name, price, reason });
      remaining -= price;
    }
  };
  if (iceKg < iceNeededKg) offer(n >= 6 ? "hielo_4kg" : "hielo_2kg", "Falta hielo para el grupo");
  if (waterL < waterNeededL) offer("agua_vital_sin_gas_2l", "Un vaso de agua cada dos tragos");
  if (mixerL < mixerNeededL) offer(alcoholTypes.includes("gin") ? "tonica_nordic_15l" : "bebida_coca_cola_3l", "Faltan mezcladores para el destilado");
  if (coverage === "corto") {
    const main = items.find((i) => TYPE_OF(i.id) && TYPE_OF(i.id) !== "mocktail");
    if (main) offer(main.id, "El alcohol no alcanza para toda la noche");
  }
  offer("mani_salado_180g", "Picoteo: comer baja el pico de alcohol");
  offer("papas_lays_380g", "Más picoteo");

  return {
    total,
    budget,
    diff,
    quota,
    drinkers,
    drinksPerDrinker,
    recommendedPerDrinker,
    coverage,
    hoursCovered,
    iceKg,
    iceNeededKg,
    waterL,
    waterNeededL,
    mixerL,
    mixerNeededL,
    missingTypes,
    suggestions: suggestions.slice(0, 3),
  };
}

/** Ingredientes del bar que aporta cada producto de la canasta (para llenar "lo que hay en la mesa"). */
export function pantryFromBasket(items: BasketItem[]): string[] {
  const out = new Set<string>();
  for (const i of items) {
    const id = i.id;
    const t = TYPE_OF(id);
    if (t && t !== "vino" && t !== "mocktail") out.add(t === "cerveza" ? "cerveza" : t);
    if (id.startsWith("vino_")) out.add("vino_tinto");
    if (id.startsWith("pipeno_")) out.add("pipeno");
    if (id.includes("coca_cola") || id.includes("coca_zero")) out.add("bebida_cola");
    if (id.includes("sprite")) out.add("sprite");
    if (id.includes("tonica")) out.add("tonica");
    if (id.includes("ginger_ale")) out.add("ginger_ale");
    if (id.includes("naranja")) out.add("jugo_naranja");
    if (id.includes("granadina")) out.add("granadina");
    if (id.startsWith("hielo_")) out.add("hielo");
    if (id.startsWith("limon_")) out.add("limon");
    if (id.startsWith("menta_")) out.add("menta");
    if (id.startsWith("agua_")) out.add("agua");
  }
  return Array.from(out);
}
