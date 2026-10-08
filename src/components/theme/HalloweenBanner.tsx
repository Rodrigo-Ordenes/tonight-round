"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, Skull, Moon, Ghost, X, Flame } from "lucide-react";
import { useTheme } from "@/lib/theme";

export default function HalloweenBanner() {
  const { theme, toggleTheme } = useTheme();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const wasDismissed = sessionStorage.getItem("tonight_halloween_banner_dismissed");
    if (wasDismissed === "true") {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("tonight_halloween_banner_dismissed", "true");
    }
  };

  const handleRestore = () => {
    setDismissed(false);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("tonight_halloween_banner_dismissed");
    }
  };

  if (!mounted) return null;

  const isHalloween = theme === "halloween";

  if (dismissed) {
    return (
      <div className="fixed top-2 right-4 z-50">
        <button
          onClick={handleRestore}
          aria-label="Abrir banner Halloween"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-slate-900/90 border border-orange-500/50 text-orange-400 shadow-[0_0_15px_rgba(255,117,24,0.35)] backdrop-blur-md hover:scale-105 active:scale-95 transition-all"
        >
          <span>🎃</span>
          <span className="hidden sm:inline">Edición Halloween</span>
        </button>
      </div>
    );
  }

  return (
    <div
      role="banner"
      className={`relative z-40 transition-all duration-300 border-b backdrop-blur-md ${
        isHalloween
          ? "bg-gradient-to-r from-orange-600/25 via-purple-950/60 to-slate-950 border-[#FF7518] shadow-[0_0_20px_rgba(255,117,24,0.35)]"
          : "bg-gradient-to-r from-orange-600/10 via-purple-950/30 to-slate-950/90 border-orange-500/30 shadow-sm"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <span className="text-xl animate-bounce shrink-0" role="img" aria-label="calabaza">
            🎃
          </span>
          <p className="text-xs sm:text-sm font-semibold tracking-wide text-slate-200">
            <span className="text-[#FF7518] font-black uppercase tracking-wider mr-1.5">
              EDICIÓN ESPECIAL HALLOWEEN:
            </span>
            <span>
              Pócimas de previa, ruletas del terror y retorno seguro embrujado.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Switch Modo Brujas */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black transition-all ${
              isHalloween
                ? "bg-[#FF7518] text-slate-950 shadow-[0_0_15px_rgba(255,117,24,0.6)] hover:bg-orange-400"
                : "bg-purple-950/60 border border-purple-500/40 text-[#A855F7] hover:border-purple-400"
            }`}
          >
            {isHalloween ? (
              <>
                <Flame className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
                <span>🎃 Modo Brujas Activo</span>
              </>
            ) : (
              <>
                <Ghost className="w-3.5 h-3.5 text-[#22C55E]" />
                <span className="text-[#22C55E]">Activar Modo Brujas</span>
              </>
            )}
          </button>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            aria-label="Cerrar banner"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
