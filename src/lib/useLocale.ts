"use client";

import { useState, useEffect, useCallback } from "react";
import { CountryCode, LocaleConfig, getLocale, COUNTRIES } from "@/config/locales";

const KEY = "tonight_country";

export function useLocale() {
  const [country, setCountryState] = useState<CountryCode>("CL");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => {
      const saved = localStorage.getItem(KEY);
      if (saved && (saved === "CL" || saved === "MX" || saved === "US" || saved === "JP")) {
        setCountryState(saved as CountryCode);
      } else {
        setCountryState("CL");
      }
      setHydrated(true);
    };

    read();

    const handler = () => read();
    window.addEventListener("tonight-country", handler);
    window.addEventListener("storage", handler);

    return () => {
      window.removeEventListener("tonight-country", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setCountry = useCallback((c: CountryCode) => {
    localStorage.setItem(KEY, c);
    setCountryState(c);
    window.dispatchEvent(new CustomEvent("tonight-country", { detail: c }));
  }, []);

  const locale: LocaleConfig = getLocale(country);

  const formatCurrency = useCallback(
    (amount: number) => {
      return locale.currency.format(amount);
    },
    [locale]
  );

  return {
    country,
    locale,
    setCountry,
    countries: COUNTRIES,
    formatCurrency,
    hydrated,
  };
}
