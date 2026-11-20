import { INGREDIENT_BY_ID, type SpecLine } from "@/data/drinks";

/**
 * Cómo se ve un trago, deducido de su receta: el color de la mezcla y los detalles que lo hacen reconocible (hielo en
 * cubos o picado, burbujas, espuma de clara o de cerveza, gotas de amargo, helado, granadina que se va al fondo, borde
 * de sal y guarniciones). Lo usan el vaso de lado de «Preparar» y los vasos vistos desde arriba de la cinta.
 */

const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toHex = (c: number[]) => `#${c.map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("")}`;

/** Mezcla dos colores hex: t = 0 da `a`, t = 1 da `b` */
export const mix = (a: string, b: string, t: number) => {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
};
export const lighten = (c: string, t: number) => mix(c, "#FFFFFF", t);
export const darken = (c: string, t: number) => mix(c, "#000000", t);

const FIZZY = new Set(["agua_gas", "tonica", "sprite", "bebida_cola", "ginger_ale", "ginger_beer", "espumante", "cerveza", "cerveza_0", "pomelo_soda", "energetica", "fanta", "sidra"]);
const colorOf = (id: string) => INGREDIENT_BY_ID.get(id)?.color ?? "#BFE7F5";

/**
 * Color del trago revuelto (la granadina y el helado se ven aparte). Se mezcla como la luz que atraviesa un líquido
 * (absorbancia, ley de Beer-Lambert) y no como pintura: un cuarto de pisco no aclara casi nada una bebida cola, igual
 * que en el vaso real.
 */
export function blendColor(spec: SpecLine[], skip: string[] = ["granadina", "helado_pina", "angostura", "clara_huevo"]): string {
  let total = 0;
  const absorb = [0, 0, 0];
  for (const l of spec) {
    const ing = INGREDIENT_BY_ID.get(l.id);
    if (!ing || ing.solid || l.ml <= 0 || skip.includes(l.id)) continue;
    rgb(ing.color).forEach((v, i) => (absorb[i] += -Math.log(Math.max(1, v) / 255) * l.ml));
    total += l.ml;
  }
  return total ? toHex(absorb.map((a) => 255 * Math.exp(-a / total))) : "#BFE7F5";
}

export interface DrinkLook {
  /** Hielo que queda en el vaso (el de la coctelera no llega) */
  ice: "cubos" | "picado" | null;
  fizzy: boolean;
  /** Espuma arriba: de clara (sours) o de cerveza */
  foam: "clara" | "cerveza" | null;
  /** Gotas de amargo de angostura sobre la espuma */
  bitters: boolean;
  /** Bola de helado flotando (terremoto) y el chorrito que la corona */
  scoop: boolean;
  drizzle: string | null;
  /** Color que se va al fondo sin revolver (granadina) */
  sinks: string | null;
  salt: boolean;
  sugar: boolean;
  citrus: boolean;
  mint: boolean;
  orange: boolean;
  cucumber: boolean;
  strawberry: boolean;
  ginger: boolean;
  cinnamon: boolean;
  straw: boolean;
}

export function drinkLook(spec: SpecLine[], glass?: string, garnish = ""): DrinkLook {
  const has = (id: string) => spec.some((l) => l.id === id);
  const iceLine = spec.find((l) => l.id === "hielo");
  const iceLabel = iceLine?.label ?? "";
  const ice = !iceLine || /coctelera/i.test(iceLabel) ? null : /picado|frapp/i.test(iceLabel) ? "picado" : "cubos";
  const fizzy = spec.some((l) => l.ml > 0 && FIZZY.has(l.id));
  const beer = (has("cerveza") || has("cerveza_0")) && (glass === "schop" || glass === "jarro" || glass === "mug");
  const scoop = has("helado_pina");
  const grenadine = has("granadina");
  return {
    ice,
    fizzy,
    foam: has("clara_huevo") ? "clara" : beer ? "cerveza" : null,
    bitters: has("angostura") || /amargo|angostura/i.test(garnish),
    scoop,
    drizzle: scoop ? (grenadine ? colorOf("granadina") : has("fernet") ? colorOf("fernet") : null) : null,
    sinks: grenadine && !scoop ? colorOf("granadina") : null,
    salt: has("sal"),
    sugar: has("azucar"),
    citrus: (has("limon") || /lim[oó]n|lima/i.test(garnish)) && !has("clara_huevo"),
    mint: has("menta"),
    orange: has("naranja") || /naranja/i.test(garnish),
    cucumber: has("pepino") || /pepino/i.test(garnish),
    strawberry: has("frutillas"),
    ginger: has("jengibre"),
    cinnamon: has("canela"),
    straw: ice === "picado" || (has("menta") && glass === "highball"),
  };
}
