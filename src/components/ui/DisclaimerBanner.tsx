"use client";

import React from "react";
import { AlertTriangle, ShieldCheck, Car } from "lucide-react";
import clLocale from "@/config/locales/cl";

interface DisclaimerBannerProps {
  compact?: boolean;
}

export default function DisclaimerBanner({ compact = false }: DisclaimerBannerProps) {
  if (compact) {
    return (
      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2.5 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span className="leading-snug">
          <strong>Ley Emilia & Tolerancia Cero:</strong> Prohibido conducir con $\ge 0.3$ g/l de alcohol. Si tomas, no manejes.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-3xl bg-amber-500/10 border-2 border-amber-500/40 shadow-glow-amber">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 shrink-0 mt-0.5">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="text-xs text-amber-200 leading-relaxed">
          <span className="font-extrabold text-amber-300 uppercase tracking-wide block mb-1 flex items-center gap-2">
            <Car className="w-4 h-4" />
            <span>Marco Legal Chileno — Consumo Responsable</span>
          </span>
          <p>
            {clLocale.legal.disclaimerText}
          </p>
        </div>
      </div>
    </div>
  );
}
