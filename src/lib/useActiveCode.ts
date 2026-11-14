"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ACTIVE_KEY, SOLO } from "@/store/useCarreteStore";

/** Código de sala en una ruta /carrete/XXXX o /carrete/XXXXXX. */
export function codeFromPath(pathname: string): string | null {
  const m = pathname.match(/^\/carrete\/([A-Za-z0-9]{4}(?:[A-Za-z0-9]{2})?)$/);
  return m && m[1].toLowerCase() !== "tv" ? m[1].toUpperCase() : null;
}

/** Código de carrete en contexto: el de la URL (/carrete/XXXX) o el activo guardado; "SOLO" si no hay. */
export function useActiveCode(): { code: string; hydrated: boolean } {
  const pathname = usePathname();
  const [stored, setStored] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const read = () => setStored(localStorage.getItem(ACTIVE_KEY));
    read();
    setHydrated(true);
    window.addEventListener("tonight-active-change", read);
    return () => window.removeEventListener("tonight-active-change", read);
  }, []);

  const fromUrl = pathname ? codeFromPath(pathname) : null;
  return { code: fromUrl ?? stored ?? SOLO, hydrated };
}
