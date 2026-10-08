"use client";

import React, { useState } from "react";
import { Clock, AlertTriangle, ShieldCheck, Zap, User, Plus } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { computeBac, BETA, widmarkR, fmtDuration, fmtTime } from "@/lib/alcohol";
import { audioEffects } from "@/lib/audioEffects";

interface CarreteResurrectionPacingProps {
  store: CarreteStore;
}

const PRESET_COMMITMENTS = [
  { label: "Turno Laboral (08:30)", hour: 8.5, mode: "strict" as const },
  { label: "Manejar a la Playa (11:00)", hour: 11.0, mode: "strict" as const },
  { label: "Almuerzo Familiar (13:00)", hour: 13.0, mode: "functional" as const },
  { label: "Reunión Social / Tarde (16:00)", hour: 16.0, mode: "functional" as const },
  { label: "Día Libre / Sin Compromiso", hour: 20.0, mode: "functional" as const },
];

export default function CarreteResurrectionPacing({ store }: CarreteResurrectionPacingProps) {
  const { participants, updateParticipant } = store;

  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);

  const now = Date.now();
  const today = new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-night-950 via-amber-950/40 to-night-950 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white">
              ¿PARA CUÁNDO TENGO QUE ESTAR VIVO?
            </h2>
            <p className="text-xs text-slate-400">
              Calculadora inversa de pacing: hora límite de corte para llegar en 0.0 g/l a tu compromiso
            </p>
          </div>
        </div>
      </div>

      {/* Grid de Pacing por Participante */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {participants.map((p) => {
          const bacData = computeBac(p.consumptions, p.gender, p.weightKg, now);
          const currentBac = bacData.bac;

          // Hora objetivo en ms para mañana o hoy
          const targetHourDec = p.resurrectionHour !== null ? p.resurrectionHour : 13.0; // default 13:00
          const targetDate = new Date();
          if (targetDate.getHours() >= 6) {
            targetDate.setDate(targetDate.getDate() + 1); // mañana
          }
          targetDate.setHours(Math.floor(targetHourDec), Math.round((targetHourDec % 1) * 60), 0, 0);

          const msRemaining = targetDate.getTime() - now;
          const hoursRemaining = Math.max(0, msRemaining / 3_600_000);

          // Tolerancia: estricto 0.0 (requiere estar sobrio 2h antes) vs funcional
          const safetyBuffer = p.resurrectionMode === "strict" ? 2.0 : 0.5;
          const effectiveHours = Math.max(0, hoursRemaining - safetyBuffer);

          // Máximo alcohol que puede eliminar antes del compromiso
          const maxBacEliminable = effectiveHours * BETA;
          const isOverLimit = currentBac > maxBacEliminable;
          const isNearLimit = !isOverLimit && currentBac > maxBacEliminable * 0.75;

          // Semáforo: Verde, Amarillo, Rojo
          const lightStatus = isOverLimit ? "red" : isNearLimit ? "yellow" : "green";

          // Last Call personal: hasta qué hora puede beber antes de cruzar la línea
          const hoursLeftToDrink = Math.max(0, (maxBacEliminable - currentBac) / BETA);
          const lastCallTs = now + hoursLeftToDrink * 3_600_000;

          return (
            <div
              key={p.id}
              className={`p-5 rounded-3xl border transition-all space-y-4 ${
                lightStatus === "red"
                  ? "bg-rose-950/40 border-rose-500/60 shadow-[0_0_20px_rgba(239,68,68,0.2)]"
                  : lightStatus === "yellow"
                  ? "bg-amber-950/30 border-amber-500/50"
                  : "bg-night-900/90 border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between gap-2 border-b border-night-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                  <div>
                    <h3 className="font-black text-base text-white">{p.name}</h3>
                    <p className="text-[11px] text-slate-400">
                      {p.gender === "M" ? "Hombre" : "Mujer"} · {p.weightKg} kg · {p.consumptions.length} consumos
                    </p>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
                    lightStatus === "red"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse"
                      : lightStatus === "yellow"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/50"
                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                  }`}
                >
                  {lightStatus === "red"
                    ? "🔴 Desfase Confirmado"
                    : lightStatus === "yellow"
                    ? "🟡 Al Límite"
                    : "🟢 En Rango"}
                </span>
              </div>

              {/* Compromiso y Modo */}
              <div className="p-3 rounded-2xl bg-night-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Compromiso de mañana
                  </span>
                  <span className="text-xs font-black text-white">
                    {p.resurrectionLabel || "Almuerzo Familiar (13:00)"}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Tolerancia: {p.resurrectionMode === "strict" ? "0.0 estricto" : "Funcional"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setEditingParticipantId(p.id)}
                  className="min-h-[36px] px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-bold transition-colors"
                >
                  Cambiar
                </button>
              </div>

              {/* Métricas del Pacing */}
              <div className="space-y-2">
                <div className="p-3.5 rounded-2xl bg-night-950 border border-night-800 text-xs space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Alcoholemia actual:</span>
                    <strong className="font-mono text-white">{currentBac.toFixed(2)} g/l</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Sobriedad total (0.0):</span>
                    <strong className="text-emerald-400">
                      {bacData.zeroAt ? `≈ ${fmtTime(bacData.zeroAt)}` : "Ahora (0.0)"}
                    </strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Hora de corte recomendada:</span>
                    <strong className="text-amber-400 font-bold">
                      {isOverLimit ? "¡YA DEBES PARAR!" : `≈ ${fmtTime(lastCallTs)}`}
                    </strong>
                  </div>
                </div>

                {lightStatus === "red" ? (
                  <p className="text-xs text-rose-300 font-semibold leading-relaxed">
                    ⚠️ A la hora de tu compromiso todavía tendrás alcohol en sangre. Te sugerimos pasar al agua inmediatamente o postergar el compromiso matutino.
                  </p>
                ) : lightStatus === "yellow" ? (
                  <p className="text-xs text-amber-300 font-semibold leading-relaxed">
                    🟡 Llegas despierto pero con deshidratación. Alterna cada trago restante con 1 vaso de agua mineral.
                  </p>
                ) : (
                  <p className="text-xs text-emerald-300 font-semibold leading-relaxed">
                    🟢 Ritmo seguro: Tu cuerpo eliminará el alcohol completamente antes de la hora fijada.
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal para configurar compromiso */}
      {editingParticipantId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-night-900 border border-indigo-500/30 p-5 space-y-4">
            <h3 className="text-base font-black text-white">
              Configurar Hora y Compromiso
            </h3>

            <div className="space-y-2">
              <span className="text-xs text-slate-400 font-bold">Selecciona un compromiso:</span>
              <div className="space-y-1.5">
                {PRESET_COMMITMENTS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    onClick={() => {
                      audioEffects.playPop();
                      updateParticipant(editingParticipantId, {
                        resurrectionLabel: c.label,
                        resurrectionHour: c.hour,
                        resurrectionMode: c.mode,
                      });
                      setEditingParticipantId(null);
                    }}
                    className="w-full min-h-[44px] p-2.5 rounded-xl bg-night-950 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500 text-left text-xs font-bold text-white flex items-center justify-between transition-colors"
                  >
                    <span>{c.label}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {c.mode === "strict" ? "0.0 estricto" : "Funcional"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setEditingParticipantId(null)}
                className="w-full min-h-[44px] rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
