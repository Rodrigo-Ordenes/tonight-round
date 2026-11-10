"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpRight, Loader2, Play } from "lucide-react";
import { CreateRoomError, SOLO, carreteExists, createCarrete, getActiveCode, setActiveCode } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { nightMoment, type NightMoment } from "@/lib/nightMoment";

const MODULES = [
  { href: "/armar", n: "01", title: "Armar", desc: "Lista de compras multi-licor, presupuesto y precios por tienda.", emoji: "🛒", tone: "from-amber-400/25" },
  { href: "/bar", n: "02", title: "Bar", desc: "Tu barra, el trago que preparas y la receta exacta, sin confusiones.", emoji: "🍸", tone: "from-purple-500/25" },
  { href: "/juegos", n: "03", title: "Juegos", desc: "La TV es el escenario, los celulares votan en vivo.", emoji: "🎲", tone: "from-indigo-500/25" },
  { href: "/musica", n: "04", title: "Música", desc: "DJ automático con Spotify según la hora y el ritmo de la sala.", emoji: "🎧", tone: "from-emerald-400/25" },
  { href: "/dividir", n: "05", title: "Cuentas", desc: "Varios pagadores, conductor exento y transferencias mínimas.", emoji: "🧾", tone: "from-cyan-400/25" },
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
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const a = getActiveCode();
    setResume(a && a !== SOLO ? a : null);
    setMoment(nightMoment(new Date()));
  }, []);

  const partyTerm = locale?.terminology?.partyName || "Carrete";

  const create = async () => {
    audioEffects.playPop();
    setBusy("create");
    setError(null);
    try {
      const code = await createCarrete();
      router.push(`/carrete/${code}`);
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

  return (
    <div className="space-y-16 lg:space-y-24">
      {/* ---------- Hero ---------- */}
      <section aria-labelledby="hero-title" className="grid gap-10 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-end">
        <div className="animate-rise-in">
          <h1 id="hero-title" className="display text-display-xl">
            La noche
            <br />
            se arma <span className="text-accent">acá.</span>
          </h1>
          {moment && <p className="meta mt-4">{moment.eyebrow}</p>}
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
            className="group relative flex w-full items-center justify-between rounded-3xl bg-indigo-500 px-6 py-5 text-left text-night-950 shadow-glow transition-transform active:scale-[0.98] disabled:opacity-60"
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
                className="col-span-6 flex h-12 w-full items-center sm:col-span-1 sm:h-14 justify-center rounded-2xl bg-white text-night-950 transition-transform active:scale-95 disabled:opacity-60"
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

      {/* ---------- Módulos: índice editorial de la noche, en el orden en que pasa ---------- */}
      <section aria-labelledby="mods-title">
        <h2 id="mods-title" className="display text-3xl sm:text-4xl">
          De la previa al cierre<span className="text-accent">.</span>
        </h2>
        <ul className="mt-6 divide-y divide-white/[0.07] border-y border-white/[0.07]">
          {MODULES.map((m, i) => (
            <li key={m.href} className="animate-rise-in" style={{ animationDelay: `${120 + i * 50}ms` }}>
              <Link
                href={m.href}
                className="group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-5 gap-y-1 py-5 transition-colors duration-200 ease-out sm:grid-cols-[3rem_14rem_minmax(0,1fr)_auto]"
              >
                <span className="text-3xl" aria-hidden>
                  {m.emoji}
                </span>
                <span className="font-display text-2xl font-extrabold text-white transition-colors group-hover:text-indigo-300 sm:text-3xl">{m.title}</span>
                <span className="col-span-2 col-start-2 row-start-2 text-sm leading-snug text-slate-400 sm:col-span-1 sm:col-start-3 sm:row-start-1">{m.desc}</span>
                <ArrowUpRight className="col-start-3 row-start-1 w-5 h-5 text-slate-500 transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white sm:col-start-4" />
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
