import { LocaleConfig, CountryCode } from "./schema";
import clLocale from "./cl";
import mxLocale from "./mx";
import usLocale from "./us";
import jpLocale from "./jp";

export const COUNTRIES: { code: CountryCode; name: string; flag: string; slang: string }[] = [
  { code: "CL", name: "Chile", flag: "🇨🇱", slang: "Carrete / Lucas" },
  { code: "MX", name: "México", flag: "🇲🇽", slang: "Peda / Varos" },
  { code: "US", name: "EE.UU.", flag: "🇺🇸", slang: "Party / Bucks" },
  { code: "JP", name: "Japón", flag: "🇯🇵", slang: "飲み会 / 円" },
];

export const LOCALES: Record<CountryCode, LocaleConfig> = {
  CL: clLocale,
  MX: mxLocale,
  US: usLocale,
  JP: jpLocale,
};

export function getLocale(code: string = "CL"): LocaleConfig {
  const upper = (code || "CL").toUpperCase() as CountryCode;
  return LOCALES[upper] || clLocale;
}

export { clLocale, mxLocale, usLocale, jpLocale };
export * from "./schema";
