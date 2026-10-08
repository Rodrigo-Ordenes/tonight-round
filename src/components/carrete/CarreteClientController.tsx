"use client";

import React, { useState } from "react";
import { fireConfetti } from "@/lib/confetti";
import {
  Smartphone,
  Car,
  User,
  CheckCircle2,
  Clock,
  Home,
  Plus,
  RotateCcw,
  Droplet,
  ShieldAlert,
  Navigation,
} from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import {
  DRINK_PRESETS,
  computeBac,
  fmtTime,
  fmtDuration,
  lightFor,
  type DrinkPreset,
} from "@/lib/alcohol";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";

interface CarreteClientControllerProps {
  store: CarreteStore;
}

export default function CarreteClientController({ store }: CarreteClientControllerProps) {
  const { locale } = useLocale();
  const {
    participants,
    meId,
    setMeId,
    addParticipant,
    addConsumption,
    removeLastConsumption,
    addWater,
    updateParticipant,
  } = store;

  const [newName, setNewName] = useState("");
  const [newIsDriver, setNewIsDriver] = useState(false);

  // Participante activo para este celular
  const currentParticipant =
    participants.find((p) => p.id === meId) || participants[0] || null;

  const handleRegisterMe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    audioEffects.playPop();
    const id = addParticipant(
      {
        name: newName.trim(),
        role: newIsDriver ? "driver" : "drinker",
        gender: "M",
        weightKg: 75,
      },
      true
    );
    setMeId(id);
    setNewName("");
  };

  const handleDrink = (preset: DrinkPreset) => {
    if (!currentParticipant) return;
    audioEffects.playPop();
    if (currentParticipant.role === "driver") {
      audioEffects.playBuzz();
    }
    addConsumption(currentParticipant.id, {
      label: preset.label,
      ml: preset.ml,
      abv: preset.abv,
    });
  };

  const handleWater = () => {
    if (!currentParticipant) return;
    audioEffects.playWaterDrop();
    addWater(currentParticipant.id);
  };

  const handleSafeCheckIn = () => {
    if (!currentParticipant) return;
    audioEffects.playSuccessChime();
    fireConfetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ["#10b981", "#ffffff"],
    });
    updateParticipant(currentParticipant.id, {
      status: "safe",
      arrivedAt: Date.now(),
    });
  };

  if (!currentParticipant) {
    return (
      <div className="max-w-md mx-auto p-6 rounded-3xl bg-night-900 border border-indigo-500/30 text-center space-y-4">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
          <Smartphone className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-white">Únete como Participante</h2>
        <p className="text-xs text-slate-300">
          Ingresa tu nombre para usar tu teléfono como mando de consumos y juegos
        </p>

        <form onSubmit={handleRegisterMe} className="space-y-3 text-left">
          <input
            type="text"
            required
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tu nombre o apodo (ej. Vale, Nico)"
            className="w-full min-h-[48px] px-4 rounded-xl bg-night-950 border border-slate-700 text-white text-sm outline-none focus:border-indigo-500"
            autoFocus
          />

          <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-800/60 text-xs text-slate-200 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsDriver}
              onChange={(e) => setNewIsDriver(e.target.checked)}
              className="w-4 h-4"
            />
            <span>🚗 Soy {locale.terminology.driverTitle} (0.0)</span>
          </label>

          <button
            type="submit"
            className="w-full min-h-[50px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm shadow-md"
          >
            Entrar al {locale.terminology.partyName}
          </button>
        </form>
      </div>
    );
  }

  const bacData = computeBac(
    currentParticipant.consumptions,
    currentParticipant.gender,
    currentParticipant.weightKg
  );
  const isDriverBreached =
    currentParticipant.role === "driver" && currentParticipant.consumptions.length > 0;

  return (
    <div className="max-w-md mx-auto space-y-4 pb-12 animate-fade-in">
      {/* Selector rápido si hay varios participantes */}
      {participants.length > 1 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-night-900/60 border border-slate-800 text-xs">
          <span className="text-slate-400 font-bold">Mando asignado a:</span>
          <select
            value={currentParticipant.id}
            onChange={(e) => setMeId(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-slate-800 text-white font-bold outline-none"
          >
            {participants.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.id === meId ? "(Tú)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Tarjeta de Identidad & Estado Biológico */}
      <div
        className={`p-5 rounded-3xl border transition-all ${
          isDriverBreached
            ? "bg-rose-950/50 border-rose-500 shadow-2xl animate-pulse"
            : currentParticipant.role === "driver"
            ? "bg-emerald-950/30 border-emerald-500/40"
            : "bg-night-900/90 border-indigo-500/30 shadow-glow"
        }`}
      >
        {isDriverBreached && (
          <div className="p-2 -mx-5 -mt-5 mb-3 rounded-t-3xl bg-rose-600 text-white text-[10px] font-black uppercase text-center flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>ALERTA {locale.legal.lawName.toUpperCase()}: {locale.terminology.driverTitle} con alcohol — NO CONDUZCAS</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest">
              Modo Celular
            </span>
            <h2 className="text-xl font-black text-white">{currentParticipant.name}</h2>
          </div>
          <span
            className={`text-xs px-2.5 py-1 rounded-xl font-bold border ${
              currentParticipant.role === "driver"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
            }`}
          >
            {currentParticipant.role === "driver" ? "🚗 Piloto 0.0%" : "🎉 En la Fiesta"}
          </span>
        </div>

        {/* Métricas Biológicas en vivo */}
        <div className="grid grid-cols-2 gap-2 mt-4 text-center">
          <div className="p-2.5 rounded-2xl bg-night-950 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">
              Alcoholemia
            </span>
            <span className="text-xl font-black text-white font-mono">
              {bacData.bac.toFixed(2)} g/l
            </span>
          </div>
          <div className="p-2.5 rounded-2xl bg-night-950 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">
              A 0.0 g/l en
            </span>
            <span className="text-sm font-black text-emerald-400 mt-1 block">
              {bacData.zeroAt ? fmtDuration(bacData.hoursToZero) : "0 min"}
            </span>
          </div>
        </div>
      </div>

      {/* Teclado Táctil de Consumo Rápido */}
      <div className="p-4 rounded-3xl bg-night-900/90 border border-slate-800 space-y-3">
        <span className="text-xs font-black text-slate-300 block uppercase tracking-wider">
          Registrar Consumo (+1 toque)
        </span>

        <div className="grid grid-cols-2 gap-2.5">
          {DRINK_PRESETS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => handleDrink(p)}
              className="min-h-[56px] p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-700/80 text-left transition-all flex items-center justify-between"
            >
              <div>
                <span className="font-black text-xs text-white block">
                  {p.emoji} {p.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {p.ml}ml · {Math.round(p.abv * 100)}°
                </span>
              </div>
              <Plus className="w-4 h-4 text-slate-400" />
            </button>
          ))}
        </div>

        {/* Botón de Agua & Deshacer */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            onClick={handleWater}
            className="min-h-[50px] rounded-2xl bg-cyan-950/60 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span>+1 Vaso de Agua</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEffects.playTick();
              removeLastConsumption(currentParticipant.id);
            }}
            disabled={currentParticipant.consumptions.length === 0}
            className="min-h-[50px] rounded-2xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-30 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Deshacer trago</span>
          </button>
        </div>
      </div>

      {/* Retorno Seguro Rápido */}
      <div className="p-4 rounded-3xl bg-night-900/90 border border-slate-800 space-y-2.5">
        <span className="text-xs font-black text-slate-300 block uppercase tracking-wider">
          Seguridad & Retorno
        </span>

        {currentParticipant.status !== "safe" ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                updateParticipant(currentParticipant.id, { status: "transit" });
              }}
              className="min-h-[48px] rounded-2xl bg-amber-600/30 hover:bg-amber-600/40 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <Navigation className="w-4 h-4" />
              <span>Voy en viaje</span>
            </button>

            <button
              type="button"
              onClick={handleSafeCheckIn}
              className="min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Home className="w-4 h-4" />
              <span>¡Llegué a salvo!</span>
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-950/50 border border-emerald-500/40 text-center text-xs text-emerald-300 font-bold flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Ya confirmaste que llegaste a casa seguro</span>
          </div>
        )}
      </div>
    </div>
  );
}
