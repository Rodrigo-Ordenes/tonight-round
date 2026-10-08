import { LocaleConfig } from "./schema";
import clLocale from "./cl";
import mxLocale from "./mx";
import usLocale from "./us";

export const LOCALES: Record<string, LocaleConfig> = {
  CL: clLocale,
  MX: mxLocale,
  US: usLocale,
};

export function getLocale(code: string = "CL"): LocaleConfig {
  return LOCALES[code.toUpperCase()] || clLocale;
}

export { clLocale, mxLocale, usLocale };
