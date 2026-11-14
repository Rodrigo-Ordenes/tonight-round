"use client";

import React, { useEffect, useRef, useState } from "react";
import SlidingIndicator, { useActiveRect } from "@/components/ui/SlidingIndicator";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ScrambleCode from "@/components/ui/ScrambleCode";
import InviteSheet from "@/components/carrete/InviteSheet";
import { AlertTriangle, ArrowLeft, Smartphone, Tv } from "lucide-react";
import { useCarreteStore, SOLO } from "@/store/useCarreteStore";
import MonstruometroRanking from "@/components/monsters/MonstruometroRanking";
import CustomizableRoulette from "@/components/games/CustomizableRoulette";
import DynamicTimeBomb from "@/components/games/DynamicTimeBomb";
import RandomPicanteGame from "@/components/games/RandomPicanteGame";
import CarreteResurrectionPacing from "@/components/carrete/CarreteResurrectionPacing";
import CarreteClientController from "@/components/carrete/CarreteClientController";
import LiveGameHost from "@/components/live/LiveGameHost";
import TonightWrapped from "@/components/wrapped/TonightWrapped";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";

type Tab = "envivo" | "monstruometro" | "rapidos" | "manana" | "wrapped";

export default function CarretePage() {
  const { locale } = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam = typeof params.code === "string" ? params.code.toUpperCase() : SOLO;
  const isSolo = codeParam === SOLO;
  const store = useCarreteStore(codeParam);
  const { status, participants, meId } = store;

  const [view, setView] = useState<"mesa" | "celular">(searchParams.get("modo") === "celular" ? "celular" : "mesa");
  const [tab, setTab] = useState<Tab>(isSolo ? "monstruometro" : "envivo");
  // Pestañas con píldora que se desliza a la opción activa
  const viewTabs = useRef<HTMLDivElement>(null);
  const sectionTabs = useRef<HTMLElement>(null);
  const viewRect = useActiveRect(viewTabs, '[aria-selected="true"]', view);
  const tabRect = useActiveRect(sectionTabs, '[aria-selected="true"]', `${tab}-${view}`);
  const [quick, setQuick] = useState<"ruleta" | "bomba" | "nunca">("ruleta");
  const [inviting, setInviting] = useState(searchParams.get("invitar") === "1");
  const closeInvite = () => {
    setInviting(false);
    // Quita ?invitar=1 sin recargar: volver atrás no reabre la hoja
    const u = new URL(window.location.href);
    u.searchParams.delete("invitar");
    window.history.replaceState(null, "", u.pathname + u.search);
  };

  // Un celular que entra por QR (y aún no es nadie) aterriza en su control.
  useEffect(() => {
    if (searchParams.get("modo") === "celular") setView("celular");
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500/30 border-t-indigo-500" />
        <p className="text-sm text-slate-300">Conectando con la sala {codeParam}…</p>
      </div>
    );
  }

  if (status === "missing") {
    return (
      <div className="mx-auto my-12 max-w-md space-y-4 text-center">
        <AlertTriangle className="mx-auto w-10 h-10 text-rose-400" />
        <h1 className="display text-3xl">No encontramos la sala {codeParam}</h1>
        <p className="text-sm text-slate-400">Revisa el código con quien la creó.</p>
        <button onClick={() => router.push("/")} className="btn-primary">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </button>
      </div>
    );
  }

  const TABS: { id: Tab; label: string; hidden?: boolean }[] = [
    { id: "envivo", label: "Juegos en vivo", hidden: isSolo },
    { id: "monstruometro", label: "Monstruómetro" },
    { id: "rapidos", label: "Juegos rápidos" },
    { id: "manana", label: "Para mañana" },
    { id: "wrapped", label: "Wrapped" },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {inviting && !isSolo && (
        <InviteSheet
          code={codeParam}
          partyName={locale.terminology.partyName}
          onClose={closeInvite}
          onJoin={() => {
            closeInvite();
            setView("celular");
          }}
        />
      )}
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="display text-display-lg">
            {isSolo ? (
              <>
                Tu noche<span className="text-accent">.</span>
              </>
            ) : (
              <>
                Sala <ScrambleCode code={codeParam} className="font-mono tracking-[0.12em] text-accent" />
              </>
            )}
          </h1>
          <p className="meta mt-3 flex items-center gap-2">
            {!isSolo && <span className="live-dot" />}
            {isSolo ? "Modo planificador" : `${locale.terminology.partyName} en vivo · ${participants.length} ${participants.length === 1 ? "persona" : "personas"}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isSolo && (
            <Link href={`/carrete/tv?code=${codeParam}`} className="btn-ghost !min-h-[44px] text-xs">
              <Tv className="w-4 h-4" /> Modo TV
            </Link>
          )}
          <div ref={viewTabs} className="relative flex rounded-2xl bg-white/[0.04] p-1" role="tablist" aria-label="Vista">
            <SlidingIndicator rect={viewRect} className="rounded-xl bg-white" />
            {(
              [
                { id: "mesa", label: "Mesa", icon: Tv },
                { id: "celular", label: meId ? "Mi celular" : "Unirme", icon: Smartphone },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => {
                  audioEffects.playTick();
                  setView(id);
                }}
                className={`relative flex min-h-[44px] items-center gap-1.5 rounded-xl px-3.5 text-xs font-bold transition-colors duration-300 ${view === id ? "text-night-950" : "text-slate-300"}`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {view === "celular" ? (
        <CarreteClientController store={store} />
      ) : (
        <>
          <nav ref={sectionTabs} className="relative -mx-4 flex gap-1 overflow-x-auto px-4 no-scrollbar sm:mx-0 sm:px-0" role="tablist" aria-label="Secciones de la sala">
            <SlidingIndicator rect={tabRect} className="rounded-full bg-white" />
            {TABS.filter((t) => !t.hidden).map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                onClick={() => {
                  audioEffects.playTick();
                  setTab(t.id);
                }}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors duration-300 ${tab === t.id ? "text-night-950" : "text-slate-400 hover:text-white"}`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* Cada sección entra al elegirla (se vuelve a montar con su clave) */}
          <div key={tab} className="animate-rise-in">
            {tab === "envivo" && <LiveGameHost store={store} />}
            {tab === "monstruometro" && <MonstruometroRanking store={store} />}
            {tab === "rapidos" && (
              <div className="space-y-5">
                <div className="flex gap-1">
                  {(
                    [
                      { id: "ruleta", label: "🎡 Ruleta" },
                      { id: "bomba", label: "💣 La Bomba" },
                      { id: "nunca", label: "🙊 Yo nunca (mazo)" },
                    ] as const
                  ).map((g) => (
                    <button key={g.id} type="button" onClick={() => setQuick(g.id)} className={`chip ${quick === g.id ? "chip-on" : ""}`}>
                      {g.label}
                    </button>
                  ))}
                </div>
                {quick === "ruleta" && <CustomizableRoulette store={store} />}
                {quick === "bomba" && <DynamicTimeBomb store={store} />}
                {quick === "nunca" && <RandomPicanteGame store={store} />}
              </div>
            )}
            {tab === "manana" && <CarreteResurrectionPacing store={store} />}
            {tab === "wrapped" && <TonightWrapped store={store} />}
          </div>
        </>
      )}
    </div>
  );
}
