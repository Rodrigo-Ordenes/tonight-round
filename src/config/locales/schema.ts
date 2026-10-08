export type CountryCode = "CL" | "MX" | "US" | "JP";
export type CurrencyCode = "CLP" | "MXN" | "USD" | "JPY";

export interface CurrencyConfig {
  code: CurrencyCode | string;
  symbol: string;
  format: (amount: number) => string;
  slangName: string; // "lucas", "varos", "bucks", "yenes"
  decimals?: number;
  thousandSeparator?: string;
  decimalSeparator?: string;
}

export interface TerminologyConfig {
  partyName: string;        // Carrete / Peda / Party / Nomikai
  pregameName: string;      // Previa / Precopeo / Pregame / 0次会 (Zero-kai)
  driverTitle: string;      // Conductor Designado / Piloto / Designated Driver / Daikou (代行)
  soberStatus: string;      // Sobrio / Ido / Wasted / Yopparai
}

export interface LegalRegulationConfig {
  lawName: string;          // Ley Emilia / El Torito / DUI Law / Daikou Law
  bacLimitText: string;     // "0.30 g/l" / "0.40 g/l" / "0.08%" / "0.00%"
  disclaimer: string;
  emergencyNumber: string;  // 131 / 911 / 911 / 119
  lawsTitle?: string;
  zeroToleranceLimit?: number; // g/l
  intoxicationLimit?: number;  // g/l
  disclaimerText?: string;
  penaltiesSummary?: string;
  countryName?: string;
}

export interface BankingConfig {
  systemName: string;       // CuentaRUT / SPEI CLABE / Venmo / PayPay
  fields: string[];         // Campos requeridos para copiar datos
  copyTemplate: (data: any) => string;
  commonBanks?: string[];
  accountTypes?: string[];
}

export interface DeliveryService {
  name: string;
  urlTemplate: string;
  icon?: string;
}

export interface DeliveryConfig {
  services: DeliveryService[];
}

export interface DrinksConfig {
  stapleName: string;       // Piscola / Paloma / Hard Seltzer / Highball
  stapleRatioDefaults: { spirit: number; mixer: number };
  spiritName?: string;
  mixerName?: string;
}

export interface SlangTerms {
  party: string;
  drinking: string;
  hangover: string;
  moneyUnit: string;
  friendGroup: string;
  splitBill: string;
  signatureDrink: string;
}

export interface TypicalDrinkOption {
  id: string;
  name: string;
  shortName: string;
  category: "destilado" | "cerveza" | "vino" | "coctel" | "sin_alcohol";
  standardAbv: number;
  defaultServingMl: number;
  alcoholMlPerServing: number;
  description: string;
  mixerRatio?: number;
}

export interface LocaleConfig {
  countryCode: CountryCode;
  countryName: string;
  flag: string;
  currency: CurrencyConfig;
  terminology: TerminologyConfig;
  legal: LegalRegulationConfig;
  banking: BankingConfig;
  delivery: DeliveryConfig;
  drinks: DrinksConfig;

  // Extensiones compatibles para no romper código previo
  locale?: string;
  slang?: SlangTerms;
  typicalDrinks?: TypicalDrinkOption[];
  labels?: {
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
    moments?: {
      planning: { title: string; subtitle: string };
      live: { title: string; subtitle: string };
      closing: { title: string; subtitle: string };
    };
  };
}
