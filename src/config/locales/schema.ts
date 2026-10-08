export type CurrencyCode = "CLP" | "MXN" | "USD";

export interface CurrencyConfig {
  code: CurrencyCode;
  symbol: string;
  decimals: number;
  thousandSeparator: string;
  decimalSeparator: string;
  format: (amount: number) => string;
}

export interface SlangTerms {
  party: string;           // ej. carrete, peda, party
  drinking: string;        // ej. tomar, chupar, beber
  hangover: string;        // ej. caña, cruda, hangover
  moneyUnit: string;       // ej. lucas, varos, bucks
  friendGroup: string;     // ej. cabros, compas, crew
  splitBill: string;       // ej. hacer la vaquita, cooperacha, split
  signatureDrink: string;  // ej. piscola, michelada, cocktail
}

export interface TypicalDrinkOption {
  id: string;
  name: string;
  shortName: string;
  category: "destilado" | "cerveza" | "vino" | "coctel" | "sin_alcohol";
  standardAbv: number;       // Alcohol por volumen (ej: 0.35 para 35°)
  defaultServingMl: number;  // Volumen típico consumido por unidad (ml)
  alcoholMlPerServing: number; // ml de alcohol puro
  description: string;
  mixerRatio?: number;       // Proporción recomendada mixer:destilado (ej. 3 para 3:1)
}

export interface LegalRegulationConfig {
  countryName: string;
  lawsTitle: string;         // ej: "Ley Emilia y Ley de Tolerancia Cero (Chile)"
  zeroToleranceLimit: number;// g/l (ej: 0.30)
  intoxicationLimit: number; // g/l (ej: 0.80)
  disclaimerText: string;
  penaltiesSummary: string;
  emergencyNumber: string;   // ej: 133 Carabineros / SAMU 131
}

export interface LocaleConfig {
  locale: string;            // ej: "es-CL"
  countryCode: "CL" | "MX" | "US";
  countryName: string;
  currency: CurrencyConfig;
  slang: SlangTerms;
  typicalDrinks: TypicalDrinkOption[];
  legal: LegalRegulationConfig;
  labels: {
    appTitle: string;
    tagline: string;
    nav: {
      home: string;
      armar: string;
      juegos: string;
      tiempo: string;
      dividir: string;
      mitos: string;
    };
    moments: {
      planning: { title: string; subtitle: string };
      live: { title: string; subtitle: string };
      closing: { title: string; subtitle: string };
    };
  };
}
