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
  const drinkers = Math.ceil(n * 0.75);
  const spiritMl = drinkers * h * 55;

  const itemsMap = new Map<string, number>();
  const setItem = (id: string, q: number) => {
    if (q > 0) itemsMap.set(id, Math.max(1, Math.ceil(q)));
  };

  const isLowBudget = targetBudget / n < 7500;
  const isVeryTight = targetBudget / n < 5000;

  // 1. ASIGNACIÓN PRINCIPAL DE ALCOHOL Y MEZCLADORES SEGÚN targetDrink
  switch (targetDrink) {
    case "cerveza": {
      const cansNeeded = Math.ceil(drinkers * h * 1.4);
      if (isVeryTight || profile === "ahorro") {
        // Cerveza rendidora económica: Báltica o Becker
        const packs6 = Math.ceil(cansNeeded / 6);
        setItem("cerveza_baltica_6pack", Math.max(1, packs6));
      } else if (isLowBudget) {
        setItem("cerveza_cristal_24pack", Math.max(1, Math.ceil(cansNeeded / 24)));
        if (cansNeeded % 24 > 6) setItem("cerveza_baltica_6pack", 1);
      } else {
        setItem("cerveza_royal_24pack", Math.max(1, Math.ceil(cansNeeded / 24)));
        if (profile === "clasica" && cansNeeded > 24) setItem("cerveza_heineken_6pack", 1);
      }
      break;
    }

    case "vino": {
      const bottlesNeeded = Math.ceil(spiritMl / 1000);
      if (isVeryTight || profile === "ahorro") {
        // Vino económico en caja (Gato Exportación / Santa Helena) o pipeño
        const cajas = Math.max(1, Math.ceil(bottlesNeeded / 2));
        setItem("vino_gato_caja_2l", cajas);
        setItem("bebida_sprite_25l", 1); // para tinto de verano
      } else {
        setItem("vino_gato_botellon_15l", Math.max(1, Math.ceil(bottlesNeeded / 1.5)));
        setItem("pipeno_botellon_15l", 1);
        setItem("bebida_sprite_25l", 1);
        setItem("jarabe_granadina_mitjans_900ml", 1);
      }
      break;
    }

    case "pisco": {
      if (isVeryTight) {
        setItem("pisco_alto_35_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("bebida_coca_cola_25l", Math.max(1, Math.ceil((spiritMl * 2.5) / 2500)));
      } else if (isLowBudget || profile === "ahorro") {
        setItem("pisco_alto_35_1l", Math.max(1, Math.ceil(spiritMl / 1000)));
        setItem("bebida_coca_cola_3l", Math.max(1, Math.ceil((spiritMl * 2.5) / 3000)));
      } else {
        setItem("pisco_mistral_40_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("bebida_coca_cola_25l", Math.max(1, Math.ceil((spiritMl * 2.5) / 2500)));
      }
      break;
    }

    case "gin": {
      if (isVeryTight || isLowBudget) {
        // Si el presupuesto es ajustado para Gin (que vale ~$14.000), 1 Gin + Báltica/Cristal de aguante
        setItem("gin_beefeater_750", 1);
        setItem("tonica_nordic_15l", 2);
        if (drinkers > 4) setItem("cerveza_baltica_6pack", 1);
      } else {
        setItem("gin_beefeater_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("tonica_nordic_15l", Math.max(1, Math.ceil((spiritMl * 2.5) / 1500)));
      }
      break;
    }

    case "vodka": {
      if (isVeryTight || isLowBudget) {
        setItem("vodka_stolichnaya_750", 1);
        setItem("bebida_sprite_25l", 1);
        setItem("jugo_watts_naranja_15l", 1);
        if (drinkers > 4) setItem("cerveza_baltica_6pack", 1);
      } else {
        setItem("vodka_stolichnaya_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("bebida_sprite_25l", 1);
        setItem("jugo_watts_naranja_15l", 2);
      }
      break;
    }

    case "whisky": {
      if (isVeryTight || isLowBudget || profile === "ahorro") {
        setItem("whisky_sandy_mac_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("ginger_ale_canada_dry_15l", Math.max(1, Math.ceil((spiritMl * 2) / 1500)));
      } else {
        setItem("whisky_ballantines_750", Math.max(1, Math.ceil(spiritMl / 750)));
        setItem("ginger_ale_canada_dry_15l", Math.max(1, Math.ceil((spiritMl * 2) / 1500)));
      }
      break;
    }

    case "ron": {
      setItem("ron_havana_especial_750", Math.max(1, Math.ceil(spiritMl / 750)));
      setItem("bebida_coca_cola_25l", Math.max(1, Math.ceil((spiritMl * 2.5) / 2500)));
      break;
    }

    case "tequila": {
      setItem("tequila_jose_cuervo_750", Math.max(1, Math.ceil(spiritMl / 750)));
      setItem("bebida_sprite_25l", 1);
      setItem("limon_malla_1kg", 1);
      break;
    }

    case "mocktail": {
      setItem("tonica_nordic_15l", Math.max(1, Math.ceil(n / 4)));
      setItem("ginger_ale_canada_dry_15l", Math.max(1, Math.ceil(n / 4)));
      setItem("jugo_watts_naranja_15l", Math.max(1, Math.ceil(n / 3)));
      setItem("jugo_guallarauco_frutas_1l", Math.max(1, Math.ceil(n / 4)));
      setItem("jarabe_granadina_mitjans_900ml", 1);
      setItem("limon_malla_1kg", 1);
      setItem("menta_fresca_atado", 1);
      break;
    }

    case "mix":
    default: {
      if (isVeryTight) {
        // Mix de bajo presupuesto: Pisco económico + Báltica 6pack o Vino Gato
        setItem("pisco_alto_35_750", 1);
        setItem("bebida_coca_cola_25l", 1);
        setItem("cerveza_baltica_6pack", 1);
        if (n >= 8) setItem("vino_gato_caja_2l", 1);
      } else if (isLowBudget || profile === "ahorro") {
        setItem("pisco_alto_35_1l", Math.max(1, Math.ceil(spiritMl / 1000 / 1.5)));
        setItem("bebida_coca_cola_3l", Math.max(1, Math.ceil((spiritMl * 2) / 3000)));
        setItem("cerveza_cristal_24pack", 1);
      } else {
        // Clásica: Pisco + Destilado secundario + Cerveza Royal
        setItem("pisco_mistral_40_750", Math.max(1, Math.ceil(spiritMl / 750 / 2)));
        setItem("gin_beefeater_750", 1);
        setItem("bebida_coca_cola_25l", 1);
        setItem("tonica_nordic_15l", 1);
        setItem("cerveza_royal_24pack", 1);
      }
      break;
    }
  }

  // 2. CONVERTIR A ITEMS Y CALCULAR SUB-TOTAL SOLO DE BEBIDAS/ALCOHOL
  const toItems = (): BasketItem[] => {
    const list: BasketItem[] = [];
    itemsMap.forEach((q, id) => {
      const c = byId.get(id);
      if (c && q > 0) list.push(toBasketItem(c, q));
    });
    return list;
  };

  let currentItems = toItems();
  let currentCost = basketTotal(currentItems, base);

  // 3. SI EL ALCOHOL PRINCIPAL EXCEDE EL PRESUPUESTO, AJUSTAR Y RECURRIR A OPCIONES ECONÓMICAS
  if (currentCost > targetBudget && !isVeryTight) {
    // Si la cerveza es cara, bajar a Báltica o Cristal
    if (itemsMap.has("cerveza_royal_24pack")) {
      itemsMap.delete("cerveza_royal_24pack");
      itemsMap.set("cerveza_cristal_24pack", 1);
    } else if (itemsMap.has("cerveza_cristal_24pack") && targetBudget < 25000) {
      itemsMap.delete("cerveza_cristal_24pack");
      itemsMap.set("cerveza_baltica_6pack", 2);
    }

    // Si el pisco es de 40°, bajar a 35° 750
    if (itemsMap.has("pisco_mistral_40_750") && targetBudget < 20000) {
      itemsMap.delete("pisco_mistral_40_750");
      itemsMap.set("pisco_alto_35_750", 1);
    }

    // Si el vino es botellón, bajar a caja
    if (itemsMap.has("vino_gato_botellon_15l") && targetBudget < 15000) {
      itemsMap.delete("vino_gato_botellon_15l");
      itemsMap.set("vino_gato_caja_2l", 1);
    }

    currentItems = toItems();
    currentCost = basketTotal(currentItems, base);
  }

  // Sustituir licores costosos si no alcanza el presupuesto
  if (currentCost > targetBudget) {
    if (itemsMap.has("gin_beefeater_750") && targetBudget < 15000) {
      itemsMap.delete("gin_beefeater_750");
      itemsMap.delete("tonica_nordic_15l");
      if (targetBudget >= 9480) {
        itemsMap.set("pisco_alto_35_750", 1);
        itemsMap.set("bebida_coca_cola_25l", 1);
      } else if (targetBudget >= 4990) {
        itemsMap.set("cerveza_baltica_6pack", 1);
      } else {
        itemsMap.set("vino_gato_caja_2l", 1);
      }
    } else if (itemsMap.has("tequila_jose_cuervo_750") && targetBudget < 15000) {
      itemsMap.delete("tequila_jose_cuervo_750");
      if (targetBudget >= 9480) {
        itemsMap.set("pisco_alto_35_750", 1);
        itemsMap.set("bebida_coca_cola_25l", 1);
      } else {
        itemsMap.set("cerveza_baltica_6pack", 1);
      }
    } else if (itemsMap.has("whisky_ballantines_750") && targetBudget < 14000) {
      itemsMap.delete("whisky_ballantines_750");
      if (targetBudget >= 10880) {
        itemsMap.set("whisky_sandy_mac_750", 1);
      } else {
        itemsMap.set("vino_gato_caja_2l", 1);
      }
    } else if (itemsMap.has("whisky_sandy_mac_750") && targetBudget < 10000) {
      itemsMap.delete("whisky_sandy_mac_750");
      itemsMap.delete("ginger_ale_canada_dry_15l");
      if (targetBudget >= 4990) {
        itemsMap.set("cerveza_baltica_6pack", 1);
      } else {
        itemsMap.set("vino_gato_caja_2l", 1);
      }
    } else if (itemsMap.has("ron_havana_especial_750") && targetBudget < 12000) {
      itemsMap.delete("ron_havana_especial_750");
      if (targetBudget >= 9480) {
        itemsMap.set("pisco_alto_35_750", 1);
        itemsMap.set("bebida_coca_cola_25l", 1);
      } else {
        itemsMap.set("cerveza_baltica_6pack", 1);
      }
    } else if (itemsMap.has("vodka_stolichnaya_750") && targetBudget < 12000) {
      itemsMap.delete("vodka_stolichnaya_750");
      itemsMap.delete("jugo_watts_naranja_15l");
      if (targetBudget >= 9480) {
        itemsMap.set("pisco_alto_35_750", 1);
        itemsMap.set("bebida_coca_cola_25l", 1);
      } else {
        itemsMap.set("cerveza_baltica_6pack", 1);
      }
    }

    currentItems = toItems();
    currentCost = basketTotal(currentItems, base);
  }

  // Si aún excede, recortar cantidades sobrantes de alcohol proporcionalmente
  while (currentCost > targetBudget && itemsMap.size > 0) {
    const entries = Array.from(itemsMap.entries()).filter(([_, q]) => q > 1);
    if (entries.length === 0) break;
    // Bajar 1 unidad del ítem con mayor cantidad
    const [topId, topQ] = entries.sort((a, b) => b[1] - a[1])[0];
    itemsMap.set(topId, topQ - 1);
    currentItems = toItems();
    currentCost = basketTotal(currentItems, base);
  }

  // Si aún excede y el presupuesto es muy bajo, recurrir a las opciones más rendidoras:
  // Vino Gato Exportación en caja 2L ($4.190) o latas de Báltica 473cc ($890 c/u)
  if (currentCost > targetBudget && targetBudget >= 890) {
    if (targetBudget >= 4190) {
      itemsMap.clear();
      itemsMap.set("vino_gato_caja_2l", 1);
      if (targetBudget >= 6680) {
        itemsMap.set("bebida_sprite_25l", 1);
      }
    } else {
      itemsMap.clear();
      const latas = Math.floor(targetBudget / 890);
      itemsMap.set("cerveza_baltica_lata_473", Math.max(1, latas));
    }
    currentItems = toItems();
    currentCost = basketTotal(currentItems, base);
  }

  // 4. INSUMOS SECUNDARIOS: SOLO SI SOBRA PRESUPUESTO (PRIORIZANDO ALCOHOL)
  let remainingBudget = targetBudget - currentCost;

  // Prioridad Insumo 1: Hielo (indispensable)
  if (remainingBudget >= 1890) {
    if (remainingBudget >= 3290 && n >= 6) {
      setItem("hielo_4kg", 1);
      remainingBudget -= 3290;
    } else {
      setItem("hielo_2kg", 1);
      remainingBudget -= 1890;
    }
  }

  // Prioridad Insumo 2: Agua Vital (hidratación / resaca)
  if (remainingBudget >= 1190) {
    setItem("agua_vital_sin_gas_2l", 1);
    remainingBudget -= 1190;
  }

  // Prioridad Insumo 3: Vasos (solo si queda presupuesto cómodo)
  if (remainingBudget >= 3490 && targetDrink !== "cerveza") {
    setItem("vasos_plasticos_500cc_50u", 1);
    remainingBudget -= 3490;
  }

  // Prioridad Insumo 4: Snacks / Comida (ÚLTIMA PRIORIDAD: solo si sobra presupuesto)
  if (remainingBudget >= 3290 && profile !== "ahorro") {
    setItem("papas_lays_380g", 1);
    remainingBudget -= 3290;
  } else if (remainingBudget >= 1490) {
    setItem("mani_salado_180g", 1);
    remainingBudget -= 1490;
  }

  if (remainingBudget >= 2690 && profile === "clasica") {
    setItem("doritos_mega_220g", 1);
    remainingBudget -= 2690;
  }

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
