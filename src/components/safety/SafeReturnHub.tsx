"use client";

import React from "react";
import { ShieldCheck, PhoneCall, AlertTriangle } from "lucide-react";
import { useActiveCode } from "@/lib/useActiveCode";
import { useCarreteStore } from "@/store/useCarreteStore";
import { useLocale } from "@/lib/useLocale";
import CarreteReturnSafe from "@/components/carrete/CarreteReturnSafe";

export default function SafeReturnHub() {
  const { code } = useActiveCode();
  const { locale } = useLocale();
  const store = useCarreteStore(code);

  const emergencyContacts = React.useMemo(() => {
    switch (locale.countryCode) {
      case "MX":
        return [
          { number: "911", name: "Emergencias Nacionales México", tel: "tel:911", color: "text-rose-400" },
          { number: "089", name: "Denuncia y Asistencia Anónima", tel: "tel:089", color: "text-indigo-400" },
          { number: "55 5395 1111", name: "Cruz Roja Mexicana", tel: "tel:5553951111", color: "text-emerald-400" },
        ];
      case "US":
        return [
          { number: "911", name: "US Emergency (Police / Fire / EMS)", tel: "tel:911", color: "text-rose-400" },
          { number: "988", name: "Suicide & Crisis Lifeline", tel: "tel:988", color: "text-indigo-400" },
          { number: "311", name: "Non-Emergency Municipal Help", tel: "tel:311", color: "text-emerald-400" },
        ];
      case "JP":
        return [
          { number: "110", name: "警察 (Police Japan)", tel: "tel:110", color: "text-indigo-400" },
          { number: "119", name: "消防・救急 (Fire & Ambulance)", tel: "tel:119", color: "text-rose-400" },
          { number: "#7119", name: "救急相談ダイヤル (Medical Consult)", tel: "tel:7119", color: "text-emerald-400" },
        ];
      case "CL":
      default:
        return [
          { number: "133", name: "Carabineros de Chile", tel: "tel:133", color: "text-indigo-400" },
          { number: "131", name: "Ambulancia SAMU Chile", tel: "tel:131", color: "text-emerald-400" },
          { number: "132", name: "Bomberos de Chile", tel: "tel:132", color: "text-rose-400" },
        ];
    }
  }, [locale.countryCode]);

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
              {code !== "SOLO"
                ? `Sincronizado con ${locale.terminology.partyName} ${code}`
                : "Protocolo de regreso seguro y emergencias"}
            </p>
          </div>
        </div>
      </div>

      {/* Módulo Principal de Retorno y Pool */}
      <CarreteReturnSafe store={store} />

      {/* Teléfonos de Emergencia Oficiales según País */}
      <div className="p-5 rounded-3xl bg-night-900/80 border border-slate-800 space-y-3">
        <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-emerald-400" />
          <span>Líneas de Emergencia Oficiales ({locale.countryName})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {emergencyContacts.map((contact) => (
            <a
              key={contact.number}
              href={contact.tel}
              className="p-3.5 rounded-2xl bg-night-950 border border-slate-800 hover:border-emerald-500 text-left transition-colors flex items-center justify-between"
            >
              <div>
                <span className="font-black text-base text-white block">{contact.number}</span>
                <span className="text-[11px] text-slate-400">{contact.name}</span>
              </div>
              <PhoneCall className={`w-4 h-4 ${contact.color}`} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
