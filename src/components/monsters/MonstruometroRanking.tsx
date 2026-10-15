"use client";

import React, { useEffect, useState } from "react";
import { Car, Crown, Droplets, Plus, RefreshCw, RotateCcw, ShieldAlert, Trash2, UserPlus, X } from "lucide-react";
import CanisterGlassMeter from "./CanisterGlassMeter";
import type { CarreteStore } from "@/store/useCarreteStore";
import { useTheme } from "@/lib/theme";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import {
  ABSORPTION,
  DRINK_PRESETS,
  bacFor,
  fmtDuration,
  fmtTime,
  groupConsumptions,
  hydrationFor,
  type DrinkPreset,
  type StomachState,
} from "@/lib/alcohol";
import type { Participant } from "@/lib/carreteState";

interface Props {
  store: CarreteStore;
  /** En modo TV se oculta la edición */
  readOnly?: boolean;
}

const STOMACH_ICON: Record<StomachState, string> = { empty: "🫥", normal: "🥨", full: "🍝" };

export default function MonstruometroRanking({ store, readOnly = false }: Props) {
  const { participants, addConsumption, removeLastConsumption, addWater, addParticipant, removeParticipant, resetAllConsumptions, updateParticipant } =
    store;
  const { theme } = useTheme();
  const { locale } = useLocale();
  const [now, setNow] = useState(() => Date.now());
  const [driverWarning, setDriverWarning] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState(75);
  const [isDriver, setIsDriver] = useState(false);
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [customFor, setCustomFor] = useState<string | null>(null);
  const [customLabel, setCustomLabel] = useState("Trago a medida");
  const [customMl, setCustomMl] = useState(50);
  const [customAbv, setCustomAbv] = useState(40);
  const [shieldPulse, setShieldPulse] = useState<string | null>(null);

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(iv);
  }, []);

  const rows = participants.map((p) => ({ p, r: bacFor(p, now), h: hydrationFor(p) })).sort((a, b) => b.r.totalGrams - a.r.totalGrams);

  const drink = (p: Participant, preset: Pick<DrinkPreset, "label" | "ml" | "abv">) => {
    audioEffects.playBubble();
    if (p.role === "driver") {
      audioEffects.playBuzz();
      setDriverWarning(p.name);
    }
    addConsumption(p.id, { label: preset.label, ml: preset.ml, abv: preset.abv });
    setPickerFor(null);
  };

  const water = (p: Participant) => {
    audioEffects.playWaterDrop();
    addWater(p.id);
    setShieldPulse(p.id);
    setTimeout(() => setShieldPulse(null), 2600);
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Monstruómetro</p>
          <h2 className="display mt-1 text-2xl sm:text-3xl">Cómo va cada uno</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-400">
            Alcohol puro real (ml × grado × 0.8), absorción según el estómago y hora estimada de volver a 0.00. El agua suma escudo.
          </p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {rows.some((x) => x.p.consumptions.length > 0) && (
              <button onClick={() => setShowResetConfirm(true)} className="btn-ghost !min-h-[44px] text-xs">
                <RefreshCw className="w-3.5 h-3.5" /> Reiniciar
              </button>
            )}
            <button onClick={() => setShowAdd(true)} className="btn-primary !min-h-[44px]">
              <UserPlus className="w-4 h-4" /> Sumar persona
            </button>
          </div>
        )}
      </div>

      {showResetConfirm && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-2xl border border-rose-500/50 bg-rose-500/10 p-4 text-sm text-rose-100 sm:flex-row animate-fade-in">
          <span className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0 text-rose-300" /> ¿Reiniciar tragos y agua de todos a 0?
          </span>
          <span className="flex gap-2">
            <button
              onClick={() => {
                audioEffects.playPop();
                resetAllConsumptions();
                setShowResetConfirm(false);
              }}
              className="btn !min-h-[38px] bg-rose-500 text-white"
            >
              Sí, reiniciar
            </button>
            <button onClick={() => setShowResetConfirm(false)} className="btn-ghost !min-h-[38px]">
              Cancelar
            </button>
          </span>
        </div>
      )}

      {rows.length === 0 && (
        <p className="rounded-3xl border border-dashed border-white/10 py-10 text-center text-sm text-slate-400">
          Aún no hay nadie en el {locale.terminology.partyName.toLowerCase()}. Suma a la primera persona para encender los cilindros.
        </p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {rows.map(({ p, r, h }, idx) => {
          const isTop = idx === 0 && r.totalGrams > 0 && p.role !== "driver";
          const breach = p.role === "driver" && p.consumptions.length > 0;
          const details = groupConsumptions(p.consumptions);
          const stomach = p.stomach ?? "normal";
          const rising = r.peakAt !== null && r.peakAt > now && r.peakBac > r.bac + 0.02;
          return (
            <article
              key={p.id}
              className={`surface relative flex flex-col gap-3 p-4 ${breach ? "!border-rose-500 ring-2 ring-rose-500/60" : isTop ? "!border-amber-400/40" : ""}`}
            >
              <header className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-lg font-bold text-white">{p.name}</h3>
                  <p className="text-[11px] text-slate-400">
                    {p.gender === "M" ? "Hombre" : "Mujer"} · {p.weightKg} kg
                  </p>
                </div>
                {p.role === "driver" ? (
                  <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-1 text-[10px] font-bold uppercase text-amber-200">
                    <Crown className="w-3 h-3" /> {breach ? "¡Bebió!" : "Piloto 0.0"}
                  </span>
                ) : isTop ? (
                  <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-1 text-[10px] font-bold uppercase text-indigo-200">
                    Monstruo #1
                  </span>
                ) : null}
              </header>

              <div className="relative flex justify-center">
                <CanisterGlassMeter
                  pressure={Math.min(100, Math.round(r.totalGrams))}
                  isDriver={p.role === "driver"}
                  theme={theme}
                  drinksCount={p.consumptions.length}
                  pureAlcoholGrams={r.totalGrams}
                  heightPx={180}
                />
                {p.waterCount > 0 && (
                  <span
                    className={`absolute right-2 top-2 flex items-center gap-1 rounded-full border border-cyan-300/50 bg-cyan-400/15 px-2 py-1 text-xs font-bold text-cyan-100 ${
                      shieldPulse === p.id ? "animate-shield-pulse" : ""
                    }`}
                    title="Escudo de hidratación"
                  >
                    💧 x{p.waterCount}
                  </span>
                )}
              </div>

              <dl className="grid grid-cols-3 gap-1.5 text-center">
                <div className="rounded-xl bg-white/[0.03] p-2">
                  <dt className="text-[10px] text-slate-400">Ahora</dt>
                  <dd className="font-mono text-sm font-bold text-white tabular">{r.bac.toFixed(2)}</dd>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-2">
                  <dt className="text-[10px] text-slate-400">{rising ? "Pico" : "Máximo"}</dt>
                  <dd className="font-mono text-sm font-bold text-white tabular">{r.peakBac.toFixed(2)}</dd>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-2">
                  <dt className="text-[10px] text-slate-400">Alcohol</dt>
                  <dd className="font-mono text-sm font-bold text-white tabular">{r.totalGrams.toFixed(0)} g</dd>
                </div>
              </dl>

              <p
                className={`rounded-xl border px-3 py-2 text-xs font-semibold ${
                  r.bac >= 0.8 ? "border-rose-500/40 bg-rose-500/10 text-rose-100" : r.bac > 0 ? "border-amber-400/30 bg-amber-400/[0.07] text-amber-100" : "border-emerald-400/30 bg-emerald-400/[0.07] text-emerald-100"
                }`}
              >
                {r.zeroAt
                  ? `${rising ? `Sigue subiendo hasta las ${fmtTime(r.peakAt!)}. ` : ""}Vuelve a 0.00 ≈ ${fmtTime(r.zeroAt)} (${fmtDuration(r.hoursToZero)})`
                  : "En 0.00 g/l ahora"}
              </p>

              {h.needsWater && p.consumptions.length > 0 && (
                <p className="rounded-xl border border-cyan-300/30 bg-cyan-400/[0.07] px-3 py-2 text-xs font-semibold text-cyan-100">
                  💧 ¡Hora de un vaso de agua! {h.drinksSinceWater} tragos seguidos.
                </p>
              )}

              {!readOnly && (
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] p-1" role="radiogroup" aria-label={`Estómago de ${p.name}`}>
                  {(Object.keys(ABSORPTION) as StomachState[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={stomach === s}
                      onClick={() => updateParticipant(p.id, { stomach: s })}
                      className={`min-h-[34px] rounded-lg text-[10px] font-bold ${stomach === s ? "bg-white text-night-950" : "text-slate-400 hover:text-white"}`}
                    >
                      {STOMACH_ICON[s]} {ABSORPTION[s].label}
                    </button>
                  ))}
                </div>
              )}

              {details.length > 0 && (
                <ul className="space-y-0.5 font-mono text-[11px] text-slate-400">
                  {details.slice(0, 4).map((d) => (
                    <li key={d.text}>· {d.text}</li>
                  ))}
                </ul>
              )}

              {!readOnly && (
                <div className="mt-auto space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPickerFor(pickerFor === p.id ? null : p.id)}
                      className={`btn flex-1 !min-h-[46px] ${p.role === "driver" ? "bg-rose-500/20 text-rose-100 border border-rose-500/40" : "bg-indigo-500 text-night-950"}`}
                    >
                      <Plus className="w-4 h-4" /> Trago
                    </button>
                    <button onClick={() => water(p)} className="btn !min-h-[46px] border border-cyan-300/30 bg-cyan-400/10 px-4 text-cyan-100">
                      <Droplets className="w-4 h-4" /> Agua
                    </button>
                  </div>
                  {pickerFor === p.id && (
                    <div className="space-y-2 rounded-2xl border border-white/[0.06] bg-night-950/70 p-2">
                      <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
                        {DRINK_PRESETS.map((d) => (
                          <button
                            key={d.key}
                            onClick={() => drink(p, d)}
                            className="min-h-[46px] rounded-xl bg-white/[0.04] p-2 text-left text-xs font-semibold text-white transition-colors hover:bg-white/[0.08] active:scale-95"
                          >
                            <span className="block truncate">
                              {d.emoji} {d.label}
                            </span>
                            <span className="block text-[10px] font-normal text-slate-400">
                              {d.ml} ml · {Math.round(d.abv * 1000) / 10}%
                            </span>
                          </button>
                        ))}
                      </div>
                      {customFor !== p.id ? (
                        <button type="button" onClick={() => setCustomFor(p.id)} className="chip w-full justify-center">
                          <Plus className="w-3.5 h-3.5" /> Trago a medida (ml y grado)
                        </button>
                      ) : (
                        <div className="space-y-2 rounded-xl bg-white/[0.03] p-3">
                          <input
                            type="text"
                            value={customLabel}
                            onChange={(e) => setCustomLabel(e.target.value)}
                            aria-label="Nombre del trago"
                            className="w-full rounded-lg border border-white/10 bg-night-950 px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-400"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <label className="text-[10px] text-slate-400">
                              Volumen (ml)
                              <input type="number" min={10} max={1000} value={customMl} onChange={(e) => setCustomMl(Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-white/10 bg-night-950 px-2 py-1 text-xs text-white" />
                            </label>
                            <label className="text-[10px] text-slate-400">
                              Grados (%)
                              <input type="number" min={1} max={100} value={customAbv} onChange={(e) => setCustomAbv(Number(e.target.value))} className="mt-0.5 w-full rounded-lg border border-white/10 bg-night-950 px-2 py-1 text-xs text-white" />
                            </label>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                if (!customLabel.trim()) return;
                                drink(p, { label: customLabel.trim(), ml: customMl, abv: customAbv / 100 });
                                setCustomFor(null);
                              }}
                              className="btn-primary !min-h-[36px] flex-1 text-xs"
                            >
                              Agregar
                            </button>
                            <button type="button" onClick={() => setCustomFor(null)} className="btn-ghost !min-h-[36px] text-xs">
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex justify-end gap-1">
                    <button
                      onClick={() => removeLastConsumption(p.id)}
                      disabled={p.consumptions.length === 0}
                      aria-label="Deshacer último trago"
                      title="Deshacer último trago"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white disabled:opacity-30"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeParticipant(p.id)}
                      aria-label={`Quitar a ${p.name}`}
                      title={`Quitar a ${p.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-rose-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      <p className="text-center text-[11px] text-slate-500">
        Estimación educativa, no medición. {locale.legal.lawName}: {locale.legal.bacLimitText}. Si bebiste, no manejes: la única cifra segura es 0.00.
      </p>

      {driverWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/90 p-4 backdrop-blur-md">
          <div role="alertdialog" aria-modal="true" className="w-full max-w-md space-y-4 rounded-3xl border-2 border-rose-500 bg-night-900 p-6 text-center">
            <ShieldAlert className="mx-auto w-10 h-10 animate-bounce text-rose-400" />
            <h3 className="font-display text-xl font-extrabold text-white">{driverWarning} es {locale.terminology.driverTitle.toLowerCase()}</h3>
            <div className="space-y-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-left text-xs text-rose-100">
              <p className="font-bold">⚠️ {locale.legal.lawsTitle || locale.legal.lawName}</p>
              <p>{locale.legal.disclaimer}</p>
              <p className="font-semibold text-white">
                <Car className="mr-1 inline w-3.5 h-3.5" /> Que alguien más maneje o pidan un transporte.
              </p>
            </div>
            <button onClick={() => setDriverWarning(null)} className="btn w-full bg-rose-500 text-white">
              Entendido
            </button>
          </div>
        </div>
      )}

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-night-950/80 p-4 backdrop-blur-sm">
          <form onSubmit={create} className="w-full max-w-sm space-y-4 rounded-3xl border border-white/10 bg-night-900 p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Sumar persona</h3>
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
              className="min-h-[48px] w-full rounded-xl border border-white/10 bg-night-950 px-4 text-sm text-white outline-none focus:border-indigo-400"
            />
            <div className="grid grid-cols-2 gap-2">
              {(["M", "F"] as const).map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setGender(g)}
                  className={`min-h-[46px] rounded-xl text-sm font-bold ${gender === g ? "bg-white text-night-950" : "bg-white/[0.05] text-slate-300"}`}
                >
                  {g === "M" ? "Hombre" : "Mujer"}
                </button>
              ))}
            </div>
            <label className="block text-xs font-bold text-slate-300">
              Peso: {weight} kg
              <input type="range" min={40} max={140} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="mt-2 w-full accent-indigo-500" />
            </label>
            <label className="flex min-h-[48px] cursor-pointer items-center gap-3 rounded-xl bg-white/[0.04] p-3 text-xs font-semibold text-slate-200">
              <input type="checkbox" checked={isDriver} onChange={(e) => setIsDriver(e.target.checked)} className="w-5 h-5 accent-amber-400" />
              🚗 {locale.terminology.driverTitle} (0.0)
            </label>
            <button type="submit" className="btn-primary w-full">
              Agregar
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
