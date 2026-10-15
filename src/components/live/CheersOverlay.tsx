"use client";

import React, { useEffect, useRef, useState } from "react";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import { audioEffects } from "@/lib/audioEffects";
import { fireConfetti } from "@/lib/confetti";

export const CHEERS_WORD: Record<string, string> = { CL: "¡Salud!", MX: "¡Salud!", US: "Cheers!", JP: "乾杯!" };

/** Cuando alguien lanza "¡Salud!", todas las pantallas de la sala lo celebran a la vez. */
export default function CheersOverlay({ code, big = false }: { code: string; big?: boolean }) {
  const { state, participants } = useCarreteStore(code);
  const { country } = useLocale();
  const cheers = state.live?.cheers;
  const [show, setShow] = useState<string | null>(null);
  const seen = useRef<string | null>(null);

  useEffect(() => {
    if (!cheers || seen.current === cheers.id) return;
    // La primera lectura solo marca: no se celebra un brindis viejo al abrir la app.
    const first = seen.current === null;
    seen.current = cheers.id;
    if (first && Date.now() - cheers.at > 8000) return;
    setShow(cheers.id);
    audioEffects.playReveal();
    audioEffects.triggerHaptic([80, 60, 80]);
    void fireConfetti({ particleCount: big ? 200 : 90, spread: 110, origin: { y: 0.6 }, colors: ["#FFBC20", "#FF5E36", "#F7F5F3"] });
    const t = setTimeout(() => setShow(null), 3800);
    return () => clearTimeout(t);
  }, [cheers, big]);

  if (!show || !cheers) return null;
  const by = participants.find((p) => p.id === cheers.by)?.name;
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] flex flex-col items-center justify-center bg-night-950/60 backdrop-blur-sm animate-fade-in" role="status">
      <p className={`display text-center ${big ? "text-tv-hero" : "text-display-xl"} animate-rise-in`}>
        <span className="text-gradient-ember">{CHEERS_WORD[country] ?? "¡Salud!"}</span> 🥂
      </p>
      {by && <p className={`mt-4 text-slate-200 ${big ? "text-tv-sm" : "text-lg"}`}>Brindis de {by}</p>}
    </div>
  );
}
