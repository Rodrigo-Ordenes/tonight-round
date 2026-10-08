import recipesData from "@/data/cocktail_recipes.json";

export interface IngredientDef {
  id: string;
  name: string;
  category: "destilados" | "fermentados" | "mezcladores" | "jugos" | "esenciales";
  icon: string;
  abv: number; // 0..1 (e.g. 0.35 para pisco 35°)
  color: string; // hex
  defaultMl: number;
}

export const INGREDIENTS: IngredientDef[] = [
  // Destilados
  { id: "pisco", name: "Pisco 35° / 40°", category: "destilados", icon: "🥃", abv: 0.35, color: "#eab308", defaultMl: 60 },
  { id: "vodka", name: "Vodka", category: "destilados", icon: "🍸", abv: 0.40, color: "#a5b4fc", defaultMl: 50 },
  { id: "ron", name: "Ron Añejo / Blanco", category: "destilados", icon: "🥃", abv: 0.38, color: "#b45309", defaultMl: 50 },
  { id: "gin", name: "Gin London Dry", category: "destilados", icon: "🍸", abv: 0.40, color: "#38bdf8", defaultMl: 50 },
  { id: "tequila", name: "Tequila", category: "destilados", icon: "🌵", abv: 0.38, color: "#f59e0b", defaultMl: 50 },
  { id: "whisky", name: "Whisky", category: "destilados", icon: "🥃", abv: 0.40, color: "#d97706", defaultMl: 50 },

  // Fermentados
  { id: "cerveza", name: "Cerveza Lager", category: "fermentados", icon: "🍺", abv: 0.05, color: "#facc15", defaultMl: 330 },
  { id: "vino_tinto", name: "Vino Tinto", category: "fermentados", icon: "🍷", abv: 0.125, color: "#991b1b", defaultMl: 150 },
  { id: "vino_blanco", name: "Vino Blanco", category: "fermentados", icon: "🥂", abv: 0.12, color: "#fef08a", defaultMl: 150 },
  { id: "pipeno", name: "Pipeño Blanco", category: "fermentados", icon: "🏺", abv: 0.115, color: "#fef9c3", defaultMl: 200 },
  { id: "espumante", name: "Espumante Brut", category: "fermentados", icon: "🍾", abv: 0.115, color: "#fef08a", defaultMl: 120 },

  // Mezcladores
  { id: "bebida_cola", name: "Bebida Cola", category: "mezcladores", icon: "🥤", abv: 0, color: "#3e1e07", defaultMl: 150 },
  { id: "sprite", name: "Sprite / Lima-Limón", category: "mezcladores", icon: "🍋", abv: 0, color: "#84cc16", defaultMl: 150 },
  { id: "tonica", name: "Agua Tónica", category: "mezcladores", icon: "🫧", abv: 0, color: "#38bdf8", defaultMl: 150 },
  { id: "ginger_ale", name: "Ginger Ale", category: "mezcladores", icon: "🫚", abv: 0, color: "#ca8a04", defaultMl: 150 },
  { id: "agua_gas", name: "Agua con Gas", category: "mezcladores", icon: "💧", abv: 0, color: "#67e8f9", defaultMl: 120 },
  { id: "energetica", name: "Bebida Energética", category: "mezcladores", icon: "⚡", abv: 0, color: "#f97316", defaultMl: 150 },

  // Jugos
  { id: "jugo_naranja", name: "Jugo de Naranja", category: "jugos", icon: "🍊", abv: 0, color: "#ea580c", defaultMl: 120 },
  { id: "jugo_pina", name: "Jugo de Piña", category: "jugos", icon: "🍍", abv: 0, color: "#facc15", defaultMl: 120 },
  { id: "jugo_maracuya", name: "Jugo de Maracuyá", category: "jugos", icon: "🍈", abv: 0, color: "#eab308", defaultMl: 100 },
  { id: "limon", name: "Limón de Pica / Limón", category: "jugos", icon: "🍋", abv: 0, color: "#a3e635", defaultMl: 20 },

  // Esenciales y sugerencias
  { id: "hielo", name: "Hielo en Cubos", category: "esenciales", icon: "🧊", abv: 0, color: "#bae6fd", defaultMl: 0 },
  { id: "menta", name: "Menta Fresca", category: "esenciales", icon: "🌿", abv: 0, color: "#10b981", defaultMl: 0 },
  { id: "granadina", name: "Granadina / Jarabe", category: "esenciales", icon: "🍒", abv: 0, color: "#dc2626", defaultMl: 15 },
  { id: "helado_pina", name: "Helado de Piña", category: "esenciales", icon: "🍨", abv: 0, color: "#fef08a", defaultMl: 60 },
  { id: "sal", name: "Sal Fina", category: "esenciales", icon: "🧂", abv: 0, color: "#ffffff", defaultMl: 0 },
  { id: "azucar", name: "Azúcar / Goma", category: "esenciales", icon: "🍬", abv: 0, color: "#f1f5f9", defaultMl: 0 },
];

export const INGREDIENT_BY_ID = new Map(INGREDIENTS.map((i) => [i.id, i]));

export interface CocktailRecipe {
  id: string;
  name: string;
  category: string;
  spirit: string;
  required: string[];
  optional: string[];
  proportions: string;
  ratio?: string;
  abv_estimated: number;
  difficulty: string;
  glass: string;
  description: string;
  chilean_lore?: string;
  history?: string;
  steps: string[];
}

export const COCKTAIL_RECIPES: CocktailRecipe[] = recipesData as unknown as CocktailRecipe[];

export interface TasteVerdict {
  type: "aprobado" | "extrano" | "peligro";
  label: string;
  description: string;
}

export interface MixAnalysis {
  totalMl: number;
  pureAlcoholGrams: number;
  abvPercentage: number;
  colorHex: string;
  status: "safe" | "warning" | "danger";
  tasteVerdict: TasteVerdict;
  title: string;
  verdict: string;
  tip?: string;
}

export function analyzeMix(selectedIds: string[]): MixAnalysis {
  const items = selectedIds
    .map((id) => INGREDIENT_BY_ID.get(id))
    .filter(Boolean) as IngredientDef[];

  if (items.length === 0) {
    return {
      totalMl: 0,
      pureAlcoholGrams: 0,
      abvPercentage: 0,
      colorHex: "#1e293b",
      status: "safe",
      tasteVerdict: {
        type: "aprobado",
        label: "🟢 Aprobado",
        description: "Vaso vacío esperando insumos.",
      },
      title: "Vaso Vacío",
      verdict: "Selecciona ingredientes para ver la simulación en tiempo real.",
    };
  }

  // Filtrar ingredientes sólidos para volumen líquido
  const liquidItems = items.filter((i) => i.defaultMl > 0);
  const totalMl = liquidItems.reduce((acc, i) => acc + i.defaultMl, 0) || 100;
  const alcoholMl = liquidItems.reduce((acc, i) => acc + i.defaultMl * i.abv, 0);
  const pureAlcoholGrams = alcoholMl * 0.8;
  const abvPercentage = Math.round((alcoholMl / totalMl) * 1000) / 10;

  // Lógica de Veredictos
  const ids = selectedIds;
  const hasEnergética = ids.includes("energetica");
  const hasDestilado = items.some((i) => i.category === "destilados");
  const destiladosCount = items.filter((i) => i.category === "destilados").length;
  const hasFermentado = items.some((i) => i.category === "fermentados");
  const hasEspumante = ids.includes("espumante");
  const hasMixer = items.some((i) => i.category === "mezcladores" || i.category === "jugos");

  // 1. Peligro Crítico: Energética + Alcohol
  if (hasEnergética && (hasDestilado || hasFermentado)) {
    return {
      totalMl,
      pureAlcoholGrams,
      abvPercentage,
      colorHex: "#f97316",
      status: "danger",
      tasteVerdict: {
        type: "peligro",
        label: "🔴 Peligro de bomba gástrica",
        description: "Mezcla estimulante/depresora: alto riesgo de taquicardia y falsa sobriedad.",
      },
      title: "⚠️ Peligro: Cóctel Energizado (Alerta Cardíaca)",
      verdict:
        "La taurina y cafeína de la energética enmascaran el efecto depresor del alcohol, provocando una falsa sensación de sobriedad y taquicardia mientras el hígado sigue procesando alcohol a niveles tóxicos.",
      tip: "Alterna con agua pura y evita consumir más de una bebida energética en la misma noche.",
    };
  }

  // 2. Fuego Líquido: 2+ destilados puros sin mezclador
  if (destiladosCount >= 2 && !hasMixer) {
    return {
      totalMl,
      pureAlcoholGrams,
      abvPercentage,
      colorHex: "#ef4444",
      status: "danger",
      tasteVerdict: {
        type: "peligro",
        label: "🔴 Peligro de bomba gástrica",
        description: "Alcohol concentrado (>35°): riesgo de gastritis aguda y absorción violenta.",
      },
      title: "🔥 Fuego Líquido: Mezcla de Destilados Puros",
      verdict:
        "Mezclar múltiples destilados sin dilución supera el 35° ABV. Causa irritación gástrica inmediata, absorción rápida y resaca severa.",
      tip: "Agrega abundante hielo y al menos 150ml de mezclador (bebida cola, tónica o agua con gas).",
    };
  }

  // 3. Mezcla Extraña (Vino con energizante, cerveza con jugos densos, etc.)
  const isStrange =
    (ids.includes("vino_tinto") && ids.includes("tonica")) ||
    (ids.includes("cerveza") && ids.includes("jugo_maracuya")) ||
    (ids.includes("vino_tinto") && ids.includes("jugo_pina")) ||
    (abvPercentage > 25);

  if (isStrange) {
    return {
      totalMl,
      pureAlcoholGrams,
      abvPercentage,
      colorHex: "#eab308",
      status: "warning",
      tasteVerdict: {
        type: "extrano",
        label: "🟡 Extraño",
        description: "Perfil organoléptico inusual o choque de acidez/gas.",
      },
      title: "🟡 Combinación Inusual",
      verdict:
        "Esta mezcla presenta un contraste aromático o de acidez poco habitual. Puede ser pesado al estómago o de sabor excesivamente ácido.",
      tip: "Prueba con mezcladores clásicos como bebida cola, Sprite o agua con gas.",
    };
  }

  // 4. Espumante + Destilado (Piscola champañizada, Pisco Royal)
  if (hasEspumante && hasDestilado) {
    return {
      totalMl,
      pureAlcoholGrams,
      abvPercentage,
      colorHex: "#facc15",
      status: "warning",
      tasteVerdict: {
        type: "extrano",
        label: "🟡 Extraño",
        description: "Efervescencia acelerada: absorción más rápida del destilado.",
      },
      title: "🥂 Pisco Royal / Champagne Shot",
      verdict:
        "El gas carbónico del espumante dilata los capilares del estómago, acelerando drásticamente el paso del destilado al torrente sanguíneo.",
      tip: "Bébelo despacio y acompaña con comida para ralentizar la absorción.",
    };
  }

  // 5. Sin Alcohol / Mocktail
  if (abvPercentage === 0) {
    return {
      totalMl,
      pureAlcoholGrams: 0,
      abvPercentage: 0,
      colorHex: "#38bdf8",
      status: "safe",
      tasteVerdict: {
        type: "aprobado",
        label: "🟢 Aprobado",
        description: "Mocktail refrescante y 100% seguro para el volante.",
      },
      title: "🌱 Mocktail / Cóctel 100% Sin Alcohol",
      verdict:
        "Cero alcohol en sangre. Refrescante, ideal para el conductor designado o para alternar tragos y mantenerse hidratado toda la noche.",
      tip: "Sírvelo con abundante hielo y una ramita de menta para un toque gourmet.",
    };
  }

  // 6. Trago equilibrado estándar (Aprobado)
  const primaryItem = items.find((i) => i.category === "destilados") || items[0];
  return {
    totalMl,
    pureAlcoholGrams,
    abvPercentage,
    colorHex: primaryItem.color || "#6366f1",
    status: abvPercentage > 18 ? "warning" : "safe",
    tasteVerdict: {
      type: "aprobado",
      label: "🟢 Aprobado",
      description: "Balance correcto de alcohol, dilución y aromas.",
    },
    title: abvPercentage > 18 ? "⚡ Cóctel Fuerte" : "✨ Mezcla Balanceada",
    verdict: `Concentración equilibrada de ${abvPercentage}% ABV con ${Math.round(pureAlcoholGrams)}g de alcohol puro por porción.`,
    tip: ids.includes("hielo") ? "Excelente proporción con hielo para enfriar." : "Agrega hielo para mantenerlo frío y diluir suavemente.",
  };
}

export function matchRecipes(selectedIds: string[]) {
  const selectedSet = new Set(selectedIds);

  const exact: CocktailRecipe[] = [];
  const near: { recipe: CocktailRecipe; missing: IngredientDef[] }[] = [];

  for (const recipe of COCKTAIL_RECIPES) {
    const missingIds = recipe.required.filter((req) => !selectedSet.has(req));

    if (missingIds.length === 0) {
      exact.push(recipe);
    } else if (missingIds.length === 1) {
      const missingDefs = missingIds
        .map((id) => INGREDIENT_BY_ID.get(id))
        .filter(Boolean) as IngredientDef[];
      near.push({ recipe, missing: missingDefs });
    }
  }

  // Sugerencia de Bartender
  let suggestion = "";
  if (!selectedSet.has("hielo")) {
    suggestion = "💡 Tip de Bartender: Te falta Hielo. Casi todos los cócteles chilenos requieren cubos grandes para enfriar sin aguar.";
  } else if (!selectedSet.has("limon") && selectedIds.some((id) => ["pisco", "vodka", "tequila"].includes(id))) {
    suggestion = "💡 Tip de Bartender: Te falta Limón. El toque cítrico equilibra el dulzor y corta el ardor del destilado.";
  } else if (exact.length === 0 && near.length > 0) {
    const topMissing = near[0].missing[0]?.name || "un mezclador";
    suggestion = `💡 Te sugerimos agregar [${topMissing}] para desbloquear ${near[0].recipe.name}.`;
  }

  return { exact, near, suggestion };
}
