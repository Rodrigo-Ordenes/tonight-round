"use client";

import { useCallback, useEffect, useState } from "react";

export type Theme = "night" | "halloween";
const KEY = "tonight_theme";

/** Tema global (no pertenece a ningún carrete, evita salas fantasma). */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>("night");

  useEffect(() => {
    const read = () => setTheme(localStorage.getItem(KEY) === "halloween" ? "halloween" : "night");
    read();
    window.addEventListener("tonight-theme", read);
    window.addEventListener("storage", read);
    return () => {
      window.removeEventListener("tonight-theme", read);
      window.removeEventListener("storage", read);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    const next: Theme = localStorage.getItem(KEY) === "halloween" ? "night" : "halloween";
    localStorage.setItem(KEY, next);
    window.dispatchEvent(new Event("tonight-theme"));
  }, []);

  return { theme, toggleTheme };
}
