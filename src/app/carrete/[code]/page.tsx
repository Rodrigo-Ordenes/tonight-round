"use client";

import React, { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import {
  Tv,
  Smartphone,
  Copy,
  Check,
  AlertTriangle,
  ArrowLeft,
  Zap,
  Dices,
  Home,
  Clock,
  Sparkles,
  ExternalLink,
  ShoppingCart,
  GlassWater,
  Receipt,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useCarreteStore, SOLO } from "@/store/useCarreteStore";
import MonstruometroRanking from "@/components/monsters/MonstruometroRanking";
import CustomizableRoulette from "@/components/games/CustomizableRoulette";
import DynamicTimeBomb from "@/components/games/DynamicTimeBomb";
import RandomPicanteGame from "@/components/games/RandomPicanteGame";
import CarreteReturnSafe from "@/components/carrete/CarreteReturnSafe";
import CarreteResurrectionPacing from "@/components/carrete/CarreteResurrectionPacing";
import CarreteClientController from "@/components/carrete/CarreteClientController";
import { audioEffects } from "@/lib/audioEffects";
import { useLocale } from "@/lib/useLocale";

type Tab = "monstruometro" | "juegos" | "retorno" | "pacing";

export default function CarretePage() {
  const { locale } = useLocale();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const codeParam = typeof params.code === "string" ? params.code.toUpperCase() : "SOLO";
  const initialMode = searchParams.get("modo") === "celular" ? "celular" : "host";

  const [viewMode, setViewMode] = useState<"host" | "celular">(initialMode);
  const [activeTab, setActiveTab] = useState<Tab>("monstruometro");
  const [activeGame, setActiveGame] = useState<"ruleta" | "bomba" | "nunca">("ruleta");
  const [qrUri, setQrUri] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);

  const store = useCarreteStore(codeParam);
  const { status, participants } = store;

  // Generar QR para unirse como celular
  useEffect(() => {
    if (typeof window !== "undefined" && codeParam !== SOLO) {
      const joinUrl = `${window.location.origin}/carrete/${codeParam}?modo=celular`;
      QRCode.toDataURL(joinUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: "#060911",
          light: "#ffffff",
        },
      })
        .then((uri) => setQrUri(uri))
        .catch(console.error);
    }
  }, [codeParam]);

  const handleCopyLink = async () => {
    try {
      const joinUrl = `${window.location.origin}/carrete/${codeParam}?modo=celular`;
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  // 1. Estado Cargando
  if (status === "loading") {
    return (
      <div className="min-h-[50dvh] flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-spin" />
        <p className="text-sm text-slate-300 font-bold">Conectando con {locale.terminology.partyName.toLowerCase()} {codeParam}...</p>
      </div>
    );
  }

  // 2. Estado Inexistente (Error 404)
  if (status === "missing") {
    return (
      <div className="max-w-md mx-auto my-12 p-6 rounded-3xl bg-rose-950/40 border-2 border-rose-500/80 text-center space-y-4 shadow-2xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-white">{locale.terminology.partyName} No Encontrado</h2>
        <p className="text-sm text-rose-200">
          El {locale.terminology.partyName.toLowerCase()} <strong className="font-mono text-white tracking-widest">{codeParam}</strong> no existe. Revisa el código con el host.
        </p>
        <button
          onClick={() => router.push("/")}
          className="w-full min-h-[48px] rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>
      </div>
    );
  }

  // 3. Estado Listo
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fade-in">
      {/* Barra de Control de la Sala / Carrete */}
      <div className="p-4 rounded-3xl bg-night-950/90 border border-indigo-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-glow">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center font-black">
            🌙
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">{locale.terminology.partyName} Activo:</span>
              <span className="px-2.5 py-0.5 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono font-black text-sm border border-indigo-500/40 tracking-wider">
                {codeParam}
              </span>
              {codeParam === SOLO && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold">
                  Modo Solo
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              {participants.length} {participants.length === 1 ? "participante" : "participantes"} conectados
            </p>
          </div>
        </div>

        {/* View Switcher: TV vs Celular */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {codeParam !== SOLO && (
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[42px] px-3 rounded-xl bg-night-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Copiar Link</span>
                </>
              )}
            </button>
          )}

          <div className="flex bg-night-900 p-1 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setViewMode("host");
              }}
              className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === "host"
                  ? "bg-indigo-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Modo TV / Mesa</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setViewMode("celular");
              }}
              className={`min-h-[40px] px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all ${
                viewMode === "celular"
                  ? "bg-emerald-600 text-white shadow-glow-accent"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Modo Celular</span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER MODO CELULAR */}
      {viewMode === "celular" ? (
        <CarreteClientController store={store} />
      ) : (
        /* RENDER MODO HOST / MESA */
        <div className="space-y-6">
          {/* Header con QR para Smart TV o living (si no es SOLO) */}
          {codeParam !== SOLO && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              <div className="md:col-span-8 p-6 rounded-3xl bg-gradient-to-r from-night-950 via-indigo-950/40 to-night-950 border border-indigo-500/30 flex flex-col justify-between space-y-3">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-black uppercase mb-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{locale.terminology.partyName} Sincronizado en Vivo</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-white">
                    Pizarra Grupal ({locale.terminology.partyName})
                  </h1>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                    Proyecta esta pantalla en tu Smart TV o monitor. Tus amigos pueden escanear el QR con su cámara para registrar consumos, jugar Yo Nunca y chequear su estado biológico sin descargar ninguna app.
                  </p>
                </div>

                <div className="pt-2 flex flex-wrap gap-2">
                  <Link
                    href="/carrete/tv"
                    className="min-h-[42px] px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Abrir Modo TV Pantalla Limpia</span>
                  </Link>

                  <Link
                    href="/armar"
                    className="min-h-[42px] px-3.5 rounded-xl bg-night-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                    <span>Canasta & Compras</span>
                  </Link>

                  <Link
                    href="/bar"
                    className="min-h-[42px] px-3.5 rounded-xl bg-night-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5"
                  >
                    <GlassWater className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Barra & Recetas</span>
                  </Link>
                </div>
              </div>

              {/* QR Gigante */}
              <div className="md:col-span-4 p-5 rounded-3xl bg-night-950 border border-indigo-500/30 flex flex-col items-center justify-center text-center">
                {qrUri ? (
                  <img
                    src={qrUri}
                    alt={`QR para unirse al carrete ${codeParam}`}
                    className="w-40 h-40 rounded-2xl bg-white p-2 shadow-xl"
                  />
                ) : (
                  <div className="w-40 h-40 rounded-2xl bg-night-900 animate-pulse" />
                )}
                <span className="text-xs font-black text-white mt-2 block">
                  ¡Escanea para entrar!
                </span>
                <span className="text-[11px] font-mono text-indigo-400 font-bold">
                  Código PIN: {codeParam}
                </span>
              </div>
            </div>
          )}

          {/* Navegación por pestañas del Carrete */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 rounded-2xl bg-night-900 border border-night-800">
            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setActiveTab("monstruometro");
              }}
              className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "monstruometro"
                  ? "bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Monstruómetro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setActiveTab("juegos");
              }}
              className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "juegos"
                  ? "bg-indigo-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Dices className="w-4 h-4 text-pink-300" />
              <span>Juegos & Ruletas</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setActiveTab("retorno");
              }}
              className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "retorno"
                  ? "bg-emerald-600 text-white shadow-glow-accent"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-4 h-4 text-emerald-300" />
              <span>Retorno Seguro</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEffects.playTick();
                setActiveTab("pacing");
              }}
              className={`min-h-[48px] py-2 px-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "pacing"
                  ? "bg-amber-600 text-white shadow-glow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-4 h-4 text-amber-300" />
              <span>Pacing & Resurrección</span>
            </button>
          </div>

          {/* TAB 1: MONSTRUÓMETRO (INTEGRADO DIRECTAMENTE) */}
          {activeTab === "monstruometro" && (
            <div className="space-y-4">
              <MonstruometroRanking store={store} />
            </div>
          )}

          {/* TAB 2: JUEGOS */}
          {activeTab === "juegos" && (
            <div className="space-y-5">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveGame("ruleta")}
                  className={`min-h-[42px] px-4 rounded-xl text-xs font-bold transition-all ${
                    activeGame === "ruleta"
                      ? "bg-indigo-600 text-white shadow-glow"
                      : "bg-night-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🎰 Ruleta del Carrete
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGame("bomba")}
                  className={`min-h-[42px] px-4 rounded-xl text-xs font-bold transition-all ${
                    activeGame === "bomba"
                      ? "bg-amber-600 text-white shadow-glow"
                      : "bg-night-900 text-slate-400 hover:text-white"
                  }`}
                >
                  💣 Bomba de Tiempo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveGame("nunca")}
                  className={`min-h-[42px] px-4 rounded-xl text-xs font-bold transition-all ${
                    activeGame === "nunca"
                      ? "bg-pink-600 text-white shadow-glow"
                      : "bg-night-900 text-slate-400 hover:text-white"
                  }`}
                >
                  🙈 Yo Nunca Nunca
                </button>
              </div>

              {activeGame === "ruleta" && <CustomizableRoulette store={store} />}
              {activeGame === "bomba" && <DynamicTimeBomb store={store} />}
              {activeGame === "nunca" && <RandomPicanteGame store={store} />}
            </div>
          )}

          {/* TAB 3: RETORNO SEGURO */}
          {activeTab === "retorno" && <CarreteReturnSafe store={store} />}

          {/* TAB 4: PACING */}
          {activeTab === "pacing" && <CarreteResurrectionPacing store={store} />}
        </div>
      )}
    </div>
  );
}
