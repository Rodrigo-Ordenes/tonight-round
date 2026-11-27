"use client";

import PourIntro from "./PourIntro";
import { useHomeMotion } from "./useHomeMotion";
import ClubStage from "./ClubStage";
import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";
import { CreateRoomError, SOLO, carreteExists, createCarrete, getActiveCode, setActiveCode } from "@/store/useCarreteStore";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";
import { nightMoment, type NightMoment } from "@/lib/nightMoment";
import { INTRO_REPLAY_EVENT } from "@/lib/introGate";

/** Portada: crear sala, unirse con código o planificar solo. */
export default function CarreteGatewayModal() {
  const router = useRouter();
  const { locale } = useLocale();
  const [chars, setChars] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [resume, setResume] = useState<string | null>(null);
  const [moment, setMoment] = useState<NightMoment | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const root = useRef<HTMLDivElement>(null);
  useHomeMotion(root);

  // Al abrir el panel del código, el cursor queda en el primer casillero
  useEffect(() => {
    if (codeOpen) refs.current[0]?.focus({ preventScroll: true });
  }, [codeOpen]);

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

  /** «Tengo un código» desde la intro: abre el panel del lobby y deja el cursor en el primer casillero. */
  const focusCode = () => {
    setCodeOpen(true);
    document.getElementById("inicio")?.scrollIntoView({ block: "start" });
    refs.current[0]?.focus({ preventScroll: true });
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

      <ClubStage
        onCreate={() => void create()}
        busy={busy === "create"}
        codeOpen={codeOpen}
        onToggleCode={() => setCodeOpen((o) => !o)}
        resume={resume}
        onResume={() => resume && router.push(`/carrete/${resume}`)}
        onReplay={() => window.dispatchEvent(new Event(INTRO_REPLAY_EVENT))}
        eyebrow={moment?.eyebrow}
        alert={
          error && !codeOpen ? (
            <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-night-950/90 p-3 text-sm font-semibold text-rose-200 backdrop-blur-md">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null
        }
        codePanel={
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="eyebrow">¿Te invitaron? Ingresa el código</p>
              <button type="button" onClick={() => setCodeOpen(false)} className="rounded-full px-2 py-1 text-xs font-semibold text-slate-400 hover:text-white">
                Cerrar
              </button>
            </div>
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
            {error && (
              <div role="alert" className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm font-semibold text-rose-200">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <button type="button" onClick={solo} className="mt-4 flex w-full items-center justify-between rounded-2xl px-1 py-2 text-sm font-semibold text-slate-300 hover:text-white">
              Solo quiero planificar (sin sala) <ArrowUpRight className="w-4 h-4" />
            </button>
          </>
        }
      />

      <p className="max-w-2xl text-xs leading-relaxed text-slate-500">
        Sin registro. Las estimaciones de alcohol son educativas. {locale.legal.lawName}: {locale.legal.bacLimitText}. Si bebes, no manejes; la
        única cifra segura al volante es 0.00.
      </p>
    </div>
  );
}
