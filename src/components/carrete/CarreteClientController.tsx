"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Crown, Droplets, GlassWater, Music2, RotateCcw, ShieldAlert, Users } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { uid } from "@/store/useCarreteStore";
import { useWakeLock } from "@/lib/useWakeLock";
import { CHEERS_WORD } from "@/components/live/CheersOverlay";
import { ABSORPTION, DRINK_PRESETS, bacFor, fmtDuration, fmtTime, hydrationFor, type DrinkPreset, type StomachState } from "@/lib/alcohol";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import LiveRoundCard from "@/components/live/LiveRoundCard";

const STOMACH_ICON: Record<StomachState, string> = { empty: "🫥", normal: "🥨", full: "🍝" };

/** El celular como control personal: identidad, tragos, agua, votos y confesiones. */
export default function CarreteClientController({ store }: { store: CarreteStore }) {
  const { locale, country } = useLocale();
  const { participants, meId, setMeId, addParticipant, addConsumption, removeLastConsumption, addWater, updateParticipant, dispatch } = store;

  const [name, setName] = useState("");
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState(70);
  const [isDriver, setIsDriver] = useState(false);
  const [stomach, setStomach] = useState<StomachState>("normal");
  const [showAll, setShowAll] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [roundOpen, setRoundOpen] = useState(false);
  const [roundFor, setRoundFor] = useState<string[]>([]);
  const [roundDrink, setRoundDrink] = useState(DRINK_PRESETS[0].key);
  const [song, setSong] = useState("");
  const [songSent, setSongSent] = useState(false);
  const [waterToast, setWaterToast] = useState(false);
  const warnedAt = useRef(0);

  const me = participants.find((p) => p.id === meId) ?? null;
  // El celular que es control no se apaga en plena noche.
  useWakeLock(!!me);

  // Recordatorio de agua: vibra una vez cada vez que se encadenan 2+ tragos sin agua.
  const sinceWater = me ? hydrationFor(me).drinksSinceWater : 0;
  useEffect(() => {
    if (sinceWater < 2) {
      warnedAt.current = 0;
      return;
    }
    if (warnedAt.current === sinceWater) return;
    warnedAt.current = sinceWater;
    audioEffects.triggerHaptic([120, 80, 120]);
    setWaterToast(true);
    const t = setTimeout(() => setWaterToast(false), 6000);
    return () => clearTimeout(t);
  }, [sinceWater]);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    audioEffects.playSuccessChime();
    addParticipant({ name: name.trim(), role: isDriver ? "driver" : "drinker", gender, weightKg: weight, stomach }, true);
    setName("");
  };

  if (!me) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <p className="eyebrow">Tu celular es tu control</p>
          <h2 className="display mt-2 text-3xl">¿Cómo te llamas?</h2>
          <p className="mt-2 text-sm text-slate-400">Con tu peso y sexo estimamos tu alcoholemia (solo como referencia educativa). Nada sale de esta sala.</p>
        </div>

        {participants.length > 0 && (
          <div className="surface p-4">
            <p className="text-xs font-semibold text-slate-400">¿Ya te agregaron? Elige tu nombre</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <button key={p.id} type="button" onClick={() => setMeId(p.id)} className="chip">
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={join} className="surface space-y-4 p-5">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre o apodo"
            aria-label="Nombre o apodo"
            className="min-h-[52px] w-full rounded-2xl border border-white/10 bg-night-950/70 px-4 text-base text-white outline-none focus:border-indigo-400"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-2">
            {(["M", "F"] as const).map((g) => (
              <button
                type="button"
                key={g}
                onClick={() => setGender(g)}
                aria-pressed={gender === g}
                className={`min-h-[46px] rounded-xl text-sm font-bold ${gender === g ? "bg-white text-night-950" : "bg-white/[0.05] text-slate-300"}`}
              >
                {g === "M" ? "Hombre" : "Mujer"}
              </button>
            ))}
          </div>
          <label className="block text-xs font-semibold text-slate-300">
            Peso aproximado: <span className="font-mono text-white">{weight} kg</span>
            <input type="range" min={40} max={140} value={weight} onChange={(e) => setWeight(Number(e.target.value))} className="mt-2 w-full accent-indigo-500" />
          </label>
          <div>
            <p className="text-xs font-semibold text-slate-300">¿Comiste?</p>
            <div className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] p-1">
              {(Object.keys(ABSORPTION) as StomachState[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStomach(s)}
                  aria-pressed={stomach === s}
                  className={`min-h-[40px] rounded-lg text-[11px] font-bold ${stomach === s ? "bg-white text-night-950" : "text-slate-400"}`}
                >
                  {STOMACH_ICON[s]} {ABSORPTION[s].label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm font-semibold text-amber-100">
            <input type="checkbox" checked={isDriver} onChange={(e) => setIsDriver(e.target.checked)} className="w-5 h-5 accent-amber-400" />
            👑 Hoy soy {locale.terminology.driverTitle.toLowerCase()} (0.0)
          </label>
          <button type="submit" className="btn-primary w-full !min-h-[54px] text-base">
            Entrar a la sala
          </button>
        </form>
      </div>
    );
  }

  const r = bacFor(me);
  const h = hydrationFor(me);
  const driver = me.role === "driver";
  const breach = driver && me.consumptions.length > 0;
  const presets = showAll ? DRINK_PRESETS : DRINK_PRESETS.slice(0, 8);
  const rising = r.peakAt !== null && r.peakAt > Date.now() && r.peakBac > r.bac + 0.02;

  const drink = (p: DrinkPreset) => {
    audioEffects.playBubble();
    if (driver) audioEffects.playBuzz();
    addConsumption(me.id, { label: p.label, ml: p.ml, abv: p.abv });
  };

  const water = () => {
    audioEffects.playWaterDrop();
    addWater(me.id);
    setPulse(true);
    setTimeout(() => setPulse(false), 2400);
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      {store.state.live?.round && <LiveRoundCard store={store} />}

      {/* Yo */}
      <section className={`surface p-5 ${breach ? "!border-rose-500 ring-2 ring-rose-500/50" : ""}`}>
        {breach && (
          <p className="-mx-5 -mt-5 mb-4 flex items-center justify-center gap-1.5 rounded-t-3xl bg-rose-500 py-2 text-center text-[11px] font-bold uppercase text-white">
            <ShieldAlert className="w-3.5 h-3.5" /> Tomaste alcohol: hoy no manejas
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="eyebrow">{driver ? `👑 ${locale.terminology.driverTitle}` : "Tú"}</p>
            <h2 className="display mt-1 truncate text-3xl">{me.name}</h2>
          </div>
          {participants.length > 1 && (
            <label className="relative">
              <span className="sr-only">Cambiar de persona</span>
              <select
                value={me.id}
                onChange={(e) => setMeId(e.target.value)}
                className="min-h-[38px] appearance-none rounded-xl border border-white/10 bg-white/[0.04] pl-3 pr-8 text-xs font-semibold text-slate-200 outline-none"
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          )}
        </div>

        <div className="mt-5 flex items-end gap-6">
          <div>
            <p className="eyebrow !text-[10px]">Ahora (g/l)</p>
            <p className="font-display text-6xl font-extrabold leading-none text-white tabular">{r.bac.toFixed(2)}</p>
          </div>
          <div className="pb-1 text-sm text-slate-300">
            {r.zeroAt ? (
              <>
                {rising && <p>Sube hasta {r.peakBac.toFixed(2)} a las {fmtTime(r.peakAt!)}</p>}
                <p>
                  Vuelves a 0.00 ≈ <span className="font-semibold text-white">{fmtTime(r.zeroAt)}</span>
                </p>
                <p className="text-xs text-slate-400">en {fmtDuration(r.hoursToZero)}</p>
              </>
            ) : (
              <p className="text-emerald-200">Estás en 0.00</p>
            )}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] p-1" role="radiogroup" aria-label="¿Comiste?">
          {(Object.keys(ABSORPTION) as StomachState[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={(me.stomach ?? "normal") === s}
              onClick={() => updateParticipant(me.id, { stomach: s })}
              className={`min-h-[36px] rounded-lg text-[11px] font-bold ${(me.stomach ?? "normal") === s ? "bg-white text-night-950" : "text-slate-400"}`}
            >
              {STOMACH_ICON[s]} {ABSORPTION[s].label}
            </button>
          ))}
        </div>

        {h.needsWater && me.consumptions.length > 0 && (
          <p className="mt-3 rounded-xl border border-cyan-300/30 bg-cyan-400/[0.08] px-3 py-2 text-sm font-semibold text-cyan-100">
            💧 Llevas {h.drinksSinceWater} tragos sin agua. Un vaso y sigues.
          </p>
        )}
      </section>

      {/* Agua y deshacer */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={water}
          className={`btn !min-h-[60px] border border-cyan-300/40 bg-cyan-400/15 text-base text-cyan-50 ${pulse ? "animate-shield-pulse" : ""}`}
        >
          <Droplets className="w-5 h-5" /> +1 vaso de agua · {me.waterCount}
        </button>
        <button
          type="button"
          onClick={() => {
            audioEffects.playTick();
            removeLastConsumption(me.id);
          }}
          disabled={me.consumptions.length === 0}
          aria-label="Deshacer último trago"
          className="btn-ghost !min-h-[60px] !px-4"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Social: brindis y ronda */}
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => {
            dispatch({ type: "CHEERS", id: uid(), by: me.id });
          }}
          className="btn !min-h-[52px] border border-amber-400/40 bg-amber-400/10 text-amber-100"
        >
          🥂 {CHEERS_WORD[country] ?? "¡Salud!"}
        </button>
        <button
          type="button"
          onClick={() => {
            setRoundFor(participants.filter((p) => p.role !== "driver").map((p) => p.id));
            setRoundOpen(!roundOpen);
          }}
          aria-expanded={roundOpen}
          className="btn-ghost !min-h-[52px]"
        >
          <Users className="w-4 h-4" /> Invito la ronda
        </button>
      </div>

      {roundOpen && (
        <section className="surface space-y-3 p-4 animate-fade-in">
          <p className="eyebrow">¿Para quiénes?</p>
          <div className="flex flex-wrap gap-1.5">
            {participants.map((p) => {
              const driver = p.role === "driver";
              const on = roundFor.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={driver}
                  onClick={() => setRoundFor(on ? roundFor.filter((x) => x !== p.id) : [...roundFor, p.id])}
                  aria-pressed={on}
                  className={`chip ${on ? "chip-on" : ""} disabled:opacity-50`}
                  title={driver ? "Maneja: no se le sirve alcohol" : undefined}
                >
                  {driver && <Crown className="w-3 h-3" />} {p.name}
                </button>
              );
            })}
          </div>
          <label className="block text-xs font-semibold text-slate-400">
            Trago
            <select
              value={roundDrink}
              onChange={(e) => setRoundDrink(e.target.value)}
              className="mt-1 min-h-[44px] w-full rounded-xl border border-white/10 bg-night-950 px-3 text-sm text-white outline-none"
            >
              {DRINK_PRESETS.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.emoji} {d.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={roundFor.length === 0}
            onClick={() => {
              const d = DRINK_PRESETS.find((x) => x.key === roundDrink) ?? DRINK_PRESETS[0];
              roundFor.forEach((id) => addConsumption(id, { label: d.label, ml: d.ml, abv: d.abv }));
              audioEffects.playBubble();
              setRoundOpen(false);
              dispatch({ type: "CHEERS", id: uid(), by: me.id });
            }}
            className="btn-primary w-full"
          >
            Servir {roundFor.length} {roundFor.length === 1 ? "trago" : "tragos"} y brindar
          </button>
        </section>
      )}

      {/* Tragos */}
      <section className="surface p-4">
        <div className="flex items-center justify-between">
          <p className="eyebrow">+1 trago</p>
          <Link href="/bar" className="flex items-center gap-1 text-xs font-semibold text-indigo-300">
            <GlassWater className="w-3.5 h-3.5" /> Desde el bar
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => drink(p)}
              className={`min-h-[58px] rounded-2xl border p-3 text-left transition-all active:scale-[0.97] ${
                driver ? "border-rose-500/30 bg-rose-500/[0.06]" : "border-white/[0.07] bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <span className="block truncate text-sm font-bold text-white">
                {p.emoji} {p.label}
              </span>
              <span className="font-mono text-[10px] text-slate-400">
                {p.ml} ml · {Math.round(p.abv * 1000) / 10}%
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowAll(!showAll)} className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-white">
          {showAll ? "Ver menos" : `Ver ${DRINK_PRESETS.length - 8} tragos más`}
        </button>
      </section>

      {/* Pedido de canción */}
      <section className="surface p-4">
        <p className="eyebrow flex items-center gap-1.5">
          <Music2 className="w-3.5 h-3.5" /> Pide una canción
        </p>
        <form
          className="mt-3 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const text = song.trim();
            if (text.length < 2) return;
            dispatch({ type: "SONG_REQUEST", request: { id: uid(), by: me.id, text: text.slice(0, 80), at: Date.now() } });
            audioEffects.playPop();
            setSong("");
            setSongSent(true);
            setTimeout(() => setSongSent(false), 2500);
          }}
        >
          <input
            value={song}
            onChange={(e) => setSong(e.target.value)}
            placeholder="Artista o canción"
            aria-label="Pedir una canción"
            className="min-h-[46px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
          />
          <button type="submit" className="btn-ghost !min-h-[46px]">
            {songSent ? "¡Listo!" : "Pedir"}
          </button>
        </form>
        <p className="mt-2 text-[11px] text-slate-500">Aparece en la cola de la TV y en la página de Música.</p>
      </section>

      {!store.state.live?.round && <LiveRoundCard store={store} />}

      {waterToast && (
        <div role="status" className="fixed inset-x-4 top-[calc(env(safe-area-inset-top,0px)+68px)] z-50 mx-auto max-w-md rounded-2xl border border-cyan-300/50 bg-night-900/95 p-4 text-sm font-semibold text-cyan-50 shadow-glow-water backdrop-blur-xl animate-rise-in">
          💧 Llevas {sinceWater} tragos sin agua. Un vaso y sigues en la pista.
          <button type="button" onClick={() => { water(); setWaterToast(false); }} className="btn mt-3 w-full !min-h-[42px] bg-cyan-400 text-night-950">
            +1 vaso de agua
          </button>
        </div>
      )}

      <p className="text-center text-[11px] text-slate-500">
        Estimación educativa, no medición. {locale.legal.bacLimitText}: si bebiste, no manejes.
      </p>
    </div>
  );
}
