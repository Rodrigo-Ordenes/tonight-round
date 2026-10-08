"use client";

import React, { useState, useMemo } from "react";
import { Car, ExternalLink, Users, Sparkles, MapPin, Zap } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

interface ReturnPoolManagerProps {
  store: CarreteStore;
}

const COMMON_COMMUNES = [
  "Santiago Centro",
  "Providencia",
  "Las Condes",
  "Ñuñoa",
  "Maipú",
  "La Florida",
  "Macul",
  "San Miguel",
  "Peñalolén",
  "Vitacura",
  "La Reina",
  "Pudahuel",
  "Viña del Mar",
  "Valparaíso",
  "Concepción",
];

const COMMUNE_FARE_ESTIMATES: Record<string, number> = {
  "Santiago Centro": 8500,
  Providencia: 9000,
  "Las Condes": 12000,
  Ñuñoa: 9500,
  Maipú: 14000,
  "La Florida": 13000,
  Macul: 10500,
  "San Miguel": 10000,
  Peñalolén: 13500,
  Vitacura: 14000,
  "La Reina": 12500,
  Pudahuel: 15000,
  "Viña del Mar": 11000,
  Valparaíso: 12000,
  Concepción: 9500,
};

export default function ReturnPoolManager({ store }: ReturnPoolManagerProps) {
  const { participants, updateParticipant, meId } = store;
  const [selectedCommune, setSelectedCommune] = useState<string>("Santiago Centro");

  // Agrupación por comunas
  const communeGroups = useMemo(() => {
    const groups: Record<string, typeof participants> = {};
    participants.forEach((p) => {
      const comm = p.commune || "Sin asignar";
      if (!groups[comm]) groups[comm] = [];
      groups[comm].push(p);
    });
    return groups;
  }, [participants]);

  const handleSetMyCommune = (pId: string, commune: string) => {
    audioEffects.playPop();
    updateParticipant(pId, { commune });
  };

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-night-950/80 border border-indigo-500/30 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-night-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-white">
              Pool de Regreso & Compartir Auto (Uber / Cabify / DiDi)
            </h3>
            <p className="text-[11px] text-slate-400">
              Agrupa amigos que van hacia la misma comuna y divide la tarifa estimada
            </p>
          </div>
        </div>

        {/* Botón Bomba de humo rápida */}
        <a
          href="https://m.uber.com/ul/?action=setPickup&pickup=my_location"
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-[44px] px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:brightness-110 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 shrink-0 active:scale-95 transition-all"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Bomba de Humo (Pedir Uber)</span>
        </a>
      </div>

      {/* Tarjetas por Comuna */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(communeGroups).map(([commune, members]) => {
          if (commune === "Sin asignar" && members.length === 0) return null;
          const fare = COMMUNE_FARE_ESTIMATES[commune] || 9500;
          const perPerson = Math.round(fare / Math.max(1, members.length));
          const uberLink = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(
            commune + ", Chile"
          )}`;

          return (
            <div
              key={commune}
              className="p-4 rounded-2xl bg-night-900 border border-slate-800 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-black text-base text-white flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    <span>{commune}</span>
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    {members.length} {members.length === 1 ? "persona" : "personas"}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1">
                  Tarifa estimada: <strong className="text-white">${fare.toLocaleString("es-CL")} CLP</strong> (~${perPerson.toLocaleString("es-CL")} c/u)
                </p>

                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {members.map((m) => (
                    <span
                      key={m.id}
                      className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200 border border-slate-700"
                    >
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-night-850 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Pedir viaje directo:</span>
                <a
                  href={uberLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[40px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Abrir Uber con Destino</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selector de Comuna de Destino */}
      <div className="p-4 rounded-2xl bg-night-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
        <span className="text-xs font-bold text-slate-300 shrink-0">
          Asignar o cambiar mi comuna:
        </span>
        <select
          value={selectedCommune}
          onChange={(e) => setSelectedCommune(e.target.value)}
          className="flex-1 min-h-[44px] px-3 rounded-xl bg-night-950 border border-slate-700 text-white text-xs outline-none"
        >
          {COMMON_COMMUNES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {meId && (
          <button
            type="button"
            onClick={() => handleSetMyCommune(meId, selectedCommune)}
            className="min-h-[44px] px-4 rounded-xl bg-indigo-600 text-white font-bold text-xs shrink-0"
          >
            Guardar en mi usuario
          </button>
        )}
      </div>
    </div>
  );
}
