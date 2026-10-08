"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ACTIVE_KEY, SOLO } from "@/store/useCarreteStore";

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

  const m = pathname?.match(/^\/carrete\/([A-Za-z0-9]{4})$/);
  const fromUrl = m && m[1].toLowerCase() !== "tv" ? m[1].toUpperCase() : null;
  return { code: fromUrl ?? stored ?? SOLO, hydrated };
}
