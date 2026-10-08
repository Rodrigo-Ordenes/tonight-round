"use client";

import React, { useEffect, useState } from "react";
import { Trophy, Droplet, Plus, RotateCcw, ShieldAlert, Car, UserPlus, X, Zap, Trash2 } from "lucide-react";
import CanisterGlassMeter from "./CanisterGlassMeter";
import type { CarreteStore } from "@/store/useCarreteStore";
import { useTheme } from "@/lib/theme";
import { audioEffects } from "@/lib/audioEffects";
import {
  DRINK_PRESETS,
  computeBac,
  fmtDuration,
  fmtTime,
  groupConsumptions,
  lightFor,
  type DrinkPreset,
} from "@/lib/alcohol";
import type { Participant } from "@/lib/carreteState";

const LIGHT_STYLE = {
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  yellow: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  red: "bg-rose-500/20 text-rose-300 border-rose-500/40",
} as const;
const LIGHT_ICON = { green: "🟢", yellow: "🟡", red: "🔴" } as const;

interface Props {
  store: CarreteStore;
  /** En modo TV se oculta la edición */
  readOnly?: boolean;
}

export default function MonstruometroRanking({ store, readOnly = false }: Props) {
  const { participants, addConsumption, removeLastConsumption, addWater, addParticipant, removeParticipant } = store;
  const { theme } = useTheme();
  const [now, setNow] = useState(() => Date.now());
  const [driverWarning, setDriverWarning] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState(75);
  const [isDriver, setIsDriver] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(iv);
  }, []);

  const rows = participants
    .map((p) => ({ p, r: computeBac(p.consumptions, p.gender, p.weightKg, now) }))
    .sort((a, b) => b.r.totalGrams - a.r.totalGrams);

  const drink = (p: Participant, preset: Pick<DrinkPreset, "label" | "ml" | "abv">) => {
    audioEffects.playPop();
    if (p.role === "driver") {
      audioEffects.playBuzz();
      setDriverWarning(p.name);
    }
    addConsumption(p.id, { label: preset.label, ml: preset.ml, abv: preset.abv });
    setPickerFor(null);
  };

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    addParticipant({ name: name.trim(), gender, weightKg: weight, role: isDriver ? "driver" : "drinker" });
    setName("");
    setIsDriver(false);
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/80 to-slate-900 border border-indigo-500/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-white">MONSTRUÓMETRO • RANKING DE CANISTERS</h2>
            <p className="text-xs text-slate-300">
              Alcohol puro real por persona (ml × grado × 0.8) y alcoholemia estimada (Widmark).
            </p>
          </div>
        </div>
        {!readOnly && (
          <button
            onClick={() => setShowAdd(true)}
            className="min-h-[48px] px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center gap-2 shrink-0"
          >
            <UserPlus className="w-4 h-4" /> Sumar participante
          </button>
        )}
      </div>

      {rows.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-10 rounded-3xl border border-dashed border-slate-700">
          Aún no hay participantes en este carrete. Suma el primero para encender los canisters.
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map(({ p, r }, idx) => {
          const light = lightFor(r.bac);
          const isTop = idx === 0 && r.totalGrams > 0 && p.role !== "driver";
          const breach = p.role === "driver" && p.consumptions.length > 0;
          const details = groupConsumptions(p.consumptions);
          return (
            <div
              key={p.id}
              className={`relative rounded-3xl p-4 border flex flex-col items-center gap-3 ${
                breach
                  ? "bg-rose-950/40 border-2 border-rose-500 animate-pulse"
                  : isTop
                  ? "bg-amber-950/20 border-amber-500/50"
                  : "bg-night-900/60 border-slate-800"
              }`}
            >
              <div className="w-full flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-black text-white truncate">{p.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {p.gender === "M" ? "Hombre" : "Mujer"} · {p.weightKg} kg
                  </p>
                </div>
                {isTop ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <Trophy className="w-3 h-3" /> Monstruo #1
                  </span>
                ) : p.role === "driver" ? (
                  <span className="flex items-center gap-1 text-[10px] font-black uppercase px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    <Car className="w-3 h-3" /> Piloto 0.0
                  </span>
                ) : null}
              </div>

              <CanisterGlassMeter
                pressure={Math.min(100, Math.round(r.totalGrams))}
                isDriver={p.role === "driver"}
                theme={theme}
                drinksCount={p.consumptions.length}
                pureAlcoholGrams={r.totalGrams}
                heightPx={200}
              />

              {/* Métricas reales */}
              <div className="w-full space-y-1.5 text-xs">
                <div className="grid grid-cols-3 gap-1.5 text-center">
                  <div className="rounded-xl bg-slate-900 p-2">
                    <p className="text-[10px] text-slate-400">Consumos</p>
                    <p className="font-black text-white">{p.consumptions.length}</p>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-2">
                    <p className="text-[10px] text-slate-400">Alcohol puro</p>
                    <p className="font-black text-white">{r.totalGrams.toFixed(1)} g</p>
                  </div>
                  <div className="rounded-xl bg-slate-900 p-2">
                    <p className="text-[10px] text-slate-400">BAC</p>
                    <p className="font-black text-white">{r.bac.toFixed(2)} g/l</p>
                  </div>
                </div>

                <div className={`px-3 py-2 rounded-xl border font-bold ${LIGHT_STYLE[light]}`}>
                  {LIGHT_ICON[light]}{" "}
                  {r.zeroAt
                    ? `A 0.0 en ${fmtDuration(r.hoursToZero)} (≈ ${fmtTime(r.zeroAt)})`
                    : "En 0.0 g/l ahora"}
                </div>

                {details.length > 0 && (
                  <ul className="space-y-0.5 text-[11px] text-slate-300 font-mono">
                    {details.map((d) => (
                      <li key={d.text}>• {d.text}</li>
                    ))}
                    {p.waterCount > 0 && <li className="text-cyan-300">• {p.waterCount}x Agua</li>}
                  </ul>
                )}
              </div>

              {!readOnly && (
                <div className="w-full space-y-2">
                  <button
                    onClick={() => setPickerFor(pickerFor === p.id ? null : p.id)}
                    className={`w-full min-h-[48px] rounded-xl text-sm font-black flex items-center justify-center gap-1 ${
                      p.role === "driver" ? "bg-rose-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                    }`}
                  >
                    <Plus className="w-4 h-4" /> Agregar consumo
                  </button>
                  {pickerFor === p.id && (
                    <div className="grid grid-cols-2 gap-2">
                      {DRINK_PRESETS.map((d) => (
                        <button
                          key={d.key}
                          onClick={() => drink(p, d)}
                          className="min-h-[48px] rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white px-2"
                        >
                          {d.emoji} {d.label}
                          <span className="block text-[10px] text-slate-400 font-normal">
                            {d.ml}ml · {Math.round(d.abv * 1000) / 10}%
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        audioEffects.playWaterDrop();
                        addWater(p.id);
                      }}
                      className="flex-1 min-h-[48px] rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <Droplet className="w-4 h-4" /> Agua
                    </button>
                    <button
                      onClick={() => removeLastConsumption(p.id)}
                      disabled={p.consumptions.length === 0}
                      aria-label="Deshacer último consumo"
                      className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 disabled:opacity-30 text-slate-300 flex items-center justify-center"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      aria-label={`Quitar a ${p.name}`}
                      className="min-w-[48px] min-h-[48px] rounded-xl bg-slate-800 text-slate-400 hover:text-rose-400 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-slate-500 text-center">
        Estimación referencial. Ley Emilia (Ley N° 20.580): Tolerancia Cero al conducir. Si bebiste, no manejes.
      </p>

      {driverWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-rose-500 p-6 text-center space-y-4">
            <ShieldAlert className="w-10 h-10 mx-auto text-rose-400 animate-bounce" />
            <h3 className="text-xl font-black text-white">¡RUPTURA DE CONTENCIÓN: {driverWarning.toUpperCase()}!</h3>
            <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-500/40 text-xs text-rose-200 text-left space-y-2">
              <p className="font-bold">⚠️ TOLERANCIA CERO (Ley N° 20.580 / Ley Emilia)</p>
              <p>
                El conductor designado registró alcohol. En Chile conducir con cualquier graduación sobre 0.0 g/l es
                ilegal.
              </p>
              <p className="font-semibold text-white">🛑 Designa un nuevo piloto o pide un auto (Uber / Cabify / DiDi).</p>
            </div>
            <button
              onClick={() => setDriverWarning(null)}
              className="w-full min-h-[48px] rounded-2xl bg-rose-600 text-white font-black text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={create} className="w-full max-w-sm rounded-3xl bg-night-900 border border-indigo-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black text-white">Sumar participante</h3>
              <button type="button" onClick={() => setShowAdd(false)} aria-label="Cerrar" className="p-2 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <input
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre o apodo"
              className="w-full min-h-[48px] px-4 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
            />
            <div className="grid grid-cols-2 gap-2">
              {(["M", "F"] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGender(g)}
                  className={`min-h-[48px] rounded-xl text-sm font-bold ${
                    gender === g ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"
                  }`}
                >
                  {g === "M" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-300">
              Peso: {weight} kg
              <input
                type="range"
                min={40}
                max={140}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full mt-2 accent-indigo-500"
              />
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/60 min-h-[48px] text-xs font-semibold text-slate-200 cursor-pointer">
              <input type="checkbox" checked={isDriver} onChange={(e) => setIsDriver(e.target.checked)} className="w-5 h-5" />
              🚗 Conductor designado (Piloto 0.0)
            </label>
            <button type="submit" className="w-full min-h-[48px] rounded-xl bg-indigo-600 text-white font-black text-sm">
              Agregar al carrete
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
