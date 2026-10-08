"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Rocket, KeyRound, Zap, AlertTriangle, Loader2, Play } from "lucide-react";
import { SOLO, carreteExists, createCarrete, getActiveCode, setActiveCode } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import CountrySelector from "@/components/navigation/CountrySelector";

type Step = "main" | "join";

/** Gateway de acceso a pantalla completa: crear carrete, unirse con código o modo solo. */
export default function CarreteGatewayModal() {
  const router = useRouter();
  const { locale } = useLocale();
  const [step, setStep] = useState<Step>("main");
  const [chars, setChars] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState<string | null>(null);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const a = getActiveCode();
    setResume(a && a !== SOLO ? a : null);
  }, []);

  useEffect(() => {
    if (step === "join") refs.current[0]?.focus();
  }, [step]);

  const partyTerm = locale?.terminology?.partyName || "Carrete";
  const partyUpper = partyTerm.toUpperCase();

  const create = async () => {
    audioEffects.playPop();
    setBusy(true);
    setError(null);
    try {
      const code = await createCarrete();
      router.push(`/carrete/${code}`);
    } catch {
      setError(`No se pudo crear el ${partyTerm.toLowerCase()}. Intenta de nuevo.`);
      setBusy(false);
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
    if (c && i < 3) refs.current[i + 1]?.focus();
  };

  const onKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !chars[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "Enter") join();
  };

  const onPaste = (e: React.ClipboardEvent) => {
    const t = e.clipboardData.getData("text").replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 4);
    if (!t) return;
    e.preventDefault();
    setChars([0, 1, 2, 3].map((i) => t[i] ?? ""));
    refs.current[Math.min(t.length, 3)]?.focus();
  };

  const join = async () => {
    const code = chars.join("");
    if (code.length < 4) {
      setError("Ingresa los 4 caracteres del código.");
      return;
    }
    setBusy(true);
    const ok = await carreteExists(code);
    setBusy(false);
    if (!ok) {
      audioEffects.playBuzz();
      setError(`El ${partyTerm.toLowerCase()} ${code} no existe. Revisa el código con el host.`);
      return;
    }
    setActiveCode(code);
    router.push(`/carrete/${code}`);
  };

  return (
    <section
      aria-labelledby="gw-title"
      className="min-h-[calc(100dvh-140px)] flex items-center justify-center px-1 py-4"
    >
      <div className="w-full max-w-md space-y-5 text-center">
        <div className="text-5xl">🌙</div>
        <h1 id="gw-title" className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          ¿CÓMO ARRANCA LA NOCHE HOY?
        </h1>
        <p className="text-sm text-slate-300">
          Crea un {partyTerm.toLowerCase()} para compartir juegos y gastos con tus amigos, o entra en modo planificador individual.
        </p>

        {/* Selector de País e Identidad Cultural */}
        <div className="pt-1 pb-1">
          <CountrySelector variant="full" />
        </div>

        {error && (
          <div role="alert" className="flex items-start gap-2 text-left p-3 rounded-2xl bg-rose-950/70 border border-rose-500 text-rose-200 text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === "main" ? (
          <div className="space-y-3">
            {resume && (
              <button
                onClick={() => router.push(`/carrete/${resume}`)}
                className="w-full min-h-[56px] rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" /> CONTINUAR {partyUpper} {resume}
              </button>
            )}
            <button
              onClick={create}
              disabled={busy}
              className="w-full min-h-[56px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Rocket className="w-5 h-5" />} 🚀 CREAR {partyUpper}
            </button>
            <button
              onClick={() => {
                setStep("join");
                setError(null);
              }}
              className="w-full min-h-[56px] rounded-2xl bg-night-900 border border-indigo-500/40 hover:bg-night-800 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              <KeyRound className="w-5 h-5" /> 🔑 UNIRME AL {partyUpper}
            </button>
            <button
              onClick={solo}
              className="w-full min-h-[56px] rounded-2xl bg-night-900 border border-amber-500/40 hover:bg-night-800 text-amber-300 font-black text-sm flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" /> ⚡ MODO SOLO / PLANIFICADOR
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center gap-2.5" onPaste={onPaste}>
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
                  className="w-14 h-16 text-center text-2xl font-black uppercase rounded-2xl bg-night-900 border-2 border-indigo-500/50 focus:border-indigo-300 text-white outline-none"
                />
              ))}
            </div>
            <button
              onClick={join}
              disabled={busy}
              className="w-full min-h-[56px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black text-sm flex items-center justify-center gap-2"
            >
              {busy && <Loader2 className="w-5 h-5 animate-spin" />} ENTRAR AL {partyUpper}
            </button>
            <button
              onClick={() => {
                setStep("main");
                setError(null);
              }}
              className="min-h-[48px] text-sm text-slate-400 underline"
            >
              ← Volver
            </button>
          </div>
        )}

        <p className="text-[11px] text-slate-500">
          Sin registro obligatorio. {locale.legal.lawName}: {locale.legal.bacLimitText}. Si bebes, no manejes.
        </p>
      </div>
    </section>
  );
}
