"use client";

import { useEffect, useState } from "react";
import { scrambleFrame } from "@/lib/signalField";

const DURATION_MS = 280;
const STEP_MS = 40;

/** Código de sala que se "decodifica" una vez al aparecer. Quien usa lector de pantalla recibe siempre el código real. */
export default function ScrambleCode({ code, className = "" }: { code: string; className?: string }) {
  const [shown, setShown] = useState(code);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const iv = setInterval(() => {
      const p = (performance.now() - start) / DURATION_MS;
      setShown(scrambleFrame(code, p));
      if (p >= 1) clearInterval(iv);
    }, STEP_MS);
    return () => {
      clearInterval(iv);
      setShown(code);
    };
  }, [code]);

  return (
    <span className={className}>
      {/* El código real para lectores de pantalla (aria-label en un span sin rol no se anuncia); lo animado se oculta */}
      <span className="sr-only">{code}</span>
      <span aria-hidden>{shown}</span>
    </span>
  );
}
