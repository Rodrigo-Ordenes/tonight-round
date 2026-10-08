"use client";

import React from "react";
import { ShieldCheck, PhoneCall, AlertTriangle } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import CarreteReturnSafe from "@/components/carrete/CarreteReturnSafe";

export default function SafeReturnHub() {
  const { code } = useActiveCode();
  const store = useCarreteStore(code);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Header */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-night-950 via-emerald-950/40 to-night-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow-accent">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Retorno Seguro & Llegué a Salvo 🏠
            </h1>
            <p className="text-xs text-slate-400">
              {code !== "SOLO" ? `Sincronizado con Carrete ${code}` : "Protocolo de regreso y emergencias"}
            </p>
          </div>
        </div>
      </div>

      {/* Módulo Principal de Retorno y Pool */}
      <CarreteReturnSafe store={store} />

      {/* Teléfonos de Emergencia Chile */}
      <div className="p-5 rounded-3xl bg-night-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>Líneas de Emergencia Oficiales en Chile</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="tel:133"
            className="p-3.5 rounded-2xl bg-night-950 border border-slate-800 hover:border-indigo-500 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-black text-base text-white block">133</span>
              <span className="text-[11px] text-slate-400">Carabineros de Chile</span>
            </div>
            <PhoneCall className="w-4 h-4 text-indigo-400" />
          </a>

          <a
            href="tel:131"
            className="p-3.5 rounded-2xl bg-night-950 border border-slate-800 hover:border-emerald-500 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-black text-base text-white block">131</span>
              <span className="text-[11px] text-slate-400">Ambulancia SAMU</span>
            </div>
            <PhoneCall className="w-4 h-4 text-emerald-400" />
          </a>

          <a
            href="tel:132"
            className="p-3.5 rounded-2xl bg-night-950 border border-slate-800 hover:border-rose-500 text-left transition-colors flex items-center justify-between"
          >
            <div>
              <span className="font-black text-base text-white block">132</span>
              <span className="text-[11px] text-slate-400">Bomberos de Chile</span>
            </div>
            <PhoneCall className="w-4 h-4 text-rose-400" />
          </a>
        </div>
      </div>
    </div>
  );
}
