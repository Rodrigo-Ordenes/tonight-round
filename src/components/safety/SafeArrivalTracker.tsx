"use client";

import React from "react";
import confetti from "canvas-confetti";
import { Home, Navigation, CheckCircle2, Users, Heart } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";

interface SafeArrivalTrackerProps {
  store: CarreteStore;
}

export default function SafeArrivalTracker({ store }: SafeArrivalTrackerProps) {
  const { participants, updateParticipant, meId } = store;

  const handleTransitStatus = (pId: string, status: "party" | "transit" | "safe") => {
    if (status === "safe") {
      audioEffects.playSuccessChime();
      confetti({
        particleCount: 65,
        spread: 75,
        origin: { y: 0.75 },
        colors: ["#10b981", "#34d399", "#ffffff", "#6366f1"],
      });
      updateParticipant(pId, { status, arrivedAt: Date.now() });
    } else {
      audioEffects.playTick();
      updateParticipant(pId, { status });
    }
  };

  const arrivedCount = participants.filter((p) => p.status === "safe").length;
  const transitCount = participants.filter((p) => p.status === "transit").length;
  const inPartyCount = participants.filter((p) => p.status === "party").length;

  return (
    <div className="p-5 sm:p-6 rounded-3xl bg-night-950/90 border border-emerald-500/30 shadow-glow-accent space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-night-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400">
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
              Confirma en vivo cuando estés en tu cama para que el grupo sepa que estás bien
            </p>
          </div>
        </div>

        {/* Counter badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-bold">
            {arrivedCount} en casa 🏠
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">
            {transitCount} en viaje 🚗
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold">
            {inPartyCount} en carrete 🎉
          </span>
        </div>
      </div>

      {/* Grid de Participantes con su estado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {participants.map((p) => {
          const isMe = p.id === meId;

          return (
            <div
              key={p.id}
              className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                p.status === "safe"
                  ? "bg-emerald-950/40 border-emerald-500/50 shadow-sm"
                  : p.status === "transit"
                  ? "bg-amber-950/30 border-amber-500/40"
                  : "bg-night-900/80 border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black text-sm text-white truncate">
                    {p.name} {isMe && "(Tú)"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
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
                  Destino: <strong className="text-slate-300">{p.commune || "Sin comuna asignada"}</strong>
                </p>
              </div>

              {/* Acciones */}
              <div className="mt-3 pt-2 border-t border-night-800 flex gap-1.5">
                {p.status !== "transit" && p.status !== "safe" && (
                  <button
                    type="button"
                    onClick={() => handleTransitStatus(p.id, "transit")}
                    className="flex-1 min-h-[40px] rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Voy en camino</span>
                  </button>
                )}

                {p.status !== "safe" && (
                  <button
                    type="button"
                    onClick={() => handleTransitStatus(p.id, "safe")}
                    className="flex-1 min-h-[40px] rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 transition-transform"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Llegué a salvo</span>
                  </button>
                )}

                {p.status === "safe" && (
                  <div className="w-full text-center text-xs text-emerald-400 font-bold py-1.5 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>En casa y a salvo</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
