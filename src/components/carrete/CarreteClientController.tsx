"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SignalField from "@/components/ui/SignalField";
import { roomEvents } from "@/lib/roomEvents";
import SlidingIndicator, { useActiveRect } from "@/components/ui/SlidingIndicator";
import { usePathname, useSearchParams } from "next/navigation";
import { lastDrink } from "@/lib/lastDrink";
import { zeroCopy } from "@/lib/zeroCopy";
import QuickActionBar from "@/components/carrete/QuickActionBar";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import { ChevronDown, Car, Droplets, Eye, EyeOff, Heart, GlassWater, Music2, RotateCcw, ShieldAlert, Users } from "lucide-react";
import type { CarreteStore } from "@/store/useCarreteStore";
import { uid } from "@/store/useCarreteStore";
import { useWakeLock } from "@/lib/useWakeLock";
import { TONE_CLASS, bacTone, hasAlcohol } from "@/lib/bacTone";
import { CHEERS_WORD } from "@/components/live/CheersOverlay";
import { ABSORPTION, DRINK_PRESETS, bacFor, bodyFactorFrom, fmtDuration, fmtTime, hydrationFor, type DrinkPreset, type StomachState } from "@/lib/alcohol";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import LiveRoundCard from "@/components/live/LiveRoundCard";
import { normalizePayLink } from "@/lib/split";
import { songQueue } from "@/lib/music";
import UndoToast from "@/components/ui/UndoToast";
import { acceptTap } from "@/lib/tapGuard";
import { addMine, readMine, selectablePeople } from "@/lib/myPeople";
import { useTiltDepth } from "@/lib/useTiltDepth";

const STOMACH_ICON: Record<StomachState, string> = { empty: "🫥", normal: "🥨", full: "🍝" };

const BODY_KEY = "tonight_body";

/** Peso y sexo solo en este celular: a la sala viaja únicamente el factor corporal. */
function loadBody(): { gender: "M" | "F"; weightKg: number } | null {
  try {
    return JSON.parse(localStorage.getItem(BODY_KEY) ?? "null");
  } catch {
    return null;
  }
}

function saveBody(body: { gender: "M" | "F"; weightKg: number }) {
  try {
    localStorage.setItem(BODY_KEY, JSON.stringify(body));
  } catch {
    /* almacenamiento bloqueado: se vuelve a preguntar la próxima vez */
  }
}

/** El celular como control personal: identidad, tragos, agua, votos y confesiones. */
export default function CarreteClientController({ store }: { store: CarreteStore }) {
  const { locale, country } = useLocale();
  const { participants, meId, setMeId, addParticipant, addConsumption, removeLastConsumption, addWater, updateParticipant, dispatch } = store;

  const [name, setName] = useState("");
  const lastTap = useRef<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  // «+1» de neón que sube desde la barra al sumar (la confirmación se siente, no solo se lee)
  const [pops, setPops] = useState<{ id: number; water: boolean }[]>([]);
  const popId = useRef(0);
  const pop = (water: boolean) => {
    const id = ++popId.current;
    setPops((ps) => [...ps.slice(-3), { id, water }]);
    setTimeout(() => setPops((ps) => ps.filter((x) => x.id !== id)), 950);
  };
  const [mine, setMine] = useState<string[]>([]);
  useEffect(() => setMine(readMine(store.code)), [store.code]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  const [gender, setGender] = useState<"M" | "F">("M");
  const [weight, setWeight] = useState(70);
  const [isDriver, setIsDriver] = useState(false);
  const [picking, setPicking] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const panel = searchParams.get("panel") === "mas" ? "mas" : "ahora";
  const panelTabs = useRef<HTMLDivElement>(null);
  const panelTabsRect = useActiveRect(panelTabs, '[aria-selected="true"]', panel);
  const setPanelUrl = (id: "ahora" | "mas") => {
    const q = new URLSearchParams(searchParams.toString());
    if (id === "mas") q.set("panel", "mas");
    else q.delete("panel");
    // Sin ir al servidor: cambiar de pestaña debe funcionar sin señal
    window.history.replaceState(null, "", `${pathname}?${q.toString()}`);
  };
  const [stomach, setStomach] = useState<StomachState>("normal");
  const [showAll, setShowAll] = useState(false);
  const [pulse, setPulse] = useState(false);
  // Señales que dispara la red de la tarjeta al sumar un trago o agua (retroalimentación sin tocar las cifras)
  const [burst, setBurst] = useState(0);
  const meCard = useRef<HTMLElement>(null);
  const [roundOpen, setRoundOpen] = useState(false);
  const [roundFor, setRoundFor] = useState<string[]>([]);
  const [roundDrink, setRoundDrink] = useState(DRINK_PRESETS[0].key);
  const [song, setSong] = useState("");
  const [songSent, setSongSent] = useState(false);
  const warnedAt = useRef(0);
  const [discreet, setDiscreet] = useState(false);
  useEffect(() => {
    try {
      setDiscreet(localStorage.getItem("tonight_discreet") === "1");
    } catch {
      /* sin almacenamiento */
    }
  }, []);
  const toggleDiscreet = () => {
    const next = !discreet;
    setDiscreet(next);
    try {
      localStorage.setItem("tonight_discreet", next ? "1" : "0");
    } catch {
      /* sin almacenamiento */
    }
  };

  const me = participants.find((p) => p.id === meId) ?? null;
  useTiltDepth(meCard, Boolean(me));
  useEffect(() => {
    const body = loadBody();
    if (!body) return;
    setGender(body.gender === "F" ? "F" : "M");
    if (Number.isFinite(body.weightKg)) setWeight(body.weightKg);
  }, []);

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
  }, [sinceWater]);

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    audioEffects.playSuccessChime();
    const id = addParticipant({ name: name.trim(), role: isDriver ? "driver" : "drinker", bodyFactor: bodyFactorFrom(gender, weight), stomach }, true);
    addMine(store.code, id);
    setMine(readMine(store.code));
    saveBody({ gender, weightKg: weight });
    setName("");
  };

  // Hooks antes de cualquier return temprano. Red viva de la sala detrás de tu tarjeta: una señal por cada trago, voto o canción de cualquiera
  const people = useMemo(() => participants.filter((p) => !p.deleted).map((p) => ({ id: p.id, name: p.name })), [participants]);
  const events = useMemo(() => roomEvents(store.state, 0).slice(-120), [store.state]);

  if (!me) {
    return (
      <div className="mx-auto max-w-md space-y-5">
        <div>
          <h2 className="display text-3xl">¿Cómo te llamas?</h2>
          <p className="mt-2 text-sm text-slate-400">Con tu peso y sexo estimamos tu alcoholemia, solo como referencia. Esos dos datos quedan en este celular. Tu nombre y lo que registras se comparten con la sala y se borran a las 48 h sin actividad.</p>
        </div>

        {participants.length > 0 && (
          <div className="surface p-4">
            <p className="text-xs font-semibold text-slate-400">¿Ya te agregaron? Elige tu nombre</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {participants.map((p) => (
                <button key={p.id} type="button" onClick={() => setMeId(p.id)} className="chip max-w-full truncate">
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
            maxLength={30}
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
                  className={`min-h-[40px] rounded-lg text-xs font-bold ${stomach === s ? "bg-white text-night-950" : "text-slate-400"}`}
                >
                  {STOMACH_ICON[s]} {ABSORPTION[s].label}
                </button>
              ))}
            </div>
          </div>
          <label className="flex min-h-[52px] cursor-pointer items-center gap-3 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-3 text-sm font-semibold text-amber-100">
            <input type="checkbox" checked={isDriver} onChange={(e) => setIsDriver(e.target.checked)} className="w-5 h-5 accent-amber-400" />
            🚗 Hoy soy {locale.terminology.driverTitle.toLowerCase()} (0.0)
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

  const last = lastDrink(me.consumptions);
  const copy = zeroCopy({ hadDrinks: hasAlcohol(me.consumptions), zeroAt: r.zeroAt });

  const logDrink = (d: { label: string; ml: number; abv: number }) => {
    const now = Date.now();
    if (!acceptTap(lastTap.current, now)) return;
    lastTap.current = now;
    audioEffects.playBubble();
    if (driver) audioEffects.playBuzz();
    addConsumption(me.id, { label: d.label, ml: d.ml, abv: d.abv });
    setBurst((b) => b + 6);
    setToast(`${d.label} sumada`);
    pop(false);
  };

  const drink = (p: DrinkPreset) => logDrink(p);
  const switchable = selectablePeople(participants, me.id, mine);

  const water = () => {
    audioEffects.playWaterDrop();
    addWater(me.id);
    setBurst((b) => b + 6);
    pop(true);
    setPulse(true);
    setTimeout(() => setPulse(false), 2400);
  };

  return (
    <div className="mx-auto max-w-md space-y-4">
      {store.state.live?.round && <LiveRoundCard store={store} />}

      {/* Yo */}
      <section ref={meCard} className={`surface relative isolate overflow-hidden p-5 ${breach ? "!border-rose-500 ring-2 ring-rose-500/50" : "shadow-neon-uv"}`}>
        <div aria-hidden data-tilt-depth="-1" className="pointer-events-none absolute inset-0 -z-10">
          <SignalField people={people} events={events} labels={false} seed={5} burst={burst} className="parallax-mid inset-0 h-full w-full opacity-70" />
        </div>
        {breach && (
          <p className="-mx-5 -mt-5 mb-4 flex items-center justify-center gap-1.5 rounded-t-3xl bg-rose-600 py-2 text-center text-xs font-bold uppercase text-white">
            <ShieldAlert className="w-3.5 h-3.5" /> Tomaste alcohol: hoy no manejas
          </p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div data-tilt-depth="0.8" className="min-w-0">
            <h2 className="display neon-blue text-3xl [overflow-wrap:anywhere]">{me.name}</h2>
            <p className="meta mt-1">{driver ? `${locale.terminology.driverTitle} · 0.0 toda la noche` : "Este celular es tu control"}</p>
          </div>
          {switchable.length > 1 && (
            <label className="relative min-w-0 max-w-[45%] shrink-0">
              <span className="sr-only">Cambiar de persona</span>
              <select
                value={me.id}
                onChange={(e) => setMeId(e.target.value)}
                className="min-h-[44px] w-full appearance-none truncate rounded-xl border border-white/10 bg-white/[0.04] pl-3 pr-8 text-xs font-semibold text-slate-200 outline-none"
              >
                {switchable.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 w-3.5 h-3.5 -translate-y-1/2 text-slate-400" />
            </label>
          )}
        </div>

        {discreet ? (
          <div className="mt-5">
            {/* Modo discreto: nadie alrededor ve una cifra; solo la hora de volver a 0.00 */}
            <p className="font-display text-5xl font-extrabold leading-none text-white tabular">{r.zeroAt ? fmtTime(r.zeroAt) : copy.headline}</p>
            {r.zeroAt && <p className="meta mt-2">Hora estimada de volver a 0.00</p>}
            {copy.caveat && <p className="meta mt-2">{copy.caveat}</p>}
          </div>
        ) : (
          <div className="mt-5">
            {r.zeroAt ? (
              <>
                <p className="eyebrow">{copy.headline}</p>
                <p className="mt-1 font-display text-4xl font-extrabold leading-none text-white tabular">cerca de las {fmtTime(r.zeroAt)}</p>
                <p className="meta mt-2">en {fmtDuration(r.hoursToZero)}. {copy.caveat}</p>
              </>
            ) : (
              <>
                <p className={`font-display text-4xl font-extrabold leading-none ${hasAlcohol(me.consumptions) ? "text-white" : "text-emerald-200"}`}>{copy.headline}</p>
                {copy.caveat && <p className="meta mt-2">{copy.caveat}</p>}
              </>
            )}
            {!driver && r.zeroAt && (
              <p className="mt-3 text-sm text-slate-300">
                Ahora{" "}
                <span className={`font-mono font-semibold tabular ${TONE_CLASS[bacTone(r.bac, driver, hasAlcohol(me.consumptions))].text}`}>
                  {r.bac.toFixed(2)} g/l
                </span>
                {rising && <> · sube hasta {r.peakBac.toFixed(2)} a las {fmtTime(r.peakAt!)}</>}
              </p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={() => toggleDiscreet()}
          aria-pressed={discreet}
          className="mt-3 flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white"
        >
          {discreet ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          {discreet ? "Mostrar cifras" : "Modo discreto"}
        </button>

        <div className="mt-4 grid grid-cols-3 gap-1 rounded-xl bg-white/[0.03] p-1" role="radiogroup" aria-label="¿Comiste?">
          {(Object.keys(ABSORPTION) as StomachState[]).map((s) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={(me.stomach ?? "normal") === s}
              onClick={() => updateParticipant(me.id, { stomach: s })}
              className={`min-h-[44px] rounded-lg text-xs font-bold ${(me.stomach ?? "normal") === s ? "bg-white text-night-950" : "text-slate-400"}`}
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

      <div ref={panelTabs} className="relative grid grid-cols-2 gap-1 rounded-xl bg-white/[0.03] p-1" role="tablist" aria-label="Secciones de tu celular">
        <SlidingIndicator rect={panelTabsRect} className="rounded-lg bg-indigo-500 shadow-neon" />
        {([["ahora", "Ahora"], ["mas", "Más"]] as const).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={panel === id}
            onClick={() => setPanelUrl(id)}
            className={`relative min-h-[44px] rounded-lg text-sm font-bold transition-colors duration-300 ${panel === id ? "text-night-950" : "text-slate-300"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {panel === "ahora" && (
      <>
      {/* Agua y deshacer */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <button
          type="button"
          onClick={water}
          className={`btn !min-h-[60px] border border-cyan-300/40 bg-cyan-400/15 text-base text-cyan-50 shadow-[0_0_26px_-8px_rgba(140,227,190,0.6)] ${pulse ? "animate-shield-pulse" : ""}`}
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
          className="btn !min-h-[52px] border border-purple-400/50 bg-purple-500/15 text-purple-100 shadow-neon-uv"
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
          className="btn !min-h-[52px] border border-indigo-400/40 bg-indigo-500/10 text-indigo-100"
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
                  {driver && <Car className="w-3 h-3" />} <span className="max-w-[10rem] truncate">{p.name}</span>
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

      </>
      )}

      {panel === "mas" && (
        <>
      {/* Link de pago para Cuentas */}
      <PayLinkField
        value={me.payLink ?? ""}
        system={locale.banking.systemName}
        onSave={(link) => updateParticipant(me.id, { payLink: link ?? undefined })}
      />

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
            maxLength={280}
            onChange={(e) => setSong(e.target.value)}
            placeholder="Artista o canción"
            aria-label="Pedir una canción"
            className="min-h-[46px] min-w-0 flex-1 rounded-2xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
          />
          <button type="submit" className="btn-ghost !min-h-[46px]">
            {songSent ? "¡Listo!" : "Pedir"}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">Aparece en la cola de la TV y en la página de Música.</p>
        {songQueue(store.state.music).length > 0 && (
          <ul className="mt-3 space-y-1.5">
            {songQueue(store.state.music)
              .slice(0, 4)
              .map((r) => {
                const voted = (r.votes ?? []).includes(me.id);
                return (
                  <li key={r.id} className="flex items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-slate-200">{r.text}</span>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "VOTE_SONG", id: r.id, participantId: me.id })}
                      aria-pressed={voted}
                      aria-label={`Votar ${r.text}`}
                      className={`flex h-9 min-w-[44px] items-center justify-center gap-1 rounded-lg text-xs font-bold ${voted ? "bg-indigo-500/20 text-indigo-100" : "bg-white/[0.04] text-slate-300"}`}
                    >
                      <Heart className="w-3.5 h-3.5" /> {r.votes?.length ?? 0}
                    </button>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {!store.state.live?.round && <LiveRoundCard store={store} />}


        </>
      )}

      {picking && (
        <Modal label="Elegir trago" onClose={() => setPicking(false)} className="flex items-end justify-center bg-night-950/80 sm:items-center sm:p-4">
          <section className="surface max-h-[86dvh] w-full max-w-md overflow-y-auto !rounded-b-none p-4 sm:!rounded-b-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Elegir trago</h2>
              <Link href="/bar" className="flex min-h-[44px] items-center gap-1 text-xs font-semibold text-indigo-300">
                <GlassWater className="w-3.5 h-3.5" /> Desde el bar
              </Link>
            </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {presets.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => {
                drink(p);
                setPicking(false);
              }}
              className={`min-h-[58px] rounded-2xl border p-3 text-left transition active:scale-[0.97] ${
                driver ? "border-rose-500/30 bg-rose-500/[0.06]" : "border-white/[0.07] bg-white/[0.03] hover:border-white/20"
              }`}
            >
              <span className="block truncate text-sm font-bold text-white">
                {p.emoji} {p.label}
              </span>
              <span className="font-mono text-xs text-slate-400">
                {p.ml} ml · {Math.round(p.abv * 1000) / 10}%
              </span>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setShowAll(!showAll)} className="mt-3 w-full text-center text-xs font-semibold text-slate-400 hover:text-white">
          {showAll ? "Ver menos" : `Ver ${DRINK_PRESETS.length - 8} tragos más`}
        </button>
            <button type="button" onClick={() => setPicking(false)} className="btn-ghost mt-3 w-full">Cerrar</button>
          </section>
        </Modal>
      )}

      <QuickActionBar
        drinkLabel={last ? last.label : null}
        showDrink={!driver}
        onDrink={() => last && logDrink(last)}
        onPick={() => setPicking(true)}
        onWater={water}
      />

      <div aria-hidden className="pointer-events-none fixed inset-x-0 bottom-[calc(176px+env(safe-area-inset-bottom,0px))] z-50 flex justify-center">
        {pops.map((p) => (
          <span
            key={p.id}
            className={`absolute animate-float-up font-display text-4xl font-extrabold ${
              p.water ? "text-emerald-300 [text-shadow:0_0_14px_rgba(140,227,190,0.6)]" : "text-purple-300 [text-shadow:0_0_14px_rgba(185,62,243,0.75)]"
            }`}
          >
            +1
          </span>
        ))}
      </div>

      {toast && (
        <UndoToast
          text={toast}
          className="bottom-[calc(156px+env(safe-area-inset-bottom,0px))]"
          onUndo={() => {
            removeLastConsumption(me.id);
            setToast(null);
          }}
        />
      )}

      <p className="pb-20 text-center text-xs text-slate-500">
        Estimación educativa, no medición. {locale.legal.bacLimitText}: si bebiste, no manejes.
      </p>
    </div>
  );
}

/** Campo para guardar el link de pago propio; Cuentas lo muestra como botón "Pagar" a quien te debe. */
function PayLinkField({ value, system, onSave }: { value: string; system: string; onSave: (link: string | null) => void }) {
  const [text, setText] = useState(value);
  const [state, setState] = useState<"idle" | "saved" | "error">("idle");
  return (
    <section className="surface p-4">
      <label htmlFor="paylink" className="eyebrow">
        Mi link de pago
      </label>
      <p className="mt-1 text-xs text-slate-400">Mercado Pago, MACH, Venmo, PayPay… Aparece en Cuentas para que te paguen en un toque ({system} también sirve con datos en «Una boleta»).</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) {
            onSave(null);
            setState("saved");
            return;
          }
          const link = normalizePayLink(text);
          if (!link) {
            setState("error");
            return;
          }
          setText(link);
          onSave(link);
          setState("saved");
        }}
      >
        <input
          id="paylink"
          inputMode="url"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setState("idle");
          }}
          placeholder="link.mercadopago.cl/tu-nombre"
          aria-invalid={state === "error"}
          className="min-h-[46px] min-w-0 flex-1 rounded-xl border border-white/10 bg-night-950/60 px-4 text-sm text-white placeholder:text-slate-500 outline-none focus:border-indigo-400"
        />
        <button type="submit" className="btn-ghost !min-h-[46px]">
          {state === "saved" ? "Listo" : "Guardar"}
        </button>
      </form>
      {state === "error" && <p className="mt-2 text-xs text-rose-300">Eso no parece un link. Pega el link que te da tu app de pagos.</p>}
    </section>
  );
}
