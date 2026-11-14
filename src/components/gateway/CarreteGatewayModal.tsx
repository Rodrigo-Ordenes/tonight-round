"use client";

import SignalField from "@/components/ui/SignalField";
import PourIntro from "./PourIntro";
import { useHomeMotion, useTrackNav } from "./useHomeMotion";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpRight, Disc3, Gamepad2, GlassWater, Loader2, Play, Receipt, ShoppingBasket } from "lucide-react";
import { CreateRoomError, SOLO, carreteExists, createCarrete, getActiveCode, setActiveCode } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { nightMoment, type NightMoment } from "@/lib/nightMoment";
import { INTRO_REPLAY_EVENT } from "@/lib/introGate";

const MODULES = [
  { href: "/armar", title: "Armar", desc: "Lista de compras multi-licor, presupuesto y precios por tienda.", icon: ShoppingBasket },
  { href: "/bar", title: "Bar", desc: "Tu barra, el trago que preparas y la receta exacta, sin confusiones.", icon: GlassWater },
  { href: "/juegos", title: "Juegos", desc: "La TV es el escenario, los celulares votan en vivo.", icon: Gamepad2 },
  { href: "/musica", title: "Música", desc: "DJ automático con Spotify según la hora y el ritmo de la sala.", icon: Disc3 },
  { href: "/dividir", title: "Cuentas", desc: "Varios pagadores, conductor exento y transferencias mínimas.", icon: Receipt },
];

/** Portada: crear sala, unirse con código o planificar solo. */
export default function CarreteGatewayModal() {
  const router = useRouter();
  const { locale } = useLocale();
  const [chars, setChars] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [moment, setMoment] = useState<NightMoment | null>(null);
  // Contador de señales de la red de la portada: sube al escribir el código y al crear la sala
  const [burst, setBurst] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  useHomeMotion(root);
  useTrackNav(root);

  useEffect(() => {
    const a = getActiveCode();
    setResume(a && a !== SOLO ? a : null);
    setMoment(nightMoment(new Date()));
  }, []);

  const partyTerm = locale?.terminology?.partyName || "Carrete";

  const create = async () => {
    audioEffects.playPop();
    setBurst((b) => b + 14);
    setBusy("create");
    setError(null);
    try {
      const code = await createCarrete();
      router.push(`/carrete/${code}?invitar=1`);
    } catch (e) {
      setError(e instanceof CreateRoomError ? e.message : `No se pudo crear el ${partyTerm.toLowerCase()}. Intenta de nuevo.`);
      setBusy(null);
    }
  };

  const solo = () => {
    audioEffects.playPop();
    setActiveCode(SOLO);
    router.push(`/carrete/${SOLO}`);
  };

  const setChar = (i: number, v: string) => {
    const c = v.replace(/[^a-zA-Z0-9]/g, "").slice(-1).toUpperCase();
    setChars((prev) => prev.map((x, idx) => (idx === i ? c : x)));
    setError(null);
    if (c) setBurst((b) => b + 1);
    if (c && i < chars.length - 1) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "Enter") void join();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
    if (!t) return;
    e.preventDefault();
    setBurst((b) => b + t.length);
    setChars([0, 1, 2, 3, 4, 5].map((i) => t[i] ?? ""));
    refs.current[Math.min(t.length, 5)]?.focus();
  };

  const join = async () => {
    const code = chars.join("");
    if (code.length !== 4 && code.length !== 6) {
      setError("Ingresa el código completo: 6 caracteres (4 en salas antiguas).");
      return;
    }
    setBusy("join");
    const ok = await carreteExists(code);
    setBusy(null);
    if (!ok) {
      audioEffects.playBuzz();
      setError(`La sala ${code} no existe. Revisa el código con quien la creó.`);
      return;
    }
    setActiveCode(code);
    router.push(`/carrete/${code}?modo=celular`);
  };

  /** «Tengo un código» desde la intro: baja al panel y deja el cursor en el primer casillero. */
  const focusCode = () => {
    const first = refs.current[0];
    first?.scrollIntoView({ block: "center", behavior: "smooth" });
    first?.focus({ preventScroll: true });
  };

  return (
    <div ref={root} data-gsap className="space-y-16 lg:space-y-24">
      {/* Color de la noche: se enciende en morado a medida que se baja (useHomeMotion) */}
      <div
        aria-hidden
        data-night
        className="pointer-events-none fixed inset-0 -z-10 opacity-0"
        style={{ background: "radial-gradient(60% 50% at 80% 25%, rgba(185, 62, 243, 0.16), transparent 70%), radial-gradient(50% 40% at 12% 85%, rgba(103, 170, 255, 0.08), transparent 70%)" }}
      />
      <PourIntro onCreate={() => void create()} onCode={focusCode} busy={busy === "create"} />

      {/* ---------- Hero ---------- */}
      <section id="inicio" aria-labelledby="hero-title" className="relative grid scroll-mt-20 gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 hidden sm:block">
          <svg data-depth="0.9" viewBox="0 0 40 40" className="float-a absolute left-[46%] top-[6%] h-10 w-10 text-indigo-300/60" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="6" y="6" width="28" height="28" rx="6" /><path d="M12 13 L18 13" strokeLinecap="round" /></svg>
          <svg data-depth="1.3" viewBox="0 0 40 40" className="float-b absolute right-[6%] top-[58%] h-7 w-7 text-purple-300/60" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="20" cy="20" r="14" /></svg>
          <svg data-depth="0.5" viewBox="0 0 40 40" className="float-c absolute left-[4%] top-[70%] h-5 w-5 text-purple-300/50" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="20" cy="20" r="12" /></svg>
          <svg data-depth="1.6" viewBox="0 0 40 40" className="float-a absolute right-[38%] top-[88%] h-6 w-6 text-emerald-300/60" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M20 4 V36 M4 20 H36 M9 9 L31 31 M31 9 L9 31" /></svg>
          <svg data-depth="0.7" viewBox="0 0 40 40" className="float-b absolute left-[30%] top-[-2%] h-8 w-8 text-indigo-300/40" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="8" y="8" width="24" height="24" rx="5" transform="rotate(18 20 20)" /></svg>
        </div>
        <div aria-hidden data-depth="0.6" className="tech-grid pointer-events-none absolute -inset-x-4 -top-6 bottom-0 -z-10 sm:-inset-x-6 lg:-inset-x-10" />
        <div aria-hidden data-depth="0.35" className="pointer-events-none absolute inset-0 -z-10">
          <SignalField count={14} burst={burst} className="-inset-x-4 -top-6 bottom-0 h-[calc(100%+1.5rem)] w-[calc(100%+2rem)] sm:-inset-x-6 sm:w-[calc(100%+3rem)] lg:-inset-x-10 lg:w-[calc(100%+5rem)]" />
        </div>
        <div className="relative animate-rise-in">
          <h1 id="hero-title" data-split data-depth="-0.2" className="display text-display-xl">
            La noche
            <br />
            se arma <span className="neon-violet">acá.</span>
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            {moment && <p className="meta">{moment.eyebrow}</p>}
            {/* Repetir la intro «La ronda» (se muestra una vez por navegador) */}
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-slate-200 transition-colors hover:border-indigo-400/50 hover:text-white"
            >
              <Play className="h-3.5 w-3.5" aria-hidden /> Ver la ronda
            </button>
          </div>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Compras, tragos, juegos en la TV con votos desde el celular, música y la cuenta dividida. Todo el {partyTerm.toLowerCase()} en
            un solo lugar, sin descargas ni cuentas.
          </p>
          {resume && (
            <button
              type="button"
              onClick={() => router.push(`/carrete/${resume}`)}
              className="mt-6 inline-flex items-center gap-3 rounded-full border border-emerald-400/30 bg-emerald-400/10 py-2 pl-3 pr-4 text-sm font-semibold text-emerald-100 hover:bg-emerald-400/15"
            >
              <span className="live-dot" /> Volver a la sala <span className="font-mono tracking-[0.2em]">{resume}</span>
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Panel de acceso */}
        <div className="surface relative overflow-hidden p-6 sm:p-7 animate-rise-in" style={{ animationDelay: "120ms" }}>
          <button
            type="button"
            onClick={create}
            disabled={busy !== null}
            className="cta-shine group relative flex w-full items-center justify-between rounded-3xl bg-indigo-500 px-6 py-5 text-left text-night-950 shadow-neon transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            <span>
              <span className="block font-display text-2xl font-extrabold leading-none">Crear sala</span>
              <span className="mt-1 block text-sm font-semibold text-night-950/70">Código corto + QR para la TV</span>
            </span>
            {busy === "create" ? <Loader2 className="w-7 h-7 animate-spin" /> : <ArrowRight className="w-7 h-7 transition-transform group-hover:translate-x-1" />}
          </button>

          <div className="relative mt-6">
            <p className="eyebrow">¿Te invitaron? Ingresa el código</p>
            <div className="mt-3 grid grid-cols-6 gap-1.5 sm:grid-cols-[repeat(6,minmax(0,1fr))_3.5rem]" onPaste={onPaste}>
              {chars.map((c, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    refs.current[i] = el;
                  }}
                  value={c}
                  onChange={(e) => setChar(i, e.target.value)}
                  onKeyDown={(e) => onKey(i, e)}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  maxLength={2}
                  aria-label={`Carácter ${i + 1} del código`}
                  className="h-14 w-full min-w-0 rounded-xl border border-white/10 bg-night-950/70 text-center font-mono text-xl font-bold uppercase text-white outline-none transition-colors focus:border-indigo-400"
                />
              ))}
              <button
                type="button"
                onClick={() => void join()}
                disabled={busy !== null}
                aria-label="Entrar a la sala"
                className="col-span-6 flex h-12 w-full items-center justify-center rounded-2xl bg-slate-100 text-night-950 transition-transform active:scale-95 disabled:opacity-60 sm:col-span-1 sm:h-14"
              >
                {busy === "join" ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {error && (
            <div role="alert" className="relative mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button type="button" onClick={solo} className="relative mt-5 flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-slate-300 hover:text-white">
            Solo quiero planificar (sin sala) <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* ---------- Módulos: la noche en orden. En escritorio, un recorrido horizontal fijado (useHomeMotion) ---------- */}
      <section data-track-section aria-labelledby="mods-title" className="lg:flex lg:h-[100dvh] lg:flex-col lg:justify-center lg:overflow-hidden">
        <h2 id="mods-title" className="display text-3xl sm:text-4xl lg:text-display-lg">
          De la previa al cierre<span className="text-accent">.</span>
        </h2>
        <ul className="mt-6 divide-y lg:hidden divide-white/[0.07] border-y border-white/[0.07]">
          {MODULES.map((m, i) => (
            <li key={m.href} className="animate-rise-in" style={{ animationDelay: `${120 + i * 50}ms` }}>
              <Link
                href={m.href}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 py-5 transition-colors duration-200 ease-out sm:grid-cols-[3rem_14rem_minmax(0,1fr)_auto]"
              >
                <span className="parallax-float grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-night-900 text-indigo-300 transition-colors group-hover:border-indigo-400/40" aria-hidden>
                  <m.icon className="h-5 w-5" />
                </span>
                <span className="font-display text-2xl font-extrabold text-white transition-colors group-hover:text-indigo-300 sm:text-3xl">{m.title}</span>
                <span className="col-span-2 col-start-2 row-start-2 text-sm leading-snug text-slate-400 sm:col-span-1 sm:col-start-3 sm:row-start-1">{m.desc}</span>
                <ArrowUpRight className="col-start-3 row-start-1 w-5 h-5 text-slate-500 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white sm:col-start-4" />
              </Link>
            </li>
          ))}
        </ul>
        {/* Recorrido de escritorio. Con GSAP queda fijado y avanza al bajar (o al deslizar de lado); sin él (táctil
            grande o movimiento reducido) es una fila con scroll horizontal propio y encaje por tarjeta */}
        <div data-track-nav className="mt-6 hidden items-center gap-3 lg:flex">
          <button type="button" data-track-go="prev" aria-label="Módulo anterior" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:border-indigo-400/50 hover:text-white">
            <ArrowRight className="h-5 w-5 rotate-180" aria-hidden />
          </button>
          <button type="button" data-track-go="next" aria-label="Módulo siguiente" className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:border-indigo-400/50 hover:text-white">
            <ArrowRight className="h-5 w-5" aria-hidden />
          </button>
          <span className="font-led text-lg font-bold tracking-[0.14em] text-slate-300">
            <span data-track-count className="text-indigo-200">01</span> / {String(MODULES.length).padStart(2, "0")}
          </span>
          <span className="meta">Baja o desliza para recorrer la noche</span>
        </div>
        <ul data-track className="mt-6 hidden gap-6 pr-[12vw] lg:flex">
          {MODULES.map((m, i) => (
            <li key={m.href} className="w-[min(58vw,560px)] shrink-0 snap-start">
              <Link
                href={m.href}
                className="group relative flex h-[58vh] max-h-[560px] min-h-[380px] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-night-900/80 p-8 transition-[border-color,transform] duration-300 ease-out hover:-translate-y-1 hover:border-indigo-400/50"
              >
                <m.icon data-panel-art aria-hidden className="pointer-events-none absolute -bottom-12 -right-10 h-80 w-80 text-indigo-400/[0.07]" strokeWidth={1} />
                <span className="neon-blue font-led text-3xl font-black tracking-[0.12em]">{String(i + 1).padStart(2, "0")}</span>
                <div className="relative">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl border border-indigo-400/30 bg-indigo-500/10 text-indigo-200 shadow-neon" aria-hidden>
                    <m.icon className="h-7 w-7" />
                  </span>
                  <p className="display mt-6 text-5xl">{m.title}</p>
                  <p className="mt-3 max-w-sm text-lg leading-relaxed text-slate-300">{m.desc}</p>
                </div>
                <span className="relative inline-flex items-center gap-2 text-sm font-bold text-indigo-200">
                  Entrar <ArrowUpRight className="h-4 w-4 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
        Sin registro. Las estimaciones de alcohol son educativas. {locale.legal.lawName}: {locale.legal.bacLimitText}. Si bebes, no manejes; la
        única cifra segura al volante es 0.00.
      </p>
    </div>
  );
}
