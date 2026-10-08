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

export function generateBasket(profile: BasketProfile, attendees: number, hours: number): BasketItem[] {
  const n = Math.max(2, attendees);
  const h = Math.max(1, hours);
  const out: BasketItem[] = [];
  const add = (id: string, q: number) => {
    const c = byId.get(id);
    if (c && q > 0) out.push(toBasketItem(c, Math.max(1, Math.ceil(q))));
  };
  const drinkers = Math.ceil(n * 0.7);
  const spiritMl = drinkers * h * 60;

  if (profile === "ahorro") {
    add("pisco_alto_35_1l", spiritMl / 1000);
    add("bebida_coca_cola_3l", (spiritMl * 3) / 3000);
    add("cerveza_cristal_24pack", (n * h * 0.5) / 24);
    add("hielo_2kg", n / 4);
    add("vasos_plasticos_500cc_50u", n / 40);
    add("mani_salado_180g", n / 4);
    add("agua_vital_sin_gas_2l", n / 4);
  } else if (profile === "clasica") {
    add("pisco_mistral_40_750", spiritMl / 750 / 1.5);
    add("vodka_stolichnaya_750", spiritMl / 750 / 3);
    add("gin_beefeater_750", spiritMl / 750 / 6);
    add("bebida_coca_cola_25l", (spiritMl * 2.5) / 2500);
    add("bebida_sprite_25l", spiritMl / 2500);
    add("cerveza_royal_24pack", (n * h * 0.6) / 24);
    add("hielo_4kg", n / 3);
    add("vasos_plasticos_500cc_50u", n / 40);
    add("papas_lays_380g", n / 3);
    add("doritos_mega_220g", n / 4);
    add("agua_vital_sin_gas_2l", n / 3);
  } else {
    add("tonica_nordic_15l", n / 3);
    add("ginger_ale_canada_dry_15l", n / 4);
    add("jugo_watts_naranja_15l", n / 3);
    add("jugo_guallarauco_frutas_1l", n / 4);
    add("jarabe_granadina_mitjans_900ml", n / 8);
    add("limon_malla_1kg", n / 6);
    add("menta_fresca_atado", n / 5);
    add("hielo_4kg", n / 3);
    add("vasos_plasticos_500cc_50u", n / 40);
    add("agua_vital_sin_gas_2l", n / 3);
  }
  return out;
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
