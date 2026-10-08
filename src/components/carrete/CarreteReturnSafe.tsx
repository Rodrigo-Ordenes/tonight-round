"use client";

import React, { useState, useMemo } from "react";
import confetti from "canvas-confetti";
import {
  Car,
  Home,
  Users,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Navigation,
} from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

interface CarreteReturnSafeProps {
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

export default function CarreteReturnSafe({ store }: CarreteReturnSafeProps) {
  const { participants, updateParticipant, meId } = store;

  const [selectedCommune, setSelectedCommune] = useState<string>("Santiago Centro");

  // Agrupamiento por comunas
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

  const handleTransitStatus = (pId: string, status: "party" | "transit" | "safe") => {
    if (status === "safe") {
      audioEffects.playSuccessChime();
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 },
        colors: ["#10b981", "#34d399", "#ffffff"],
      });
      updateParticipant(pId, { status, arrivedAt: Date.now() });
    } else {
      audioEffects.playTick();
      updateParticipant(pId, { status });
    }
  };

  const arrivedCount = participants.filter((p) => p.status === "safe").length;
  const transitCount = participants.filter((p) => p.status === "transit").length;
  const partyCount = participants.filter((p) => p.status === "party").length;

  return (
    <div className="space-y-6">
      {/* Tablero 'Llegué a Salvo' */}
      <div className="p-5 sm:p-6 rounded-3xl bg-night-950/90 border border-emerald-500/30 shadow-glow-accent space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-500/20 text-emerald-400">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Tablero &apos;Llegué a Salvo&apos;</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                  Check-in Seguro
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Confirma cuando estés en camino o en tu cama para que el grupo sepa que estás bien
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
              {arrivedCount} en casa 🏠
            </span>
            <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">
              {transitCount} en viaje 🚗
            </span>
          </div>
        </div>

        {/* Listado de participantes con estado de retorno */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {participants.map((p) => {
            const isMe = p.id === meId;

            return (
              <div
                key={p.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                  p.status === "safe"
                    ? "bg-emerald-950/40 border-emerald-500/50"
                    : p.status === "transit"
                    ? "bg-amber-950/30 border-amber-500/40"
                    : "bg-night-900/80 border-slate-800"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-white">
                      {p.name} {isMe && "(Tú)"}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        p.status === "safe"
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : p.status === "transit"
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {p.status === "safe"
                        ? "En Casa ✓"
                        : p.status === "transit"
                        ? "En Viaje 🚗"
                        : "En el Carrete 🎉"}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-1">
                    Comuna: <strong className="text-slate-300">{p.commune || "Sin asignar"}</strong>
                  </p>
                </div>

                {/* Acciones de cambio de estado */}
                <div className="mt-3 pt-2 border-t border-night-800 flex gap-1.5">
                  {p.status !== "transit" && p.status !== "safe" && (
                    <button
                      type="button"
                      onClick={() => handleTransitStatus(p.id, "transit")}
                      className="flex-1 min-h-[38px] rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Voy en camino</span>
                    </button>
                  )}

                  {p.status !== "safe" && (
                    <button
                      type="button"
                      onClick={() => handleTransitStatus(p.id, "safe")}
                      className="flex-1 min-h-[38px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Llegué a salvo</span>
                    </button>
                  )}

                  {p.status === "safe" && (
                    <div className="w-full text-center text-xs text-emerald-400 font-bold py-1">
                      🏠 En casa y a salvo
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pool de Retorno por Comunas */}
      <div className="p-5 sm:p-6 rounded-3xl bg-night-950/80 border border-indigo-500/30 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-night-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-indigo-500/20 text-indigo-400">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Pool de Regreso & Compartir Auto (Uber / DiDi)
              </h3>
              <p className="text-[11px] text-slate-400">
                Agrupa amigos que van hacia la misma comuna y divide la tarifa
              </p>
            </div>
          </div>
        </div>

        {/* Grupos de comunas */}
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
                    <span className="font-black text-base text-white">{commune}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">
                      {members.length} {members.length === 1 ? "persona" : "personas"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    Tarifa estimada: ${fare.toLocaleString("es-CL")} CLP (~$
                    {perPerson.toLocaleString("es-CL")} c/u)
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {members.map((m) => (
                      <span
                        key={m.id}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-xl bg-slate-800 text-slate-200"
                      >
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-night-850 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Pide el auto directo:</span>
                  <a
                    href={uberLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[40px] px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <span>Abrir Uber</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Asignar comuna para participantes */}
        <div className="p-4 rounded-2xl bg-night-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <span className="text-xs font-bold text-slate-300 shrink-0">
            Cambiar comuna de destino:
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
              Asignar a mi usuario
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
